import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend } from 'recharts';
import { Coffee, Clock, AlertCircle, TrendingUp, CreditCard, QrCode, Users, LayoutDashboard, ClipboardList, Package, LogOut, Search, ChevronRight, Ban, RotateCcw, Banknote, Edit3, Trash2, CheckCircle2, Archive, Eye, DollarSign, ShoppingCart, Star, TrendingDown, Activity, BarChart3, X, Menu } from 'lucide-react';
import { GlassCard, Button, Badge, Table, Input, Select, GlassModal } from '../components/GlassComponents';
import { Order, OrderStatus, User, Product, InventoryItem } from '../types';
import { io, Socket } from 'socket.io-client';
import { formatCurrency } from '../lib/currency';

const SOCKET_URL = '/';

interface AdminDashboardProps {
  orders: Order[];
  users: User[];
  products: Product[];
  inventory: InventoryItem[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateProductStatus: (productId: string, isActive: boolean) => void; // Soft Delete
  updateInventoryStock: (productId: string, newStock: number) => void;
  onExit: () => void;
}

type AdminView = 'dashboard' | 'analytics' | 'orders' | 'users' | 'inventory' | 'menu';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, users, products, inventory, 
  updateOrderStatus, updateProductStatus, updateInventoryStock, onExit 
}) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [realtimeOrders, setRealtimeOrders] = useState<Order[]>(orders);
  const [feedbackNotification, setFeedbackNotification] = useState<{orderId: string; rating: number} | null>(null);
  const [newOrderNotification, setNewOrderNotification] = useState<{orderId: string; customerName: string; total: number; items: number} | null>(null);

  // Sync orders prop with realtime state
  useEffect(() => {
    setRealtimeOrders(orders);
  }, [orders]);

  // WebSocket for real-time updates in admin dashboard
  useEffect(() => {
    console.log('🔌 Admin: Connecting to WebSocket for real-time updates');
    
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🔌 Admin WebSocket connected');
      // Join admin room for broadcast updates
      socket.emit('join-admin');
    });

    // Listen for order updates (status changes)
    socket.on('order-updated', (updatedOrder: any) => {
      console.log('🔔 Admin: Order update received', updatedOrder.id);
      
      // Parse timestamp
      updatedOrder.timestamp = new Date(updatedOrder.timestamp);
      
      // Update orders list
      setRealtimeOrders(prev => 
        prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      );
    });

    // Listen for new feedback submissions
    socket.on('feedback-received', (data: any) => {
      console.log('⭐ Admin: New feedback received!', data);
      
      // Show notification
      setFeedbackNotification({ orderId: data.orderId, rating: data.rating });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setFeedbackNotification(null), 5000);
      
      // Update orders list with feedback
      setRealtimeOrders(prev => 
        prev.map(o => o.id === data.orderId 
          ? { ...o, feedback: { rating: data.rating, comment: data.comment, timestamp: new Date(data.timestamp) } }
          : o
        )
      );
    });

    // Listen for new orders
    socket.on('new-order', (newOrder: any) => {
      console.log('🆕 Admin: New order received!', newOrder.id);
      
      newOrder.timestamp = new Date(newOrder.timestamp);
      
      // Show notification popup
      setNewOrderNotification({
        orderId: newOrder.id,
        customerName: newOrder.customer.name,
        total: newOrder.total,
        items: newOrder.items.length
      });
      
      // Play notification sound (if browser allows)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
        audio.play().catch(() => {}); // Ignore if blocked
      } catch (e) {}
      
      // Auto-hide notification after 8 seconds
      setTimeout(() => setNewOrderNotification(null), 8000);
      
      // Add to orders list at the top
      setRealtimeOrders(prev => [newOrder, ...prev]);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Admin WebSocket disconnected');
    });

    return () => {
      socket.emit('leave-admin');
      socket.disconnect();
    };
  }, []);

  // Stats - Use realtimeOrders for instant updates
  const stats = useMemo(() => {
    return {
      pending: realtimeOrders.filter(o => o.status === 'pending_payment').length,
      prep: realtimeOrders.filter(o => o.status === 'in_prep').length,
      ready: realtimeOrders.filter(o => o.status === 'ready').length,
      completed: realtimeOrders.filter(o => o.status === 'completed').length,
      revenue: realtimeOrders.filter(o => o.status !== 'pending_payment').reduce((acc, curr) => acc + curr.total, 0),
      totalMembers: users.filter(u => u.role === 'customer').length
    };
  }, [realtimeOrders, users]);

  // Advanced Analytics KPIs - Use realtimeOrders for instant updates
  const analytics = useMemo(() => {
    const completedOrders = realtimeOrders.filter(o => o.status === 'completed');
    const paidOrders = realtimeOrders.filter(o => o.status !== 'pending_payment');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = realtimeOrders.filter(o => new Date(o.timestamp) >= today);
    
    // Revenue metrics
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const todayRevenue = todayOrders.filter(o => o.status !== 'pending_payment').reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    
    // Order metrics
    const totalOrders = realtimeOrders.length;
    const completionRate = realtimeOrders.length > 0 ? (completedOrders.length / realtimeOrders.length) * 100 : 0;
    
    // Customer metrics
    const registeredCustomers = users.filter(u => u.role === 'customer').length;
    const guestOrders = realtimeOrders.filter(o => o.customer.type === 'guest').length;
    const registeredOrders = realtimeOrders.filter(o => o.customer.type === 'registered').length;
    
    // Product performance
    const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
    paidOrders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, count: 0, revenue: 0 };
        }
        productSales[item.id].count += item.quantity || 1;
        productSales[item.id].revenue += item.price * (item.quantity || 1);
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Payment method breakdown
    const paymentMethods = {
      cash: paidOrders.filter(o => o.paymentMethod === 'cash').length,
      card_pos: paidOrders.filter(o => o.paymentMethod === 'card_pos').length,
      manual_qr: paidOrders.filter(o => o.paymentMethod === 'manual_qr').length
    };
    
    // Fulfillment breakdown
    const fulfillmentTypes = {
      pickup: realtimeOrders.filter(o => o.fulfillment === 'pickup').length,
      delivery: realtimeOrders.filter(o => o.fulfillment === 'delivery').length
    };
    
    // Category breakdown
    const categoryRevenue: Record<string, number> = {};
    paidOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          if (!categoryRevenue[product.category]) {
            categoryRevenue[product.category] = 0;
          }
          categoryRevenue[product.category] += item.price * (item.quantity || 1);
        }
      });
    });
    
    // Customer satisfaction
    const ordersWithFeedback = completedOrders.filter(o => o.feedback);
    const avgRating = ordersWithFeedback.length > 0
      ? ordersWithFeedback.reduce((sum, o) => sum + (o.feedback?.rating || 0), 0) / ordersWithFeedback.length
      : 0;
    
    // Inventory alerts
    const lowStockItems = inventory.filter(i => i.currentStock <= i.lowStockThreshold);
    const outOfStockItems = inventory.filter(i => i.currentStock === 0);
    
    return {
      totalRevenue,
      todayRevenue,
      avgOrderValue,
      totalOrders,
      completionRate,
      registeredCustomers,
      guestOrders,
      registeredOrders,
      topProducts,
      paymentMethods,
      fulfillmentTypes,
      categoryRevenue,
      avgRating,
      feedbackCount: ordersWithFeedback.length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length
    };
  }, [realtimeOrders, users, products, inventory]);

  // Chart
  const chartData = [
    { name: '8am', orders: 12 }, { name: '9am', orders: 28 }, { name: '10am', orders: 15 },
    { name: '11am', orders: 10 }, { name: '12pm', orders: 35 }, { name: '1pm', orders: 22 },
  ];

  const SidebarItem = ({ view, icon: Icon, label }: { view: AdminView, icon: any, label: string }) => (
    <button 
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false); // Close sidebar on mobile when item clicked
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === view ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  // Views
  const DashboardHome = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between items-start mb-2"><span className="text-neutral-500 dark:text-neutral-400 text-xs uppercase font-medium">Total Revenue</span><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
          <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(stats.revenue)}</div>
        </GlassCard>
        <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
           <div className="flex justify-between items-start mb-2"><span className="text-neutral-500 dark:text-neutral-400 text-xs uppercase font-medium">Active Orders</span><Clock className="w-4 h-4 text-blue-600" /></div>
          <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{stats.prep + stats.ready}</div>
        </GlassCard>
        <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
           <div className="flex justify-between items-start mb-2"><span className="text-neutral-500 dark:text-neutral-400 text-xs uppercase font-medium">Pending Payment</span><AlertCircle className="w-4 h-4 text-amber-600" /></div>
          <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{stats.pending}</div>
        </GlassCard>
        <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
           <div className="flex justify-between items-start mb-2"><span className="text-neutral-500 dark:text-neutral-400 text-xs uppercase font-medium">Total Members</span><Users className="w-4 h-4 text-indigo-600" /></div>
          <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{stats.totalMembers}</div>
        </GlassCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard variant="solid" className="lg:col-span-2 p-6 min-h-[300px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <h3 className="text-neutral-900 dark:text-neutral-100 font-medium mb-6">Hourly Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: '#f5f5f4'}} contentStyle={{backgroundColor: '#fff', borderColor: '#e7e5e4', color: '#1c1917', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} itemStyle={{color: '#1c1917'}} />
              <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill="#d6d3d1" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <div className="space-y-4">
           <h3 className="text-neutral-500 dark:text-neutral-400 text-xs font-medium uppercase mb-2">Quick Actions</h3>
           <button onClick={() => setCurrentView('menu')} className="w-full p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl flex items-center justify-between group transition-all shadow-sm">
             <div className="flex items-center gap-3"><div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><ClipboardList className="w-5 h-5"/></div><span className="text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">Review Menu</span></div>
             <ChevronRight className="w-4 h-4 text-neutral-400" />
           </button>
           <button onClick={() => setCurrentView('inventory')} className="w-full p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl flex items-center justify-between group transition-all shadow-sm">
             <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Package className="w-5 h-5"/></div><span className="text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">Inventory Check</span></div>
             <ChevronRight className="w-4 h-4 text-neutral-400" />
           </button>
        </div>
      </div>
    </div>
  );

  const OrdersList = () => {
    const activeOrders = realtimeOrders.filter(o => o.status !== 'completed').sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2">
        {/* Feedback Notification */}
        {feedbackNotification && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-purple-900 dark:text-purple-100 font-medium">New Feedback Received!</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(feedbackNotification.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-purple-700 dark:text-purple-300 text-sm">Order #{feedbackNotification.orderId.slice(-4)}</span>
            <button onClick={() => setFeedbackNotification(null)} className="ml-auto">
              <X className="w-4 h-4 text-purple-400 hover:text-purple-700 dark:hover:text-purple-200" />
            </button>
          </div>
        )}
        
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-6">Live Queue</h2>
        <Table headers={['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Action']}>
          {activeOrders.map(order => (
             <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
               <td className="px-6 py-4 font-mono text-neutral-500 dark:text-neutral-400">{order.id.slice(-6).toUpperCase()}</td>
               <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100 font-medium">
                  {order.customer.name}
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">{order.fulfillment}</div>
               </td>
               <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">{order.items.length} items</td>
               <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100 font-medium">{formatCurrency(order.total)}</td>
               <td className="px-6 py-4">
                  {order.paymentMethod === 'cash' && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs"><Banknote className="w-3 h-3"/> Cash</span>}
                  {order.paymentMethod === 'card_pos' && <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs"><CreditCard className="w-3 h-3"/> POS</span>}
                  {order.paymentMethod === 'manual_qr' && <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs"><QrCode className="w-3 h-3"/> QR</span>}
               </td>
               <td className="px-6 py-4"><Badge status={order.status} /></td>
               <td className="px-6 py-4">
                 <Select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="text-xs py-1.5 px-3 min-w-[150px] bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  >
                    <option value="pending_payment">Payment Pending</option>
                    <option value="in_prep">Brewing (In Prep)</option>
                    <option value="ready">Ready for Pickup</option>
                    <option value="completed">Completed</option>
                  </Select>
               </td>
             </tr>
          ))}
        </Table>
      </div>
    );
  };

  const InventoryView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2">
       <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-6">Inventory Management</h2>
       <Table headers={['Item', 'Current Stock', 'Unit', 'Status', 'Actions']}>
          {inventory.map(item => (
             <tr key={item.productId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100">{item.productName}</td>
                <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-300">{item.currentStock}</td>
                <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 text-xs uppercase">{item.unit}</td>
                <td className="px-6 py-4">
                   {item.currentStock <= item.lowStockThreshold ? (
                      <span className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Low Stock</span>
                   ) : <span className="text-emerald-600 dark:text-emerald-400 text-xs">OK</span>}
                </td>
                <td className="px-6 py-4 flex gap-2">
                   <button onClick={() => updateInventoryStock(item.productId, item.currentStock + 10)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs border border-neutral-200 dark:border-neutral-700">Add Stock</button>
                </td>
             </tr>
          ))}
       </Table>
    </div>
  );

  const MenuManagement = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2">
       <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-6">Menu Management</h2>
       <Table headers={['Product', 'Category', 'Price', 'Status', 'Actions']}>
          {products.map(product => (
             <tr key={product.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${!product.isActive ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4 flex items-center gap-3">
                   <img src={product.image} className="w-8 h-8 rounded-md object-cover bg-neutral-200 dark:bg-neutral-700" alt="" />
                   <span className="text-neutral-900 dark:text-neutral-100">{product.name}</span>
                </td>
                <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 capitalize">{product.category}</td>
                <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100 font-mono">{formatCurrency(product.price)}</td>
                <td className="px-6 py-4">
                   <Badge status={product.isActive ? 'active' : 'suspended'} />
                </td>
                <td className="px-6 py-4 flex gap-2">
                   <button 
                      onClick={() => updateProductStatus(product.id, !product.isActive)}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-1 ${product.isActive ? 'text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                   >
                      {product.isActive ? <><Archive className="w-3 h-3"/> Archive</> : <><RotateCcw className="w-3 h-3"/> Restore</>}
                   </button>
                </td>
             </tr>
          ))}
       </Table>
    </div>
  );

  const UserManagement = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">User Management</h2>
          <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><Input placeholder="Search users..." className="pl-10 h-10 text-sm bg-white dark:bg-neutral-900" /></div>
       </div>
       <Table headers={['Name', 'Email', 'Role', 'Joined', 'Orders', 'Spent', 'Status']}>
          {users.map(user => (
             <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{user.email}</td>
                <td className="px-6 py-4"><Badge status={user.role === 'customer' ? 'registered' : 'admin'} /></td>
                <td className="px-6 py-4 text-neutral-400 text-xs">{user.joinedDate.toLocaleDateString()}</td>
                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">{user.totalOrders}</td>
                <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(user.totalSpent)}</td>
                <td className="px-6 py-4"><Badge status={user.status} /></td>
             </tr>
          ))}
       </Table>
    </div>
  );

  const AnalyticsView = () => {
    const [resetting, setResetting] = useState<string | null>(null);

    const handleReset = async (type: 'orders' | 'feedback' | 'inventory' | 'all') => {
      if (!confirm(`Are you sure you want to reset ${type}? This cannot be undone.`)) {
        return;
      }

      setResetting(type);
      try {
        const response = await fetch(`/api/admin/reset-${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Reset failed');

        const result = await response.json();
        console.log('✅ Reset successful:', result);
        
        alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} reset successfully!`);
        
        // Refresh page to reload data
        window.location.reload();
      } catch (error) {
        console.error('❌ Reset error:', error);
        alert(`Failed to reset ${type}`);
      } finally {
        setResetting(null);
      }
    };

    // Prepare chart data
    const categoryChartData = Object.entries(analytics.categoryRevenue).map(([category, revenue]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      revenue: Number((revenue as number).toFixed(2)),
      fill: category === 'coffee' ? '#8B4513' : category === 'tea' ? '#10b981' : '#f59e0b'
    }));

    const paymentChartData = [
      { name: 'Cash', value: analytics.paymentMethods.cash, fill: '#10b981' },
      { name: 'Card POS', value: analytics.paymentMethods.card_pos, fill: '#3b82f6' },
      { name: 'QR/E-Wallet', value: analytics.paymentMethods.manual_qr, fill: '#8b5cf6' }
    ].filter(item => item.value > 0);

    const fulfillmentChartData = [
      { name: 'Pickup', value: analytics.fulfillmentTypes.pickup, fill: '#f59e0b' },
      { name: 'Delivery', value: analytics.fulfillmentTypes.delivery, fill: '#06b6d4' }
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Reset Controls */}
        <div className="flex justify-end gap-3 flex-wrap">
          <button
            onClick={() => handleReset('feedback')}
            disabled={resetting !== null}
            className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-lg border border-amber-200 dark:border-amber-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Feedback
          </button>
          <button
            onClick={() => handleReset('orders')}
            disabled={resetting !== null}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg border border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Orders
          </button>
          <button
            onClick={() => handleReset('inventory')}
            disabled={resetting !== null}
            className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-lg border border-purple-200 dark:border-purple-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Inventory
          </button>
          <button
            onClick={() => handleReset('all')}
            disabled={resetting !== null}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset All Data
          </button>
        </div>

        {/* Feedback Notification */}
        {feedbackNotification && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p className="text-purple-900 dark:text-purple-100 font-semibold">New Customer Feedback!</p>
                <p className="text-purple-700 dark:text-purple-300 text-sm">Order #{feedbackNotification.orderId.slice(-4)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-5 h-5 ${i < feedbackNotification.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 dark:text-neutral-700'}`} 
                />
              ))}
            </div>
            <button onClick={() => setFeedbackNotification(null)} className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg">
              <X className="w-4 h-4 text-purple-400 hover:text-purple-700 dark:hover:text-purple-200" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard variant="solid" className="p-6 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-neutral-900 border-emerald-100 dark:border-emerald-900/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-emerald-700 dark:text-emerald-400 text-xs uppercase font-medium">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(analytics.totalRevenue)}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Today: {formatCurrency(analytics.todayRevenue)}</div>
          </GlassCard>

          <GlassCard variant="solid" className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-neutral-900 border-blue-100 dark:border-blue-900/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-blue-700 dark:text-blue-400 text-xs uppercase font-medium">Avg Order Value</span>
              <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(analytics.avgOrderValue)}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">{analytics.totalOrders} total orders</div>
          </GlassCard>

          <GlassCard variant="solid" className="p-6 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-neutral-900 border-amber-100 dark:border-amber-900/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-amber-700 dark:text-amber-400 text-xs uppercase font-medium">Completion Rate</span>
              <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{analytics.completionRate.toFixed(1)}%</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">{stats.completed} completed</div>
          </GlassCard>

          <GlassCard variant="solid" className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-neutral-900 border-purple-100 dark:border-purple-900/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-purple-700 dark:text-purple-400 text-xs uppercase font-medium">Customer Rating</span>
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{analytics.avgRating.toFixed(1)}/5</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">{analytics.feedbackCount} reviews</div>
          </GlassCard>
        </div>

        {/* Revenue & Orders Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Revenue by Category
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryChartData}>
                <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'var(--tooltip-bg, #fff)', borderColor: 'var(--tooltip-border, #e7e5e4)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  formatter={(value: any) => [`₱${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Payment Methods
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Top Products & Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold mb-6 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" />
              Top Selling Products
            </h3>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium text-sm">{product.name}</p>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs">{product.count} sold</p>
                    </div>
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
              {analytics.topProducts.length === 0 && (
                <div className="text-center py-8 text-neutral-400 dark:text-neutral-600">
                  <Coffee className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No sales data yet</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Customer Insights */}
          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Customer Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">Registered Customers</span>
                  <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{analytics.registeredCustomers}</span>
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400">{analytics.registeredOrders} orders from members</div>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm font-medium">Guest Orders</span>
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{analytics.guestOrders}</span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {analytics.totalOrders > 0 
                    ? `${((analytics.guestOrders / analytics.totalOrders) * 100).toFixed(1)}% of total`
                    : 'No orders yet'}
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">Avg Customer Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">{analytics.avgRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">{analytics.feedbackCount} feedback responses</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Fulfillment & Inventory Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fulfillment Types */}
          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-600" />
              Fulfillment Types
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">Pickup</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{analytics.fulfillmentTypes.pickup}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    {analytics.totalOrders > 0 
                      ? `${((analytics.fulfillmentTypes.pickup / analytics.totalOrders) * 100).toFixed(0)}%`
                      : '0%'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-100 dark:border-cyan-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-500" />
                  </div>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">Delivery</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{analytics.fulfillmentTypes.delivery}</div>
                  <div className="text-xs text-cyan-600 dark:text-cyan-400">
                    {analytics.totalOrders > 0 
                      ? `${((analytics.fulfillmentTypes.delivery / analytics.totalOrders) * 100).toFixed(0)}%`
                      : '0%'}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Inventory Alerts */}
          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Inventory Alerts
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-700 dark:text-red-300 text-sm font-medium">Out of Stock</span>
                  <span className="text-2xl font-bold text-red-900 dark:text-red-100">{analytics.outOfStockItems}</span>
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">Requires immediate attention</div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">Low Stock</span>
                  <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">{analytics.lowStockItems}</span>
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Below threshold</div>
              </div>

              <button 
                onClick={() => setCurrentView('inventory')}
                className="w-full p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all flex items-center justify-center gap-2"
              >
                View Inventory <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Payment Methods</span>
              <CreditCard className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Cash</span>
                <span className="font-mono text-neutral-900 dark:text-neutral-100">{analytics.paymentMethods.cash}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Card POS</span>
                <span className="font-mono text-neutral-900 dark:text-neutral-100">{analytics.paymentMethods.card_pos}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">QR/E-Wallet</span>
                <span className="font-mono text-neutral-900 dark:text-neutral-100">{analytics.paymentMethods.manual_qr}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Order Status</span>
              <Activity className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Pending Payment</span>
                <span className="font-mono text-amber-600 dark:text-amber-500">{stats.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">In Preparation</span>
                <span className="font-mono text-blue-600 dark:text-blue-500">{stats.prep}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Ready</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-500">{stats.ready}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Completed</span>
                <span className="font-mono text-neutral-400 dark:text-neutral-600">{stats.completed}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Customer Types</span>
              <Users className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Registered</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{analytics.registeredOrders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Guest</span>
                <span className="font-mono text-neutral-600 dark:text-neutral-300">{analytics.guestOrders}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">Total Members</span>
                <span className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold">{analytics.registeredCustomers}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  };

  const UserDetailModal = () => {
    if (!selectedUser) return null;
    const userOrders = realtimeOrders.filter(o => (o.customer.userId === selectedUser.id) || (o.customer.email === selectedUser.email)).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    return (
      <GlassModal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Customer Details">
         <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-3 md:col-span-1 flex flex-col items-center text-center p-4 bg-stone-50 rounded-xl border border-stone-200">
               <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl font-bold mb-4 border border-indigo-100">{selectedUser.name.charAt(0)}</div>
               <h3 className="text-stone-900 font-medium text-lg">{selectedUser.name}</h3>
               <p className="text-stone-500 text-sm">{selectedUser.email}</p>
               <div className="mt-2"><Badge status={selectedUser.status} /></div>
            </div>
            <div className="col-span-3 md:col-span-2 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200"><span className="text-stone-500 text-xs uppercase">Lifetime Value</span><div className="text-2xl font-mono text-emerald-600 mt-1">{formatCurrency(selectedUser.totalSpent)}</div></div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200"><span className="text-stone-500 text-xs uppercase">Total Orders</span><div className="text-2xl font-mono text-stone-900 mt-1">{selectedUser.totalOrders}</div></div>
               </div>
            </div>
         </div>
         <div>
            <h4 className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-4">History</h4>
            <div className="border border-stone-200 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 text-xs uppercase"><tr><th className="px-4 py-3">Order ID</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-stone-100">
                     {userOrders.map(ord => (<tr key={ord.id} className="hover:bg-stone-50"><td className="px-4 py-3 font-mono text-stone-500">{ord.id.slice(-6).toUpperCase()}</td><td className="px-4 py-3 text-stone-500">{ord.timestamp.toLocaleDateString()}</td><td className="px-4 py-3 text-stone-900 font-medium">{formatCurrency(ord.total)}</td><td className="px-4 py-3"><Badge status={ord.status} /></td></tr>))}
                  </tbody>
               </table>
            </div>
         </div>
      </GlassModal>
    );
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 transition-colors duration-300">
      <UserDetailModal />
      
      {/* New Order Popup Notification */}
      {newOrderNotification && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border-2 border-emerald-500 p-6 min-w-[320px] max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">New Order Received! 🎉</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
                  <span className="font-medium">{newOrderNotification.customerName}</span> placed an order
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                    <Coffee className="w-4 h-4" />
                    <span>{newOrderNotification.items} items</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(newOrderNotification.total)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentView('orders');
                      setNewOrderNotification(null);
                    }}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    View Order
                  </button>
                  <button
                    onClick={() => setNewOrderNotification(null)}
                    className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setNewOrderNotification(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm text-neutral-600 dark:text-neutral-300"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
         <div className="p-6"><h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white"><LayoutDashboard className="w-4 h-4"/></div>Lumina Admin</h1></div>
         <nav className="flex-1 px-4 space-y-1">
            <SidebarItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem view="analytics" icon={BarChart3} label="Analytics & KPIs" />
            <SidebarItem view="orders" icon={ClipboardList} label="Live Queue" />
            <SidebarItem view="menu" icon={Coffee} label="Menu Management" />
            <SidebarItem view="inventory" icon={Package} label="Inventory" />
            <SidebarItem view="users" icon={Users} label="User Management" />
         </nav>
         <div className="p-4 border-t border-neutral-200 dark:border-neutral-800"><button onClick={onExit} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 pt-16 md:pt-8 transition-all duration-300">
         <div className="max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
               <div><h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 capitalize">{currentView.replace('-', ' ')}</h2></div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-sm"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">System Online</span></div>
            </header>
            {currentView === 'dashboard' && <DashboardHome />}
            {currentView === 'analytics' && <AnalyticsView />}
            {currentView === 'orders' && <OrdersList />}
            {currentView === 'users' && <UserManagement />}
            {currentView === 'inventory' && <InventoryView />}
            {currentView === 'menu' && <MenuManagement />}
         </div>
      </main>
    </div>
  );
};
