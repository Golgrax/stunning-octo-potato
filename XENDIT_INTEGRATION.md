# Xendit Payment Gateway Integration

## Overview

Lumina Café now supports **Xendit** as an online payment option, allowing customers to pay via credit/debit cards, e-wallets (GCash, PayMaya, GrabPay), bank transfers, and over-the-counter payments.

## What is Xendit?

**Xendit** is a leading payment gateway in Southeast Asia that supports:
- 💳 Credit/Debit Cards (Visa, Mastercard, JCB, Amex)
- 📱 E-Wallets (GCash, PayMaya, GrabPay, ShopeePay, etc.)
- 🏦 Bank Transfers (BPI, BDO, Metrobank, etc.)
- 🏪 Over-the-Counter (7-Eleven, Cebuana, etc.)
- 💰 Installments and Buy Now Pay Later

## Setup Instructions

### 1. Create Xendit Account

1. Go to https://dashboard.xendit.co/register
2. Sign up for a free account
3. Verify your email
4. Complete business profile

### 2. Get API Keys

1. Login to Xendit Dashboard
2. Go to **Settings** → **Developers** → **API Keys**
3. Copy your **Secret Key**
   - Development: `xnd_development_...`
   - Production: `xnd_production_...`

### 3. Configure Environment

Create a `.env` file in project root:

```bash
# Copy the example file
cp env.example .env

# Edit with your key
nano .env
```

Add your Xendit key:

```env
XENDIT_SECRET_KEY=xnd_development_your_actual_key_here
XENDIT_CURRENCY=PHP
```

### 4. Install Dependencies

```bash
npm install xendit-node dotenv
```

### 5. Load Environment Variables

Update `server.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();
```

## How It Works

### Payment Flow

```
1. Customer selects items
        ↓
2. Proceeds to checkout
        ↓
3. Selects "Pay Online (Xendit)"
        ↓
4. Clicks "Proceed to Payment"
        ↓
5. Backend creates Xendit invoice
        ↓
6. Xendit payment page opens in new tab
        ↓
7. Customer chooses payment method:
   - Credit Card
   - GCash/PayMaya
   - Bank Transfer
   - 7-Eleven, etc.
        ↓
8. Customer completes payment
        ↓
9. Xendit sends webhook to backend
        ↓
10. Backend updates order status to "in_prep"
        ↓
11. Customer sees order tracking (paid)
```

### Technical Flow

```typescript
// 1. Customer clicks "Proceed to Payment"
const invoice = await fetch('/api/payment/create-invoice', {
  method: 'POST',
  body: JSON.stringify({
    orderId: 'ord-123',
    amount: 18.50,
    customerEmail: 'customer@example.com',
    items: [...]
  })
});

// 2. Backend creates Xendit invoice
const xenditInvoice = await xenditClient.Invoice.createInvoice({
  externalId: orderId,
  amount: amount,
  payerEmail: customerEmail,
  description: 'Lumina Café Order',
  currency: 'PHP',
  items: [...]
});

// 3. Return invoice URL
return { invoiceUrl: xenditInvoice.invoice_url };

// 4. Frontend opens payment page
window.open(invoiceUrl, '_blank');

// 5. Customer pays on Xendit page
// 6. Xendit sends webhook to /api/payment/webhook
// 7. Backend updates order status
```

## API Endpoints

### POST /api/payment/create-invoice

Create a Xendit payment invoice.

**Request:**
```json
{
  "orderId": "ord-1234567890",
  "amount": 18.50,
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "items": [
    {
      "name": "Velvet Latte",
      "price": 5.50,
      "quantity": 2,
      "category": "coffee"
    }
  ]
}
```

**Response:**
```json
{
  "invoiceId": "657a1b2c3d4e5f6g7h8i9j0k",
  "invoiceUrl": "https://checkout.xendit.co/web/657a1b2c3d4e5f6g7h8i9j0k",
  "expiryDate": "2025-12-10T04:53:28.000Z",
  "amount": 18.50,
  "status": "PENDING"
}
```

### GET /api/payment/invoice/:invoiceId

Check invoice payment status.

**Request:**
```
GET /api/payment/invoice/657a1b2c3d4e5f6g7h8i9j0k
```

