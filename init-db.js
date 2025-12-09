const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./inventory.db');

db.serialize(() => {
  // Create products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    description TEXT
  )`);

  // Clear existing data
  db.run('DELETE FROM products');

  // Insert 20 sample products
  const stmt = db.prepare('INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)');
  
  const products = [
    ['Laptop Pro 15"', 'Electronics', 1299.99, 15, 'High-performance laptop with 16GB RAM'],
    ['Wireless Mouse', 'Electronics', 29.99, 50, 'Ergonomic wireless mouse with USB receiver'],
    ['Office Chair', 'Furniture', 249.99, 20, 'Comfortable ergonomic office chair'],
    ['Standing Desk', 'Furniture', 399.99, 12, 'Adjustable height standing desk'],
    ['Coffee Maker', 'Appliances', 89.99, 25, 'Programmable coffee maker with thermal carafe'],
    ['Notebook Set', 'Stationery', 12.99, 100, 'Pack of 3 premium notebooks'],
    ['Pen Pack', 'Stationery', 8.99, 150, 'Box of 12 ballpoint pens'],
    ['USB-C Hub', 'Electronics', 49.99, 30, '7-in-1 USB-C hub with HDMI and USB ports'],
    ['Desk Lamp', 'Furniture', 34.99, 40, 'LED desk lamp with adjustable brightness'],
    ['Water Bottle', 'Accessories', 19.99, 60, 'Insulated stainless steel water bottle'],
    ['Backpack', 'Accessories', 59.99, 35, 'Laptop backpack with multiple compartments'],
    ['Bluetooth Speaker', 'Electronics', 79.99, 28, 'Portable Bluetooth speaker with 12-hour battery'],
    ['Desk Organizer', 'Stationery', 24.99, 45, 'Multi-compartment desk organizer'],
    ['Monitor Stand', 'Furniture', 44.99, 22, 'Adjustable monitor stand with storage'],
    ['Keyboard', 'Electronics', 69.99, 32, 'Mechanical keyboard with RGB lighting'],
    ['Mouse Pad', 'Accessories', 14.99, 80, 'Large extended mouse pad'],
    ['Webcam HD', 'Electronics', 89.99, 18, '1080p HD webcam with built-in microphone'],
    ['Phone Holder', 'Accessories', 16.99, 55, 'Adjustable phone holder for desk'],
    ['Whiteboard', 'Stationery', 39.99, 15, 'Magnetic dry-erase whiteboard 24x36'],
    ['Cable Organizer', 'Accessories', 11.99, 70, 'Cable management clips and ties set']
  ];

  products.forEach(product => {
    stmt.run(product);
  });

  stmt.finalize();

  console.log('Database initialized with 20 products!');
});

db.close();
