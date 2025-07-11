const express = require('express');
const { db } = require('../database/init');
const { verifyToken } = require('./auth');

const router = express.Router();

// Create order
router.post('/', verifyToken, (req, res) => {
  const { items, totalAmount, shippingAddress, phone, couponCode } = req.body;
  const userId = req.user.userId;

  if (!items || !totalAmount || !shippingAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO orders (user_id, items, total_amount, shipping_address, phone, coupon_code) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, JSON.stringify(items), totalAmount, shippingAddress, phone, couponCode],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create order' });
      }

      // Update product stock
      const itemsArray = JSON.parse(JSON.stringify(items));
      itemsArray.forEach(item => {
        db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
      });

      res.json({ orderId: this.lastID, message: 'Order created successfully' });
    }
  );
});

// Get user orders
router.get('/my-orders', verifyToken, (req, res) => {
  db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
      
      // Parse items JSON for each order
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: JSON.parse(order.items)
      }));
      
      res.json(ordersWithItems);
    }
  );
});

// Get single order
router.get('/:id', verifyToken, (req, res) => {
  const query = req.user.role === 'admin' 
    ? 'SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?'
    : 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
  
  const params = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.userId];

  db.get(query, params, (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.items = JSON.parse(order.items);
    res.json(order);
  });
});

module.exports = router;