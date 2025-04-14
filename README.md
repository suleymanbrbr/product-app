# Product Listing Application

This is a full-stack application designed to display a list of products (engagement rings) with dynamically calculated prices based on real-time gold data. It features a React frontend interface for browsing, filtering, and sorting products, served by a Node.js backend API.

## Features

**Frontend:**
*   Displays a list of products fetched from the backend API.
*   Shows product details including name, dynamically calculated price, and image.
*   Product image carousel powered by Swiper.js.
*   Color picker for each product that changes the displayed image.
*   Displays popularity score as a 0-5 star rating (calculated from the 0-1 score from the backend).
*   Client-side filtering based on:
    *   Price range ($)
    *   User-friendly rating range (0-5)
*   Client-side sorting based on:
    *   Price (Low to High, High to Low)
    *   Name (A to Z)
*   Input validation for price (non-negative) and rating (0-5) filters.
*   Responsive design for various screen sizes.

**Backend:**
*   RESTful API endpoint (`/api/products`) serves product data.
*   Reads base product information from a local `products.json` file.
*   Fetches real-time gold price per gram from an external API (GoldAPI.io).
*   Calculates dynamic product prices based on the formula: `Price = (popularityScore + 1) * weight * goldPrice`.
*   Provides API-level filtering based on:
    *   `minPrice`, `maxPrice`
    *   `minPopularity`, `maxPopularity` (expecting values between 0-1)
*   Configured for local development (Express) and deployment (tested with Vercel Serverless Functions).
*   Includes CORS configuration to allow requests from the frontend.

## Tech Stack

*   **Frontend:** React, Vite, Axios, Swiper.js, CSS
*   **Backend:** Node.js, Express (for local dev), Axios, Dotenv, Cors
*   **Deployment:** Vercel (Frontend & Backend)
*   **External APIs:** GoldAPI.io

## Demo

*   **Live Frontend:** https://product-app-frontend-two.vercel.app/
*   **Live Backend API:** https://product-app-backend-l1ujsu3i3-suleymans-projects-2f8f8c76.vercel.app/api/products

## Screenshots

<img width="1379" alt="Screenshot 2025-04-14 at 14 10 27" src="https://github.com/user-attachments/assets/03ee8088-e5fb-4749-8b63-2584bd0718b0" />




<img width="1327" alt="Screenshot 2025-04-14 at 14 11 00" src="https://github.com/user-attachments/assets/8bf7fd61-8e12-4225-bf56-03808f7db526" />


## API Endpoint

*   **`GET /api/products`**
    *   Retrieves the list of products with calculated prices.
    *   **Query Parameters:**
        *   `minPrice` (number): Minimum product price.
        *   `maxPrice` (number): Maximum product price.
        *   `minPopularity` (number, 0-1): Minimum popularity score (0-1 scale).
        *   `maxPopularity` (number, 0-1): Maximum popularity score (0-1 scale).