**Response:**
```json
{
  "id": "657a1b2c3d4e5f6g7h8i9j0k",
  "externalId": "ord-1234567890",
  "status": "PAID",
  "amount": 18.50,
  "paidAmount": 18.50,
  "paidAt": "2025-12-09T05:00:00.000Z",
  "paymentMethod": "CREDIT_CARD",
  "paymentChannel": "VISA"
}
```

### POST /api/payment/webhook

Xendit webhook callback (automatic).

**Xendit sends:**
```json
{
  "external_id": "ord-1234567890",
  "status": "PAID",
  "paid_amount": 18.50,
  "payment_method": "CREDIT_CARD",
  "payment_channel": "VISA",
  "paid_at": "2025-12-09T05:00:00.000Z"
}
```

**Backend action:**
- Updates order status to "in_prep"
- Logs payment details
- Emits WebSocket event (future)

## Payment Methods Supported

### Credit/Debit Cards
- Visa
- Mastercard
- JCB
- American Express

### E-Wallets (Philippines)
- GCash
- PayMaya
- GrabPay
- ShopeePay

### Bank Transfer
- BPI
- BDO
- Metrobank
- UnionBank
- And more...

### Over-the-Counter
- 7-Eleven
- Cebuana Lhuillier
- M Lhuillier
- SM Payment Centers

### Installments
- Credit card installments (0% interest options)
- Buy Now Pay Later (BNPL)

## UI Integration

### Payment Selection Screen

**New Option Added:**

```
┌────────────────────────────────────────┐
│  💵 Cash (At Counter)                  │
│     Pay when you pick up               │
├────────────────────────────────────────┤
│  💳 Card (POS Terminal)                │
│     Use terminal at counter            │
├────────────────────────────────────────┤
│  📱 QR / E-Wallet                      │
│     Scan code & upload proof           │
├────────────────────────────────────────┤
│  🌟 Pay Online (Xendit) ← NEW!        │
│     Credit Card, E-Wallet, Bank        │
└────────────────────────────────────────┘
```

### Xendit Option Details

When selected, shows:

```
┌────────────────────────────────────────┐
│  💳 Secure Online Payment              │
│     Powered by Xendit                  │
│                                        │
│  ✅ Credit/Debit Cards                 │
│  ✅ E-Wallets (GCash, PayMaya)        │
│  ✅ Bank Transfer & OTC                │
└────────────────────────────────────────┘
```

**Button Text:** "Proceed to Payment" (instead of "Place Order")

## Customer Experience

### Step-by-Step

1. **Add items to cart**
2. **Proceed to checkout**
3. **Enter details** (name, email)
4. **Select payment method** → "Pay Online (Xendit)"
5. **See payment options** (cards, e-wallets, banks)
6. **Click "Proceed to Payment"**
7. **New tab opens** → Xendit payment page
8. **Choose payment method:**
   - Credit Card → Enter card details
   - GCash → Login to GCash
   - Bank Transfer → Get account number
   - 7-Eleven → Get payment code
9. **Complete payment**
10. **Return to original tab**
11. **See order tracking** (status updates when paid)

### Payment Page (Xendit Hosted)

Xendit provides a secure, PCI-compliant payment page with:
- ✅ SSL encryption
- ✅ Multiple payment methods
- ✅ Mobile-responsive
- ✅ Multi-language support
- ✅ Real-time validation
- ✅ Professional UI

## Webhook Configuration

### Setup Webhook in Xendit Dashboard

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/payment/webhook`
3. Select events:
   - ✅ Invoice Paid
   - ✅ Invoice Expired
4. Save

### Webhook Security (Production)

```typescript
// Verify webhook signature
const webhookToken = req.headers['x-callback-token'];
const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

