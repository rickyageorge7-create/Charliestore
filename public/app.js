const state = {
  products: [],
  categories: [],
  adminProducts: [],
  cart: [],
  user: null,
  selectedCategory: 'all',
  adminProductSearch: '',
  adminProductCategory: 'all',
  searchTerm: ''
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const STORAGE_KEYS = {
  cart: 'liberiaTechCart',
  user: 'liberiaTechUser'
};

const fallbackCategories = [
  { name: 'Smartphones', slug: 'smartphones', description: 'Premium mobile devices and flagship phones' },
  { name: 'Laptops & Computers', slug: 'laptops-computers', description: 'Portable workstations and productivity gear' },
  { name: 'Tablets & iPads', slug: 'tablets-ipads', description: 'Productive tablets for work and play' },
  { name: 'Gaming Consoles', slug: 'gaming-consoles', description: 'Console gaming and accessories' },
  { name: 'Headphones & Earbuds', slug: 'headphones-earbuds', description: 'Audio gear for everyday life' },
  { name: 'Smartwatches', slug: 'smartwatches', description: 'Connected wearables and health tracking' },
  { name: 'Phone Accessories', slug: 'phone-accessories', description: 'Chargers, cases, and mobile essentials' },
  { name: 'Computer Accessories', slug: 'computer-accessories', description: 'Peripherals, docks, and productivity gear' },
  { name: 'Other Electronics', slug: 'other-electronics', description: 'Home tech and lifestyle electronics' }
];

const fallbackProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    category: 'Smartphones',
    description: 'Flagship smartphone with premium titanium finish and Pro camera system.',
    price: 3500,
    original_price: 4200,
    condition: 'New',
    stock: 12,
    rating: 4.9,
    colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium'],
    image_urls: ['https://images.unsplash.com/photo-1678652816700-5e90e64e9ad3?auto=format&fit=crop&w=900&q=80'],
    specs: { display: '6.1-inch OLED', processor: 'A17 Pro', camera: '48MP Pro camera', battery: 'Up to 23 hours' },
    storage_options: ['128GB', '256GB', '512GB', '1TB']
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'Smartphones',
    description: 'Feature-rich Android flagship with advanced camera and AI-powered productivity.',
    price: 3390,
    original_price: 3950,
    condition: 'New',
    stock: 9,
    rating: 4.8,
    colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet'],
    image_urls: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80'],
    specs: { display: '6.8-inch AMOLED', processor: 'Snapdragon 8 Gen 3', camera: '200MP main camera', battery: '5000mAh' },
    storage_options: ['256GB', '512GB', '1TB']
  },
  {
    id: 3,
    name: 'Google Pixel 9 Pro',
    brand: 'Google',
    category: 'Smartphones',
    description: 'Pure Android experience with exceptional camera quality and clean design.',
    price: 3100,
    original_price: 3600,
    condition: 'New',
    stock: 11,
    rating: 4.7,
    colors: ['Peony', 'Hazel', 'Porcelain'],
    image_urls: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80'],
    specs: { display: '6.3-inch LTPO OLED', processor: 'Google Tensor G4', camera: '50MP triple camera', battery: 'Up to 24 hours' },
    storage_options: ['128GB', '256GB', '512GB']
  },
  {
    id: 4,
    name: 'Apple MacBook Air 13',
    brand: 'Apple',
    category: 'Laptops & Computers',
    description: 'Ultra-light laptop for students, creators, and professional work.',
    price: 3250,
    original_price: 3900,
    condition: 'New',
    stock: 7,
    rating: 4.9,
    colors: ['Silver', 'Midnight', 'Starlight'],
    image_urls: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'],
    specs: { display: '13.6-inch Retina', processor: 'Apple M3', memory: '16GB Unified Memory', storage: '512GB SSD' },
    storage_options: ['256GB', '512GB', '1TB']
  },
  {
    id: 5,
    name: 'Samsung Galaxy Tab S10',
    brand: 'Samsung',
    category: 'Tablets & iPads',
    description: 'High-performance Android tablet designed for work, study, and entertainment.',
    price: 2450,
    original_price: 2920,
    condition: 'New',
    stock: 10,
    rating: 4.8,
    colors: ['Graphite', 'Silver'],
    image_urls: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80'],
    specs: { display: '11-inch AMOLED', processor: 'MediaTek Dimensity', battery: 'Up to 10 hours', connectivity: 'Wi-Fi 6E' },
    storage_options: ['128GB', '256GB', '512GB']
  },
  {
    id: 6,
    name: 'Sony PlayStation 5',
    brand: 'Sony',
    category: 'Gaming Consoles',
    description: 'Next-gen console with immersive graphics, 4K gaming, and lightning-fast loading.',
    price: 2350,
    original_price: 2800,
    condition: 'New',
    stock: 8,
    rating: 4.9,
    colors: ['White', 'Black'],
    image_urls: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80'],
    specs: { storage: '825GB SSD', resolution: '4K Ultra HD', controller: 'DualSense wireless', performance: 'Ray tracing' },
    storage_options: ['Standard Edition', 'Digital Edition']
  },
  {
    id: 7,
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Headphones & Earbuds',
    description: 'Premium wireless ANC headphones built for travel, calls, and immersive audio.',
    price: 1420,
    original_price: 1800,
    condition: 'New',
    stock: 15,
    rating: 4.8,
    colors: ['Black', 'Silver'],
    image_urls: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80'],
    specs: { noise_cancelation: 'Adaptive ANC', battery: '30 hours', connectivity: 'Bluetooth 5.3' },
    storage_options: ['Standard']
  },
  {
    id: 8,
    name: 'Apple Watch Series 9',
    brand: 'Apple',
    category: 'Smartwatches',
    description: 'A reliable smartwatch for health tracking, notifications, and workouts.',
    price: 1780,
    original_price: 2200,
    condition: 'New',
    stock: 16,
    rating: 4.7,
    colors: ['Midnight', 'Starlight', 'Silver'],
    image_urls: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80'],
    specs: { display: 'Always-On Retina', battery: 'Up to 18 hours', health: 'ECG + sleep tracking', connectivity: 'GPS + cellular' },
    storage_options: ['41mm', '45mm']
  },
  {
    id: 9,
    name: 'Anker 3-in-1 Charging Dock',
    brand: 'Anker',
    category: 'Phone Accessories',
    description: 'A compact wireless charging dock for phone, headphones, and watch.',
    price: 520,
    original_price: 690,
    condition: 'New',
    stock: 30,
    rating: 4.6,
    colors: ['White', 'Black'],
    image_urls: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80'],
    specs: { charging: 'Up to 15W', compatibility: 'iPhone + AirPods + Watch', power: '65W USB-C' },
    storage_options: ['Standard']
  },
  {
    id: 10,
    name: 'Logitech MX Master 3S',
    brand: 'Logitech',
    category: 'Computer Accessories',
    description: 'Precision wireless mouse built for efficiency and all-day comfort.',
    price: 760,
    original_price: 980,
    condition: 'New',
    stock: 18,
    rating: 4.7,
    colors: ['Graphite', 'Black'],
    image_urls: ['https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80'],
    specs: { battery: '70 days', connectivity: 'Bluetooth + USB receiver', ergonomics: 'Comfort grip' },
    storage_options: ['Standard']
  }
];

