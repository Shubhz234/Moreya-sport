const express = require('express');
const { db } = require('../database/init');
const { verifyToken } = require('./auth');

const router = express.Router();

// Middleware to check admin role
function verifyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Dashboard stats
router.get('/dashboard', verifyToken, verifyAdmin, (req, res) => {
  const stats = {};
  
  // Get total products
  db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
    stats.totalProducts = result.count;
    
    // Get total orders
    db.get('SELECT COUNT(*) as count FROM orders', (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
      stats.totalOrders = result.count;
      
      // Get total revenue
      db.get('SELECT SUM(total_amount) as revenue FROM orders WHERE status != "cancelled"', (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
        stats.totalRevenue = result.revenue || 0;
        
        // Get total customers
        db.get('SELECT COUNT(*) as count FROM users WHERE role = "customer"', (err, result) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
          stats.totalCustomers = result.count;
          
          res.json(stats);
        });
      });
    });
  });
});

// Get all orders
router.get('/orders', verifyToken, verifyAdmin, (req, res) => {
  db.all(`
    SELECT o.*, u.name as customer_name, u.email as customer_email 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    ORDER BY o.created_at DESC
  `, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    
    res.json(ordersWithItems);
  });
});

// Update order status
router.put('/orders/:id/status', verifyToken, verifyAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update order status' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order status updated successfully' });
  });
});

// Add product
router.post('/products', verifyToken, verifyAdmin, (req, res) => {
  const { id, name, price, discount, image, category, description, stock } = req.body;

  if (!id || !name || !price || !image || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO products (id, name, price, discount, image, category, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, price, discount || 0, image, category, description || '', stock || 0],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Product ID already exists' });
        }
        return res.status(500).json({ error: 'Failed to add product' });
      }
      res.json({ message: 'Product added successfully' });
    }
  );
});

// Update product
router.put('/products/:id', verifyToken, verifyAdmin, (req, res) => {
  const { name, price, discount, image, category, description, stock } = req.body;

  db.run(
    'UPDATE products SET name = ?, price = ?, discount = ?, image = ?, category = ?, description = ?, stock = ? WHERE id = ?',
    [name, price, discount || 0, image, category, description || '', stock || 0, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update product' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete product
router.delete('/products/:id', verifyToken, verifyAdmin, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Get all customers
router.get('/customers', verifyToken, verifyAdmin, (req, res) => {
  db.all('SELECT id, email, name, phone, address, created_at FROM users WHERE role = "customer"', (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
    res.json(customers);
  });
});

module.exports = router;