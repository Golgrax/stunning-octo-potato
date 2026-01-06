# Admin Authentication System (FR-A01)

## Overview

The admin authentication system secures the admin dashboard by requiring valid credentials and proper role authorization. Only users with `admin` or `employee` roles can access the admin portal.

## Implementation

### Database Schema

The `users` table includes a password field:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- Plain text for prototype; PRODUCTION: Use bcrypt hash
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'customer')),
  joinedDate TEXT NOT NULL,
  totalOrders INTEGER DEFAULT 0,
  totalSpent REAL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended'))
);
```

**⚠️ SECURITY NOTE**: For this prototype, passwords are stored in **plain text**. In production, passwords MUST be hashed using bcrypt or similar:

```typescript
// PRODUCTION EXAMPLE:
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.password);
```

### Authentication Endpoint

**POST** `/api/auth/login`

#### Request Body

```json
{
  "email": "admin@lumina.cafe",
  "password": "admin123"
}
```

#### Authentication Flow

1. **Validate Input**: Check that both email and password are provided
2. **Query Database**: Find user by email where status is 'active'
3. **Verify Password**: Compare provided password with stored password
4. **Check Role**: Ensure user has 'admin' or 'employee' role
5. **Generate Token**: Create authentication token (mock token for prototype)
6. **Return User Data**: Send user object (excluding password) and token

#### Success Response (200)

```json
{
  "message": "Login successful",
  "user": {
    "id": "u-2",
    "name": "John Admin",
    "email": "admin@lumina.cafe",
    "phone": "+1987654321",
    "role": "admin",
    "joinedDate": "2024-11-01T00:00:00.000Z",
    "totalOrders": 0,
    "totalSpent": 0,
    "status": "active"
  },
  "token": "mock-token-u-2-1765209387321"
}
```

#### Error Responses

**400 Bad Request** - Missing credentials
```json
{
  "error": "Email and password are required"
}
```

**401 Unauthorized** - Invalid credentials
```json
{
  "error": "Invalid email or password"
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "error": "Access denied. Admin or employee role required."
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Login failed. Please try again."
}
```

## Test Users

### Admin User
- **Email**: `admin@lumina.cafe`
- **Password**: `admin123`
- **Role**: `admin`
- **Name**: John Admin

### Employee User
- **Email**: `employee@lumina.cafe`
- **Password**: `employee123`
- **Role**: `employee`
- **Name**: Sarah Employee

### Customer User (Access Denied)
- **Email**: `alice@lumina.cafe`
- **Password**: `customer123`
- **Role**: `customer`
- **Name**: Alice Member
- **Note**: Cannot access admin dashboard

## Testing Results

### ✅ Test 1: Valid Admin Login

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lumina.cafe","password":"admin123"}'
```

**Result:**
- Status: 200 OK
- User object returned with role: "admin"
- Token generated
- Console: `✅ Login successful: John Admin (admin) - admin@lumina.cafe`

### ✅ Test 2: Valid Employee Login

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@lumina.cafe","password":"employee123"}'
```

**Result:**
- Status: 200 OK
- User object returned with role: "employee"
- Token generated
- Console: `✅ Login successful: Sarah Employee (employee) - employee@lumina.cafe`

### ❌ Test 3: Wrong Password

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lumina.cafe","password":"wrongpassword"}'
```

**Result:**
- Status: 401 Unauthorized
- Error: "Invalid email or password"
- Console: `❌ Login failed: Invalid password for admin@lumina.cafe`

### ❌ Test 4: Non-existent User

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notfound@test.com","password":"test123"}'
```

**Result:**
- Status: 401 Unauthorized
- Error: "Invalid email or password"
- Console: `❌ Login failed: User not found for email notfound@test.com`

### ❌ Test 5: Customer Role (Access Denied)

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@lumina.cafe","password":"customer123"}'
```

**Result:**
- Status: 403 Forbidden
- Error: "Access denied. Admin or employee role required."
- Console: `❌ Login failed: User alice@lumina.cafe has role 'customer', not admin/employee`

