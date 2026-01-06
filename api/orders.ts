import { Router, Request, Response } from 'express';
import { getDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { io } from '../server';

export const ordersRouter = Router();

// GET /api/orders - Get all orders (with optional filters)
ordersRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { status, userId, limit } = req.query;
  
  try {
    let query = 'SELECT * FROM orders';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (userId) {
      conditions.push('userId = ?');
      params.push(userId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY timestamp DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    }
    
    const orders = db.prepare(query).all(...params);
    
    // Parse JSON fields
    const formatted = orders.map((o: any) => ({
      ...o,
      items: JSON.parse(o.items || '[]'),
      customer: {
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        address: o.customerAddress,
        type: o.customerType,
        userId: o.userId
      },
      feedback: o.feedbackRating ? {
        rating: o.feedbackRating,
        comment: o.feedbackComment,
        timestamp: o.feedbackTimestamp
      } : undefined,
      timestamp: new Date(o.timestamp)
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get a single order by ID
ordersRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const formatted = {
      ...order,
      items: JSON.parse(order.items || '[]'),
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.customerAddress,
        type: order.customerType,
        userId: order.userId
      },
      feedback: order.feedbackRating ? {
        rating: order.feedbackRating,
        comment: order.feedbackComment,
        timestamp: order.feedbackTimestamp
      } : undefined,
      timestamp: new Date(order.timestamp)
    };

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create a new order with TRANSACTION
ordersRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { customer, items, subtotal, tax, total, paymentMethod, fulfillment } = req.body;
  
  // Validate required fields
  if (!customer || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: customer, items' });
  }
  
  if (!customer.name || !customer.email || !customer.type) {
    return res.status(400).json({ error: 'Invalid customer details' });
  }
  
  // Generate order ID
  const orderId = `ord-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  // Define the transaction
  const placeOrder = db.transaction(() => {
    // Step 1: Check inventory and deduct stock for each item
    const checkInventoryStmt = db.prepare('SELECT currentStock FROM inventory WHERE productId = ?');
    const updateInventoryStmt = db.prepare('UPDATE inventory SET currentStock = currentStock - ? WHERE productId = ?');
    
    for (const item of items) {
      const quantity = item.quantity || 1;
      
      // Check current stock
      const inventory = checkInventoryStmt.get(item.id) as any;
      
      if (!inventory) {
        throw new Error(`Product ${item.name} not found in inventory`);
      }
      
      if (inventory.currentStock < quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${inventory.currentStock}, Requested: ${quantity}`);
      }
      
      // Deduct stock
      updateInventoryStmt.run(quantity, item.id);
    }
    
    // Step 2: Insert into orders table
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        id, customerName, customerEmail, customerPhone, customerAddress, 
        customerType, userId, items, subtotal, tax, total, 
        status, timestamp, paymentMethod, fulfillment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertOrderStmt.run(
      orderId,
      customer.name,
      customer.email,
      customer.phone || null,
      customer.address || null,
      customer.type,
      customer.userId || null,
      JSON.stringify(items),
      subtotal,
      tax,
      total,
      'pending_payment',
      timestamp,
      paymentMethod || 'manual_qr',
      fulfillment || 'pickup'
    );
    
    // Step 3: Insert into order_items table
    const insertOrderItemStmt = db.prepare(`
      INSERT INTO order_items (orderId, productId, productName, quantity, price, options)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of items) {
      insertOrderItemStmt.run(
        orderId,
        item.id,
        item.name,
        item.quantity || 1,
        item.price,
        item.options ? JSON.stringify(item.options) : null
      );
    }
    
    // Step 4: Update user stats if registered user
    if (customer.userId) {
      const updateUserStmt = db.prepare(`
        UPDATE users 
        SET totalOrders = totalOrders + 1, totalSpent = totalSpent + ? 
        WHERE id = ?
      `);
      updateUserStmt.run(total, customer.userId);
    }
    
    // Return the order data
    return {
      id: orderId,
      customer,
      items,
      subtotal,
      tax,
      total,
      status: 'pending_payment',
      timestamp,
      paymentMethod: paymentMethod || 'manual_qr',
      fulfillment: fulfillment || 'pickup'
    };
  });
  
  try {
    // Execute the transaction
    const newOrder = placeOrder();
    
    console.log(`✅ Order ${orderId} created successfully`);
    
    // Emit WebSocket event to admin room for real-time order notification
    io.to('admin-room').emit('new-order', newOrder);
    console.log(`🔔 WebSocket: New order notification sent to admin`);
    
    return res.status(201).json({ 
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error: any) {
    // Transaction automatically rolled back on error
    console.error('❌ Order creation failed (transaction rolled back):', error.message);
    
    // Check if it's an inventory error
    if (error.message.includes('Insufficient stock') || error.message.includes('not found in inventory')) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// PUT /api/orders/:id - Update order status or add feedback
ordersRouter.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { status, feedback } = req.body;
  
  try {
    // Check if order exists
    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (status) {
      // Update order status
      const validStatuses = ['pending_payment', 'in_prep', 'ready', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      
      // Emit WebSocket event for real-time update
      const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
      if (updatedOrder) {
        updatedOrder.items = JSON.parse(updatedOrder.items || '[]');
        updatedOrder.customer = {
          name: updatedOrder.customerName,
          email: updatedOrder.customerEmail,
          phone: updatedOrder.customerPhone,
          address: updatedOrder.customerAddress,
          type: updatedOrder.customerType,
          userId: updatedOrder.userId
        };
        
        // Emit to specific order room
        io.to(`order-${id}`).emit('order-updated', updatedOrder);
        console.log(`🔔 WebSocket: Order ${id} status updated to ${status}`);
      }
    }
    
    if (feedback) {
      // Add feedback
      if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
        return res.status(400).json({ error: 'Invalid rating (must be 1-5)' });
      }
      
      db.prepare(`
        UPDATE orders 
        SET feedbackRating = ?, feedbackComment = ?, feedbackTimestamp = ?
        WHERE id = ?
      `).run(feedback.rating, feedback.comment || '', new Date().toISOString(), id);
      
      // Emit WebSocket event for feedback update
      const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
      if (updatedOrder) {
        updatedOrder.items = JSON.parse(updatedOrder.items || '[]');
        updatedOrder.customer = {
          name: updatedOrder.customerName,
          email: updatedOrder.customerEmail,
          phone: updatedOrder.customerPhone,
          address: updatedOrder.customerAddress,
          type: updatedOrder.customerType,
          userId: updatedOrder.userId
        };
        updatedOrder.feedback = {
          rating: updatedOrder.feedbackRating,
          comment: updatedOrder.feedbackComment,
          timestamp: updatedOrder.feedbackTimestamp
        };
        
        // Emit to order room (for customer tracking)
        io.to(`order-${id}`).emit('order-updated', updatedOrder);
        
        // Emit to admin room (for real-time analytics update)
        io.to('admin-room').emit('feedback-received', {
          orderId: id,
          rating: feedback.rating,
          comment: feedback.comment,
          timestamp: new Date().toISOString(),
          customerName: updatedOrder.customerName
        });
        
        console.log(`⭐ WebSocket: Feedback received for order ${id} - Rating: ${feedback.rating}/5`);
      }
    }
    
    return res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/orders/:id - Cancel an order (only if pending_payment)
ordersRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  
  try {
    const order = db.prepare('SELECT status, items FROM orders WHERE id = ?').get(id) as any;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Can only cancel orders with pending_payment status' });
    }
    
    // Restore inventory
    const items = JSON.parse(order.items);
    const updateInventory = db.prepare('UPDATE inventory SET currentStock = currentStock + 1 WHERE productId = ?');
    for (const item of items) {
      updateInventory.run(item.id);
    }
    
    // Delete order
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    
    return res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Vercel serverless function handler (for backward compatibility)
export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented in serverless mode' });
}

