import React, { useState, useEffect } from 'react';
import { CustomerView } from './pages/CustomerView';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { Product, CartItem, Order, OrderStatus, CustomerDetails, PaymentMethod, User, InventoryItem, FulfillmentType } from './types';
import { Button, AccessibilityMenu } from './components/GlassComponents';
import { Lock } from 'lucide-react';

// API Base URL
const API_BASE_URL = '/api';

const App: React.FC = () => {
  // Always start at landing page (no persistence for view)
  const [view, setView] = useState<'landing' | 'customer' | 'admin' | 'admin-login'>('landing');
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('lumina_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    const saved = localStorage.getItem('lumina_activeOrder');
    if (saved) {
      const order = JSON.parse(saved);
      // Parse date back to Date object
      order.timestamp = new Date(order.timestamp);
      return order;
    }
    return null;
  });
  
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lumina_adminUser');
    if (saved) {
      const user = JSON.parse(saved);
      user.joinedDate = new Date(user.joinedDate);
      return user;
    }
    return null;
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // App-Wide State (now fetched from backend)
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (activeOrder) {
      // Save to localStorage whenever activeOrder changes
      localStorage.setItem('lumina_activeOrder', JSON.stringify(activeOrder));
      console.log('💾 Active order saved to localStorage:', activeOrder.status);
    } else {
      localStorage.removeItem('lumina_activeOrder');
    }
  }, [activeOrder]);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('lumina_adminUser', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('lumina_adminUser');
    }
  }, [adminUser]);

  // Fetch data from backend on mount
  useEffect(() => {
    // Check for /admin in URL
    if (window.location.pathname === '/admin') {
      setView('admin-login');
    }

    // Clear any saved view state to ensure fresh start
    localStorage.removeItem('lumina_view');
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products
        const productsRes = await fetch(`${API_BASE_URL}/products`);
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        const productsData = await productsRes.json();
        setProducts(productsData);

        // Fetch orders
        const ordersRes = await fetch(`${API_BASE_URL}/orders`);
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersRes.json();
        // Parse date strings to Date objects
        const ordersWithDates = ordersData.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp)
        }));
        setOrders(ordersWithDates);

        // Fetch users
        const usersRes = await fetch(`${API_BASE_URL}/auth/users`);
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        // Parse date strings to Date objects
        const usersWithDates = usersData.map((u: any) => ({
          ...u,
          joinedDate: new Date(u.joinedDate)
        }));
        setUsers(usersWithDates);

        // Fetch inventory
        const inventoryRes = await fetch(`${API_BASE_URL}/inventory`);
        if (!inventoryRes.ok) throw new Error('Failed to fetch inventory');
        const inventoryData = await inventoryRes.json();
        setInventory(inventoryData);
        
        // CRITICAL FIX: If there's an activeOrder in localStorage, fetch its latest status
        const savedOrder = localStorage.getItem('lumina_activeOrder');
        if (savedOrder) {
          const orderData = JSON.parse(savedOrder);
          try {
            const orderRes = await fetch(`${API_BASE_URL}/orders/${orderData.id}`);
            if (orderRes.ok) {
              const latestOrder = await orderRes.json();
              latestOrder.timestamp = new Date(latestOrder.timestamp);
              setActiveOrder(latestOrder);
              localStorage.setItem('lumina_activeOrder', JSON.stringify(latestOrder));
              console.log('✅ Active order refreshed from backend:', latestOrder.status);
            }
          } catch (err) {
            console.error('⚠️ Could not refresh active order, using cached version');
          }
        }
        
        console.log('✅ Data loaded from backend');
      } catch (err: any) {
        console.error('❌ Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // -- CUSTOMER ACTIONS --
  const addToCart = (item: CartItem) => setCart([...cart, item]);
  const removeFromCart = (cartId: string) => setCart(cart.filter(item => item.cartId !== cartId));
  const clearActiveOrder = () => {
    setActiveOrder(null);
    localStorage.removeItem('lumina_activeOrder');
  };

  const placeOrder = async (details: CustomerDetails, paymentMethod: PaymentMethod, fulfillment: FulfillmentType) => {
    if (cart.length === 0) return;
    
    try {
      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      // Find userId if registered user
      let userId = undefined;
      if (details.type === 'registered') {
        const existingUser = users.find(u => u.email === details.email);
        if (existingUser) {
          userId = existingUser.id;
        }
      }

      // Prepare order data for backend
      const orderData = {
        customer: {
          name: details.name,
          email: details.email,
          phone: details.phone,
          address: details.address,
          type: details.type,
          userId
        },
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1, // Assuming quantity is 1 per cart item
          options: item.options
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
        fulfillment
      };

      // POST to backend API
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const result = await response.json();
      const newOrder = result.order;

      // Update local state
      setOrders([newOrder, ...orders]);
      setActiveOrder(newOrder);
      setCart([]);

      console.log('✅ Order placed successfully:', newOrder.id);
      
      // Refresh orders and inventory from backend
      fetchOrders();
      
    } catch (err: any) {
      console.error('❌ Error placing order:', err);
      alert(`Failed to place order: ${err.message}`);
    }
  };

  // Helper function to refresh orders
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      if (response.ok) {
        const ordersData = await response.json();
        // Parse date strings to Date objects
        const ordersWithDates = ordersData.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp)
        }));
        setOrders(ordersWithDates);
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }
  };

  const submitFeedback = async (orderId: string, rating: number, comment: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: { rating, comment } })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      const feedbackData = { rating, comment, timestamp: new Date() };
      
      // Update local state for orders list
      setOrders(orders.map(o => o.id === orderId ? { ...o, feedback: feedbackData } : o));
      
      // WebSocket will handle real-time update to admin dashboard
      // Backend emits 'order-updated' and 'feedback-received' events

      console.log('✅ Feedback submitted - Admin will see it instantly via WebSocket');
    } catch (err: any) {
      console.error('❌ Error submitting feedback:', err);
      alert(`Failed to submit feedback: ${err.message}`);
    }
  };

  // -- ADMIN ACTIONS --
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update order status');

      // Update local state for orders list
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      
      // DON'T update activeOrder here - let WebSocket handle it
      // This prevents overriding the real-time update from customer's WebSocket
      
      console.log('✅ Order status updated (WebSocket will notify customer)');
      
      // Refresh orders list to get latest data
      fetchOrders();
    } catch (err: any) {
      console.error('❌ Error updating order status:', err);
      alert(`Failed to update order status: ${err.message}`);
    }
  };

  const updateProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) throw new Error('Failed to update product status');

      // Update local state
      setProducts(products.map(p => p.id === productId ? { ...p, isActive } : p));

      console.log('✅ Product status updated');
    } catch (err: any) {
      console.error('❌ Error updating product status:', err);
      alert(`Failed to update product status: ${err.message}`);
    }
  };

  const updateInventoryStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock: newStock })
      });

      if (!response.ok) throw new Error('Failed to update inventory');

      // Update local state
      setInventory(inventory.map(i => i.productId === productId ? { ...i, currentStock: newStock } : i));

      console.log('✅ Inventory updated');
    } catch (err: any) {
      console.error('❌ Error updating inventory:', err);
      alert(`Failed to update inventory: ${err.message}`);
    }
  };

  // -- RENDER --
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-200 transition-colors duration-300">
      <AccessibilityMenu />
      {view !== 'admin' && view !== 'landing' && (
        <nav className="border-b border-neutral-200/60 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl fixed top-0 w-full z-40 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
            <button onClick={() => setView('landing')} className="font-light text-xl tracking-wider text-neutral-900 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors duration-300">LUMINA CAFÉ</button>
            <div className="flex gap-4">
                <button onClick={() => setView('landing')} className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200 tracking-wide uppercase">← Home</button>
            </div>
            </div>
        </nav>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-300 border-t-neutral-900 mx-auto mb-4"></div>
            <p className="text-neutral-600 font-light tracking-wide">Loading...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white border border-neutral-300 text-neutral-900 px-6 py-3 rounded-lg shadow-lg z-50">
          <p className="font-medium">Error: {error}</p>
          <button onClick={() => window.location.reload()} className="text-sm underline mt-1">Retry</button>
        </div>
      )}

      <main className={view !== 'admin' ? "pt-16" : ""}>
        {view === 'landing' && (
          <div className="h-[85vh] flex flex-col items-center justify-center space-y-10 px-4 text-center animate-in fade-in duration-700 relative">
             <div className="relative">
                <h1 className="relative text-6xl md:text-8xl font-extralight text-neutral-900 tracking-[0.2em] mb-4">LUMINA</h1>
                <div className="h-px w-32 bg-neutral-300 mx-auto"></div>
             </div>
             <p className="text-neutral-500 max-w-md text-base font-light tracking-widest uppercase">Artisanal Coffee & Pastries</p>
             <div className="flex flex-col gap-4 mt-16">
               <Button onClick={() => setView('customer')} className="h-14 px-16 text-base">Start Ordering</Button>
               <p className="text-neutral-400 text-xs font-light mt-4">Experience our premium selection</p>
             </div>
          </div>
        )}

        {view === 'customer' && (
          <CustomerView 
            products={products} addToCart={addToCart} removeFromCart={removeFromCart} cart={cart}
            placeOrder={placeOrder} activeOrder={activeOrder} clearActiveOrder={clearActiveOrder}
            updateActiveOrder={setActiveOrder}
            orderHistory={orders}
            submitFeedback={submitFeedback}
          />
        )}

        {view === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={(user) => {
              setAdminUser(user);
              setView('admin');
            }}
            onCancel={() => setView('landing')}
          />
        )}

        {view === 'admin' && adminUser && (
          <AdminDashboard 
            orders={orders} users={users} products={products} inventory={inventory}
            updateOrderStatus={updateOrderStatus} updateProductStatus={updateProductStatus}
            updateInventoryStock={updateInventoryStock}
            onExit={() => {
              setAdminUser(null);
              localStorage.removeItem('lumina_adminUser');
              setView('landing');
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;