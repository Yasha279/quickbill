# QuickBill POS System

<<<<<<< HEAD
Production-ready full-stack POS for **Meera's Retail Shop** — React, Express, MongoDB, JWT auth, invoices, reports, and AI insights.

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit, Recharts, jsPDF, html2canvas, xlsx |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt, express-validator |
| Database | MongoDB |
| AI | Google Gemini or OpenRouter (optional) |

## Prerequisites

- Node.js 18+
- MongoDB running locally or Atlas URI (standalone/local install is supported; no replica set required)

## Quick Start

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run seed
npm run dev
```

API runs at `http://localhost:5000`

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Demo Login

| Role | Email | Password |
|------|-------|----------|
| Admin (Meera) | meera@quickbill.shop | admin123 |
| Staff (Cashier) | ravi@quickbill.shop | staff123 |

## Environment Variables

### Server (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quickbill_pos
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
TAX_RATE=18
GEMINI_API_KEY=          # optional
OPENROUTER_API_KEY=      # optional
AI_PROVIDER=gemini
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## API Overview

### Auth
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (protected)

### Products
- `GET /api/products` — List (search, category, pagination)
- `POST /api/products` — Create (admin)
- `PUT /api/products/:id` — Update (admin)
- `DELETE /api/products/:id` — Delete (admin)
- `PATCH /api/products/restock/:id` — Restock

### Inventory
- `GET /api/inventory/low-stock`
- `GET /api/inventory/logs`

### Orders
- `POST /api/orders` — Create order (atomic stock deduction)
- `GET /api/orders` — List orders
- `GET /api/orders/:id` — Order detail
- `PATCH /api/orders/cancel/:id` — Cancel & restore stock

### Dashboard
- `GET /api/dashboard/stats`
- `GET /api/dashboard/charts`

### Reports
- `GET /api/reports/sales`
- `GET /api/reports/inventory`
- `GET /api/reports/export?type=sales|inventory|best-selling`

### AI
- `POST /api/ai/generate-description`
- `POST /api/ai/sales-summary`
- `POST /api/ai/restock-suggestions`
- `GET /api/ai/trend-insight`
- `POST /api/ai/natural-search` — natural language queries (e.g. "orders above 500 from last week")

## Sample Login Response

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "8h",
  "user": {
    "id": "...",
    "name": "Meera Sharma",
    "email": "meera@quickbill.shop",
    "role": "admin"
  }
}
```

## Features

- JWT authentication with protected routes & auto logout on expiry
- Role-based access (admin vs staff)
- Product CRUD with search, filters, pagination
- Atomic inventory updates via MongoDB transactions
- Modern POS billing with barcode support, tax, discount
- Printable & downloadable PDF invoices
- Dashboard with KPIs and Recharts analytics
- Excel report exports
- AI product descriptions, sales summaries, restock tips
- Dark/light mode

## Project Structure

```
weybee/
├── server/          # Express API (MVC)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── client/          # React SPA
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       ├── redux/
│       └── layouts/
└── README.md
```

## Security

- Password hashing (bcrypt)
- JWT middleware on all business routes
- Helmet, CORS, rate limiting, mongo-sanitize
- Input validation via express-validator
- Admin-only product mutations

## License

MIT — Built for Meera's retail shop demo.
=======
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
>>>>>>> 509beb7991effd0ffb28aa97b1e3fff24627f7c1