if (webhookToken !== expectedToken) {
  return res.status(401).json({ error: 'Invalid webhook token' });
}
```

## Testing

### Test Mode (Development)

**Xendit provides test credentials:**

**Test Cards:**
- Success: `4000000000000002`
- Failure: `4000000000000010`
- 3DS: `4000000000001091`

**Test E-Wallets:**
- Use Xendit test mode
- No real money charged
- Instant payment confirmation

### Test Flow

1. **Use test API key** (`xnd_development_...`)
2. **Place order** with Xendit payment
3. **Payment page opens** (Xendit test mode)
4. **Use test card** number
5. **Payment succeeds** instantly
6. **Webhook called** (if configured)
7. **Order status** updates to "in_prep"

## Currency Support

### Available Currencies

| Currency | Code | Countries |
|----------|------|-----------|
| Philippine Peso | PHP | Philippines |
| Indonesian Rupiah | IDR | Indonesia |
| Thai Baht | THB | Thailand |
| Vietnamese Dong | VND | Vietnam |
| Malaysian Ringgit | MYR | Malaysia |

**Configure in `.env`:**
```env
XENDIT_CURRENCY=PHP
```

## Fees

### Xendit Pricing

**Credit/Debit Cards:**
- 2.9% + ₱15 per transaction

**E-Wallets:**
- 2.0% - 3.5% per transaction

**Bank Transfer:**
- ₱10 - ₱25 per transaction

**Over-the-Counter:**
- ₱20 - ₱30 per transaction

**Note:** Fees vary by country and payment method. Check Xendit pricing page for details.

## Security

### PCI Compliance

- ✅ Xendit is PCI-DSS Level 1 certified
- ✅ Card data never touches your server
- ✅ Hosted payment page (secure)
- ✅ Tokenization for recurring payments

### Data Protection

- Customer card details → Stored by Xendit only
- Your server → Never sees card numbers
- SSL/TLS → All communications encrypted
- Webhook → Signature verification (production)

## Error Handling

### Invoice Creation Failed

```typescript
try {
  const invoice = await createInvoice(...);
} catch (error) {
  // Show error to customer
  alert('Payment system unavailable. Please try another method.');
}
```

### Payment Failed

- Customer redirected to failure URL
- Order stays in "pending_payment"
- Customer can retry payment
- Or choose different payment method

### Webhook Not Received

- Order stays in "pending_payment"
- Admin can manually check Xendit dashboard
- Admin can manually update order status

## Database Schema

### Orders Table

```sql
paymentMethod TEXT CHECK(paymentMethod IN (
  'manual_qr', 
  'cash', 
  'card_pos', 
  'xendit'  ← Added
))
```

### Additional Fields (Future)

```sql
-- Store Xendit invoice ID
xenditInvoiceId TEXT,

-- Store payment channel details
paymentChannel TEXT,

-- Store paid timestamp
paidAt TEXT
```

## Files Created/Modified

- ✅ **`api/payment.ts`** - NEW Xendit payment API
- ✅ **`server.ts`** - Added payment router
- ✅ **`pages/CustomerView.tsx`** - Added Xendit option
- ✅ **`types.ts`** - Added 'xendit' payment method
- ✅ **`db/schema.sql`** - Updated payment method enum
- ✅ **`env.example`** - Environment configuration template
- ✅ **`package.json`** - Added xendit-node dependency

## Quick Start

### 1. Get Xendit API Key

```bash
# Sign up at https://dashboard.xendit.co
# Get your test API key
```

### 2. Configure Environment

```bash
# Create .env file
echo "XENDIT_SECRET_KEY=xnd_development_your_key_here" > .env
```

### 3. Install Dependencies

```bash
npm install dotenv
```

### 4. Update server.ts

```typescript
import dotenv from 'dotenv';
dotenv.config();
```

### 5. Restart Server

```bash
pkill -f "tsx server.ts"
npm run server
```

### 6. Test Payment

1. Go to customer view
2. Add items to cart
3. Checkout
4. Select "Pay Online (Xendit)"
5. Click "Proceed to Payment"
6. Use test card: `4000000000000002`
7. Payment succeeds!

## Production Deployment

### Checklist

- [ ] Get production API key from Xendit
- [ ] Update `.env` with production key
- [ ] Configure webhook URL in Xendit dashboard
- [ ] Implement webhook signature verification
- [ ] Set up SSL certificate (HTTPS required)
- [ ] Test with real payment methods
- [ ] Set up monitoring and alerts
- [ ] Configure currency correctly
- [ ] Update success/failure redirect URLs

### Environment Variables

```env
# Production
XENDIT_SECRET_KEY=xnd_production_your_production_key
XENDIT_WEBHOOK_TOKEN=your_webhook_verification_token
XENDIT_CURRENCY=PHP
SUCCESS_REDIRECT_URL=https://lumina-cafe.com/order-success
FAILURE_REDIRECT_URL=https://lumina-cafe.com/order-failed
```

## Webhook Setup

### Configure in Xendit Dashboard

1. **URL:** `https://your-domain.com/api/payment/webhook`
2. **Events:**
   - Invoice paid
   - Invoice expired
   - Invoice pending
