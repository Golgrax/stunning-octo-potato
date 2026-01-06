import { initDb, getDb } from '../lib/db';
import { Product, InventoryItem, User } from '../types';

// Mock data from App.tsx - Prices in PHP (Philippine Peso)
const PRODUCTS: Product[] = [
  { id: '1', name: 'Velvet Latte', price: 165.00, category: 'coffee', description: 'Espresso with steamed silky milk and a hint of Madagascar vanilla.', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800', tags: ['Bestseller', 'Hot'], isActive: true, isFeatured: true },
  { id: '2', name: 'Cold Brew Noir', price: 135.00, category: 'coffee', description: 'Slow-steeped for 24 hours. Deep, dark, and incredibly smooth with chocolate notes.', image: '/cold-brew-noir.png', tags: ['Cold', 'Strong'], isActive: true, isFeatured: true },
  { id: '3', name: 'Matcha Cloud', price: 180.00, category: 'tea', description: 'Premium ceremonial grade matcha topped with sweet vanilla cream foam.', image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&q=80&w=800', tags: ['Sweet', 'Tea'], isActive: true },
  { id: '4', name: 'Golden Croissant', price: 110.00, category: 'pastry', description: 'Buttery, flaky, and baked fresh every morning by our in-house pastry chef.', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800', tags: ['Bakery', 'Fresh'], isActive: true, isFeatured: true },
  { id: '5', name: 'Cortado', price: 120.00, category: 'coffee', description: 'Equal parts espresso and steamed milk. The perfect balance of power and comfort.', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800', tags: ['Classic'], isActive: true },
  { id: '6', name: 'Lavender Haze', price: 170.00, category: 'tea', description: 'Earl grey tea with house-made lavender syrup and creamy oat milk.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800', tags: ['Floral'], isActive: true }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { productId: '1', productName: 'Velvet Latte (Beans)', currentStock: 150, unit: 'shots', lowStockThreshold: 20 },
  { productId: '2', productName: 'Cold Brew Noir (Batch)', currentStock: 40, unit: 'cups', lowStockThreshold: 10 },
  { productId: '3', productName: 'Matcha Cloud (Powder)', currentStock: 80, unit: 'servings', lowStockThreshold: 15 },
  { productId: '4', productName: 'Golden Croissant', currentStock: 12, unit: 'pcs', lowStockThreshold: 5 },
  { productId: '5', productName: 'Cortado (Beans)', currentStock: 150, unit: 'shots', lowStockThreshold: 20 },
  { productId: '6', productName: 'Lavender Haze (Syrup)', currentStock: 200, unit: 'pumps', lowStockThreshold: 30 },
];

const MOCK_USERS: User[] = [
  { id: 'u-1', name: 'Alice Member', email: 'alice@lumina.cafe', phone: '+639171234567', role: 'customer', joinedDate: new Date('2025-01-15'), totalOrders: 12, totalSpent: 4365.00, status: 'active' },
  { id: 'u-2', name: 'John Admin', email: 'admin@lumina.cafe', phone: '+639189876543', role: 'admin', joinedDate: new Date('2024-11-01'), totalOrders: 0, totalSpent: 0, status: 'active' },
  { id: 'u-3', name: 'Sarah Employee', email: 'employee@lumina.cafe', phone: '+639155512345', role: 'employee', joinedDate: new Date('2024-12-01'), totalOrders: 0, totalSpent: 0, status: 'active' },
];

// User passwords (plain text for prototype - PRODUCTION: use bcrypt)
const USER_PASSWORDS: Record<string, string> = {
  'u-1': 'customer123',
  'u-2': 'admin123',
  'u-3': 'employee123'
};

function insertMockData() {
  const db = getDb();

  // Check if data already exists
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  
  if (productCount.count > 0) {
    console.log('⚠️  Database already contains data. Skipping data insertion.');
    console.log('   To reset the database, delete lumina.db and run this script again.');
    return;
  }

  console.log('Inserting products...');
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, description, price, category, image, tags, isActive, isFeatured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of PRODUCTS) {
    insertProduct.run(
      product.id,
      product.name,
      product.description,
      product.price,
      product.category,
      product.image,
      JSON.stringify(product.tags),
      product.isActive ? 1 : 0,
      product.isFeatured ? 1 : 0
    );
  }
  console.log(`✓ Inserted ${PRODUCTS.length} products`);

  console.log('Inserting inventory...');
  const insertInventory = db.prepare(`
    INSERT INTO inventory (productId, productName, currentStock, unit, lowStockThreshold)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const item of INITIAL_INVENTORY) {
    insertInventory.run(
      item.productId,
      item.productName,
      item.currentStock,
      item.unit,
      item.lowStockThreshold
    );
  }
  console.log(`✓ Inserted ${INITIAL_INVENTORY.length} inventory items`);

  console.log('Inserting users...');
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, phone, role, joinedDate, totalOrders, totalSpent, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of MOCK_USERS) {
    insertUser.run(
      user.id,
      user.name,
      user.email,
      USER_PASSWORDS[user.id] || null, // Add password
      user.phone,
      user.role,
      user.joinedDate.toISOString(),
      user.totalOrders,
      user.totalSpent,
      user.status
    );
  }
  console.log(`✓ Inserted ${MOCK_USERS.length} users (with passwords)`);
}

// Main execution
console.log('🚀 Initializing Lumina Café database...\n');

try {
  // Initialize database schema
  initDb();
  
  // Insert mock data
  insertMockData();
  
  console.log('\n✅ Database initialization complete!');
  console.log('📊 Database location: lumina.db');
  
  // Display summary
  const db = getDb();
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number };
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  console.log('\n📈 Summary:');
  console.log(`   - Products: ${productCount.count}`);
  console.log(`   - Inventory items: ${inventoryCount.count}`);
  console.log(`   - Users: ${userCount.count}`);
  
} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
}

