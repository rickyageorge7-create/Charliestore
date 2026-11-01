import express from 'express';
import { all, get } from '../db.js';

const router = express.Router();

const parseJson = (value, fallback = []) => {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
};

const serializeProduct = (product) => ({
  ...product,
  colors: parseJson(product.colors, []),
  storage_options: parseJson(product.storage_options, []),
  specs: parseJson(product.specs, {}),
  image_urls: parseJson(product.image_urls, [])
});

router.get('/', async (req, res) => {
  const { category, search, featured } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [];

  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }

  if (search) {
    sql += category ? ' AND' : ' WHERE';
    sql += ' (name LIKE ? OR description LIKE ? OR brand LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (featured !== undefined) {
    sql += (category || search) ? ' AND' : ' WHERE';
    sql += ' featured = ?';
    params.push(featured === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY featured DESC, created_at DESC';

  const rows = await all(sql, params);
  res.json({ products: rows.map(serializeProduct) });
});

router.get('/categories', async (_req, res) => {
  const rows = await all('SELECT * FROM categories ORDER BY name ASC');
  res.json({ categories: rows });
});

router.get('/:id', async (req, res) => {
  const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  res.json({ product: serializeProduct(product) });
});

export default router;
