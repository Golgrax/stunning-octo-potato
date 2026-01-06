# Lumina Café - Test Credentials

## Admin Dashboard Access

### 👨‍💼 Admin Account
- **Email**: `admin@lumina.cafe`
- **Password**: `admin123`
- **Role**: Admin
- **Name**: John Admin
- **Access**: Full admin dashboard access

### 👩‍💼 Employee Account
- **Email**: `employee@lumina.cafe`
- **Password**: `employee123`
- **Role**: Employee
- **Name**: Sarah Employee
- **Access**: Full admin dashboard access

### 👤 Customer Account (No Admin Access)
- **Email**: `alice@lumina.cafe`
- **Password**: `customer123`
- **Role**: Customer
- **Name**: Alice Member
- **Access**: Customer view only (cannot access admin dashboard)

---

## Quick Login Test

```bash
# Admin Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lumina.cafe","password":"admin123"}'

# Employee Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@lumina.cafe","password":"employee123"}'

# Customer Login (Will be denied)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@lumina.cafe","password":"customer123"}'
```

---

## Database Initialization

When you run `npm run init-db`, these users are automatically created with their passwords.

⚠️ **Security Warning**: These passwords are stored in **plain text** for prototype purposes only. In production, use bcrypt or similar hashing algorithms.

---

## Frontend Login Form

Use these credentials in your login form to test the admin dashboard:

1. Navigate to the login page
2. Enter email: `admin@lumina.cafe`
3. Enter password: `admin123`
4. Click "Login"
5. You should be redirected to the admin dashboard

---

**Last Updated**: December 8, 2025

