/**
 * POST /api/soft-booking/register-payment-method
 *
 * Server-side step 2 of the soft-booking checkout.
 * Fetches the actual stripeCustomer state from Sharetribe, then calls the
 * right SDK action (create / add / delete+add) based on real state.
 * Running server-side lets us log the exact Sharetribe responses.
 */
const { getSdk } = require('../../api-util/sdk');

module.exports = async (req, res) => {
  const sdk = getSdk(req, res);
  const { stripePaymentMethodId } = req.body;

  if (!stripePaymentMethodId) {
    return res.status(400).json({ error: 'stripePaymentMethodId is required' });
  }

  try {
    // Get the authoritative state: does the user have a Stripe customer and/or a
    // default payment method?
    const userRes = await sdk.currentUser.show({
      include: ['stripeCustomer.defaultPaymentMethod'],
    });
    const included = userRes.data.included || [];
    const stripeCustomer = included.find(r => r.type === 'stripeCustomer');
    const hasDefaultPM = included.some(r => r.type === 'stripePaymentMethod');

    console.log(
      '[register-pm] stripeCustomer exists:', !!stripeCustomer,
      '| hasDefaultPM:', hasDefaultPM,
      '| pmId:', stripePaymentMethodId
    );

    if (!stripeCustomer) {
      // First time – create the customer and add the PM in one call
      console.log('[register-pm] → createStripeCustomer');
      await sdk.stripeCustomer.create({ stripePaymentMethodId });
      console.log('[register-pm] createStripeCustomer OK');
      return res.json({ success: true, action: 'created' });
    }

    if (hasDefaultPM) {
      // Customer already has a default PM – delete it first
      console.log('[register-pm] → deletePaymentMethod');
      await sdk.stripeCustomer.deletePaymentMethod({});
      console.log('[register-pm] deletePaymentMethod OK');
    }

    // Add the new PM (customer now has no default PM)
    console.log('[register-pm] → addPaymentMethod');
    await sdk.stripeCustomer.addPaymentMethod({ stripePaymentMethodId });
    console.log('[register-pm] addPaymentMethod OK');

    return res.json({ success: true, action: hasDefaultPM ? 'updated' : 'added' });
  } catch (e) {
    const status = e.status || e.statusCode || (e.data && e.data.status);
    const apiErrors = e?.data?.errors;
    console.error(
      '[register-pm] FAILED status:', status,
      '| apiErrors:', JSON.stringify(apiErrors),
      '| message:', e.message
    );
    // Return 400 for client errors, 500 for server/unknown errors
    const resStatus = status && status < 500 ? status : 500;
    return res.status(resStatus).json({ error: e.message, apiErrors });
  }
};
