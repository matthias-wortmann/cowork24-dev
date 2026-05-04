const { getSdk } = require('../../api-util/sdk');

module.exports = async (req, res) => {
  const sdk = getSdk(req, res);

  try {
    // Verify the user is authenticated
    await sdk.currentUser.show({});

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Create SetupIntent without a customer — Sharetribe's SDK handles
    // customer creation and payment method attachment in the client step.
    const setupIntent = await stripe.setupIntents.create({
      usage: 'off_session',
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'any',
        },
      },
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (e) {
    const status = e.status || e.statusCode || (e.data && e.data.status);
    if (status === 401 || status === 403) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      console.error('[soft-booking/setup-intent]', e);
      res.status(500).json({ error: e.message });
    }
  }
};