const refs = {
  productGrid: document.querySelector('#productGrid'),
  categoryList: document.querySelector('#categoryList'),
  cartButton: document.querySelector('#cartButton'),
  cartCount: document.querySelector('#cartCount'),
  cartDrawer: document.querySelector('#cartDrawer'),
  cartItems: document.querySelector('#cartItems'),
  checkoutSummary: document.querySelector('#checkoutSummary'),
  subtotalValue: document.querySelector('#subtotalValue'),
  shippingValue: document.querySelector('#shippingValue'),
  discountValue: document.querySelector('#discountValue'),
  totalValue: document.querySelector('#totalValue'),
  cartTotal: document.querySelector('#cartTotal'),
  authButton: document.querySelector('#authButton'),
  authModal: document.querySelector('#authModal'),
  closeAuth: document.querySelector('#closeAuth'),
  checkoutForm: document.querySelector('#checkoutForm'),
  toast: document.querySelector('#toast'),
  searchInput: document.querySelector('#searchInput'),
  adminPanel: document.querySelector('#adminPanel'),
  adminStats: document.querySelector('#adminStats'),
  adminOrders: document.querySelector('#adminOrders'),
  productForm: document.querySelector('#productForm'),
  adminProductTable: document.querySelector('#adminProductTable'),
  adminProductSearch: document.querySelector('#adminProductSearch'),
  adminProductCategory: document.querySelector('#adminProductCategory'),
  adminProductForm: document.querySelector('#adminProductForm'),
  adminProductModal: document.querySelector('#adminProductModal'),
  closeAdminProductModal: document.querySelector('#closeAdminProductModal'),
  adminProductDeleteConfirm: document.querySelector('#adminProductDeleteConfirm')
};

