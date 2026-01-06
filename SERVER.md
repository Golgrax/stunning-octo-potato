# Lumina Café API Server

Express server providing REST API endpoints for the Lumina Café application.

## Getting Started

### Prerequisites

- Node.js installed
- Database initialized (run `npm run init-db` first)

### Running the Server

```bash
# Start the server
npm run server

# Start the server with auto-reload on file changes
npm run server:watch
```

The server will start on **http://localhost:3001**

## API Endpoints

### Health Check

#### `GET /health`
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-08T15:47:41.845Z"
}
```

---

### Products API

#### `GET /api/products`
Get all active products.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Velvet Latte",
    "description": "Espresso with steamed silky milk...",
    "price": 5.5,
    "category": "coffee",
    "image": "https://...",
    "tags": ["Bestseller", "Hot"],
    "isActive": true,
    "isFeatured": true
  }
]
```

#### `GET /api/products/:id`
Get a single product by ID.

**Response:** Single product object or 404 error.

#### `POST /api/products`
Create a new product (admin only).

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Description",
  "price": 5.99,
  "category": "coffee",
  "image": "https://...",
  "tags": ["New"],
  "isFeatured": false
}
```

#### `PUT /api/products/:id`
Update a product (admin only).

**Request Body:** Partial product object with fields to update.

#### `DELETE /api/products/:id`
Soft delete a product (sets isActive to false).

---

### Orders API

#### `GET /api/orders`
Get all orders with optional filters.

**Query Parameters:**
- `status` - Filter by order status (pending_payment, in_prep, ready, completed)
- `userId` - Filter by user ID
- `limit` - Limit number of results

**Response:**
```json
[
  {
    "id": "ord-1234",
    "customer": {
      "name": "Alice Member",
      "email": "alice@lumina.cafe",
      "type": "registered",
      "userId": "u-1"
    },
    "items": [...],
    "subtotal": 6.25,
    "tax": 0.62,
    "total": 6.87,
    "status": "in_prep",
    "timestamp": "2025-12-08T...",
    "paymentMethod": "manual_qr",
    "fulfillment": "pickup"
  }
]
```

#### `GET /api/orders/:id`
Get a single order by ID.

#### `POST /api/orders`
Create a new order.

**Request Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "type": "guest"
  },
  "items": [
    {
      "id": "1",
      "name": "Velvet Latte",
      "price": 5.5,
      "quantity": 1
    }
  ],
  "subtotal": 5.5,
  "tax": 0.55,
  "total": 6.05,
  "paymentMethod": "manual_qr",
  "fulfillment": "pickup"
}
```

**Response:**
```json
{
  "id": "ord-1733678901234",
  "message": "Order created successfully",
  "order": {
    "id": "ord-1733678901234",
    "status": "pending_payment"
  }
}
```

#### `PUT /api/orders/:id`
Update order status or add feedback.

**Request Body (Status Update):**
```json
{
  "status": "in_prep"
}
```

**Request Body (Add Feedback):**
```json
{
  "feedback": {
    "rating": 5,
    "comment": "Great service!"
  }
}
```

#### `DELETE /api/orders/:id`
Cancel an order (only if status is pending_payment).

---

### Authentication API

#### `POST /api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "admin@lumina.cafe"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "u-2",
    "name": "John Admin",
    "email": "admin@lumina.cafe",
    "role": "admin",
    ...
  },
  "token": "mock-token-u-2-1733678901234"
}
```

#### `POST /api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890"
}
```

#### `GET /api/auth/user/:id`
Get user profile by ID.

#### `PUT /api/auth/user/:id`
Update user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+1234567890"
}
```

#### `GET /api/auth/users`
Get all users (admin only).

**Query Parameters:**
- `role` - Filter by role (admin, employee, customer)
- `status` - Filter by status (active, suspended)

---

## Architecture

### File Structure

```
server.ts              # Main Express server
api/
  ├── products.ts      # Products endpoints
  ├── orders.ts        # Orders endpoints
  └── auth.ts          # Authentication endpoints
lib/
  └── db.ts           # Database connection
```

### Features

- **CORS enabled** - Allows cross-origin requests
- **JSON body parsing** - Automatic JSON request body parsing
- **Database integration** - Uses SQLite via better-sqlite3
- **Error handling** - Centralized error handling middleware
- **Vercel compatibility** - API files maintain backward compatibility with Vercel serverless functions

### Middleware

- `cors()` - Enable CORS for all routes
- `bodyParser.json()` - Parse JSON request bodies
- `express.json()` - Additional JSON parsing

### Database

The server uses SQLite database (`lumina.db`) with the following tables:
- `products` - Product catalog
- `inventory` - Stock management
- `users` - User accounts
- `orders` - Order history

Make sure to initialize the database before starting the server:
```bash
npm run init-db
```

---

## Testing

### Using curl

```bash
# Health check
curl http://localhost:3001/health

# Get products
curl http://localhost:3001/api/products

# Get single product
curl http://localhost:3001/api/products/1

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lumina.cafe"}'

# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name":"Test","email":"test@test.com","type":"guest"},
    "items": [{"id":"1","name":"Velvet Latte","price":5.5}],
    "subtotal": 5.5,
    "tax": 0.55,
    "total": 6.05
  }'
```

### Using Postman or Insomnia

Import the endpoints listed above and test with the provided request/response examples.

---

## Development

### Running in Development Mode

```bash
npm run server:watch
```

This will automatically restart the server when you make changes to the code.

### Adding New Endpoints

1. Create or modify files in the `api/` directory
2. Export a router from the file
3. Import and register the router in `server.ts`

Example:
```typescript
// api/myendpoint.ts
import { Router } from 'express';
export const myRouter = Router();
myRouter.get('/', (req, res) => res.json({ message: 'Hello' }));

// server.ts
import { myRouter } from './api/myendpoint';
app.use('/api/myendpoint', myRouter);
```

---

## Production Deployment

### Local Production Build

```bash
npm run build
npm run server
```

### Vercel Deployment

The API files are compatible with Vercel serverless functions. Each file in `api/` exports a default handler function that works with Vercel's serverless runtime.

---

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, you can change it in `server.ts`:

```typescript
const PORT = 3002; // Change to any available port
```

### Database Not Found

Make sure to initialize the database first:
```bash
npm run init-db
```

### CORS Issues

The server has CORS enabled by default. If you need to restrict origins, modify the CORS configuration in `server.ts`:

```typescript
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
```

