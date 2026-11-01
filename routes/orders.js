import express from 'express';
import { all, get, run } from '../db.js';
import { requireAuth } from '../authMiddleware.js';
import { createProviderPayment } from '../services/paymentService.js';

const router = express.Router();

const shippingByCounty = {
  'Monrovia': 90,
  'Paynesville': 80,
  'Brewerville': 110,
  'Montserrado County': 120,
  'Bomi County': 180,
  'Margibi County': 200,
  'Nimba County': 260,
  'Grand Bassa County': 220,
  'Grand Cape Mount County': 240,
  'Sinoe County': 290,
  'River Gee County': 310,
  'Gbarpolu County': 260,
  'Lofa County': 250,
  'Maryland County': 280
};

const applyDiscount = async (code, subtotal) => {
  if (!code) return { amount: 0, code: null };

  const discount = await get('SELECT * FROM discounts WHERE code = ? AND active = 1', [String(code).trim().toUpperCase()]);
  if (!discount) {
    return { amount: 0, code: null, invalid: true };
  }

  if (discount.type === 'percentage') {
    return { amount: subtotal * (discount.value / 100), code: discount.code };
  }

  return { amount: Number(discount.value), code: discount.code };
};

const formatOrderRef = () => `LM-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

router.get('/my', requireAuth, async (req, res) => {
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

router.post('/', async (req, res) => {
  const {
    items,
    name,
    phone,
    address,
    county,
    paymentMethod,
    discountCode,
    customerId,
    email
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Add at least one product before checkout.' });
  }

  if (!name || !phone || !address || !county) {
    return res.status(400).json({ message: 'Full name, phone, address, and county are required.' });
  }

  const totalBeforeShipping = items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 1);
    const price = Number(item.unit_price || item.price || 0);
    return sum + price * quantity;
  }, 0);

  const discount = await applyDiscount(discountCode, totalBeforeShipping);
  const shippingFee = shippingByCounty[county] || 180;
  const subtotal = totalBeforeShipping;
  const total = subtotal + shippingFee - discount.amount;

  const orderRef = formatOrderRef();
  const orderStatus = 'Pending Payment';

  const orderInsert = await run(
    `INSERT INTO orders (
      order_ref,
      user_id,
      guest_name,
      guest_phone,
      delivery_address,
      county,
      status,
      payment_method,
      payment_provider,
      payment_status,
      subtotal,
      shipping_fee,
      discount_amount,
      total,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderRef,
      customerId || null,
      name,
      phone,
      address,
      county,
      orderStatus,
      paymentMethod || 'card',
      paymentMethod === 'orange_money' ? 'orange_money' : 'card',
      'pending',
      subtotal,
      shippingFee,
      discount.amount,
      total,
      discount.invalid ? 'Discount code is invalid or expired.' : null
    ]
  );

  for (const item of items) {
    await run(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, color, storage)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderInsert.lastID,
        item.product_id,
        item.product_name,
        Number(item.quantity || 1),
        Number(item.unit_price || item.price || 0),
        item.color || null,
        item.storage || null
      ]
    );
  }

  const paymentResult = await createProviderPayment({
    method: paymentMethod || 'card',
    orderRef,
    amount: total,
    currency: 'USD',
    customer: { name, phone, email }
  });

  const paymentStatus = paymentResult.status === 'pending' ? 'pending' : 'requires_configuration';
  await run(
    'UPDATE orders SET payment_status = ?, payment_reference = ?, payment_provider = ? WHERE id = ?',
    [paymentStatus, paymentResult.reference || orderRef, paymentResult.provider || (paymentMethod === 'orange_money' ? 'orange_money' : 'card'), orderInsert.lastID]
  );

  const order = await get('SELECT * FROM orders WHERE id = ?', [orderInsert.lastID]);
  res.status(201).json({
    order,
    payment: paymentResult,
    message: paymentResult.status === 'requires_configuration'
      ? 'The payment gateway is not configured for this environment yet; your order has been created and pending payment verification.'
      : 'Order submitted successfully. Payment is pending external verification.'
  });
});

router.get('/:id', requireAuth, async (req, res) => {
  const order = await get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  const items = await all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.json({ order, items });
});

export default router;
