import { Router, Request, Response } from 'express';
import { getDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const inventoryRouter = Router();

// GET /api/inventory - Get all inventory items
inventoryRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  
  try {
    const inventory = db.prepare('SELECT * FROM inventory ORDER BY productName').all();
    
    return res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /api/inventory/:productId - Get inventory for a specific product
inventoryRouter.get('/:productId', (req: Request, res: Response) => {
  const db = getDb();
  const { productId } = req.params;
  
  try {
    const item = db.prepare('SELECT * FROM inventory WHERE productId = ?').get(productId);
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    return res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// PUT /api/inventory/:productId - Update inventory stock
inventoryRouter.put('/:productId', (req: Request, res: Response) => {
  const db = getDb();
  const { productId } = req.params;
  const { currentStock, lowStockThreshold } = req.body;
  
  try {
    // Check if inventory item exists
    const existing = db.prepare('SELECT productId FROM inventory WHERE productId = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    // Update inventory
    const update = db.prepare(`
      UPDATE inventory 
      SET currentStock = COALESCE(?, currentStock),
          lowStockThreshold = COALESCE(?, lowStockThreshold)
      WHERE productId = ?
    `);
    
    update.run(
      currentStock !== undefined ? currentStock : null,
      lowStockThreshold !== undefined ? lowStockThreshold : null,
      productId
    );
    
    console.log(`✅ Inventory updated for product ${productId}`);
    
    return res.status(200).json({ message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// POST /api/inventory - Create inventory item for a product
inventoryRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { productId, productName, currentStock, unit, lowStockThreshold } = req.body;
  
  try {
    // Validate required fields
    if (!productId || !productName || currentStock === undefined || !unit) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, productName, currentStock, unit' 
      });
    }
    
    // Check if inventory already exists
    const existing = db.prepare('SELECT productId FROM inventory WHERE productId = ?').get(productId);
    if (existing) {
      return res.status(409).json({ error: 'Inventory item already exists for this product' });
    }
    
    // Insert inventory
    const insert = db.prepare(`
      INSERT INTO inventory (productId, productName, currentStock, unit, lowStockThreshold)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insert.run(
      productId,
      productName,
      currentStock,
      unit,
      lowStockThreshold || 10
    );
    
    console.log(`✅ Inventory created for product ${productId}`);
    
    return res.status(201).json({ message: 'Inventory created successfully' });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return res.status(500).json({ error: 'Failed to create inventory' });
  }
});

// Vercel serverless function handler (for backward compatibility)
export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented in serverless mode' });
}

