import sqlite3 from 'sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

sqlite3.verbose();

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'store.db');
const db = new sqlite3.Database(dbPath);

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

export const initializeDatabase = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'customer',
      addresses TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      brand TEXT,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      condition TEXT DEFAULT 'New',
      stock INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      colors TEXT DEFAULT '[]',
      storage_options TEXT DEFAULT '[]',
      specs TEXT DEFAULT '{}',
      image_urls TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      color TEXT,
      storage TEXT,
      unit_price REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cart_id) REFERENCES carts(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_ref TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      guest_name TEXT,
      guest_phone TEXT,
      delivery_address TEXT,
      county TEXT,
      status TEXT DEFAULT 'Pending Payment',
      payment_method TEXT,
      payment_provider TEXT,
      payment_status TEXT DEFAULT 'pending',
      payment_reference TEXT,
      subtotal REAL DEFAULT 0,
      shipping_fee REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      color TEXT,
      storage TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      active INTEGER DEFAULT 1,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      rating REAL NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const categoryRows = await all('SELECT COUNT(*) AS total FROM categories');
  if ((categoryRows[0]?.total ?? 0) === 0) {
    const seedCategories = [
      ['Smartphones', 'smartphones', 'High-performance mobile phones and flagship devices'],
      ['Laptops & Computers', 'laptops-computers', 'Portable workstations and desktop computing'],
      ['Tablets & iPads', 'tablets-ipads', 'Tablets and productivity devices'],
      ['Gaming Consoles', 'gaming-consoles', 'PlayStation, Xbox, and Nintendo platforms'],
      ['Gaming Accessories', 'gaming-accessories', 'Controllers, headsets, and game-ready gear'],
      ['Headphones & Earbuds', 'headphones-earbuds', 'Sound for study, commutes, and gaming'],
      ['Smartwatches', 'smartwatches', 'Fitness-focused and connected wristwear'],
      ['Phone Accessories', 'phone-accessories', 'Chargers, cases, and mobile essentials'],
      ['Computer Accessories', 'computer-accessories', 'Peripherals and upgrades for productivity'],
      ['Other Electronics', 'other-electronics', 'Home and lifestyle technology']
    ];

    for (const [name, slug, description] of seedCategories) {
      await run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description]);
    }
  }

  const productCountRow = await get('SELECT COUNT(*) AS total FROM products');
  if ((productCountRow?.total ?? 0) === 0) {
    const sampleProducts = [
      {
        name: 'iPhone 15 Pro',
        brand: 'Apple',
        slug: 'iphone-15-pro',
        category: 'Smartphones',
        description: 'A flagship smartphone with titanium finish, A17 Pro performance, and stunning triple-camera capability.',
        price: 3500,
        original_price: 4200,
        condition: 'New',
        stock: 14,
        rating: 4.9,
        review_count: 168,
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium'],
        storage_options: ['128GB', '256GB', '512GB', '1TB'],
        specs: {
          display: '6.1-inch Super Retina XDR',
          processor: 'Apple A17 Pro',
          camera: '48MP Pro camera system',
          battery: 'Up to 23 hours video playback',
          connectivity: '5G, Wi-Fi 6E, USB-C'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1678652816700-5e90e64e9ad3?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        brand: 'Samsung',
        slug: 'samsung-galaxy-s24-ultra',
        category: 'Smartphones',
        description: 'Powerful Android flagship with advanced AI features, S Pen, and elite camera system.',
        price: 3390,
        original_price: 3950,
        condition: 'New',
        stock: 18,
        rating: 4.8,
        review_count: 142,
        colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet'],
        storage_options: ['256GB', '512GB', '1TB'],
        specs: {
          display: '6.8-inch QHD+ AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '200MP main camera',
          battery: '5000mAh',
          connectivity: '5G, Bluetooth 5.3'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Dell XPS 13',
        brand: 'Dell',
        slug: 'dell-xps-13',
        category: 'Laptops & Computers',
        description: 'Premium ultrabook for remote work, business, and everyday performance with a near-borderless display.',
        price: 2950,
        original_price: 3550,
        condition: 'New',
        stock: 9,
        rating: 4.7,
        review_count: 84,
        colors: ['Silver', 'Black'],
        storage_options: ['256GB SSD', '512GB SSD', '1TB SSD'],
        specs: {
          display: '13.4-inch FHD+',
          processor: 'Intel Core i7-1365U',
          memory: '16GB RAM',
          storage: '512GB SSD',
          battery: 'Up to 12 hours'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Apple iPad Pro 12.9',
        brand: 'Apple',
        slug: 'apple-ipad-pro-12-9',
        category: 'Tablets & iPads',
        description: 'A premium tablet designed for creative professionals, productivity, and immersive entertainment.',
        price: 2980,
        original_price: 3600,
        condition: 'New',
        stock: 12,
        rating: 4.8,
        review_count: 98,
        colors: ['Space Gray', 'Silver'],
        storage_options: ['128GB', '256GB', '512GB', '1TB'],
        specs: {
          display: '12.9-inch Ultra Retina XDR',
          processor: 'Apple M2',
          connectivity: 'USB-C, Wi-Fi 6E',
          battery: 'Up to 10 hours',
          accessories: 'Apple Pencil Pro compatible'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1561154464-82e9d1e3ac5a?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Sony PlayStation 5',
        brand: 'Sony',
        slug: 'sony-playstation-5',
        category: 'Gaming Consoles',
        description: 'Next-gen gaming console delivering lightning-fast load times, 4K visuals, and immersive audio.',
        price: 2350,
        original_price: 2800,
        condition: 'New',
        stock: 7,
        rating: 4.9,
        review_count: 211,
        colors: ['White', 'Black'],
        storage_options: ['Standard Edition', 'Digital Edition'],
        specs: {
          storage: '825GB SSD',
          resolution: '4K Ultra HD',
          controller: 'DualSense wireless',
          performance: 'Ray tracing enabled'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Sony WH-1000XM5',
        brand: 'Sony',
        slug: 'sony-wh-1000xm5',
        category: 'Headphones & Earbuds',
        description: 'Premium wireless noise-cancelling headphones for travel, meetings, and focused work.',
        price: 1420,
        original_price: 1800,
        condition: 'New',
        stock: 24,
        rating: 4.8,
        review_count: 127,
        colors: ['Black', 'Silver'],
        storage_options: ['Standard'],
        specs: {
          noise_cancellation: 'Adaptive ANC',
          battery: '30-hour battery life',
          connectivity: 'Bluetooth 5.3',
          microphone: 'Beamforming dual microphones'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Apple Watch Series 9',
        brand: 'Apple',
        slug: 'apple-watch-series-9',
        category: 'Smartwatches',
        description: 'A feature-rich smartwatch for health, fitness tracking, notifications, and everyday convenience.',
        price: 1780,
        original_price: 2200,
        condition: 'New',
        stock: 15,
        rating: 4.7,
        review_count: 95,
        colors: ['Midnight', 'Starlight', 'Silver'],
        storage_options: ['41mm', '45mm'],
        specs: {
          display: 'Always-On Retina',
          battery: 'Up to 18 hours',
          health: 'ECG, sleep tracking, fitness metrics',
          connectivity: 'GPS + cellular options'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1431440869543-efaf3388c585?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Anker 3-in-1 Charging Dock',
        brand: 'Anker',
        slug: 'anker-3in1-charging-dock',
        category: 'Phone Accessories',
        description: 'Fast and clean wireless charging solution for your phone, earbuds, and watch in one setup.',
        price: 520,
        original_price: 690,
        condition: 'New',
        stock: 30,
        rating: 4.6,
        review_count: 76,
        colors: ['White', 'Black'],
        storage_options: ['Single Dock'],
        specs: {
          charging: 'Up to 15W wireless charging',
          compatibility: 'iPhone, AirPods, Apple Watch',
          power: '65W USB-C adapter included'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Logitech MX Master 3S',
        brand: 'Logitech',
        slug: 'logitech-mx-master-3s',
        category: 'Computer Accessories',
        description: 'A high-precision wireless mouse designed for productivity and comfortable all-day use.',
        price: 760,
        original_price: 980,
        condition: 'New',
        stock: 18,
        rating: 4.7,
        review_count: 89,
        colors: ['Graphite', 'Black'],
        storage_options: ['Standard'],
        specs: {
          battery: '70 days on a full charge',
          connectivity: 'Bluetooth and USB receiver',
          ergonomics: 'Comfort grip design'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'iPhone 16 Pro Max',
        brand: 'Apple',
        slug: 'iphone-16-pro-max',
        category: 'Smartphones',
        description: 'The newest flagship iPhone with a larger dynamic display, elite camera system, and all-day power.',
        price: 4100,
        original_price: 4900,
        condition: 'New',
        stock: 10,
        rating: 4.9,
        review_count: 214,
        colors: ['Desert Titanium', 'Black Titanium', 'White Titanium'],
        storage_options: ['256GB', '512GB', '1TB'],
        specs: {
          display: '6.9-inch Super Retina XDR',
          processor: 'Apple A18 Pro',
          camera: '48MP Fusion camera',
          battery: 'Up to 33 hours video playback',
          connectivity: '5G, Wi‑Fi 7, USB‑C'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1695048133142-1f7e6d010d66?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1592750475338-74d8f5f9a0f0?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Samsung Galaxy S25 Ultra',
        brand: 'Samsung',
        slug: 'samsung-galaxy-s25-ultra',
        category: 'Smartphones',
        description: 'A premium Android flagship built for mobile creators, productivity, and next-level imaging.',
        price: 3990,
        original_price: 4650,
        condition: 'New',
        stock: 12,
        rating: 4.9,
        review_count: 186,
        colors: ['Titanium Silver', 'Titanium Black', 'Titanium Blue'],
        storage_options: ['256GB', '512GB', '1TB'],
        specs: {
          display: '6.9-inch Dynamic AMOLED 2X',
          processor: 'Snapdragon 8 Elite',
          camera: '200MP triple camera',
          battery: '6000mAh',
          connectivity: '5G, Wi‑Fi 7'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1610792469312-4b8a1f4d2f8d?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1527600478564-30c6d3f61d57?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Samsung Galaxy Z Fold 6',
        brand: 'Samsung',
        slug: 'samsung-galaxy-z-fold-6',
        category: 'Smartphones',
        description: 'Foldable productivity powerhouse with a large inner display and flexibility for work or entertainment.',
        price: 3850,
        original_price: 4500,
        condition: 'New',
        stock: 7,
        rating: 4.8,
        review_count: 103,
        colors: ['Silver Shadow', 'Craft Black', 'Blue'],
        storage_options: ['256GB', '512GB', '1TB'],
        specs: {
          display: '7.6-inch foldable AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP + 12MP + 12MP',
          battery: '4400mAh',
          connectivity: '5G, DeX'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Google Pixel 9 Pro',
        brand: 'Google',
        slug: 'google-pixel-9-pro',
        category: 'Smartphones',
        description: 'AI-assisted photography experience and clean Android software built for everyday reliability.',
        price: 3190,
        original_price: 3690,
        condition: 'New',
        stock: 11,
        rating: 4.7,
        review_count: 94,
        colors: ['Porcelain', 'Rose', 'Obsidian'],
        storage_options: ['128GB', '256GB', '512GB'],
        specs: {
          display: '6.3-inch LTPO OLED',
          processor: 'Google Tensor G4',
          camera: '50MP main camera',
          battery: 'All-day adaptive power',
          connectivity: '5G, Wi‑Fi 7'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1535240040629-7ca7404acef7?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'MacBook Air M3',
        brand: 'Apple',
        slug: 'macbook-air-m3',
        category: 'Laptops & Computers',
        description: 'Ultra-light premium laptop for students, creators, and business users who need high performance.',
        price: 3250,
        original_price: 3900,
        condition: 'New',
        stock: 9,
        rating: 4.9,
        review_count: 168,
        colors: ['Space Gray', 'Silver', 'Midnight'],
        storage_options: ['256GB SSD', '512GB SSD', '1TB SSD'],
        specs: {
          display: '13.6-inch Liquid Retina',
          processor: 'Apple M3',
          memory: '16GB unified memory',
          battery: '18-hour battery life',
          connectivity: 'Wi‑Fi 6E, Thunderbolt'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'ASUS ROG Zephyrus G14',
        brand: 'ASUS',
        slug: 'asus-rog-zephyrus-g14',
        category: 'Laptops & Computers',
        description: 'Compact gaming laptop with Ryzen power and a bright, high-refresh display for serious gamers.',
        price: 3550,
        original_price: 4200,
        condition: 'New',
        stock: 6,
        rating: 4.8,
        review_count: 87,
        colors: ['Moonlight White', 'Eclipse Gray'],
        storage_options: ['1TB SSD', '2TB SSD'],
        specs: {
          display: '14-inch QHD 165Hz',
          processor: 'AMD Ryzen 9 8945HS',
          graphics: 'NVIDIA RTX 4070',
          memory: '32GB RAM',
          battery: 'Up to 10 hours'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Samsung Galaxy Tab S10 Ultra',
        brand: 'Samsung',
        slug: 'samsung-galaxy-tab-s10-ultra',
        category: 'Tablets & iPads',
        description: 'Large-screen tablet for multitasking, creative work, and immersive entertainment.',
        price: 2860,
        original_price: 3400,
        condition: 'New',
        stock: 8,
        rating: 4.8,
        review_count: 72,
        colors: ['Gray', 'Silver'],
        storage_options: ['256GB', '512GB'],
        specs: {
          display: '14.6-inch AMOLED',
          processor: 'MediaTek Dimensity',
          battery: 'Up to 14 hours',
          connectivity: 'Wi‑Fi 6E, S Pen included',
          accessories: 'Smart Keyboard support'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Apple iPad Air M2',
        brand: 'Apple',
        slug: 'apple-ipad-air-m2',
        category: 'Tablets & iPads',
        description: 'Lightweight performance tablet designed for study, work, and entertainment on the move.',
        price: 2410,
        original_price: 2850,
        condition: 'New',
        stock: 13,
        rating: 4.8,
        review_count: 114,
        colors: ['Blue', 'Purple', 'Starlight'],
        storage_options: ['128GB', '256GB', '512GB'],
        specs: {
          display: '11-inch Liquid Retina',
          processor: 'Apple M2',
          battery: 'Up to 10 hours',
          connectivity: 'USB-C, Wi‑Fi 6',
          accessories: 'Apple Pencil Pro support'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1561154464-82e9d1e3ac5a?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Microsoft Surface Pro 11',
        brand: 'Microsoft',
        slug: 'microsoft-surface-pro-11',
        category: 'Tablets & iPads',
        description: 'Versatile 2-in-1 tablet and laptop for business, note-taking, and flexible work setups.',
        price: 2890,
        original_price: 3380,
        condition: 'New',
        stock: 9,
        rating: 4.7,
        review_count: 63,
        colors: ['Platinum', 'Black'],
        storage_options: ['256GB', '512GB', '1TB'],
        specs: {
          display: '13-inch PixelSense',
          processor: 'Intel Core Ultra 7',
          battery: 'Up to 14 hours',
          connectivity: 'USB-C, Wi‑Fi 7',
          accessories: 'Surface Pen capable'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'PlayStation 5 Pro',
        brand: 'Sony',
        slug: 'playstation-5-pro',
        category: 'Gaming Consoles',
        description: 'High-end console for next-level graphics, speed, and immersive AAA gaming experiences.',
        price: 3100,
        original_price: 3600,
        condition: 'New',
        stock: 5,
        rating: 4.9,
        review_count: 221,
        colors: ['Black'],
        storage_options: ['Standard'],
        specs: {
          storage: '2TB SSD',
          resolution: '8K ready',
          controller: 'DualSense Edge',
          performance: 'Enhanced ray tracing'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Xbox Series X',
        brand: 'Microsoft',
        slug: 'xbox-series-x',
        category: 'Gaming Consoles',
        description: 'A powerful gaming console focused on 4K performance, ultra-fast load times, and live multiplayer.',
        price: 2560,
        original_price: 3000,
        condition: 'New',
        stock: 8,
        rating: 4.8,
        review_count: 133,
        colors: ['Black'],
        storage_options: ['1TB'],
        specs: {
          storage: '1TB SSD',
          resolution: '4K',
          controller: 'Xbox Wireless Controller',
          performance: '120Hz support'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Nintendo Switch OLED',
        brand: 'Nintendo',
        slug: 'nintendo-switch-oled',
        category: 'Gaming Consoles',
        description: 'Portable hybrid console with a vibrant OLED screen and a great library of family-friendly games.',
        price: 1490,
        original_price: 1750,
        condition: 'New',
        stock: 14,
        rating: 4.8,
        review_count: 118,
        colors: ['White', 'Neon'],
        storage_options: ['Standard'],
        specs: {
          display: '7-inch OLED',
          battery: 'Up to 9 hours',
          controller: 'Joy-Con detachable',
          connectivity: 'Docked and handheld modes'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Meta Quest 3',
        brand: 'Meta',
        slug: 'meta-quest-3',
        category: 'Other Electronics',
        description: 'Immersive mixed-reality headset for gaming, fitness, and creative experiences.',
        price: 2350,
        original_price: 2800,
        condition: 'New',
        stock: 7,
        rating: 4.7,
        review_count: 96,
        colors: ['White'],
        storage_options: ['128GB', '512GB'],
        specs: {
          display: 'Dual 2064x2208 pancake lenses',
          processor: 'Qualcomm Snapdragon XR2 Gen 2',
          battery: 'Up to 2.5 hours',
          connectivity: 'Wi‑Fi 6E'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Apple AirPods Pro 2',
        brand: 'Apple',
        slug: 'apple-airpods-pro-2',
        category: 'Headphones & Earbuds',
        description: 'Premium true wireless earbuds with active noise cancellation and top-tier sound quality.',
        price: 890,
        original_price: 1100,
        condition: 'New',
        stock: 17,
        rating: 4.9,
        review_count: 204,
        colors: ['White'],
        storage_options: ['Standard'],
        specs: {
          battery: 'Up to 6 hours on a single charge',
          noise_cancellation: 'Adaptive ANC',
          connectivity: 'Bluetooth 5.3',
          charging: 'USB-C MagSafe case'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Bose QuietComfort Ultra',
        brand: 'Bose',
        slug: 'bose-quietcomfort-ultra',
        category: 'Headphones & Earbuds',
        description: 'Luxury wireless headphones built for travel, calls, and immersive listening experiences.',
        price: 1710,
        original_price: 2200,
        condition: 'New',
        stock: 10,
        rating: 4.8,
        review_count: 89,
        colors: ['Black', 'Sandstone'],
        storage_options: ['Standard'],
        specs: {
          battery: 'Up to 24 hours',
          noise_cancellation: 'World-class ANC',
          connectivity: 'Bluetooth',
          microphone: 'Beamforming call technology'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Garmin Fenix 8',
        brand: 'Garmin',
        slug: 'garmin-fenix-8',
        category: 'Smartwatches',
        description: 'Rugged premium smartwatch for outdoor adventures, health monitoring, and fitness tracking.',
        price: 2140,
        original_price: 2600,
        condition: 'New',
        stock: 9,
        rating: 4.8,
        review_count: 81,
        colors: ['Black', 'Silver'],
        storage_options: ['47mm', '51mm'],
        specs: {
          display: 'AMOLED 1.4-inch',
          battery: 'Up to 29 days',
          health: 'HR, pulse ox, sleep tracking',
          connectivity: 'GPS, Bluetooth, LTE'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1431440869543-efaf3388c585?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Logitech G Pro X Superlight 2',
        brand: 'Logitech',
        slug: 'logitech-g-pro-x-superlight-2',
        category: 'Gaming Accessories',
        description: 'Ultra-light gaming mouse built for speed, comfort, and precision in competitive play.',
        price: 1240,
        original_price: 1500,
        condition: 'New',
        stock: 15,
        rating: 4.8,
        review_count: 75,
        colors: ['Black', 'White'],
        storage_options: ['Standard'],
        specs: {
          sensor: 'HERO 2 sensor',
          connection: '2.4GHz wireless',
          battery: 'Up to 90 hours',
          weight: '63g'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'DJI Mini 4 Pro',
        brand: 'DJI',
        slug: 'dji-mini-4-pro',
        category: 'Other Electronics',
        description: 'Portable drone with obstacle sensing, cinematic recording, and travel-ready controls.',
        price: 2650,
        original_price: 3150,
        condition: 'New',
        stock: 6,
        rating: 4.8,
        review_count: 67,
        colors: ['Gray'],
        storage_options: ['Standard'],
        specs: {
          camera: '4K HDR video',
          flight_time: '34 minutes',
          range: 'Up to 20 km',
          sensing: 'Obstacle avoidance'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'iPhone 16',
        brand: 'Apple',
        slug: 'iphone-16',
        category: 'Smartphones',
        description: 'The standard iPhone 16 brings advanced camera quality, better battery life, and refined everyday performance.',
        price: 2980,
        original_price: 3480,
        condition: 'New',
        stock: 15,
        rating: 4.8,
        review_count: 170,
        colors: ['Ultramarine', 'Pink', 'White'],
        storage_options: ['128GB', '256GB', '512GB'],
        specs: {
          display: '6.1-inch Super Retina',
          processor: 'Apple A18',
          camera: '48MP Fusion camera',
          battery: 'Up to 22 hours video',
          connectivity: '5G, USB-C'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Samsung Galaxy A55 5G',
        brand: 'Samsung',
        slug: 'samsung-galaxy-a55-5g',
        category: 'Smartphones',
        description: 'Balanced premium Android smartphone with vibrant display, strong performance, and excellent camera quality.',
        price: 1380,
        original_price: 1720,
        condition: 'New',
        stock: 22,
        rating: 4.7,
        review_count: 118,
        colors: ['Awesome Iceblue', 'Awesome Navy', 'Awesome Lilac'],
        storage_options: ['128GB', '256GB'],
        specs: {
          display: '6.6-inch Super AMOLED',
          processor: 'Exynos 1480',
          camera: '50MP + 12MP + 5MP',
          battery: '5000mAh',
          connectivity: '5G, Wi‑Fi 6'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Samsung Galaxy Watch Ultra',
        brand: 'Samsung',
        slug: 'samsung-galaxy-watch-ultra',
        category: 'Smartwatches',
        description: 'Premium smartwatch with rugged durability, tracking, and a vivid AMOLED display for active users.',
        price: 1980,
        original_price: 2380,
        condition: 'New',
        stock: 12,
        rating: 4.8,
        review_count: 92,
        colors: ['Titanium Gray', 'Titanium Silver'],
        storage_options: ['46mm'],
        specs: {
          display: 'AMOLED 1.5-inch',
          battery: 'Up to 48 hours',
          tracking: 'GPS, heart rate, sleep, workouts',
          connectivity: 'Bluetooth + LTE'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1551816230-ef5deaed4f26?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Apple MacBook Pro 14',
        brand: 'Apple',
        slug: 'apple-macbook-pro-14',
        category: 'Laptops & Computers',
        description: 'Professional workstation combining power, portability, and a high-quality liquid Retina display.',
        price: 4300,
        original_price: 5100,
        condition: 'New',
        stock: 8,
        rating: 4.9,
        review_count: 144,
        colors: ['Silver', 'Space Black'],
        storage_options: ['512GB SSD', '1TB SSD', '2TB SSD'],
        specs: {
          display: '14.2-inch Liquid Retina XDR',
          processor: 'Apple M3 Pro',
          memory: '18GB unified memory',
          battery: 'Up to 22 hours',
          connectivity: 'Thunderbolt 4, HDMI'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Apple iPad mini',
        brand: 'Apple',
        slug: 'apple-ipad-mini',
        category: 'Tablets & iPads',
        description: 'Compact tablet for reading, sketching, note-taking, and mobile productivity in a pocket-friendly size.',
        price: 1760,
        original_price: 2200,
        condition: 'New',
        stock: 11,
        rating: 4.7,
        review_count: 86,
        colors: ['Purple', 'Blue', 'Starlight'],
        storage_options: ['128GB', '256GB', '512GB'],
        specs: {
          display: '8.3-inch Liquid Retina',
          processor: 'Apple A17 Pro',
          battery: 'Up to 10 hours',
          connectivity: 'USB-C, Wi‑Fi 6E',
          accessories: 'Apple Pencil Pro compatible'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1561154464-82e9d1e3ac5a?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Sony WF-1000XM5',
        brand: 'Sony',
        slug: 'sony-wf-1000xm5',
        category: 'Headphones & Earbuds',
        description: 'Premium noise-canceling earbuds with richer sound and plenty of battery for travel and calls.',
        price: 1040,
        original_price: 1310,
        condition: 'New',
        stock: 18,
        rating: 4.9,
        review_count: 167,
        colors: ['Black', 'Silver'],
        storage_options: ['Standard'],
        specs: {
          noise_cancellation: 'Advanced ANC',
          battery: 'Up to 8 hours listening',
          connectivity: 'Bluetooth 5.3',
          charging: 'USB-C fast charging'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      },
      {
        name: 'Hisense 65U8N',
        brand: 'Hisense',
        slug: 'hisense-65u8n',
        category: 'Other Electronics',
        description: 'Large-format smart TV with stunning brightness, contrast, and excellent picture clarity.',
        price: 2750,
        original_price: 3350,
        condition: 'New',
        stock: 4,
        rating: 4.7,
        review_count: 58,
        colors: ['Black'],
        storage_options: ['65-inch'],
        specs: {
          display: '65-inch Mini LED ULED',
          resolution: '4K UHD',
          gaming: '120Hz gaming mode',
          connectivity: 'Wi‑Fi, HDMI 2.1'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 1
      },
      {
        name: 'Xiaomi 14T Pro',
        brand: 'Xiaomi',
        slug: 'xiaomi-14t-pro',
        category: 'Smartphones',
        description: 'High-performing Android phone with excellent photography, strong battery life, and premium battery support.',
        price: 1840,
        original_price: 2250,
        condition: 'New',
        stock: 16,
        rating: 4.7,
        review_count: 99,
        colors: ['Black', 'Gray'],
        storage_options: ['256GB', '512GB'],
        specs: {
          display: '6.67-inch AMOLED',
          processor: 'MediaTek Dimensity 9300',
          camera: '50MP Leica camera system',
          battery: '5000mAh',
          connectivity: '5G, Wi‑Fi 7'
        },
        image_urls: [
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1526481280695-3c4691a0c0d9?auto=format&fit=crop&w=900&q=80'
        ],
        featured: 0
      }
    ];

    for (const product of sampleProducts) {
      await run(
        `INSERT INTO products (name, slug, brand, category, description, price, original_price, condition, stock, rating, review_count, colors, storage_options, specs, image_urls, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.slug,
          product.brand,
          product.category,
          product.description,
          product.price,
          product.original_price,
          product.condition,
          product.stock,
          product.rating,
          product.review_count,
          JSON.stringify(product.colors),
          JSON.stringify(product.storage_options),
          JSON.stringify(product.specs),
          JSON.stringify(product.image_urls),
          product.featured ? 1 : 0
        ]
      );
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@liberiatech.market';
  const adminUser = await get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!adminUser) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const hash = bcrypt.hashSync(adminPassword, 10);
    await run(
      'INSERT INTO users (name, email, phone, password_hash, role, addresses) VALUES (?, ?, ?, ?, ?, ?)',
      ['Administrator', adminEmail, '+231880000000', hash, 'admin', JSON.stringify([])]
    );
  }

  const defaultDiscounts = [
    ['SAVE10', 'percentage', 10],
    ['LIBERIA5', 'fixed', 50]
  ];

  for (const [code, type, value] of defaultDiscounts) {
    const existing = await get('SELECT id FROM discounts WHERE code = ?', [code]);
    if (!existing) {
      await run('INSERT INTO discounts (code, type, value, active, expires_at) VALUES (?, ?, ?, 1, date("now","+30 days"))', [code, type, value]);
    }
  }
};

export const getDb = () => db;
