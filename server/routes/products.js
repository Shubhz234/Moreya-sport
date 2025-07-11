const express = require('express');
const { db } = require('../database/init');

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  const { category, search, sort } = req.query;
  
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  if (sort === 'price_asc') {
    query += ' ORDER BY (price * (1 - discount/100)) ASC';
  } else if (sort === 'price_desc') {
    query += ' ORDER BY (price * (1 - discount/100)) DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(products);
  });
});

// Get single product
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
});

// Get categories
router.get('/categories/list', (req, res) => {
  db.all('SELECT DISTINCT category FROM products', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    const categories = rows.map(row => row.category);
    res.json(categories);
  });
});

module.exports = router;