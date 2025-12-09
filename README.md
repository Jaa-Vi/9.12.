# Inventory Management System

A modern web application for managing retail store inventory. Built with Node.js, Express, SQLite, and vanilla JavaScript.

## Features

- 📦 **Browse Products**: View all products in a clean, modern table interface
- ➕ **Add Products**: Add new products with name, category, price, quantity, and description
- ✏️ **Edit Products**: Update existing product information
- 🗑️ **Delete Products**: Remove products from inventory
- 🔢 **Quantity Management**: Quickly increase or decrease product quantities with +/- buttons
- 🔍 **Search**: Search products by name, category, or description
- 📊 **Statistics**: View total products, inventory value, and low stock alerts
- 💡 **Low Stock Alerts**: Products with quantity < 20 are highlighted
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 9.12.
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database with 20 sample products:
```bash
npm run init-db
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The application will load with 20 pre-populated products ready to manage!

## Database Schema

The application uses SQLite with the following schema:

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  description TEXT
);
```

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a single product
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

## Project Structure

```
.
├── server.js           # Express server and API routes
├── init-db.js         # Database initialization script
├── package.json       # Node.js dependencies
├── public/            # Frontend files
│   ├── index.html    # Main HTML page
│   ├── styles.css    # CSS styling
│   └── app.js        # Frontend JavaScript
└── inventory.db      # SQLite database (created after init)
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Modern gradient design with responsive layout

## License

MIT