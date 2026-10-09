const stripe = require('stripe');
const { env } = require('../config/env');
const paymentGatewayService = require('./paymentGatewayService');

const buildStripeIntentPayload = ({ amountCents, currency = 'USD', orderId }) => {
  return {
    amount: Number(amountCents),
    currency: String(currency).toUpperCase(),
    metadata: {
      orderId: String(orderId),
    },
  };
};

const buildPayPalOrderPayload = ({ amountCents, currency = 'USD', orderId }) => {
  const amountValue = (Number(amountCents || 0) / 100).toFixed(2);
  const normalizedOrderId = String(orderId || `order-${Date.now()}`);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: normalizedOrderId,
      description: `Order ${normalizedOrderId}`,
      amount: {
        currency_code: String(currency).toUpperCase(),
        value: amountValue,
      },
    }],
    application_context: {
      brand_name: 'Claude E-commerce',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${frontendUrl}/payment-success`,
      cancel_url: `${frontendUrl}/checkout`,
    },
  };
};

const isPaymentAmountValid = ({ expectedTotalCents, actualTotalCents }) => {
  const expected = Number(expectedTotalCents || 0);
  const actual = Number(actualTotalCents || 0);

  if (expected !== actual) {
    return {
      isValid: false,
      message: 'Payment amount mismatch',
      expectedTotalCents: expected,
      actualTotalCents: actual,
    };
  }

  return {
    isValid: true,
    message: 'Payment amount matches',
  };
};

const verifyPayPalCapture = ({ expectedTotalCents, captureData }) => {
  const amountValue = captureData?.purchase_units?.[0]?.amount?.value;
  const amountCents = Number((Number(amountValue || 0) * 100).toFixed(0));

  if ((captureData?.status || '').toUpperCase() !== 'COMPLETED') {
    return {
      isValid: false,
      message: 'PayPal payment not completed',
    };
  }

  return isPaymentAmountValid({
    expectedTotalCents,
    actualTotalCents: amountCents,
  });
};

const createStripeClient = (secretKey = process.env.STRIPE_SECRET_KEY || '') => {
  if (!secretKey) {
    return null;
  }

  return new stripe(secretKey);
};

const createStripeIntent = async ({ amountCents, currency = 'USD', orderId }) => {
  const credentials = await paymentGatewayService.getProviderCredentials();
  const stripeClient = createStripeClient(credentials.stripeSecretKey);

  if (!stripeClient) {
    return {
      provider: 'stripe',
      status: 'demo',
      clientSecret: 'demo_secret',
      paymentIntentId: `demo_${Date.now()}`,
      amountCents: Number(amountCents || 0),
      currency: String(currency).toUpperCase(),
      orderId: String(orderId || ''),
      demo: true,
      message: 'Stripe is not configured. Demo intent generated.',
    };
  }

  try {
    const intent = await stripeClient.paymentIntents.create({
      amount: Number(amountCents || 0),
      currency: String(currency).toUpperCase(),
      metadata: {
        orderId: String(orderId || ''),
      },
      automatic_payment_methods: { enabled: true },
    });

    return {
      provider: 'stripe',
      status: intent.status,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountCents: Number(intent.amount || amountCents || 0),
      currency: String(intent.currency || currency).toUpperCase(),
      orderId: String(orderId || ''),
      demo: false,
    };
  } catch (error) {
    return {
      provider: 'stripe',
      status: 'error',
      clientSecret: null,
      paymentIntentId: null,
      amountCents: Number(amountCents || 0),
      currency: String(currency).toUpperCase(),
      orderId: String(orderId || ''),
      demo: true,
      message: error.message || 'Unable to create Stripe payment intent',
    };
  }
};

const getPayPalAccessToken = async (credentials) => {
  const clientId = credentials.paypalClientId;
  const clientSecret = credentials.paypalClientSecret;

  if (!clientId || !clientSecret) {
    return null;
  }

  const baseUrl = credentials.paypalEnvironment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal token request failed: ${errorText}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
};

const createPayPalOrder = async ({ amountCents, currency = 'USD', orderId }) => {
  const credentials = await paymentGatewayService.getProviderCredentials();
  const accessToken = await getPayPalAccessToken(credentials).catch(() => null);

  if (!accessToken) {
    return {
      provider: 'paypal',
      status: 'demo',
      orderId: String(orderId || `order-${Date.now()}`),
      amountCents: Number(amountCents || 0),
      currency: String(currency).toUpperCase(),
      demo: true,
      approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
      message: 'PayPal is not configured. Demo order generated.',
    };
  }

  const baseUrl = credentials.paypalEnvironment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const payload = buildPayPalOrderPayload({ amountCents, currency, orderId });
  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData?.error?.message || 'Unable to create PayPal order');
  }

  return {
    provider: 'paypal',
    status: responseData.status || 'created',
    orderId: responseData.id || String(orderId || `order-${Date.now()}`),
    amountCents: Number(amountCents || 0),
    currency: String(currency).toUpperCase(),
    approvalUrl: responseData.links?.find((link) => link.rel === 'approve')?.href || null,
    demo: false,
  };
};

const verifyStripeEvent = async ({ rawBody, signature, secret }) => {
  const credentials = await paymentGatewayService.getProviderCredentials();
  const stripeClient = createStripeClient(credentials.stripeSecretKey);
  if (!stripeClient) {
    return {
      valid: false,
      reason: 'Stripe secret key is not configured',
    };
  }

  try {
    const event = stripeClient.webhooks.constructEvent(rawBody, signature, secret || credentials.stripeWebhookSecret);
    return {
      valid: true,
      event,
    };
  } catch (error) {
    return {
      valid: false,
      reason: error.message,
    };
  }
};

module.exports = {
  buildStripeIntentPayload,
  buildPayPalOrderPayload,
  isPaymentAmountValid,
  verifyPayPalCapture,
  verifyStripeEvent,
  createStripeClient,
  createStripeIntent,
  createPayPalOrder,
};