const shippingByCounty = {
  Monrovia: 90,
  Paynesville: 80,
  Brewerville: 110,
  'Montserrado County': 120,
  'Bomi County': 180,
  'Margibi County': 200,
  'Nimba County': 260,
  'Grand Bassa County': 220,
  'Grand Cape Mount County': 240,
  'Lofa County': 250,
  'Maryland County': 280
};

const showToast = (message) => {
  refs.toast.textContent = message;
  refs.toast.classList.remove('hidden');
  setTimeout(() => refs.toast.classList.add('hidden'), 2500);
};

const parseJson = (value, fallback = []) => {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
};

const loadStoredUser = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  state.user = raw ? JSON.parse(raw) : null;
};

const saveStoredUser = () => {
  if (state.user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.user);
  }
};

const saveCart = () => {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
  renderCartSummary();
  renderCartItems();
};

const loadCart = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.cart);
  state.cart = raw ? JSON.parse(raw) : [];
};

const updateAuthButton = () => {
  if (state.user) {
    refs.authButton.textContent = `Hi, ${state.user.name.split(' ')[0]}`;
    refs.authButton.classList.add('secondary-button');
  } else {
    refs.authButton.textContent = 'Login';
    refs.authButton.classList.remove('secondary-button');
  }
};

const renderCategoryFilters = () => {
  const categories = [{ name: 'All Products', slug: 'all' }, ...state.categories];
  refs.categoryList.innerHTML = categories
    .map((category) => {
      const active = category.slug === state.selectedCategory ? 'active' : '';
      return `
        <button class="category-item ${active}" data-category="${category.slug}">
          <div>📦</div>
          <strong>${category.name}</strong>
          <small>${category.description || 'Smart tech selection'}</small>
        </button>
      `;
    })
    .join('');

  refs.categoryList.querySelectorAll('.category-item').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = button.dataset.category;
      renderCategoryFilters();
      renderProducts();
    });
  });
};

