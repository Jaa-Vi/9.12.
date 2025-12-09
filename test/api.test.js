const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create a test database
const TEST_DB_PATH = path.join(__dirname, 'test-inventory.db');

describe('Inventory Management API', () => {
  let app;
  let db;

  // Setup: Create app and test database before all tests
  before((done) => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Create test database
    db = new sqlite3.Database(TEST_DB_PATH, (err) => {
      if (err) {
        console.error('Error opening test database:', err);
        done(err);
        return;
      }

      // Create table
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        description TEXT
      )`, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          done(err);
          return;
        }

        // Create Express app with the same routes
        app = express();
        app.use(bodyParser.json());

        // API Routes
        app.get('/api/products', (req, res) => {
          db.all('SELECT * FROM products ORDER BY id', [], (err, rows) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ products: rows });
          });
        });

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

        done();
      });
    });
  });

  // Cleanup: Delete products before each test
  beforeEach((done) => {
    db.run('DELETE FROM products', (err) => {
      if (err) {
        console.error('Error clearing products:', err);
        done(err);
        return;
      }
      done();
    });
  });

  // Teardown: Close database and remove test file after all tests
  after((done) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      
      // Remove test database file
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
      }
      
      done();
    });
  });

  describe('GET /api/products', () => {
    it('should return an empty array when no products exist', (done) => {
      request(app)
        .get('/api/products')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('products');
          expect(res.body.products).to.be.an('array');
          expect(res.body.products).to.have.lengthOf(0);
          done();
        });
    });

    it('should return all products when products exist', (done) => {
      // Insert test products
      const stmt = db.prepare('INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)');
      stmt.run('Test Product 1', 'Electronics', 99.99, 10, 'Description 1');
      stmt.run('Test Product 2', 'Furniture', 199.99, 5, 'Description 2', (err) => {
        stmt.finalize();
        if (err) return done(err);

        request(app)
          .get('/api/products')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.products).to.be.an('array');
            expect(res.body.products).to.have.lengthOf(2);
            expect(res.body.products[0]).to.have.property('name', 'Test Product 1');
            expect(res.body.products[1]).to.have.property('name', 'Test Product 2');
            done();
          });
      });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product by id', (done) => {
      db.run('INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)',
        ['Test Product', 'Electronics', 99.99, 10, 'Description'], function(err) {
          if (err) return done(err);
          const productId = this.lastID;

          request(app)
            .get(`/api/products/${productId}`)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.body).to.have.property('product');
              expect(res.body.product).to.have.property('id', productId);
              expect(res.body.product).to.have.property('name', 'Test Product');
              expect(res.body.product).to.have.property('category', 'Electronics');
              expect(res.body.product).to.have.property('price', 99.99);
              expect(res.body.product).to.have.property('quantity', 10);
              done();
            });
        });
    });

    it('should return 404 when product does not exist', (done) => {
      request(app)
        .get('/api/products/999')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Product not found');
          done();
        });
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product with all fields', (done) => {
      const newProduct = {
        name: 'New Product',
        category: 'Test Category',
        price: 149.99,
        quantity: 20,
        description: 'Test description'
      };

      request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('message', 'Product added successfully');
          
          // Verify product was created
          db.get('SELECT * FROM products WHERE id = ?', [res.body.id], (err, row) => {
            if (err) return done(err);
            expect(row).to.exist;
            expect(row.name).to.equal('New Product');
            expect(row.category).to.equal('Test Category');
            expect(row.price).to.equal(149.99);
            expect(row.quantity).to.equal(20);
            expect(row.description).to.equal('Test description');
            done();
          });
        });
    });

    it('should create a new product without description', (done) => {
      const newProduct = {
        name: 'Product Without Desc',
        category: 'Test',
        price: 50.00,
        quantity: 15
      };

      request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('id');
          done();
        });
    });

    it('should return 400 when name is missing', (done) => {
      const invalidProduct = {
        category: 'Test',
        price: 50.00,
        quantity: 15
      };

      request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Missing required fields');
          done();
        });
    });

    it('should return 400 when category is missing', (done) => {
      const invalidProduct = {
        name: 'Test Product',
        price: 50.00,
        quantity: 15
      };

      request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Missing required fields');
          done();
        });
    });

    it('should return 400 when price is missing', (done) => {
      const invalidProduct = {
        name: 'Test Product',
        category: 'Test',
        quantity: 15
      };

      request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Missing required fields');
          done();
        });
    });

    it('should return 400 when quantity is missing', (done) => {
      const invalidProduct = {
        name: 'Test Product',
        category: 'Test',
        price: 50.00
      };

      request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Missing required fields');
          done();
        });
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update an existing product', (done) => {
      db.run('INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)',
        ['Original Product', 'Electronics', 99.99, 10, 'Original description'], function(err) {
          if (err) return done(err);
          const productId = this.lastID;

          const updatedProduct = {
            name: 'Updated Product',
            category: 'Furniture',
            price: 199.99,
            quantity: 20,
            description: 'Updated description'
          };

          request(app)
            .put(`/api/products/${productId}`)
            .send(updatedProduct)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.body).to.have.property('message', 'Product updated successfully');
              
              // Verify product was updated
              db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
                if (err) return done(err);
                expect(row.name).to.equal('Updated Product');
                expect(row.category).to.equal('Furniture');
                expect(row.price).to.equal(199.99);
                expect(row.quantity).to.equal(20);
                expect(row.description).to.equal('Updated description');
                done();
              });
            });
        });
    });

    it('should return 404 when updating non-existent product', (done) => {
      const updatedProduct = {
        name: 'Updated Product',
        category: 'Test',
        price: 99.99,
        quantity: 10
      };

      request(app)
        .put('/api/products/999')
        .send(updatedProduct)
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Product not found');
          done();
        });
    });

    it('should return 400 when required fields are missing', (done) => {
      db.run('INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)',
        ['Test Product', 'Electronics', 99.99, 10, 'Description'], function(err) {
          if (err) return done(err);
          const productId = this.lastID;

          const invalidUpdate = {
            name: 'Updated Name',
            category: 'Test'
            // Missing price and quantity
          };

          request(app)
            .put(`/api/products/${productId}`)
            .send(invalidUpdate)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.body).to.have.property('error', 'Missing required fields');
              done();
            });
        });
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete an existing product', (done) => {
      db.run('INSERT INTO products (name, category, price, quantity, description) VALUES (?, ?, ?, ?, ?)',
        ['Product to Delete', 'Electronics', 99.99, 10, 'Description'], function(err) {
          if (err) return done(err);
          const productId = this.lastID;

          request(app)
            .delete(`/api/products/${productId}`)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.body).to.have.property('message', 'Product deleted successfully');
              
              // Verify product was deleted
              db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
                if (err) return done(err);
                expect(row).to.be.undefined;
                done();
              });
            });
        });
    });

    it('should return 404 when deleting non-existent product', (done) => {
      request(app)
        .delete('/api/products/999')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error', 'Product not found');
          done();
        });
    });
  });
});
