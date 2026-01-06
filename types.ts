
export type Category = 'coffee' | 'tea' | 'pastry';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  tags: string[];
  isActive: boolean; // For Soft Delete (FR-A05)
  isFeatured?: boolean; // Fix: Added optional property to match mock data
}

export interface ProductOptions {
  size: 'S' | 'M' | 'L';
  milk?: 'Dairy' | 'Oat' | 'Almond' | 'Soy';
  sweetness?: '0%' | '50%' | '100%';
}

export interface CartItem extends Product {
  cartId: string;
  options: ProductOptions;
  totalPrice: number;
}

export type OrderStatus = 'pending_payment' | 'in_prep' | 'ready' | 'completed';

export interface CustomerDetails {
  name: string;
  email: string;
  phone?: string;
  address?: string; // For Delivery
  type: 'guest' | 'registered';
  userId?: string;
}

export type PaymentMethod = 'manual_qr' | 'cash' | 'card_pos' | 'xendit';
export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderFeedback {
  rating: number;
  comment: string;
  timestamp: Date;
}

export interface Order {
  id: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  timestamp: Date;
  paymentMethod: PaymentMethod;
  fulfillment: FulfillmentType; // FR-C03
  feedback?: OrderFeedback; // FR-C05
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'employee' | 'customer';
  joinedDate: Date;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'suspended';
}

export interface InventoryItem {
  productId: string;
  productName: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
}

export interface AnalyticsData {
  time: string;
  orders: number;
  revenue: number;
}