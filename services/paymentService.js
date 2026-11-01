const PAYMENT_CONFIG = {
  orange_money: {
    apiUrl: process.env.ORANGE_API_URL,
    merchantId: process.env.ORANGE_MERCHANT_ID,
    apiKey: process.env.ORANGE_API_KEY,
    apiSecret: process.env.ORANGE_API_SECRET
  },
  card: {
    provider: process.env.CARD_PROVIDER || 'stripe',
    apiKey: process.env.STRIPE_SECRET_KEY
  }
};

const ensureConfigured = (method) => {
  const config = PAYMENT_CONFIG[method];
  if (!config) {
    throw new Error(`Unsupported payment method: ${method}`);
  }

  if (method === 'orange_money') {
    if (!config.apiUrl || !config.merchantId || !config.apiKey || !config.apiSecret) {
      throw new Error('Orange Money is not configured. Add merchant credentials to enable live payments.');
    }
  }

  if (method === 'card') {
    if (!config.apiKey) {
      throw new Error('Card gateway is not configured. Set STRIPE_SECRET_KEY or equivalent production credentials.');
    }
  }

  return config;
};

const buildPaymentRequest = ({ orderRef, amount, currency, customer, method }) => {
  const sanitizedCustomer = {
    name: customer?.name || 'Customer',
    phone: customer?.phone || '',
    email: customer?.email || ''
  };

  if (method === 'orange_money') {
    return {
      merchant_id: PAYMENT_CONFIG.orange_money.merchantId,
      amount,
      currency,
      reference: orderRef,
      customer: sanitizedCustomer,
      description: `Order ${orderRef}`
    };
  }

  return {
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata: {
      order_ref: orderRef,
      customer_name: sanitizedCustomer.name,
      phone: sanitizedCustomer.phone
    }
  };
};

export const createProviderPayment = async ({ method, orderRef, amount, currency, customer }) => {
  try {
    const config = ensureConfigured(method);

    if (method === 'orange_money') {
      const response = await fetch(`${config.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'X-Merchant-Id': config.merchantId
        },
        body: JSON.stringify(buildPaymentRequest({ orderRef, amount, currency, customer, method }))
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Orange Money API rejected payment request: ${errorBody}`);
      }

      const payload = await response.json();
      return {
        status: 'pending',
        provider: 'orange_money',
        reference: payload.reference || orderRef,
        gateway_response: payload
      };
    }

    if (method === 'card') {
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: new URLSearchParams({
          amount: String(Math.round(amount * 100)),
          currency: String(currency).toLowerCase(),
          metadata: JSON.stringify({ order_ref: orderRef })
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Card gateway rejected payment request: ${errorBody}`);
      }

      const payload = await response.json();
      return {
        status: 'pending',
        provider: 'card',
        reference: payload.id || orderRef,
        gateway_response: payload
      };
    }

    throw new Error(`No payment logic defined for ${method}`);
  } catch (error) {
    return {
      status: 'requires_configuration',
      provider: method,
      reference: orderRef,
      message: error.message
    };
  }
};

export const getSupportedPaymentMethods = () => {
  return {
    orange_money: {
      label: 'Orange Money',
      description: 'Requires an approved Orange Money merchant account and live API credentials.'
    },
    card: {
      label: 'Visa / Mastercard',
      description: 'Requires a merchant-approved card gateway for Liberia and secure server-side processing.'
    }
  };
};
