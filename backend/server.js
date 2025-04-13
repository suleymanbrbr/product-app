// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const GOLD_API_KEY = process.env.GOLD_API_KEY;
const GOLD_API_URL = 'https://www.goldapi.io/api/XAU/USD';

let cachedGoldPrice = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function getGoldPricePerGram() {
    const now = Date.now();
    if (cachedGoldPrice && (now - lastFetchTime < CACHE_DURATION)) {
        console.log('Using cached gold price.');
        return cachedGoldPrice;
    }

    console.log('Fetching fresh gold price...');
    if (!GOLD_API_KEY) {
        console.error('ERROR: GOLD_API_KEY is not defined.');
        // Fallback to a default price ONLY for development if needed
        // console.warn('Using fallback gold price.');
        // return 75.0; // Example fallback - REMOVE FOR PRODUCTION
         throw new Error('API key for gold price is missing.');
    }

    try {
        const response = await axios.get(GOLD_API_URL, {
            headers: { 'x-access-token': GOLD_API_KEY, 'Content-Type': 'application/json' },
        });

        const pricePerOunce = response.data.price;
        if (typeof pricePerOunce !== 'number') {
             throw new Error('Invalid price format received from Gold API.');
        }
        const pricePerGram = pricePerOunce / 31.1035;

        cachedGoldPrice = pricePerGram;
        lastFetchTime = now;
        console.log(`Fetched gold price: $${pricePerGram.toFixed(4)} per gram`);
        return pricePerGram;

    } catch (error) {
        console.error('Error fetching gold price:', error.response ? error.response.data : error.message);
        if (cachedGoldPrice) {
             console.warn('Using stale cached gold price due to fetch error.');
             return cachedGoldPrice;
        }
         // Fallback for development ONLY if API fails consistently
         // console.warn('Using fallback gold price due to error.');
         // return 75.0; // Example fallback - REMOVE FOR PRODUCTION
        throw new Error('Could not fetch gold price.');
    }
}

// --- API Endpoint ---
app.get('/api/products', async (req, res) => {
    try {
        // 1. Fetch the current gold price
        const goldPricePerGram = await getGoldPricePerGram();

        // 2. Read product data from JSON file
        const productsFilePath = path.join(__dirname, 'products.json');
        const productsData = await fs.readFile(productsFilePath, 'utf-8');
        const products = JSON.parse(productsData);

        // 3. Calculate dynamic price for each product
        const productsWithPrice = products.map(product => {
            if (typeof product.popularityScore !== 'number' || typeof product.weight !== 'number') {
                 console.warn(`Skipping price calculation for product "${product.name}" due to invalid data.`);
                 return { ...product, price: null, error: 'Invalid data for price calculation' };
            }
            const calculatedPrice = (product.popularityScore + 1) * product.weight * goldPricePerGram;
            return {
                ...product,
                price: parseFloat(calculatedPrice.toFixed(2)),
            };
        });

        // ================== START FILTERING LOGIC ==================

        // Get filter criteria from query parameters
        const { minPrice, maxPrice, minPopularity, maxPopularity } = req.query;

        // Start with all products (that have prices calculated)
        let filteredProducts = productsWithPrice;

        // Apply Price Filter
        if (minPrice || maxPrice) {
            console.log(`Applying price filter: min=${minPrice}, max=${maxPrice}`);
            const minPriceNum = minPrice ? parseFloat(minPrice) : null;
            const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null;

            filteredProducts = filteredProducts.filter(p => {
                // Exclude products where price calculation failed
                if (p.price === null || p.price === undefined) return false;

                const meetsMin = (minPriceNum === null || isNaN(minPriceNum)) ? true : p.price >= minPriceNum;
                const meetsMax = (maxPriceNum === null || isNaN(maxPriceNum)) ? true : p.price <= maxPriceNum;
                return meetsMin && meetsMax;
            });
            console.log(`Products after price filter: ${filteredProducts.length}`);
        }

        // Apply Popularity Filter (to the already price-filtered list)
        if (minPopularity || maxPopularity) {
            console.log(`Applying popularity filter: min=${minPopularity}, max=${maxPopularity}`);
            // Popularity score is between 0 and 1
            const minPopNum = minPopularity ? parseFloat(minPopularity) : null;
            const maxPopNum = maxPopularity ? parseFloat(maxPopularity) : null;

            // Validate popularity range makes sense (0 to 1)
            if ((minPopNum !== null && (isNaN(minPopNum) || minPopNum < 0 || minPopNum > 1)) ||
                (maxPopNum !== null && (isNaN(maxPopNum) || maxPopNum < 0 || maxPopNum > 1))) {
                console.warn('Invalid popularity range provided (must be between 0 and 1). Skipping popularity filter.');
            } else {
                filteredProducts = filteredProducts.filter(p => {
                    // Use the original popularityScore
                    if (p.popularityScore === null || p.popularityScore === undefined) return false;

                    const meetsMin = (minPopNum === null) ? true : p.popularityScore >= minPopNum;
                    const meetsMax = (maxPopNum === null) ? true : p.popularityScore <= maxPopNum;
                    return meetsMin && meetsMax;
                });
                console.log(`Products after popularity filter: ${filteredProducts.length}`);
            }
        }

        // =================== END FILTERING LOGIC ===================


        // 4. Send response (send the filtered list)
        console.log(`Sending ${filteredProducts.length} products after all filters.`);
        res.json(filteredProducts);

    } catch (error) {
        console.error('Error processing /api/products request:', error);
        // Send a more specific error message if gold price fetch failed
        if (error.message.includes('gold price')) {
             res.status(503).json({ message: 'Service temporarily unavailable: Could not retrieve gold price.', error: error.message });
        } else {
             res.status(500).json({ message: 'Error fetching product data', error: error.message });
        }
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});