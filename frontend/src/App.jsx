// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import ProductList from './components/ProductList.jsx';
import './App.css'; // Make sure this CSS file exists or add styles

function App() {
  // --- State ---
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // For fetch errors
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(''); // User input 0-5
  const [maxRating, setMaxRating] = useState(''); // User input 0-5
  // ** NEW: State for price input validation error **
  const [priceError, setPriceError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('default');

  // --- Backend URL ---
  const baseApiUrl = 'https://product-app-backend-l1ujsu3i3-suleymans-projects-2f8f8c76.vercel.app/api/products';

  console.log("API Base URL:", baseApiUrl);

  // --- fetchProducts ---
  const fetchProducts = useCallback(async (filters) => {
    setLoading(true);
    setError(null); // Clear fetch error
    // Clear validation errors when starting a new fetch triggered by filter change

    const params = new URLSearchParams();
    // ... (rest of fetchProducts remains the same) ...
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.minPopularity) params.append('minPopularity', filters.minPopularity);
    if (filters.maxPopularity) params.append('maxPopularity', filters.maxPopularity);
    const fullUrl = `${baseApiUrl}?${params.toString()}`;
    console.log("Fetching from URL:", fullUrl);
    try {
      const response = await axios.get(fullUrl);
      setAllProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      const errorMsg = err.response?.data?.error || err.message;
      setError(`Failed to load products. ${errorMsg}.`);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, [baseApiUrl]);

  // --- useEffect ---
  useEffect(() => {
    fetchProducts(activeFilters);
  }, [activeFilters, fetchProducts]);

  // --- sortedProducts memo ---
  const sortedProducts = useMemo(() => {
    // ... (sorting logic remains the same) ...
    let productsToSort = [...allProducts];
    switch (sortBy) {
      case 'price-asc':
        productsToSort.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case 'price-desc':
        productsToSort.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        break;
      case 'name-asc':
        productsToSort.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'default':
      default:
        break;
    }
    return productsToSort;
  }, [allProducts, sortBy]);


  // --- ** Filter Handlers ** ---
  const handleApplyFilters = () => {
      const filtersToApply = {};
      let currentRatingError = '';
      let currentPriceError = ''; // Local variable for price error checking

      // --- Price Filter Validation ---
      const parsedMinPrice = parseFloat(minPrice);
      if (minPrice && isNaN(parsedMinPrice)) {
          currentPriceError = 'Min Price must be a number.';
      } else if (parsedMinPrice < 0) { // Check if negative only if it's a number
          currentPriceError = 'Price cannot be negative.';
      } else if (!isNaN(parsedMinPrice)) {
          filtersToApply.minPrice = parsedMinPrice.toString(); // Only add valid, non-negative price
      }

      const parsedMaxPrice = parseFloat(maxPrice);
      if (maxPrice && isNaN(parsedMaxPrice)) {
          currentPriceError = currentPriceError
              ? currentPriceError + ' Max Price must also be a number.'
              : 'Max Price must be a number.';
      } else if (parsedMaxPrice < 0) { // Check if negative only if it's a number
           currentPriceError = currentPriceError
              ? currentPriceError + ' Max Price cannot be negative.'
              : 'Price cannot be negative.';
      } else if (!isNaN(parsedMaxPrice)) {
          // Basic check: max price shouldn't be less than min price if both are provided
          if (!isNaN(parsedMinPrice) && parsedMaxPrice < parsedMinPrice) {
               currentPriceError = currentPriceError
                  ? currentPriceError + ' Max Price cannot be less than Min Price.'
                  : 'Max Price cannot be less than Min Price.';
          } else {
             filtersToApply.maxPrice = parsedMaxPrice.toString(); // Only add valid, non-negative price
          }
      }
      // --- End Price Filter Validation ---


      // --- Popularity (Rating) Filter Validation (remains the same) ---
      const parsedMinRatingInput = parseFloat(minRating);
      if (!isNaN(parsedMinRatingInput)) {
          if (parsedMinRatingInput < 0 || parsedMinRatingInput > 5) {
              currentRatingError = 'Rating must be between 0 and 5.';
          }
          const clampedMinRatingInput = Math.max(0, Math.min(5, parsedMinRatingInput));
          const minPopForBackend = clampedMinRatingInput / 5;
          filtersToApply.minPopularity = minPopForBackend.toFixed(2);
      } else if (minRating) {
           currentRatingError = 'Min Rating must be a number.';
      }

      const parsedMaxRatingInput = parseFloat(maxRating);
      if (!isNaN(parsedMaxRatingInput)) {
          if (parsedMaxRatingInput < 0 || parsedMaxRatingInput > 5) {
              currentRatingError = currentRatingError
                  ? currentRatingError + ' Max Rating must also be between 0 and 5.'
                  : 'Rating must be between 0 and 5.';
          }
          const clampedMaxRatingInput = Math.max(0, Math.min(5, parsedMaxRatingInput));
          // Basic check: max rating shouldn't be less than min rating if both are provided
          if (!isNaN(parsedMinRatingInput) && parsedMaxRatingInput < parsedMinRatingInput) {
                currentRatingError = currentRatingError
                  ? currentRatingError + ' Max Rating cannot be less than Min Rating.'
                  : 'Max Rating cannot be less than Min Rating.';
          } else {
            const maxPopForBackend = clampedMaxRatingInput / 5;
            filtersToApply.maxPopularity = maxPopForBackend.toFixed(2);
          }
      } else if (maxRating) {
           currentRatingError = currentRatingError
                  ? currentRatingError + ' Max Rating must also be a number.'
                  : 'Max Rating must be a number.';
      }
      // --- End Rating Filter Validation ---


      // ** NEW: Set the validation error states **
      setPriceError(currentPriceError);
      setRatingError(currentRatingError);

      // Only proceed to set active filters if BOTH price and rating errors are clear
      if (!currentPriceError && !currentRatingError) {
          console.log("Applying filters (Backend expects 0-1 pop):", filtersToApply);
          setActiveFilters(filtersToApply); // Trigger fetch
      } else {
          console.warn("Filters not applied due to validation errors:", { price: currentPriceError, rating: currentRatingError });
      }
  };

  const handleClearFilters = () => {
      setMinPrice(''); setMaxPrice('');
      setMinRating(''); setMaxRating('');
      // ** NEW: Clear price error **
      setPriceError('');
      setRatingError('');
      setActiveFilters({});
    
  };

  // --- Sort Change Handler ---
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  // --- JSX Rendering ---
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="product-list-title">Product List</h1>
      </header>

      {/* Control Bar */}
      <div className="controls-bar">
          {/* Price Filters */}
          <div className="filter-group-price"> {/* Wrapper for price inputs + error */}
              <div className="price-inputs"> {/* Keep inputs side-by-side */}
                  <div className="filter-group">
                      <label htmlFor="minPrice">Min Price ($)</label>
                      <input
                          type="number"
                          id="minPrice"
                          className={priceError ? 'input-error' : ''} // Error styling
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="e.g., 500"
                          min="0" // HTML5 validation
                          aria-invalid={!!priceError} // Accessibility
                          aria-describedby={priceError ? "price-error-msg" : undefined} // Accessibility
                      />
                  </div>
                  <div className="filter-group">
                      <label htmlFor="maxPrice">Max Price ($)</label>
                      <input
                          type="number"
                          id="maxPrice"
                          className={priceError ? 'input-error' : ''} // Error styling
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="e.g., 1000"
                          min="0" // HTML5 validation
                          aria-invalid={!!priceError} // Accessibility
                          aria-describedby={priceError ? "price-error-msg" : undefined} // Accessibility
                       />
                  </div>
              </div>
              {/* ** NEW: Display Price Error Message ** */}
              {priceError && <p id="price-error-msg" className="error-message price-error-text">{priceError}</p>}
          </div>

          {/* Rating Filters */}
          <div className="filter-group-rating"> {/* Wrapper for rating inputs + error */}
              <div className="rating-inputs"> {/* Keep inputs side-by-side */}
                  <div className="filter-group">
                      <label htmlFor="minRating">Min Rating (0-5)</label>
                      <input
                          type="number"
                          id="minRating"
                          className={ratingError ? 'input-error' : ''} // Error styling
                          value={minRating}
                          onChange={(e) => setMinRating(e.target.value)}
                          placeholder="e.g., 2.5"
                          min="0" max="5" step="0.1" // HTML5 validation
                          aria-invalid={!!ratingError} // Accessibility
                          aria-describedby={ratingError ? "rating-error-msg" : undefined} // Accessibility
                      />
                  </div>
                  <div className="filter-group">
                      <label htmlFor="maxRating">Max Rating (0-5)</label>
                      <input
                          type="number"
                          id="maxRating"
                          className={ratingError ? 'input-error' : ''} // Error styling
                          value={maxRating}
                          onChange={(e) => setMaxRating(e.target.value)}
                          placeholder="e.g., 4.5"
                          min="0" max="5" step="0.1" // HTML5 validation
                          aria-invalid={!!ratingError} // Accessibility
                          aria-describedby={ratingError ? "rating-error-msg" : undefined} // Accessibility
                      />
                  </div>
              </div>
              {/* Display Rating Error Message */}
              {ratingError && <p id="rating-error-msg" className="error-message rating-error-text">{ratingError}</p>}
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
              <button onClick={handleApplyFilters} className="filter-button apply">Apply</button>
              <button onClick={handleClearFilters} className="filter-button clear">Clear</button>
          </div>

          {/* Sorting Dropdown */}
          <div className="sort-control-group">
              <label htmlFor="sort-by">Sort By:</label>
              <select id="sort-by" value={sortBy} onChange={handleSortChange}>
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
              </select>
          </div>
      </div>
      {/* END: Control Bar */}

      <main>
        {/* Display Fetch error OR Loading OR No products OR Product List */}
        {loading && <p className="status-message">Loading products...</p>}
        {error && !loading && <p className="status-message error-message">{error}</p>}
        {!loading && !error && sortedProducts.length === 0 && <p className="status-message">No products match the current filters.</p>}
        {!loading && !error && sortedProducts.length > 0 && <ProductList products={sortedProducts} />}
      </main>
    </div>
  );
}

export default App;