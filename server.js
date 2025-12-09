const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Database connection
const db = new sqlite3.Database('./inventory.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ products: rows });
  });
});

// Get a single product
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product: row });
  });
});

// Add a new product
app.post('/api/products', (req, res) => {
  const { name, category, price, quantity, description } = req.body;
  
  if (!name || !category || price === undefined || quantity === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const sql = 'INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)';
  const params = [name, category, price, quantity, description || ''];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      id: this.lastID,
      message: 'Product added successfully'
    });
  });
});

// Update a product
app.put('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const { name, category, price, quantity, description } = req.body;
  
  if (!name || !category || price === undefined || quantity === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const sql = 'UPDATE products SET name = ?, category = ?, price = ?, quantity = ?, description = ? WHERE id = ?';
  const params = [name, category, price, quantity, description || '', id];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product updated successfully' });
  });
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
