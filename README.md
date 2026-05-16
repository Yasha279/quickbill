# QuickBill POS System

A full-stack, AI-powered Point of Sale (POS) and inventory management
system built for retail shop owners like **Meera**.

QuickBill helps manage products, billing, inventory, reports, analytics,
and AI-driven business insights in one modern platform.

## Features

### Authentication & Authorization

-   Secure JWT-based authentication
-   Role-based access control:
    -   Admin
    -   Staff / Cashier
-   Password hashing with bcrypt
-   Protected frontend routes
-   Protected backend APIs
-   Auto logout on token expiry

### Product Management

-   Add new products
-   Edit product details
-   Delete products
-   Product search & filters
-   Category-based organization
-   Product image support
-   Barcode / SKU support
-   Pagination support

### Inventory Management

-   Real-time stock updates
-   Automatic stock deduction after sales
-   Prevent overselling
-   Low stock alerts
-   Inventory restocking
-   Inventory movement logs
-   Atomic stock updates using MongoDB transactions

### POS Billing System

-   Fast billing interface
-   Instant product search
-   Barcode scanning support
-   Tax/GST calculations
-   Discount support
-   Customer information
-   Payment methods: Cash, Card, UPI

## Tech Stack

-   React.js
-   Tailwind CSS
-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JWT
-   Redux Toolkit
-   Recharts
-   jsPDF
-   Gemini/OpenRouter API

## Installation

### Backend

``` bash
cd server
npm install
npm run dev
```

### Frontend

``` bash
cd client
npm install
npm run dev
```