3. **Verification Token:** Copy and save to `.env`

### Webhook Handler

```typescript
app.post('/api/payment/webhook', (req, res) => {
  // Verify signature
  const signature = req.headers['x-callback-token'];
  if (signature !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process payment
  if (req.body.status === 'PAID') {
    updateOrderStatus(req.body.external_id, 'in_prep');
  }
  
  res.status(200).send('OK');
});
```

## Testing with Xendit Test Mode

### Test Credit Cards

| Card Number | Result |
|-------------|--------|
| 4000000000000002 | Success |
| 4000000000000010 | Card declined |
| 4000000000001091 | 3D Secure required |

### Test E-Wallets

- Use Xendit test mode
- Select GCash/PayMaya
- Payment succeeds instantly
- No real money charged

### Test Bank Transfer

- Generates test account number
- Mark as paid in Xendit dashboard
- Webhook fires immediately

## Advantages of Xendit

### For Business

✅ **Multiple Payment Methods** - One integration, many options  
✅ **Low Fees** - Competitive pricing  
✅ **Fast Settlement** - T+1 to T+3 days  
✅ **Dashboard** - Track all payments  
✅ **Reporting** - Export transaction data  
✅ **Support** - 24/7 customer service  

### For Customers

✅ **Familiar Methods** - GCash, cards, banks  
✅ **Secure** - PCI-compliant  
✅ **Fast** - Instant confirmation  
✅ **Convenient** - Pay online anytime  
✅ **Flexible** - Many payment options  

## Troubleshooting

### Issue: "Failed to create payment invoice"

**Cause:** Invalid API key

**Solution:**
```bash
# Check .env file
cat .env

# Verify key format
# Should start with: xnd_development_ or xnd_production_
```

### Issue: Payment page doesn't open

**Cause:** Pop-up blocked by browser

**Solution:**
- Allow pop-ups for localhost:5173
- Or show invoice URL as link

### Issue: Webhook not received

**Cause:** Webhook URL not configured

**Solution:**
1. Use ngrok for local testing:
   ```bash
   ngrok http 3001
   ```
2. Configure webhook URL in Xendit:
   ```
   https://abc123.ngrok.io/api/payment/webhook
   ```

### Issue: Order stays "pending_payment"

**Cause:** Webhook not processed

**Solution:**
- Check Xendit dashboard for payment status
- Manually update order status
- Check server logs for webhook errors

## Cost Estimation

### Example Costs (Philippines)

**Order: ₱500**

| Method | Fee | You Receive |
|--------|-----|-------------|
| Credit Card | ₱29.50 | ₱470.50 |
| GCash | ₱15.00 | ₱485.00 |
| Bank Transfer | ₱20.00 | ₱480.00 |
| 7-Eleven | ₱25.00 | ₱475.00 |

**Note:** Fees are approximate. Check Xendit pricing for exact rates.

## Alternative Payment Gateways

If Xendit doesn't work for your region:

- **Stripe** - Global (cards, wallets)
- **PayPal** - Global
- **PayMongo** - Philippines
- **Midtrans** - Indonesia
- **Omise** - Thailand
- **Razorpay** - India

## Summary

### What's Implemented

✅ **Xendit Integration** - Full payment gateway  
✅ **Invoice Creation** - API endpoint  
✅ **Payment Page** - Opens in new tab  
✅ **Webhook Handler** - Auto-update orders  
✅ **UI Option** - Beautiful payment button  
✅ **Multiple Methods** - Cards, wallets, banks  
✅ **Test Mode** - Safe testing  

### Next Steps

1. **Get Xendit API key** (free account)
2. **Add to `.env` file**
3. **Install dotenv** (`npm install dotenv`)
4. **Update server.ts** (load environment)
5. **Restart server**
6. **Test payment flow**

---

**Status:** ✅ Implemented (Requires API Key)  
**Documentation:** https://developers.xendit.co  
**Dashboard:** https://dashboard.xendit.co  
**Last Updated:** December 9, 2025

