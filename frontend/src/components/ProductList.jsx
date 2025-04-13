// src/components/ProductList.jsx
import React from 'react';
import ProductCard from './ProductCard.jsx';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';

import { Navigation, Scrollbar } from 'swiper/modules';

const ProductList = ({ products }) => {
  if (!products || products.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className="product-list-container">
      <Swiper
        modules={[Navigation, Scrollbar]}
        spaceBetween={25} // Or use value from ProductCard margin if needed
        slidesPerView={1}
        navigation={true}
        grabCursor={true}
        allowTouchMove={true}     // Explicitly allow touch swiping
        simulateTouch={true}      // Explicitly allow mouse drag simulation
        scrollbar={{
            draggable: true,
            hide: false
         }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          768: { slidesPerView: 3, spaceBetween: 25 },
          1024: { slidesPerView: 4, spaceBetween: 30 },
        }}
        className="mySwiper" // Target this class for overrides
        style={{ paddingBottom: '30px' }} // Adjusted padding for scrollbar
      >
        {products.map((product, index) => (
          // Remove margin from ProductCard CSS if using spaceBetween
          <SwiperSlide key={product.name || index}>
             <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductList;