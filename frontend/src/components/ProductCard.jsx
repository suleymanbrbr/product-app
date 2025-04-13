// src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  // State for color/image
  const availableColors = Object.keys(product.images || {});
  const defaultColor = availableColors.includes('yellow') ? 'yellow' : (availableColors[0] || 'default');
  const defaultImage = product.images && product.images[defaultColor] ? product.images[defaultColor] : 'placeholder.png';

  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [currentImage, setCurrentImage] = useState(defaultImage);

   useEffect(() => {
    if (product.images && product.images[selectedColor]) {
      setCurrentImage(product.images[selectedColor]);
    } else {
      setCurrentImage('placeholder.png');
    }
  }, [selectedColor, product.images]);


  // Popularity Calculation for Fractional Stars
  const rating = product.popularityScore != null ? product.popularityScore * 5 : null;
  const displayPopularity = rating != null ? rating.toFixed(1) : 'N/A';
  const fullStars = rating != null ? Math.floor(rating) : 0;
  const partialFill = rating != null ? (rating - fullStars) * 100 : 0;


  const displayPrice = product.price != null ? `$${product.price.toFixed(2)} USD` : 'Price unavailable';

  // --- Ensure colorMap is defined correctly ---
  const colorMap = {
    yellow: '#E6CA97',
    white: '#D9D9D9',
    rose: '#E1A4A9',
  };
  // ---

  const handleColorClick = (color) => {
    if (product.images && product.images[color]) {
      setSelectedColor(color);
    }
  };

  const productName = product.name || 'Unnamed Product';

  return (
    <div className="product-card">
      {/* Image */}
      <img
        src={currentImage}
        alt={`${productName} - ${selectedColor} gold`}
        className="product-image"
        onError={(e) => { e.target.onerror = null; e.target.src="placeholder.png"; }}
      />

      {/* Middle part - Info */}
      {/* Using a wrapper div here is optional but can help structure */}
      <div className="product-info">
        <h3 className="product-name">{productName}</h3>
        <p className="product-price">{displayPrice}</p>

        {/* --- COLOR PICKER SECTION --- */}
        <div className="color-picker">
          {Object.entries(colorMap).map(([colorName, colorHex]) => (
             // Check if product.images and the specific color image exist
             product.images && product.images[colorName] && (
              // --- RESTORED BUTTON CODE ---
              <button
                key={colorName} // Unique key for each button
                className={`color-swatch ${selectedColor === colorName ? 'selected' : ''}`} // Dynamic class for styling selected
                style={{ backgroundColor: colorHex }} // Apply background color
                onClick={() => handleColorClick(colorName)} // Handle clicks
                aria-label={`Select ${colorName} gold`} // Accessibility label
                title={`${colorName.charAt(0).toUpperCase() + colorName.slice(1)} Gold`} // Tooltip on hover
              />
              // --- END RESTORED BUTTON CODE ---
            )
          ))}
        </div>
        {/* --- END COLOR PICKER SECTION --- */}

        {/* --- COLOR NAME --- */}
        <p className="product-color-name">
           {selectedColor !== 'default'
              ? `${selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} Gold`
              : 'Color unavailable'}
        </p>
        {/* --- END COLOR NAME --- */}

      </div> {/* End of .product-info wrapper */}


      {/* --- Popularity Section (with Fractional Stars) --- */}
      <div className="product-popularity">
        <div className="stars">
          {[...Array(5)].map((_, index) => {
            let starClass = 'star-empty';
            let style = {};
            if (index < fullStars) {
              starClass = 'star-full';
            } else if (index === fullStars && partialFill > 0) {
              starClass = 'star-partial';
              style = { '--star-fill-percentage': `${partialFill}%` };
            }
            return (
              <span key={index} className={`star ${starClass}`} style={style}>
                ★
              </span>
            );
          })}
        </div>
        {/* Display the numeric score */}
        {rating != null && (
           <span className="score-value">{displayPopularity}/5</span>
        )}
         {rating == null && (
            <span className="score-value">N/A</span>
         )}
      </div>
      {/* --- End Popularity Section --- */}

    </div>
  );
};

export default ProductCard;