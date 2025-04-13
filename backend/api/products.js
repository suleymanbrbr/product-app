// backend/api/products.js

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const GOLD_API_KEY = process.env.GOLD_API_KEY;
const GOLD_API_URL = 'https://www.goldapi.io/api/XAU/USD';

let cachedGoldPrice = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function getGoldPricePerGram() {
    const now = Date.now();
    if (cachedGoldPrice && (now - lastFetchTime < CACHE_DURATION)) {
        console.log("Using cached gold price.");
        return cachedGoldPrice;
    }

    console.log("Fetching fresh gold price.");
    if (!GOLD_API_KEY) {
        console.error('FATAL: Missing GOLD_API_KEY environment variable.');
        throw new Error('Server configuration error: Missing GOLD_API_KEY');
    }

    try {
        const response = await axios.get(GOLD_API_URL, {
            headers: { 'x-access-token': GOLD_API_KEY, 'Content-Type': 'application/json' }
        });

        if (response.data && typeof response.data.price === 'number') {
            const pricePerOunce = response.data.price;
            const pricePerGram = pricePerOunce / 31.1035;
            cachedGoldPrice = pricePerGram;
            lastFetchTime = now;
            console.log(`Fetched gold price: ${pricePerGram.toFixed(4)} per gram.`);
            return pricePerGram;
        } else {
            console.error('Gold API response missing price data:', response.data);
            throw new Error('Failed to retrieve valid gold price data from API.');
        }
    } catch (apiError) {
        console.error("Error fetching gold price from API:", apiError.response ? apiError.response.data : apiError.message);
        throw new Error('Failed to fetch external gold price data.');
    }
}


// Vercel Serverless Function handler
module.exports = async (req, res) => {
    // --- BEGIN CORS HEADERS ---
    // Allow requests from any origin for simplicity in this context
    const allowedOrigin = '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Keep as needed
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS'); // Methods needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization'); // Common safe headers

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    // --- END CORS HEADERS ---

    try {
        const goldPricePerGram = await getGoldPricePerGram();
        // Use correct path relative to the function file location
        const productsPath = path.resolve(__dirname, '..', 'products.json');
        console.log(`Reading products from: ${productsPath}`);

        let productsRaw;
        try {
            productsRaw = await fs.readFile(productsPath, 'utf-8');
        } catch (readError) {
            console.error(`Error reading products file at ${productsPath}:`, readError);
            // Send error (CORS headers already set)
            return res.status(500).json({ error: 'Could not read product data file.' });
        }

        const products = JSON.parse(productsRaw);

        // Calculate prices
        const productsWithPrice = products.map(p => {
            if (p && typeof p.popularityScore === 'number' && typeof p.weight === 'number' && p.weight > 0) {
                const price = (p.popularityScore + 1) * p.weight * goldPricePerGram;
                // Add price to the product object
                return { ...p, price: parseFloat(price.toFixed(2)) };
            } else {
                console.warn(`Skipping product due to invalid data: ${JSON.stringify(p)}`);
                // Keep the product but mark price as null or add an error field
                return { ...p, price: null, error: 'Invalid or missing data (popularityScore/weight)' };
            }
        }).filter(p => p.price !== null); // Keep only products where price calculation was successful


        // --- Apply Filters ---
        const { minPrice, maxPrice, minPopularity, maxPopularity } = req.query;
        let filtered = productsWithPrice;

        // Price filtering
        if (minPrice || maxPrice) {
            const min = parseFloat(minPrice) || 0;
            const max = parseFloat(maxPrice) || Infinity;
            filtered = filtered.filter(p => p.price >= min && p.price <= max); // Assumes p.price is not null here
        }

        // Popularity filtering (Backend still uses 0-1 range)
        if (minPopularity || maxPopularity) {
            // Ensure they are treated as numbers between 0 and 1
            const min = Math.max(0, Math.min(1, parseFloat(minPopularity) || 0));
            const max = Math.max(0, Math.min(1, parseFloat(maxPopularity) || 1)); // Default max to 1 if not provided/invalid
            filtered = filtered.filter(p => typeof p.popularityScore === 'number' && p.popularityScore >= min && p.popularityScore <= max);
        }

        // Set Cache-Control (currently prevents caching)
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        console.log(`Returning ${filtered.length} products after filtering.`);

        // Send the successful response (CORS headers already set)
        res.status(200).json(filtered);

    } catch (err) {
        console.error("Error processing request:", err);
        // Send error response (CORS headers already set)
        res.status(500).json({ error: 'An internal server error occurred.', details: err.message });
    }
};