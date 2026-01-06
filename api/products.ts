import { Router, Request, Response } from 'express';
import { getDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const productsRouter = Router();

// GET /api/products - Get all active products
productsRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  
  try {
    // Get all active products
    const products = db.prepare(`
      SELECT * FROM products WHERE isActive = 1
    `).all();
    
    // Parse tags JSON and format field names
    const formatted = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      image: p.image,
      tags: JSON.parse(p.tags || '[]'),
      isActive: Boolean(p.isActive),
      isFeatured: Boolean(p.isFeatured)
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get a single product by ID
productsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  
  try {
    const product = db.prepare(`
      SELECT * FROM products WHERE id = ?
    `).get(id) as any;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const formatted = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      tags: JSON.parse(product.tags || '[]'),
      isActive: Boolean(product.isActive),
      isFeatured: Boolean(product.isFeatured)
    };

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create a new product (admin only)
productsRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, description, price, category, image, tags, isFeatured } = req.body;
  
  try {
    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields: name, price, category' });
    }
    
    // Generate ID
    const id = `prod-${Date.now()}`;
    
    const insert = db.prepare(`
      INSERT INTO products (id, name, description, price, category, image, tags, isActive, isFeatured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(
      id,
      name,
      description || '',
      price,
      category,
      image || '',
      JSON.stringify(tags || []),
      1,
      isFeatured ? 1 : 0
    );
    
    return res.status(201).json({ id, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update a product (admin only)
productsRouter.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { name, description, price, category, image, tags, isActive, isFeatured } = req.body;
  
  try {
    // Check if product exists
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const update = db.prepare(`
      UPDATE products 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          category = COALESCE(?, category),
          image = COALESCE(?, image),
          tags = COALESCE(?, tags),
          isActive = COALESCE(?, isActive),
          isFeatured = COALESCE(?, isFeatured)
      WHERE id = ?
    `);
    
    update.run(
      name,
      description,
      price,
      category,
      image,
      tags ? JSON.stringify(tags) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      id
    );
    
    return res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Soft delete a product (admin only)
productsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  
  try {
    const update = db.prepare('UPDATE products SET isActive = 0 WHERE id = ?');
    const result = update.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    return res.status(200).json({ message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Vercel serverless function handler (for backward compatibility)
export default function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb();

  if (req.method === 'GET') {
    try {
      // Get all active products
      const products = db.prepare(`
        SELECT * FROM products WHERE isActive = 1
      `).all();
      
      // Parse tags JSON
      const formatted = products.map((p: any) => ({
        ...p,
        tags: JSON.parse(p.tags || '[]'),
        isActive: Boolean(p.isActive),
        isFeatured: Boolean(p.isFeatured)
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
