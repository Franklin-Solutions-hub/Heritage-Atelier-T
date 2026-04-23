require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/tailors', require('./server/routes/tailors'));
app.use('/api/admin', require('./server/routes/admin'));
app.use('/api/upload', require('./server/routes/upload'));

// Notifications API
const db = require('./server/database/db');
const { requireAuth } = require('./server/middleware/auth');

app.get('/api/notifications', requireAuth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;
  res.json({ notifications, unread });
});

app.patch('/api/notifications/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

// Cart API
app.get('/api/cart', requireAuth, (req, res) => {
  const items = db.prepare(`
    SELECT c.*, p.name, p.price, p.images, p.seller_id, u.name as seller_name
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    JOIN users u ON p.seller_id = u.id
    WHERE c.user_id = ?
  `).all(req.user.id);
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.json({ 
    items: items.map(i => ({ ...i, images: JSON.parse(i.images || '[]'), customizations: JSON.parse(i.customizations || '{}') })),
    total 
  });
});

app.post('/api/cart', requireAuth, (req, res) => {
  const { product_id, quantity, customizations } = req.body;
  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity || 1, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity, customizations) VALUES (?, ?, ?, ?)').run(
      req.user.id, product_id, quantity || 1, JSON.stringify(customizations || {})
    );
  }
  res.json({ message: 'Added to cart' });
});

app.delete('/api/cart/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Removed from cart' });
});

app.delete('/api/cart', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Cart cleared' });
});

// Catch-all for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA fallback — serve index.html for all non-API, non-static routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/admin/css') || req.path.startsWith('/admin/js')) {
    return next();
  }
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✨ Heritage Atelier is running at http://localhost:${PORT}`);
  console.log(`   Custom Made. Culturally Yours.\n`);
});
