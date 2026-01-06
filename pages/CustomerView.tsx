import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Sparkles, X, Coffee, ChevronLeft, CreditCard, QrCode, Clock, Banknote, MapPin, Star, History, Store, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { GlassCard, Button, GlassModal, Input, Select, Badge } from '../components/GlassComponents';
import { Product, CartItem, Order, ProductOptions, CustomerDetails, PaymentMethod, FulfillmentType } from '../types';
import { io, Socket } from 'socket.io-client';
import { formatCurrency } from '../lib/currency';

const API_BASE_URL = '/api';
const SOCKET_URL = '/';

interface CustomerViewProps {
  products: Product[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  cart: CartItem[];
  placeOrder: (details: CustomerDetails, method: PaymentMethod, fulfillment: FulfillmentType) => void;
  activeOrder: Order | null;
  clearActiveOrder: () => void;
  updateActiveOrder: (order: Order) => void;
  orderHistory: Order[]; // Passed for History View
  submitFeedback: (orderId: string, rating: number, comment: string) => void;
}

type Screen = 'menu' | 'checkout' | 'history';
type CheckoutStep = 'auth' | 'details' | 'payment';

export const CustomerView: React.FC<CustomerViewProps> = ({ 
  products, 
  addToCart, 
  removeFromCart,
  cart, 
  placeOrder,
  activeOrder,
  clearActiveOrder,
  updateActiveOrder,
  orderHistory,
  submitFeedback
}) => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('auth');
  
  // Selection State
  const [category, setCategory] = useState<'all' | 'coffee' | 'tea' | 'pastry'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductOptions>({ size: 'M', sweetness: '50%', milk: 'Oat' });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout Form State
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({ name: '', email: '', type: 'guest' });
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Xendit Payment Modal State
  const [showXenditModal, setShowXenditModal] = useState(false);
  const [selectedXenditMethod, setSelectedXenditMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Payment Form Details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [ewalletPhone, setEwalletPhone] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{recommendation: string, reason: string} | null>(null);

  // Feedback State
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // -- LOGIC --

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    if (product.category === 'pastry') {
      setOptions({ size: 'M' });
    } else {
      setOptions({ size: 'M', sweetness: '50%', milk: 'Oat' });
    }
  };

