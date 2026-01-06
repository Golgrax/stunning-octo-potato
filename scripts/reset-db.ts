import { getDb } from '../lib/db';

console.log('🔄 Resetting Lumina Café database...\n');

const db = getDb();

try {
  // Clear all orders
  const ordersDeleted = db.prepare('DELETE FROM orders').run();
  console.log(`✅ Deleted ${ordersDeleted.changes} orders`);

  // Clear all order items
  const orderItemsDeleted = db.prepare('DELETE FROM order_items').run();
  console.log(`✅ Deleted ${orderItemsDeleted.changes} order items`);

  // Reset inventory to initial values
  db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?').run(150, '1');
  db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?').run(40, '2');
  db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?').run(80, '3');
  db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?').run(12, '4');
  db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?').run(150, '5');
  db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?').run(200, '6');
  console.log('✅ Reset inventory to initial stock levels');

  // Reset user stats
  db.prepare('UPDATE users SET totalOrders = 0, totalSpent = 0 WHERE role = ?').run('customer');
  console.log('✅ Reset customer statistics');

  console.log('\n✅ Database reset complete!');
  console.log('\n📊 Current state:');
  console.log(`   - Orders: 0`);
  console.log(`   - Products: ${db.prepare('SELECT COUNT(*) as count FROM products').get().count}`);
  console.log(`   - Users: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`);
  console.log(`   - Inventory: Reset to initial levels`);
  
} catch (error) {
  console.error('❌ Error resetting database:', error);
  process.exit(1);
}

