import { Router, Request, Response } from 'express';
import { getDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const authRouter = Router();

// POST /api/auth/login - Admin/Employee Login (FR-A01)
authRouter.post('/login', (req: Request, res: Response) => {
  const db = getDb();
  const { email, password } = req.body;
  
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Query user by email (include password for verification)
    const user = db.prepare(`
      SELECT id, name, email, password, phone, role, joinedDate, totalOrders, totalSpent, status
      FROM users 
      WHERE email = ? AND status = 'active'
    `).get(email) as any;
    
    // Check if user exists
    if (!user) {
      console.log(`❌ Login failed: User not found for email ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // PRODUCTION NOTE: In production, use bcrypt.compare(password, user.password)
    // Example: const isPasswordValid = await bcrypt.compare(password, user.password);
    // For this prototype, we're using plain text password comparison
    if (user.password !== password) {
      console.log(`❌ Login failed: Invalid password for ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check if user has admin or employee role
    if (user.role !== 'admin' && user.role !== 'employee') {
      console.log(`❌ Login failed: User ${email} has role '${user.role}', not admin/employee`);
      return res.status(403).json({ 
        error: 'Access denied. Admin or employee role required.' 
      });
    }
    
    // Login successful - format response (exclude password)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      joinedDate: user.joinedDate,
      totalOrders: user.totalOrders,
      totalSpent: user.totalSpent,
      status: user.status
    };
    
    // PRODUCTION NOTE: Generate a proper JWT token here
    // Example: const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    const token = `mock-token-${user.id}-${Date.now()}`;
    
    console.log(`✅ Login successful: ${user.name} (${user.role}) - ${user.email}`);
    
    return res.status(200).json({ 
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/register - Register new user
authRouter.post('/register', (req: Request, res: Response) => {
  const db = getDb();
  const { name, email, phone, password } = req.body;
  
  try {
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Generate user ID
    const userId = `u-${Date.now()}`;
    
    // Insert new user
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, phone, role, joinedDate, totalOrders, totalSpent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(
      userId,
      name,
      email,
      phone || null,
      'customer', // Default role
      new Date().toISOString(),
      0, // totalOrders
      0, // totalSpent
      'active'
    );
    
    // Get the created user
    const user = db.prepare(`
      SELECT id, name, email, phone, role, joinedDate, totalOrders, totalSpent, status
      FROM users 
      WHERE id = ?
    `).get(userId) as any;
    
    // In a real app, you would generate a JWT token here
    const token = `mock-token-${userId}-${Date.now()}`;
    
    return res.status(201).json({ 
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/user/:id - Get user profile
authRouter.get('/user/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, role, joinedDate, totalOrders, totalSpent, status
      FROM users 
      WHERE id = ? AND status = 'active'
    `).get(id) as any;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/user/:id - Update user profile
authRouter.put('/user/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { name, phone, email } = req.body;
  
  try {
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If email is being changed, check it's not taken
    if (email) {
      const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (emailTaken) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }
    
    // Update user
    const update = db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone)
      WHERE id = ?
    `);
    
    update.run(name, email, phone, id);
    
    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/auth/users - Get all users (admin only)
authRouter.get('/users', (req: Request, res: Response) => {
  const db = getDb();
  const { role, status } = req.query;
  
  try {
    let query = 'SELECT id, name, email, phone, role, joinedDate, totalOrders, totalSpent, status FROM users';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY joinedDate DESC';
    
    const users = db.prepare(query).all(...params);
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Vercel serverless function handler (for backward compatibility)
export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented in serverless mode' });
}