  const calculateItemPrice = (product: Product, opts: ProductOptions) => {
    let price = product.price;
    if (opts.size === 'L') price += 1.0;
    if (opts.size === 'S') price -= 0.5;
    if (opts.milk && opts.milk !== 'Dairy') price += 0.75;
    return price;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const totalPrice = calculateItemPrice(selectedProduct, options);
    
    addToCart({
      ...selectedProduct,
      cartId: Math.random().toString(36).substr(2, 9),
      options: { ...options },
      totalPrice
    });
    setSelectedProduct(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setRecommendation(null);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPreference: aiPrompt,
          menuItems: products.filter(p => p.isActive).map(p => p.name)
        }),
      });
      
      if (!response.ok) throw new Error('AI request failed');
      
      const parsed = await response.json();
      setRecommendation(parsed);
    } catch (e) {
      console.error(e);
      setRecommendation({
        recommendation: "Latte", 
        reason: "A classic choice is always reliable when the connection is fuzzy." 
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleXenditPayment = () => {
    if (cart.length === 0) return;
    setShowXenditModal(true);
    setSelectedXenditMethod(null);
  };

  const processXenditPayment = async () => {
    if (!selectedXenditMethod) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Create the order first
      await placeOrder(customerDetails, 'xendit', fulfillmentType);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch the latest order (should be the one we just created)
      const ordersRes = await fetch(`${API_BASE_URL}/orders`);
      const orders = await ordersRes.json();
      
      // Find the most recent order with pending_payment status
      const pendingOrder = orders
        .filter((o: any) => o.status === 'pending_payment')
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (pendingOrder) {
        // Update order status to in_prep (payment confirmed)
        const updateRes = await fetch(`${API_BASE_URL}/orders/${pendingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_prep' })
        });
        
        if (updateRes.ok) {
          const updatedOrder = await updateRes.json();
          updateActiveOrder({ ...updatedOrder, timestamp: new Date(updatedOrder.timestamp) });
          console.log('✅ Payment confirmed, order status updated to in_prep');
        }
      }
      
      // Close modal and reset form
      setShowXenditModal(false);
      setSelectedXenditMethod(null);
      
      // Reset payment form fields
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCvv('');
      setEwalletPhone('');
      setBankAccountNumber('');
      
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // -- SUB-VIEWS --

  const HistoryView = () => (
    <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen">
       <button 
          onClick={() => setCurrentScreen('menu')}
          className="flex items-center text-stone-500 hover:text-stone-900 mb-8 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Menu
        </button>
        <h2 className="text-2xl font-light text-stone-900 mb-6">Order History</h2>
        
        <div className="space-y-4">
          {orderHistory.filter(o => o.customer.type === 'registered' && o.customer.email === customerDetails.email).length === 0 ? (
            <div className="text-center py-12 text-stone-500 bg-white border border-stone-200 rounded-xl shadow-sm">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No past orders found for {customerDetails.email || 'this user'}.</p>
            </div>
          ) : (
            orderHistory
              .filter(o => o.customer.email === customerDetails.email)
              .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map(order => (
              <GlassCard key={order.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border-stone-200">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="font-mono text-stone-500">#{order.id.slice(-4)}</span>
                       <Badge status={order.status} />
                    </div>
                    <p className="text-stone-900 text-sm font-medium">
                      {order.items.map(i => i.name).join(', ')}
                    </p>
                    <p className="text-stone-500 text-xs mt-1">{order.timestamp.toLocaleDateString()} at {order.timestamp.toLocaleTimeString()}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-stone-900 font-medium">{formatCurrency(order.total)}</span>
                    <Button variant="secondary" className="text-xs">Reorder</Button>
                 </div>
              </GlassCard>
            ))
          )}
        </div>
    </div>
  );

  const TrackingView = ({ order }: { order: Order }) => {
    const isPayAtCounter = order.paymentMethod === 'cash' || order.paymentMethod === 'card_pos';
    // Use ref to track initial order ID to prevent resets
    const orderIdRef = React.useRef(order.id);
    const [currentOrder, setCurrentOrder] = useState(order);
    const [isConnected, setIsConnected] = useState(false);

    // WebSocket real-time updates - Fixed to prevent reconnection issues
    useEffect(() => {
      console.log('🔌 Initializing WebSocket for order:', order.id);
      
      // Connect to WebSocket server
      const socket: Socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        console.log('🔌 WebSocket connected:', socket.id);
        setIsConnected(true);
        
        // Join this order's room for targeted updates
        socket.emit('join-order', order.id);
        console.log(`📦 Joined order room: ${order.id}`);
      });

      socket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔌 WebSocket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        // Rejoin the order room after reconnection
        socket.emit('join-order', order.id);
      });

      // Listen for order updates
      socket.on('order-updated', (updatedOrder: any) => {
        console.log('🔔 Real-time update received:', updatedOrder);
        
        // Only update if it's for this order
        if (updatedOrder.id === order.id) {
          // Parse timestamp
          updatedOrder.timestamp = new Date(updatedOrder.timestamp);
          
          console.log(`✨ Status update: ${updatedOrder.status}`);
          
          // Update the local order state
          setCurrentOrder(updatedOrder);
          
          // CRITICAL: Also update parent's activeOrder state
          // This ensures localStorage gets the latest status
          updateActiveOrder(updatedOrder);
        }
      });

      // Cleanup on unmount ONLY
      return () => {
        console.log('🔌 Cleaning up WebSocket for order:', order.id);
        socket.emit('leave-order', order.id);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.off('order-updated');
        socket.disconnect();
      };
    }, []); // Empty dependency array - only run once on mount
    
    return (
      <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center text-center animate-in fade-in duration-500">
        <GlassCard className="p-8">
          <div className="mb-6 flex justify-center">
             <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full"></div>
                <div className="relative p-4 rounded-full bg-stone-50 border border-emerald-500/30">
                  <Coffee className="w-8 h-8 text-emerald-600" />
                </div>
             </div>
          </div>
          <h2 className="text-2xl font-light text-stone-900 mb-2 flex items-center justify-center gap-2">
            Order #{currentOrder.id.slice(-4)}
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
          </h2>
          
          <div className="space-y-4 mb-8 bg-stone-50 border border-stone-100 rounded-xl p-4">
            <div className="flex justify-between text-sm items-center">
              <span className="text-stone-500">Status</span>
              <Badge status={currentOrder.status} />
            </div>
            <div className="flex justify-between text-sm items-center">
               <span className="text-stone-500">Method</span>
               <span className="text-stone-900 capitalize flex items-center gap-1">
                  {currentOrder.fulfillment === 'delivery' ? <MapPin className="w-3 h-3"/> : <Store className="w-3 h-3"/>}
                  {currentOrder.fulfillment}
               </span>
            </div>
            <div className="flex justify-between text-sm items-center pt-2 border-t border-stone-200">
              <span className="text-stone-500">Payment</span>
              <span className="text-stone-700 text-xs uppercase tracking-wide flex items-center gap-1 font-medium">
                {currentOrder.paymentMethod === 'cash' && <><Banknote className="w-3 h-3"/> Cash at Counter</>}
                {currentOrder.paymentMethod === 'card_pos' && <><CreditCard className="w-3 h-3"/> Card at POS</>}
                {currentOrder.paymentMethod === 'manual_qr' && <><QrCode className="w-3 h-3"/> Online QR</>}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-8">
             <div className="flex justify-between text-xs text-stone-500 px-1">
                <span>Received</span>
                <span>Preparing</span>
                <span>Ready</span>
             </div>
             <div className="relative h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div 
                   className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out" 
                   style={{ 
                     width: currentOrder.status === 'pending_payment' ? '15%' :
                            currentOrder.status === 'in_prep' ? '60%' :
                            currentOrder.status === 'ready' || currentOrder.status === 'completed' ? '100%' : '5%'
                   }} 
                />
             </div>
          </div>

          {/* Feedback Form - Only when completed */}
          {currentOrder.status === 'completed' && !currentOrder.feedback && !feedbackSubmitted && (
            <div className="animate-in slide-in-from-bottom-4">
               <h3 className="text-stone-900 font-medium mb-4">Rate your Experience</h3>
               <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                       <Star className={`w-8 h-8 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                    </button>
                  ))}
               </div>
               <Input 
                  placeholder="Any comments? (Optional)" 
                  className="mb-4 text-sm bg-white"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
               />
               <Button 
                 disabled={rating === 0} 
                 onClick={() => {
                    submitFeedback(currentOrder.id, rating, feedbackComment);
                    setFeedbackSubmitted(true);
                 }}
               >
                 Submit Feedback
               </Button>
            </div>
          )}

          {feedbackSubmitted && (
             <div className="text-emerald-600 text-sm bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                Thank you for your feedback!
             </div>
          )}
          
          <div className="mt-8">
             <Button variant="ghost" onClick={() => {
               clearActiveOrder();
               setCurrentScreen('menu');
             }}>Place Another Order</Button>
          </div>
        </GlassCard>
      </div>
    );
  };

  // -- CHECKOUT RENDER --

  if (activeOrder) return <TrackingView order={activeOrder} />;
  if (currentScreen === 'history') return <HistoryView />;

  if (currentScreen === 'checkout') {
    return (
      <>
      <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen">
        <button 
          onClick={() => setCurrentScreen('menu')}
          className="flex items-center text-stone-500 hover:text-stone-900 mb-8 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Menu
        </button>

        {/* PROGRESS INDICATOR */}
        <div className="flex items-center justify-between mb-12 px-4 max-w-lg mx-auto">
          {['Login', 'Details', 'Payment'].map((step, idx) => {
            let isActive = false;
            let isPast = false;
            if (checkoutStep === 'auth') { isActive = idx === 0; }
            if (checkoutStep === 'details') { isActive = idx === 1; isPast = idx < 1; }
            if (checkoutStep === 'payment') { isActive = idx === 2; isPast = idx < 2; }

            return (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border
                  ${isActive ? 'bg-stone-900 text-white border-stone-900 scale-110 shadow-lg' : 
                    isPast ? 'bg-stone-200 text-stone-500 border-stone-300' : 'bg-white text-stone-400 border-stone-200'}
                `}>
                  {isPast ? <Check className="w-4 h-4"/> : idx + 1}
                </div>
                <span className={`text-xs tracking-wider uppercase transition-colors duration-300 ${isActive ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>{step}</span>
              </div>
            );
          })}
          <div className="absolute top-[5.2rem] left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-stone-200 -z-0 hidden md:block" /> 
        </div>

        <div className="max-w-lg mx-auto">
          {checkoutStep === 'auth' && (
            <GlassCard className="p-8 text-center animate-in slide-in-from-right-8 duration-500">
               <h2 className="text-2xl font-light text-stone-900 mb-2">Checkout</h2>
               <p className="text-stone-500 mb-8 font-light">Join us or continue as guest.</p>
               
               <div className="space-y-4">
                 <Button className="w-full h-12 text-base" onClick={() => {
                   setCustomerDetails({...customerDetails, type: 'guest'});
                   setCheckoutStep('details');
                 }}>
                   Continue as Guest
                 </Button>
                 
                 <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                    <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-stone-400 uppercase">Or</span></div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <Button variant="secondary" onClick={() => {
                        setCustomerDetails({name: 'Alice Member', email: 'alice@lumina.cafe', type: 'registered'});
                        setCheckoutStep('details');
                    }}>Log In</Button>
                    <Button variant="secondary" onClick={() => {
                        setCustomerDetails({name: 'New Member', email: 'new@lumina.cafe', type: 'registered'});
                        setCheckoutStep('details');
                    }}>Sign Up</Button>
                 </div>
               </div>
            </GlassCard>
          )}

          {checkoutStep === 'details' && (
             <GlassCard className="p-8 animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-xl font-light text-stone-900 mb-6">Details</h2>
                
                {/* Fulfillment Selection (FR-C03) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button 
                      onClick={() => setFulfillmentType('pickup')}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${fulfillmentType === 'pickup' ? 'bg-stone-900 text-white border-stone-900' : 'bg-transparent text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                    >
                      Pickup
                    </button>
                    <button 
                      onClick={() => setFulfillmentType('delivery')}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${fulfillmentType === 'delivery' ? 'bg-stone-900 text-white border-stone-900' : 'bg-transparent text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                    >
                      Delivery
                    </button>
                </div>

                <div className="space-y-4">
                   <div>
                     <label className="text-xs text-stone-500 uppercase tracking-wider mb-1 block">Full Name</label>
                     <Input 
                        placeholder="Jane Doe" 
                        value={customerDetails.name}
                        onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="text-xs text-stone-500 uppercase tracking-wider mb-1 block">Email Receipt</label>
                     <Input 
                        placeholder="jane@example.com" 
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                     />
                   </div>
                   {fulfillmentType === 'delivery' && (
                     <div className="animate-in fade-in slide-in-from-top-2">
                       <label className="text-xs text-stone-500 uppercase tracking-wider mb-1 block">Delivery Address</label>
                       <Input 
                          placeholder="Building, Street, Unit..." 
                          value={customerDetails.address || ''}
                          onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                       />
                     </div>
                   )}
                   <div className="pt-4">
                     <Button 
                       className="w-full h-12" 
                       disabled={!customerDetails.name || !customerDetails.email || (fulfillmentType === 'delivery' && !customerDetails.address)}
                       onClick={() => setCheckoutStep('payment')}
                     >
                       Continue to Payment
                     </Button>
                   </div>
                </div>
             </GlassCard>
          )}

          {checkoutStep === 'payment' && (
             <GlassCard className="p-8 animate-in slide-in-from-right-8 duration-500">
               <div className="text-center mb-8">
                  <h2 className="text-xl font-light text-stone-900 mb-2">Total: {formatCurrency(cartTotal)}</h2>
                  <p className="text-stone-500 text-sm">Select payment method.</p>
               </div>
               
               <div className="grid grid-cols-1 gap-4 mb-8">
                  <button onClick={() => setSelectedPaymentMethod('cash')} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${selectedPaymentMethod === 'cash' ? 'bg-stone-50 border-stone-900 ring-1 ring-stone-900 text-stone-900 shadow-md' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50 hover:border-stone-300'}`}>
                     <div className={`p-2 rounded-lg ${selectedPaymentMethod === 'cash' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}><Banknote className="w-5 h-5"/></div>
                     <div className="text-left">
                        <span className="block text-sm font-medium">Cash (At Counter)</span>
                        <span className="block text-xs opacity-60">Pay when you {fulfillmentType === 'pickup' ? 'pick up' : 'receive'} your order</span>
                     </div>
                  </button>

                  <button onClick={() => setSelectedPaymentMethod('xendit')} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${selectedPaymentMethod === 'xendit' ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500 ring-1 ring-blue-500 text-stone-900 shadow-md' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50 hover:border-stone-300'}`}>
                     <div className={`p-2 rounded-lg ${selectedPaymentMethod === 'xendit' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-stone-100 text-stone-600'}`}><CreditCard className="w-5 h-5"/></div>
                     <div className="text-left">
                        <span className="block text-sm font-medium">Pay Online (Xendit)</span>
                        <span className="block text-xs opacity-60">Credit/Debit Card, E-Wallet, Bank Transfer</span>
                     </div>
                  </button>
               </div>

               {selectedPaymentMethod === 'xendit' && (
                 <div className="animate-in fade-in slide-in-from-top-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-stone-900 font-semibold">Secure Online Payment</p>
                          <p className="text-stone-600 text-xs">Powered by Xendit</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-stone-600">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Credit/Debit Cards (Visa, Mastercard, JCB)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>E-Wallets (GCash, PayMaya, GrabPay)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Bank Transfer & Over-the-Counter</span>
                        </div>
                        </div>
                    </div>
                 </div>
               )}

               <Button 
                 className={`w-full h-12 transition-all duration-300 ${selectedPaymentMethod ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}
                 disabled={!selectedPaymentMethod}
                 onClick={async () => {
                   if (!selectedPaymentMethod) return;
                   
                   if (selectedPaymentMethod === 'xendit') {
                     // Handle Xendit payment
                     await handleXenditPayment();
                   } else {
                     // Handle other payment methods
                     placeOrder(customerDetails, selectedPaymentMethod, fulfillmentType);
                   }
                 }}
               >
                 {selectedPaymentMethod === 'xendit' ? 'Proceed to Payment' : 'Place Order'}
               </Button>
               
               <button onClick={() => setCheckoutStep('details')} className="w-full mt-4 text-xs text-stone-500 hover:text-stone-900">
                  Back to Details
               </button>
             </GlassCard>
          )}
        </div>
      </div>

      {/* Xendit Payment Modal */}
      {showXenditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">Secure Payment</h2>
                    <p className="text-white/80 text-xs">Powered by Xendit</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowXenditModal(false);
                    setSelectedXenditMethod(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="p-6 border-b border-stone-200">
              <div className="text-center">
                <p className="text-stone-500 text-sm mb-1">Total Amount</p>
                <p className="text-3xl font-light text-stone-900">
                  {formatCurrency(cart.reduce((sum, item) => sum + item.totalPrice, 0) * 1.1)}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Subtotal: {formatCurrency(cart.reduce((sum, item) => sum + item.totalPrice, 0))} + Tax
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-6 space-y-6">
              {/* Credit/Debit Cards */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Credit/Debit Cards
                </h3>
                <div className="space-y-2">
                  {['Visa', 'Mastercard', 'JCB'].map((card) => (
                    <div key={card}>
                      <button
                        onClick={() => setSelectedXenditMethod(
                          selectedXenditMethod === `card_${card.toLowerCase()}` 
                            ? null 
                            : `card_${card.toLowerCase()}`
                        )}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          selectedXenditMethod === `card_${card.toLowerCase()}`
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedXenditMethod === `card_${card.toLowerCase()}`
                                ? 'bg-blue-500 text-white'
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-stone-900">{card}</span>
                          </div>
                          {selectedXenditMethod === `card_${card.toLowerCase()}` && (
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </button>
                      
                      {/* Card Input Fields */}
                      {selectedXenditMethod === `card_${card.toLowerCase()}` && (
                        <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <label className="text-xs font-medium text-stone-700 mb-1 block">Card Number</label>
                            <Input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                                setCardNumber(formatted);
                              }}
                              maxLength={19}
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-stone-700 mb-1 block">Cardholder Name</label>
                            <Input
                              type="text"
                              placeholder="JOHN DOE"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value.toUpperCase())}
                              className="bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-stone-700 mb-1 block">Expiry Date</label>
                              <Input
                                type="text"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  const formatted = value.length >= 2 
                                    ? `${value.slice(0, 2)}/${value.slice(2, 4)}` 
                                    : value;
                                  setCardExpiry(formatted);
                                }}
                                maxLength={5}
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-stone-700 mb-1 block">CVV</label>
                              <Input
                                type="text"
                                placeholder="123"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                maxLength={3}
                                className="bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* E-Wallets */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  E-Wallets
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'GCash', icon: '💚' },
                    { name: 'PayMaya', icon: '💙' },
                    { name: 'GrabPay', icon: '💜' }
                  ].map((wallet) => (
                    <div key={wallet.name}>
                      <button
                        onClick={() => setSelectedXenditMethod(
                          selectedXenditMethod === `ewallet_${wallet.name.toLowerCase()}` 
                            ? null 
                            : `ewallet_${wallet.name.toLowerCase()}`
                        )}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          selectedXenditMethod === `ewallet_${wallet.name.toLowerCase()}`
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                              selectedXenditMethod === `ewallet_${wallet.name.toLowerCase()}`
                                ? 'bg-blue-50'
                                : 'bg-stone-100'
                            }`}>
                              {wallet.icon}
                            </div>
                            <span className="font-medium text-stone-900">{wallet.name}</span>
                          </div>
                          {selectedXenditMethod === `ewallet_${wallet.name.toLowerCase()}` && (
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </button>
                      
                      {/* E-Wallet Input Fields */}
                      {selectedXenditMethod === `ewallet_${wallet.name.toLowerCase()}` && (
                        <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <label className="text-xs font-medium text-stone-700 mb-1 block">Mobile Number</label>
                            <Input
                              type="text"
                              placeholder="+63 912 345 6789"
                              value={ewalletPhone}
                              onChange={(e) => setEwalletPhone(e.target.value)}
                              className="bg-white"
                            />
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-stone-600">
                              <strong className="text-stone-900">Next step:</strong> You'll be redirected to {wallet.name} to complete the payment securely.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Transfer & Over-the-Counter */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Bank Transfer & Over-the-Counter
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'Bank Transfer', icon: '🏦', desc: 'Transfer from your bank account' },
                    { name: '7-Eleven', icon: '🏪', desc: 'Pay at any 7-Eleven store' },
                    { name: 'Cebuana Lhuillier', icon: '🏪', desc: 'Pay at Cebuana branches' }
                  ].map((method) => (
                    <div key={method.name}>
                      <button
                        onClick={() => setSelectedXenditMethod(
                          selectedXenditMethod === `bank_${method.name.toLowerCase().replace(/\s+/g, '_')}` 
                            ? null 
                            : `bank_${method.name.toLowerCase().replace(/\s+/g, '_')}`
                        )}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          selectedXenditMethod === `bank_${method.name.toLowerCase().replace(/\s+/g, '_')}`
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                              selectedXenditMethod === `bank_${method.name.toLowerCase().replace(/\s+/g, '_')}`
                                ? 'bg-blue-50'
                                : 'bg-stone-100'
                            }`}>
                              {method.icon}
                            </div>
                            <span className="font-medium text-stone-900">{method.name}</span>
                          </div>
                          {selectedXenditMethod === `bank_${method.name.toLowerCase().replace(/\s+/g, '_')}` && (
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </button>
                      
                      {/* Bank/OTC Input Fields */}
                      {selectedXenditMethod === `bank_${method.name.toLowerCase().replace(/\s+/g, '_')}` && (
                        <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                          {method.name === 'Bank Transfer' ? (
                            <>
                              <div>
                                <label className="text-xs font-medium text-stone-700 mb-1 block">Bank Account Number</label>
                                <Input
                                  type="text"
                                  placeholder="1234567890"
                                  value={bankAccountNumber}
                                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                                  className="bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-stone-700 mb-1 block">Account Holder Name</label>
                                <Input
                                  type="text"
                                  placeholder="JOHN DOE"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                  className="bg-white"
                                />
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-stone-600">
                                  <strong className="text-stone-900">Instructions:</strong> You'll receive bank details to complete the transfer. Payment must be made within 24 hours.
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-xs font-medium text-stone-700 mb-1 block">Mobile Number</label>
                                <Input
                                  type="text"
                                  placeholder="+63 912 345 6789"
                                  value={ewalletPhone}
                                  onChange={(e) => setEwalletPhone(e.target.value)}
                                  className="bg-white"
                                />
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-stone-600">
                                  <strong className="text-stone-900">Instructions:</strong> You'll receive a payment code via SMS. Bring it to any {method.name} branch to complete payment.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-6 bg-stone-50 border-t border-stone-200 rounded-b-2xl">
              <Button
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={!selectedXenditMethod || isProcessingPayment || (() => {
                  // Validate card fields
                  if (selectedXenditMethod?.startsWith('card_')) {
                    return !cardNumber || !cardName || !cardExpiry || !cardCvv;
                  }
                  // Validate e-wallet fields
                  if (selectedXenditMethod?.startsWith('ewallet_')) {
                    return !ewalletPhone;
                  }
                  // Validate bank transfer fields
                  if (selectedXenditMethod === 'bank_bank_transfer') {
                    return !bankAccountNumber || !cardName;
                  }
                  // Validate OTC fields
                  if (selectedXenditMethod?.startsWith('bank_') && selectedXenditMethod !== 'bank_bank_transfer') {
                    return !ewalletPhone;
                  }
                  return false;
                })()}
                onClick={processXenditPayment}
              >
                {isProcessingPayment ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Payment...
                  </span>
                ) : (
                  `Pay ${formatCurrency(cart.reduce((sum, item) => sum + item.totalPrice, 0) * 1.1)}`
                )}
              </Button>
              <p className="text-xs text-stone-500 text-center mt-3">
                🔒 Your payment is secure and encrypted
              </p>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // -- HELPER COMPONENTS --

  const ProductDetailModal = () => (
    <GlassModal 
      isOpen={!!selectedProduct} 
      onClose={() => setSelectedProduct(null)}
      title="Customize Order"
    >
      {selectedProduct && (
        <div className="space-y-6">
           <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
              <div>
                 <h3 className="text-lg font-medium text-stone-900">{selectedProduct.name}</h3>
                 <p className="text-stone-500 text-sm mt-1">{selectedProduct.description}</p>
                 <div className="mt-2 text-emerald-600 font-mono font-medium">{formatCurrency(calculateItemPrice(selectedProduct, options))}</div>
              </div>
           </div>

           <div className="space-y-4">
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-wider mb-2 block">Size</label>
                <div className="flex gap-2">
                   {['S', 'M', 'L'].map((s) => (
                      <button 
                        key={s}
                        onClick={() => setOptions({...options, size: s as any})}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${options.size === s ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
                      >
                        {s}
                      </button>
                   ))}
                </div>
              </div>

              {selectedProduct.category !== 'pastry' && (
                <>
                  <div>
                    <label className="text-xs text-stone-500 uppercase tracking-wider mb-2 block">Milk</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Dairy', 'Oat', 'Almond', 'Soy'].map((m) => (
                          <button 
                            key={m}
                            onClick={() => setOptions({...options, milk: m as any})}
                            className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${options.milk === m ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
                          >
                            {m} {m !== 'Dairy' && '+0.75'}
                          </button>
                      ))}
                    </div>
                  </div>
                   <div>
                    <label className="text-xs text-stone-500 uppercase tracking-wider mb-2 block">Sweetness</label>
                    <div className="flex gap-2">
                      {['0%', '50%', '100%'].map((s) => (
                          <button 
                            key={s}
                            onClick={() => setOptions({...options, sweetness: s as any})}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${options.sweetness === s ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
                          >
                            {s}
                          </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
           </div>

           <Button className="w-full h-12 mt-4" onClick={handleAddToCart}>
             Add to Order - {formatCurrency(calculateItemPrice(selectedProduct, options))}
           </Button>
        </div>
      )}
    </GlassModal>
  );

  const CartDrawer = () => {
    if (!isCartOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
         <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
         <div className="relative w-full max-w-md bg-white border-l border-stone-200 h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
               <h2 className="text-lg font-medium text-stone-900 flex items-center gap-2">
                 <ShoppingBag className="w-5 h-5" /> Your Order
               </h2>
               <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {cart.length === 0 ? (
                 <div className="text-center py-12 text-stone-400">
                    <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Your cart is empty.</p>
                 </div>
               ) : (
                 cart.map(item => (
                   <div key={item.cartId} className="flex gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <img src={item.image} alt="" className="w-16 h-16 rounded-md object-cover bg-stone-200" />
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <h4 className="text-stone-900 font-medium text-sm">{item.name}</h4>
                            <span className="text-stone-900 text-sm font-mono">{formatCurrency(item.totalPrice)}</span>
                         </div>
                         <p className="text-stone-500 text-xs mt-1">
                           {item.options.size} • {item.options.milk || 'Regular'} • {item.options.sweetness || 'Regular'}
                         </p>
                         <button 
                           onClick={() => removeFromCart(item.cartId)}
                           className="text-red-400 text-xs mt-3 flex items-center gap-1 hover:text-red-600 transition-colors"
                         >
                           <Trash2 className="w-3 h-3" /> Remove
                         </button>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-6 border-t border-stone-100 bg-stone-50">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-stone-500">Total</span>
                  <span className="text-2xl font-light text-stone-900">{formatCurrency(cartTotal)}</span>
               </div>
               <Button 
                 className="w-full h-12" 
                 disabled={cart.length === 0}
                 onClick={() => {
                   setIsCartOpen(false);
                   setCurrentScreen('checkout');
                 }}
               >
                 Proceed to Checkout
               </Button>
            </div>
         </div>
      </div>
    );
  };

  // -- MAIN MENU RENDER --

  const filteredProducts = products.filter(p => p.isActive && (category === 'all' || p.category === category));

  return (
    <div className="pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      <ProductDetailModal />
      <CartDrawer />

      {/* Header with History Link */}
      <div className="flex justify-between items-center py-6">
         <h1 className="text-xl font-light text-stone-900 tracking-tight">Lumina</h1>
         <div className="flex gap-4">
           {customerDetails.type === 'registered' && (
              <button onClick={() => setCurrentScreen('history')} className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1">
                 <History className="w-4 h-4"/> History
              </button>
           )}
         </div>
      </div>

      {/* Hero */}
      <div className="py-12 md:py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-6xl font-thin tracking-tight text-stone-900 mb-4">
          Lumina <span className="text-stone-400">Café</span>
        </h1>
        <p className="text-stone-500 font-light max-w-lg mx-auto">Experience coffee in high definition.</p>
      </div>

      {/* AI Assistant */}
      <GlassCard className="mb-12 p-1 flex flex-col md:flex-row items-center gap-2 max-w-2xl mx-auto backdrop-blur-2xl bg-white/50 border border-stone-200 shadow-sm">
        <div className="p-3">
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </div>
        <input 
          type="text" 
          placeholder="How are you feeling today?" 
          className="bg-transparent border-none outline-none text-stone-900 w-full placeholder-stone-400 text-sm p-2"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
        />
        <Button variant="secondary" onClick={handleAskAi} isLoading={aiLoading} className="whitespace-nowrap rounded-lg border-none bg-stone-100 hover:bg-stone-200">
          Ask Barista
        </Button>
      </GlassCard>

      {recommendation && (
        <div className="max-w-2xl mx-auto mb-12 animate-in fade-in zoom-in-95">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-indigo-900 text-sm font-medium mb-1">Recommended: {recommendation.recommendation}</p>
              <p className="text-stone-600 text-xs">{recommendation.reason}</p>
            </div>
            <button onClick={() => setRecommendation(null)}><X className="w-4 h-4 text-stone-400 hover:text-stone-900" /></button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex justify-center gap-2 mb-12 overflow-x-auto pb-4 no-scrollbar">
        {['all', 'coffee', 'tea', 'pastry'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat as any)}
            className={`
              px-6 py-2 rounded-full text-sm font-medium transition-all duration-300
              ${category === cat ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300'}
            `}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <GlassCard key={product.id} className="group flex flex-col h-full bg-white border-stone-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all" onClick={() => handleProductClick(product)}>
            <div className="aspect-[4/3] relative overflow-hidden bg-stone-100">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute top-4 right-4">
                <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white flex items-center justify-center text-stone-900 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-stone-900 group-hover:text-amber-700 transition-colors">{product.name}</h3>
                <span className="text-stone-900 font-medium">{formatCurrency(product.price)}</span>
              </div>
              <p className="text-stone-500 text-sm font-light mb-4 flex-grow line-clamp-2">{product.description}</p>
              <div className="flex gap-2">
                {product.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider text-stone-500 border border-stone-200 px-2 py-1 rounded bg-stone-50">{tag}</span>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Floating Cart Dock */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 animate-in slide-in-from-bottom-10">
          <div onClick={() => setIsCartOpen(true)} className="bg-white/90 backdrop-blur-xl border border-stone-200 rounded-2xl p-4 shadow-2xl flex items-center justify-between cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold shadow-md">{cart.length}</div>
              <div className="flex flex-col">
                <span className="text-stone-900 text-sm font-medium">Current Order</span>
                <span className="text-stone-500 text-xs">Total: {formatCurrency(cartTotal)}</span>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium text-stone-900">
              View Cart <ChevronLeft className="w-4 h-4 ml-1 rotate-90" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};