### ❌ Test 6: Missing Email

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'
```

**Result:**
- Status: 400 Bad Request
- Error: "Email and password are required"

### ❌ Test 7: Missing Password

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lumina.cafe"}'
```

**Result:**
- Status: 400 Bad Request
- Error: "Email and password are required"

## Security Features

### 1. **Role-Based Access Control (RBAC)**
- Only `admin` and `employee` roles can access admin dashboard
- `customer` role is explicitly denied (403 Forbidden)

### 2. **Password Verification**
- Passwords are checked before granting access
- Invalid passwords return generic error message (no user enumeration)

### 3. **Active User Check**
- Only users with `status = 'active'` can log in
- Suspended users cannot access the system

### 4. **Generic Error Messages**
- Same error for wrong password and non-existent user
- Prevents user enumeration attacks

### 5. **Password Exclusion**
- Password field is never returned in API responses
- Only safe user data is sent to client

### 6. **Logging**
- All login attempts are logged to console
- Success and failure reasons are tracked
- Helps with debugging and security monitoring

## Code Implementation

### Login Handler (api/auth.ts)

```typescript
authRouter.post('/login', (req: Request, res: Response) => {
  const db = getDb();
  const { email, password } = req.body;
  
  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // 2. Query user (include password for verification)
  const user = db.prepare(`
    SELECT id, name, email, password, phone, role, joinedDate, totalOrders, totalSpent, status
    FROM users 
    WHERE email = ? AND status = 'active'
  `).get(email);
  
  // 3. Check if user exists
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // 4. Verify password (PRODUCTION: use bcrypt.compare)
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // 5. Check role authorization
  if (user.role !== 'admin' && user.role !== 'employee') {
    return res.status(403).json({ 
      error: 'Access denied. Admin or employee role required.' 
    });
  }
  
  // 6. Return user data (exclude password) and token
  const userResponse = { ...user };
  delete userResponse.password;
  
  const token = `mock-token-${user.id}-${Date.now()}`;
  
  return res.status(200).json({ 
    message: 'Login successful',
    user: userResponse,
    token
  });
});
```

## Frontend Integration

### Login Form Example

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to admin dashboard
      navigate('/admin');
    } else {
      // Show error message
      setError(data.error);
    }
  } catch (error) {
    setError('Login failed. Please try again.');
  }
};
```

### Protected Route Example

```typescript
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.role || (user.role !== 'admin' && user.role !== 'employee')) {
    return <Navigate to="/login" />;
  }
  
  return children;
};
```

## Production Recommendations

### 1. **Password Hashing**
```bash
npm install bcrypt
```

```typescript
import bcrypt from 'bcrypt';

// When creating user
const hashedPassword = await bcrypt.hash(password, 10);

// When verifying
const isValid = await bcrypt.compare(password, user.password);
```

### 2. **JWT Tokens**
```bash
npm install jsonwebtoken
```

```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### 3. **Rate Limiting**
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', loginLimiter);
```

### 4. **HTTPS Only**
- Always use HTTPS in production
- Set secure cookies
- Enable HSTS headers

### 5. **Session Management**
- Implement token refresh mechanism
- Add logout endpoint to invalidate tokens
- Store tokens securely (httpOnly cookies)

### 6. **Two-Factor Authentication (2FA)**
- Add optional 2FA for admin accounts
- Use TOTP (Time-based One-Time Password)
- Libraries: `speakeasy`, `qrcode`

## API Endpoints Summary

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/login` | POST | No | Admin/Employee login |
| `/api/auth/register` | POST | No | Customer registration |
| `/api/auth/user/:id` | GET | Yes | Get user profile |
| `/api/auth/user/:id` | PUT | Yes | Update user profile |
| `/api/auth/users` | GET | Yes (Admin) | Get all users |

## Environment Variables (Production)

```env
JWT_SECRET=your-secret-key-here
BCRYPT_ROUNDS=10
SESSION_TIMEOUT=86400000
```

---

**Last Updated**: December 8, 2025  
**Status**: ✅ Implemented and Tested  
**Security Level**: Prototype (Plain text passwords - NOT for production)

