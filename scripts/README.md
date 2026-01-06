# Database Initialization Script

## Overview

This folder contains the database initialization script for Lumina Café.

## Usage

### First-time setup

1. Install dependencies (if not already done):
```bash
npm install
```

2. Run the database initialization script:
```bash
npm run init-db
```

This will:
- Create the SQLite database (`lumina.db`) in the project root
- Set up all necessary tables (products, inventory, users, orders)
- Insert initial mock data including:
  - 6 products (coffees, teas, and pastries)
  - Inventory items for all products
  - 2 users (1 customer, 1 admin)

### Re-initializing the database

If you need to reset the database:

1. Delete the existing database file:
```bash
rm lumina.db
```

2. Run the initialization script again:
```bash
npm run init-db
```

## Files

- `init-db.ts` - Main initialization script that creates the database schema and populates it with mock data

## Database Location

The SQLite database file will be created at: `./lumina.db` (project root)

## Mock Data

### Products
- Velvet Latte ($5.50) - Featured coffee
- Cold Brew Noir ($4.50) - Featured coffee
- Matcha Cloud ($6.00) - Tea
- Golden Croissant ($3.75) - Featured pastry
- Cortado ($4.00) - Coffee
- Lavender Haze ($5.75) - Tea

### Users
- **Customer**: Alice Member (alice@lumina.cafe)
- **Admin**: John Admin (admin@lumina.cafe)

### Inventory
All products have initial stock levels set with appropriate low-stock thresholds.

