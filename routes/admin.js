import express from 'express';
import { all, get, run } from '../db.js';
import { requireAuth, requireAdmin } from '../authMiddleware.js';

const router = express.Router();

const parseJson = (value, fallback = []) => {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
};

router.get('/stats', requireAuth, requireAdmin, async (_req, res) => {
  const stats = {
    totalSales: await get('SELECT COALESCE(SUM(total), 0) AS totalSales FROM orders WHERE status IN ("Payment Confirmed", "Processing", "Ready for Delivery", "Shipped", "Delivered")'),
    pendingOrders: await get('SELECT COUNT(*) AS total FROM orders WHERE status = "Pending Payment"'),
    completedOrders: await get('SELECT COUNT(*) AS total FROM orders WHERE status = "Delivered"'),
    inventory: await get('SELECT COALESCE(SUM(stock), 0) AS total FROM products')
  };

  res.json({
    totalSales: Number(stats.totalSales?.totalSales || 0),
    pendingOrders: Number(stats.pendingOrders?.total || 0),
    completedOrders: Number(stats.completedOrders?.total || 0),
    inventory: Number(stats.inventory?.total || 0)
  });
});

router.get('/orders', requireAuth, requireAdmin, async (_req, res) => {
  const rows = await all(`
    SELECT o.*, COUNT(oi.id) AS item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `);
  res.json({ orders: rows });
});

router.get('/customers', requireAuth, requireAdmin, async (_req, res) => {
  const users = await all('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
  res.json({ customers: users });
});

router.get('/products', requireAuth, requireAdmin, async (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [];

  if (category && category !== 'all') {
    sql += ' WHERE category = ?';
    params.push(category);
  }

  if (search) {
    sql += params.length ? ' AND' : ' WHERE';
    sql += ' (name LIKE ? OR brand LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = await all(sql, params);
  res.json({
    products: rows.map((product) => ({
      ...product,
      colors: parseJson(product.colors, []),
      storage_options: parseJson(product.storage_options, []),
      specs: parseJson(product.specs, {}),
      image_urls: parseJson(product.image_urls, [])
    }))
  });
});

router.get('/discounts', requireAuth, requireAdmin, async (_req, res) => {
  const discounts = await all('SELECT * FROM discounts ORDER BY created_at DESC');
  res.json({ discounts });
});

router.post('/products', requireAuth, requireAdmin, async (req, res) => {
  const {
    name,
    brand,
    category,
    description,
    price,
    original_price,
    condition,
    stock,
    colors,
    storage_options,
    specs,
    image_urls,
    featured
  } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ message: 'Product name, category, and selling price are required.' });
  }

  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`;

  const insert = await run(
    `INSERT INTO products (name, slug, brand, category, description, price, original_price, condition, stock, colors, storage_options, specs, image_urls, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      slug,
      brand || '',
      category,
      description || '',
      Number(price),
      original_price ? Number(original_price) : null,
      condition || 'New',
      Number(stock || 0),
      JSON.stringify(colors || []),
      JSON.stringify(storage_options || []),
      JSON.stringify(specs || {}),
      JSON.stringify(image_urls || []),
      featured ? 1 : 0
    ]
  );

  const product = await get('SELECT * FROM products WHERE id = ?', [insert.lastID]);
  res.status(201).json({ product: { ...product, colors: parseJson(product.colors, []), storage_options: parseJson(product.storage_options, []), specs: parseJson(product.specs, {}), image_urls: parseJson(product.image_urls, []) } });
});

router.put('/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const fields = {
    name: req.body.name || product.name,
    brand: req.body.brand || product.brand,
    category: req.body.category || product.category,
    description: req.body.description || product.description,
    price: req.body.price !== undefined ? Number(req.body.price) : product.price,
    original_price: req.body.original_price !== undefined ? Number(req.body.original_price) : product.original_price,
    condition: req.body.condition || product.condition,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : product.stock,
    colors: JSON.stringify(req.body.colors || parseJson(product.colors, [])),
    storage_options: JSON.stringify(req.body.storage_options || parseJson(product.storage_options, [])),
    specs: JSON.stringify(req.body.specs || parseJson(product.specs, {})),
    image_urls: JSON.stringify(req.body.image_urls || parseJson(product.image_urls, [])),
    featured: req.body.featured !== undefined ? (req.body.featured ? 1 : 0) : product.featured
  };

  await run(
    `UPDATE products SET
      name = ?,
      brand = ?,
      category = ?,
      description = ?,
      price = ?,
      original_price = ?,
      condition = ?,
      stock = ?,
      colors = ?,
      storage_options = ?,
      specs = ?,
      image_urls = ?,
      featured = ?
     WHERE id = ?`,
    [fields.name, fields.brand, fields.category, fields.description, fields.price, fields.original_price, fields.condition, fields.stock, fields.colors, fields.storage_options, fields.specs, fields.image_urls, fields.featured, req.params.id]
  );

  const updated = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json({ product: { ...updated, colors: parseJson(updated.colors, []), storage_options: parseJson(updated.storage_options, []), specs: parseJson(updated.specs, {}), image_urls: parseJson(updated.image_urls, []) } });
});

router.delete('/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  await run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Product deleted successfully.' });
});

router.post('/discounts', requireAuth, requireAdmin, async (req, res) => {
  const { code, type, value, expires_at } = req.body;
  if (!code || !type || value === undefined) {
    return res.status(400).json({ message: 'Discount code, type, and value are required.' });
  }

  const existing = await get('SELECT * FROM discounts WHERE code = ?', [String(code).trim().toUpperCase()]);
  if (existing) {
    return res.status(409).json({ message: 'That discount code already exists.' });
  }

  const discountInsert = await run(
    'INSERT INTO discounts (code, type, value, active, expires_at) VALUES (?, ?, ?, 1, ?)',
    [String(code).trim().toUpperCase(), type, Number(value), expires_at || null]
  );

  const discount = await get('SELECT * FROM discounts WHERE id = ?', [discountInsert.lastID]);
  res.status(201).json({ discount });
});

router.patch('/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending Payment', 'Payment Confirmed', 'Processing', 'Ready for Delivery', 'Shipped', 'Delivered', 'Cancelled'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Unsupported order status.' });
  }

  await run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  res.json({ order });
});

export default router;
