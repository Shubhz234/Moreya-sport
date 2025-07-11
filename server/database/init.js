const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'morya_sports.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      discount REAL DEFAULT 0,
      image TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      phone TEXT,
      coupon_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Insert default admin user
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(`
    INSERT OR IGNORE INTO users (email, password, name, role) 
    VALUES ('admin@moryasports.com', ?, 'Admin', 'admin')
  `, [adminPassword]);

  // Insert sample products
  const sampleProducts = [
    {
      id: 'bat001',
      name: 'Cricket Bat',
      price: 1800,
      discount: 10,
      image: 'https://i.postimg.cc/3N6XfjxH/images-6.jpg',
      category: 'Bats',
      description: 'Professional grade cricket bat made from premium willow',
      stock: 25
    },
    {
      id: 'ball001',
      name: 'Cricket Ball',
      price: 500,
      discount: 5,
      image: 'https://i.postimg.cc/xCPYPggc/images-7.jpg',
      category: 'Balls',
      description: 'Leather cricket ball for professional matches',
      stock: 50
    },
    {
      id: 'tee001',
      name: 'Cricket T-Shirt',
      price: 799,
      discount: 10,
      image: 'https://i.postimg.cc/fW2QTVPn/images-8.jpg',
      category: 'Apparel',
      description: 'Comfortable cricket jersey with moisture-wicking fabric',
      stock: 30
    },
    {
      id: 'shoe001',
      name: 'Cricket Shoes',
      price: 2500,
      discount: 10,
      image: 'https://i.postimg.cc/0j34Gwgz/jaffa-n.jpg',
      category: 'Footwear',
      description: 'Professional cricket shoes with excellent grip',
      stock: 20
    },
    {
      id: 'track001',
      name: 'Track Pants',
      price: 999,
      discount: 10,
      image: 'https://i.postimg.cc/7YSv1K6D/images-9.jpg',
      category: 'Apparel',
      description: 'Comfortable track pants for training and casual wear',
      stock: 40
    }
  ];

  sampleProducts.forEach(product => {
    db.run(`
      INSERT OR IGNORE INTO products (id, name, price, discount, image, category, description, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [product.id, product.name, product.price, product.discount, product.image, product.category, product.description, product.stock]);
  });

  console.log('Database initialized successfully');
}

module.exports = { db, initDatabase };