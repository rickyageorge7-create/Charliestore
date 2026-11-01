import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run, all } from '../db.js';
import { requireAuth } from '../authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liberia-market-dev-secret';

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  addresses: JSON.parse(user.addresses || '[]')
});

const signToken = (user) =>
  jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const existingUser = await get('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phone || '']);
  if (existingUser) {
    return res.status(409).json({ message: 'An account with this email or phone already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const createResult = await run(
    'INSERT INTO users (name, email, phone, password_hash, role, addresses) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, phone || '', passwordHash, 'customer', JSON.stringify([])]
  );

  const user = await get('SELECT * FROM users WHERE id = ?', [createResult.lastID]);
  res.status(201).json({
    token: signToken(user),
    user: serializeUser(user)
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  res.json({
    token: signToken(user),
    user: serializeUser(user)
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({ user: serializeUser(user) });
});

router.post('/addresses', requireAuth, async (req, res) => {
  const { county, address } = req.body;
  if (!county || !address) {
    return res.status(400).json({ message: 'County and address are required.' });
  }

  const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const addresses = JSON.parse(user.addresses || '[]');
  addresses.push({ county, address, created_at: new Date().toISOString() });

  await run('UPDATE users SET addresses = ? WHERE id = ?', [JSON.stringify(addresses), req.user.id]);
  res.json({ addresses });
});

router.get('/orders', requireAuth, async (req, res) => {
  const orders = await all(
    `SELECT o.*, COUNT(oi.id) AS item_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  res.json({ orders });
});

export default router;
