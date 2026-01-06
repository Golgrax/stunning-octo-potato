import { Router, Request, Response } from 'express';
// xendit-node is published as CJS; grab the constructor from the default export
import XenditModule from 'xendit-node';
const { Xendit } = XenditModule as typeof import('xendit-node');
import { getDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const paymentRouter = Router();

// Initialize Xendit
// IMPORTANT: Get your API key from https://dashboard.xendit.co/settings/developers#api-keys
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || 'xnd_development_your_key_here'
});

const { Invoice } = xenditClient;

// POST /api/payment/create-invoice - Create Xendit payment invoice
paymentRouter.post('/create-invoice', async (req: Request, res: Response) => {
  const { orderId, amount, customerEmail, customerName, items } = req.body;
  
  try {
    // Validate input
    if (!orderId || !amount || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields: orderId, amount, customerEmail' });
    }

    // Create invoice with Xendit
    const invoice = await Invoice.createInvoice({
      externalId: orderId,
      amount: amount,
      payerEmail: customerEmail,
      description: `Lumina Café Order #${orderId.slice(-6).toUpperCase()}`,
      invoiceDuration: 86400, // 24 hours
      currency: process.env.XENDIT_CURRENCY || 'PHP',
      reminderTime: 1,
      successRedirectUrl: `http://localhost:5173/order-success?orderId=${orderId}`,
      failureRedirectUrl: `http://localhost:5173/order-failed?orderId=${orderId}`,
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price,
        category: item.category || 'Food & Beverage'
      })),
      customer: {
        given_names: customerName,
        email: customerEmail
      }
    });

    console.log('✅ Xendit invoice created:', invoice.id);

    return res.status(200).json({
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      expiryDate: invoice.expiry_date,
      amount: invoice.amount,
      status: invoice.status
    });
  } catch (error: any) {
    console.error('❌ Xendit invoice creation failed:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment invoice',
      details: error.message 
    });
  }
});

// GET /api/payment/invoice/:invoiceId - Get invoice status
paymentRouter.get('/invoice/:invoiceId', async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  
  try {
    const invoice = await Invoice.getInvoice({
      invoiceId: invoiceId
    });

    return res.status(200).json({
      id: invoice.id,
      externalId: invoice.external_id,
      status: invoice.status,
      amount: invoice.amount,
      paidAmount: invoice.paid_amount,
      paidAt: invoice.paid_at,
      paymentMethod: invoice.payment_method,
      paymentChannel: invoice.payment_channel
    });
  } catch (error: any) {
    console.error('❌ Failed to get invoice:', error);
    return res.status(500).json({ 
      error: 'Failed to get invoice status',
      details: error.message 
    });
  }
});

// POST /api/payment/webhook - Xendit webhook callback
paymentRouter.post('/webhook', async (req: Request, res: Response) => {
  const db = getDb();
  
  try {
    const webhookData = req.body;
    
    // Verify webhook (in production, verify signature)
    console.log('🔔 Xendit webhook received:', webhookData);

    const { external_id, status, paid_amount, payment_method, payment_channel } = webhookData;

    if (status === 'PAID') {
      // Update order status in database
      const updateStmt = db.prepare(`
        UPDATE orders 
        SET status = 'in_prep',
            paymentMethod = ?
        WHERE id = ?
      `);
      
      const paymentMethodMap: Record<string, string> = {
        'CREDIT_CARD': 'card_pos',
        'BANK_TRANSFER': 'manual_qr',
        'EWALLET': 'manual_qr',
        'RETAIL_OUTLET': 'cash',
        'QR_CODE': 'manual_qr'
      };
      
      const mappedPaymentMethod = paymentMethodMap[payment_channel] || 'manual_qr';
      
      updateStmt.run(mappedPaymentMethod, external_id);
      
      console.log(`✅ Order ${external_id} marked as PAID via ${payment_channel}`);
      
      // TODO: Emit WebSocket event to customer and admin
      // io.to(`order-${external_id}`).emit('payment-confirmed', { orderId: external_id });
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /api/payment/check-status/:orderId - Check payment status for an order
paymentRouter.post('/check-status/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const db = getDb();
  
  try {
    // Get order from database
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If order already paid, return status
    if (order.status !== 'pending_payment') {
      return res.status(200).json({
        paid: true,
        status: order.status,
        message: 'Order already processed'
      });
    }

    // Check with Xendit (if invoice ID stored)
    // For now, return pending status
    return res.status(200).json({
      paid: false,
      status: 'pending_payment',
      message: 'Awaiting payment confirmation'
    });
  } catch (error: any) {
    console.error('❌ Payment status check failed:', error);
    return res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Vercel serverless function handler (for backward compatibility)
export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented in serverless mode' });
}