const renderProducts = () => {
  let visibleProducts = state.products.filter((product) => {
    const matchesCategory = state.selectedCategory === 'all' || product.category === state.selectedCategory;
    const matchesSearch = !state.searchTerm || [product.name, product.description, product.brand].join(' ').toLowerCase().includes(state.searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!visibleProducts.length) {
    refs.productGrid.innerHTML = '<div class="empty-state">No products match your criteria yet.</div>';
    return;
  }

  refs.productGrid.innerHTML = visibleProducts
    .map((product) => {
      const firstImage = product.image_urls?.[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80';
      const specs = (product.specs && typeof product.specs === 'object' ? Object.entries(product.specs).slice(0, 3) : [])
        .map(([key, value]) => `<span>${key}: ${value}</span>`)
        .join('');

      const colors = Array.isArray(product.colors) ? product.colors.slice(0, 2).join(', ') : 'Available';

      return `
        <article class="product-card">
          <img class="product-image" src="${firstImage}" alt="${product.name}" />
          <div class="product-body">
            <div class="product-header">
              <h3>${product.name}</h3>
              <span class="product-tag">${product.condition || 'New'}</span>
            </div>
            <div class="product-meta">
              <span>${product.brand}</span>
              <span>⭐ ${product.rating || 4.8}</span>
            </div>
            <div class="product-price">
              <strong>${currency.format(product.price)}</strong>
              <span>${product.original_price ? currency.format(product.original_price) : ''}</span>
            </div>
            <div class="product-specs">${specs || '<span>Premium tech</span><span>Fast shipping</span>'}</div>
            <p>${product.description || 'High-quality electronics for Liberian customers.'}</p>
            <div class="product-meta"><span>Colors: ${colors}</span><span>Stock: ${product.stock || 0}</span></div>
            <div class="product-actions">
              <button class="secondary-button add-to-cart" data-product-id="${product.id}">Add to cart</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  refs.productGrid.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.productId)));
  });
};

const addToCart = (productId) => {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  showToast(`${product.name} added to cart`);
};

const updateQuantity = (productId, change) => {
  const item = state.cart.find((entry) => entry.id === productId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((entry) => entry.id !== productId);
  }
  saveCart();
};

const renderCartItems = () => {
  if (!state.cart.length) {
    refs.cartItems.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
    refs.cartTotal.textContent = currency.format(0);
    return;
  }

  refs.cartItems.innerHTML = state.cart
    .map((item) => {
      const image = item.image_urls?.[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80';
      return `
        <div class="cart-item">
          <img src="${image}" alt="${item.name}" />
          <div>
            <strong>${item.name}</strong>
            <small>${currency.format(item.price)} each</small>
            <div class="cart-item-actions">
              <button class="quantity-button" data-action="decrease" data-id="${item.id}">-</button>
              <span>${item.quantity}</span>
              <button class="quantity-button" data-action="increase" data-id="${item.id}">+</button>
            </div>
          </div>
          <strong>${currency.format(item.price * item.quantity)}</strong>
        </div>
      `;
    })
    .join('');

  refs.cartItems.querySelectorAll('.quantity-button').forEach((button) => {
    button.addEventListener('click', () => {
      const change = button.dataset.action === 'increase' ? 1 : -1;
      updateQuantity(Number(button.dataset.id), change);
    });
  });

  refs.cartTotal.textContent = currency.format(state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
};

const renderCartSummary = () => {
  const countySelect = document.querySelector('[name="county"]');
  const countyValue = countySelect ? countySelect.value : '';
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = parseFloat(countyValue ? shippingByCounty[countyValue] || 0 : 0) || 0;
  const discount = 0;

  refs.subtotalValue.textContent = currency.format(subtotal);
  refs.shippingValue.textContent = currency.format(shipping);
  refs.discountValue.textContent = currency.format(discount);
  refs.totalValue.textContent = currency.format(subtotal + shipping - discount);

  refs.checkoutSummary.innerHTML = state.cart.length
    ? state.cart
        .map((item) => `
          <div class="summary-item">
            <img src="${item.image_urls?.[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'}" alt="${item.name}" />
            <div>
              <strong>${item.name}</strong>
              <small>${item.quantity} x ${currency.format(item.price)}</small>
            </div>
          </div>
        `)
        .join('')
    : '<p class="empty-state">Add products to your cart.</p>';

  refs.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
};

const toggleCart = () => refs.cartDrawer.classList.toggle('hidden');

const fetchJSON = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
};

const loadCategories = async () => {
  try {
    const data = await fetchJSON('/api/products/categories');
    state.categories = data.categories || fallbackCategories;
  } catch (error) {
    state.categories = fallbackCategories;
  }
  renderCategoryFilters();
};

const loadProducts = async () => {
  try {
    const data = await fetchJSON('/api/products');
    state.products = (data.products || []).map((product) => ({
      ...product,
      colors: parseJson(product.colors, []),
      image_urls: parseJson(product.image_urls, []),
      specs: parseJson(product.specs, {})
    }));
  } catch (error) {
    state.products = fallbackProducts.map((product) => ({
      ...product,
      colors: Array.isArray(product.colors) ? product.colors : [],
      image_urls: Array.isArray(product.image_urls) ? product.image_urls : [],
      specs: product.specs || {}
    }));
  }
  renderProducts();
};

const updateUserSession = (user, token) => {
  state.user = user;
  if (token) localStorage.setItem('liberiaTechToken', token);
  saveStoredUser();
  updateAuthButton();
  refs.authModal.classList.add('hidden');
};

const loadUserSession = () => {
  loadStoredUser();
  const token = localStorage.getItem('liberiaTechToken');
  if (state.user && token) {
    updateAuthButton();
  }
};

const authAndAdminState = async () => {
  loadUserSession();
  if (state.user && state.user.role === 'admin') {
    refs.adminPanel.classList.remove('hidden');
    await loadAdminDashboard();
  }
};

const handleLogin = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    email: form.get('email'),
    password: form.get('password')
  };

  try {
    const data = await fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    updateUserSession(data.user, data.token);

    if (data.user.role === 'admin') {
      refs.adminPanel.classList.remove('hidden');
      await loadAdminDashboard();
    }

    showToast('Login successful.');
  } catch (error) {
    showToast(error.message);
  }
};

const handleRegister = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    name: form.get('name'),
    email: form.get('email'),
    phone: form.get('phone'),
    password: form.get('password')
  };

  try {
    const data = await fetchJSON('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    updateUserSession(data.user, data.token);
    showToast('Account created successfully.');
  } catch (error) {
    showToast(error.message);
  }
};

const handleCheckout = async (event) => {
  event.preventDefault();
  if (!state.cart.length) {
    showToast('Add products before checkout.');
    return;
  }

  const formData = new FormData(event.currentTarget);
  const payload = {
    items: state.cart.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      color: item.colors?.[0] || null,
      storage: item.storage_options?.[0] || null,
      price: item.price
    })),
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    county: formData.get('county'),
    paymentMethod: formData.get('paymentMethod'),
    discountCode: formData.get('discountCode') || '',
    email: state.user?.email || '',
    customerId: state.user?.id || null
  };

  try {
    const response = await fetchJSON('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(response.message || 'Order placed successfully.');
    state.cart = [];
    saveCart();
    refs.checkoutForm.reset();
  } catch (error) {
    showToast(error.message);
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('liberiaTechToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const loadAdminDashboard = async () => {
  const token = localStorage.getItem('liberiaTechToken');
  if (!token || !state.user || state.user.role !== 'admin') {
    refs.adminPanel.classList.add('hidden');
    return;
  }

  try {
    const stats = await fetchJSON('/api/admin/stats', {
      headers: getAuthHeaders()
    });

    refs.adminStats.innerHTML = [
      { label: 'Total sales', value: currency.format(stats.totalSales || 0) },
      { label: 'Pending orders', value: stats.pendingOrders || 0 },
      { label: 'Completed orders', value: stats.completedOrders || 0 },
      { label: 'Inventory in stock', value: stats.inventory || 0 }
    ]
      .map((card) => `
        <div class="admin-stat">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
        </div>
      `)
      .join('');

    const orderData = await fetchJSON('/api/admin/orders', {
      headers: getAuthHeaders()
    });

    refs.adminOrders.innerHTML = (orderData.orders || [])
      .slice(0, 6)
      .map((order) => `
        <div class="mini-order">
          <div>
            <strong>${order.order_ref}</strong>
            <small>${order.status}</small>
          </div>
          <strong>${currency.format(order.total || 0)}</strong>
        </div>
      `)
      .join('') || '<p class="empty-state">No orders yet.</p>';

    await loadAdminProducts();
  } catch (error) {
    showToast(error.message);
    refs.adminPanel.classList.add('hidden');
  }
};

const renderAdminProducts = () => {
  const searchTerm = state.adminProductSearch.trim().toLowerCase();
  const visibleProducts = state.adminProducts.filter((product) => {
    const matchesCategory = state.adminProductCategory === 'all' || product.category === state.adminProductCategory;
    const searchable = [product.name, product.brand, product.category, product.description].join(' ').toLowerCase();
    const matchesSearch = !searchTerm || searchable.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (!visibleProducts.length) {
    refs.adminProductTable.innerHTML = '<p class="empty-state">No products match this filter.</p>';
    return;
  }

  refs.adminProductTable.innerHTML = visibleProducts
    .map((product) => {
      const status = Number(product.stock) > 0 ? 'In stock' : 'Out of stock';
      return `
        <div class="admin-product-row">
          <div>
            <strong>${product.name}</strong>
            <small>${product.category}</small>
          </div>
          <div>
            <strong>${currency.format(product.price)}</strong>
            <small>Sale price</small>
          </div>
          <div>
            <strong>${product.stock ?? 0}</strong>
            <small>${status}</small>
          </div>
          <div>
            <strong>${product.condition || 'New'}</strong>
            <small>Condition</small>
          </div>
          <div class="admin-product-actions">
            <button class="secondary-button edit-product" data-product-id="${product.id}">Edit</button>
            <button class="danger-button delete-product" data-product-id="${product.id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join('');

  refs.adminProductTable.querySelectorAll('.edit-product').forEach((button) => {
    button.addEventListener('click', () => openAdminProductModal(Number(button.dataset.productId)));
  });

  refs.adminProductTable.querySelectorAll('.delete-product').forEach((button) => {
    button.addEventListener('click', () => openDeleteProductModal(Number(button.dataset.productId)));
  });
};

const loadAdminProducts = async () => {
  const token = localStorage.getItem('liberiaTechToken');
  if (!token || !state.user || state.user.role !== 'admin') {
    refs.adminProductTable.innerHTML = '<p class="empty-state">Admin login required.</p>';
    return;
  }

  try {
    const data = await fetchJSON('/api/admin/products', {
      headers: getAuthHeaders()
    });
    state.adminProducts = data.products || [];
    renderAdminProducts();
  } catch (error) {
    showToast(error.message);
    refs.adminProductTable.innerHTML = '<p class="empty-state">Unable to load products.</p>';
  }
};

const parseAdminProductImageInput = (value) => String(value || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean);

const openAdminProductModal = (productId) => {
  const product = state.adminProducts.find((item) => item.id === productId) || state.products.find((item) => item.id === productId);
  if (!product) {
    showToast('Product not found.');
    return;
  }

  const form = refs.adminProductForm;
  form.elements.id.value = product.id;
  form.elements.name.value = product.name || '';
  form.elements.brand.value = product.brand || '';
  form.elements.category.value = product.category || 'Smartphones';
  form.elements.description.value = product.description || '';
  form.elements.price.value = product.price ?? 0;
  form.elements.original_price.value = product.original_price ?? 0;
  form.elements.stock.value = product.stock ?? 0;
  form.elements.condition.value = product.condition || 'New';
  form.elements.image_urls.value = Array.isArray(product.image_urls) ? product.image_urls.join('\n') : '';
  refs.adminProductModal.classList.remove('hidden');
};

const closeAdminProductModal = () => {
  refs.adminProductModal.classList.add('hidden');
  refs.adminProductForm.reset();
};

const handleAdminProductSubmit = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const productId = Number(formData.get('id'));
  if (!productId) {
    showToast('Please choose a valid product to edit.');
    return;
  }

  const payload = {
    name: String(formData.get('name') || '').trim(),
    brand: String(formData.get('brand') || '').trim(),
    category: String(formData.get('category') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    price: Number(formData.get('price')),
    original_price: Number(formData.get('original_price')) || null,
    condition: String(formData.get('condition') || 'New'),
    stock: Number(formData.get('stock')) || 0,
    colors: ['Black', 'White'],
    storage_options: ['Standard'],
    specs: { category: String(formData.get('category') || '').trim() },
    image_urls: parseAdminProductImageInput(formData.get('image_urls')),
    featured: false
  };

  if (!payload.name || !payload.category || !Number.isFinite(payload.price)) {
    showToast('Product name, category, and a valid price are required.');
    return;
  }

  try {
    await fetchJSON(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    closeAdminProductModal();
    await loadProducts();
    await loadAdminDashboard();
    showToast('Product updated successfully.');
  } catch (error) {
    showToast(error.message);
  }
};

const openDeleteProductModal = (productId) => {
  refs.adminProductDeleteConfirm.dataset.productId = String(productId);
  refs.adminProductDeleteConfirm.classList.remove('hidden');
};

const closeDeleteProductModal = () => {
  refs.adminProductDeleteConfirm.dataset.productId = '';
  refs.adminProductDeleteConfirm.classList.add('hidden');
};

const handleDeleteProduct = async () => {
  const productId = Number(refs.adminProductDeleteConfirm.dataset.productId);
  if (!productId) {
    showToast('No product selected to delete.');
    return;
  }

  try {
    await fetchJSON(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    closeDeleteProductModal();
    await loadProducts();
    await loadAdminDashboard();
    showToast('Product deleted successfully.');
  } catch (error) {
    showToast(error.message);
  }
};

const handleProductCreate = async (event) => {
  event.preventDefault();
  const token = localStorage.getItem('liberiaTechToken');
  if (!token) {
    showToast('Login as admin before adding products.');
    return;
  }

  const formData = new FormData(event.currentTarget);
  const payload = {
    name: formData.get('name'),
    brand: formData.get('brand'),
    category: formData.get('category'),
    description: formData.get('description'),
    price: Number(formData.get('price')),
    original_price: Number(formData.get('original_price')) || null,
    condition: formData.get('condition'),
    stock: Number(formData.get('stock')) || 0,
    colors: ['Black', 'White'],
    storage_options: ['Standard'],
    specs: { category: formData.get('category') },
    image_urls: String(formData.get('image_urls') || '').split('\n').filter(Boolean),
    featured: false
  };

  try {
    await fetchJSON('/api/admin/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    event.currentTarget.reset();
    await loadProducts();
    await loadAdminDashboard();
    showToast('Product created successfully.');
  } catch (error) {
    showToast(error.message);
  }
};

const bindEvents = () => {
  refs.cartButton.addEventListener('click', toggleCart);
  document.querySelector('#closeCart').addEventListener('click', toggleCart);
  document.querySelector('#checkoutScrollButton').addEventListener('click', () => {
    document.querySelector('#checkout').scrollIntoView({ behavior: 'smooth' });
    refs.cartDrawer.classList.add('hidden');
  });

  refs.authButton.addEventListener('click', () => refs.authModal.classList.remove('hidden'));
  refs.closeAuth.addEventListener('click', () => refs.authModal.classList.add('hidden'));

  refs.searchInput.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    renderProducts();
  });

  if (refs.adminProductSearch) {
    refs.adminProductSearch.addEventListener('input', (event) => {
      state.adminProductSearch = event.target.value;
      renderAdminProducts();
    });
  }

  if (refs.adminProductCategory) {
    refs.adminProductCategory.addEventListener('change', (event) => {
      state.adminProductCategory = event.target.value;
      renderAdminProducts();
    });
  }

  const countySelect = document.querySelector('[name="county"]');
  if (countySelect) {
    countySelect.addEventListener('change', renderCartSummary);
  }

  document.querySelector('#loginForm').addEventListener('submit', handleLogin);
  document.querySelector('#registerForm').addEventListener('submit', handleRegister);
  refs.checkoutForm.addEventListener('submit', handleCheckout);
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab));
      const activeForm = tab.dataset.tab;
      document.querySelector('#loginForm').classList.toggle('active', activeForm === 'login');
      document.querySelector('#registerForm').classList.toggle('active', activeForm === 'register');
    });
  });

  refs.productForm.addEventListener('submit', handleProductCreate);
  refs.adminProductForm.addEventListener('submit', handleAdminProductSubmit);
  refs.closeAdminProductModal.addEventListener('click', closeAdminProductModal);
  refs.adminProductModal.addEventListener('click', (event) => {
    if (event.target === refs.adminProductModal) closeAdminProductModal();
  });
  refs.adminProductDeleteConfirm.addEventListener('click', (event) => {
    if (event.target === refs.adminProductDeleteConfirm) closeDeleteProductModal();
  });
  document.querySelector('#cancelDeleteProduct').addEventListener('click', closeDeleteProductModal);
  document.querySelector('#confirmDeleteProduct').addEventListener('click', handleDeleteProduct);
};

const init = async () => {
  loadCart();
  renderCartItems();
  renderCartSummary();
  bindEvents();
  try {
    await loadCategories();
    await loadProducts();
    authAndAdminState();
    updateAuthButton();
  } catch (error) {
    showToast(error.message);
  }
};

init();
