/**
 * GET /api/sync-stripe-status
 *
 * Fetches the current user's Stripe account and writes an accurate
 * `stripeConnected` flag into their profile.publicData so it is
 * readable by other users (e.g. customers on ListingPage).
 *
 * We use Stripe's `charges_enabled` as the authoritative source rather
 * than Sharetribe's own stripeConnected flag. Sharetribe marks an account
 * as "connected" as soon as the OAuth flow completes, but Stripe only
 * enables charges once identity verification and onboarding are fully
 * complete. Without this check, providers who have started (but not
 * finished) Stripe onboarding would incorrectly appear as payment-ready,
 * sending customers to the normal checkout which would then fail.
 */
const { getSdk, handleError } = require('../api-util/sdk');

// Lazy init: do NOT call require('stripe')(...) at module load time.
// Initialising at the top level crashes the server on startup when
// STRIPE_SECRET_KEY is not set (e.g. on a fresh Heroku environment).
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY env var is not set');
  return require('stripe')(key);
};

module.exports = (req, res) => {
  const sdk = getSdk(req, res);

  sdk.currentUser
    .show({ include: ['stripeAccount'] })
    .then(async response => {
      const currentUser = response.data.data;
      const included = response.data.included || [];

      // No Stripe account at all → definitely not connected.
      const sharetribeConnected = !!currentUser?.attributes?.stripeConnected;
      const stripeAccountEntity = included.find(i => i.type === 'stripeAccount');
      const stripeAccountId = stripeAccountEntity?.attributes?.stripeAccountId;

      if (!sharetribeConnected || !stripeAccountId) {
        await sdk.currentUser.updateProfile({ publicData: { stripeConnected: false } });
        return res.status(200).json({ synced: false, reason: 'stripe_not_onboarded' });
      }

      // Verify with Stripe that the account can actually receive charges.
      // `charges_enabled` is false until identity verification is complete —
      // the OAuth connection alone is not sufficient.
      let chargesEnabled = false;
      try {
        const stripe = getStripe();
        const account = await stripe.accounts.retrieve(stripeAccountId);
        chargesEnabled = !!account.charges_enabled;
      } catch (stripeErr) {
        console.error('[sync-stripe-status] Stripe account retrieve failed:', stripeErr.message);
        // On Stripe error, fall back to Sharetribe's own flag to avoid incorrectly
        // blocking providers who have a functioning account.
        chargesEnabled = sharetribeConnected;
      }

      await sdk.currentUser.updateProfile({ publicData: { stripeConnected: chargesEnabled } });
      return res.status(200).json({ synced: chargesEnabled, chargesEnabled });
    })
    .catch(e => {
      const status = e?.status || e?.response?.status;
      const apiErrors = e?.data?.errors || e?.apiErrors;
      const isNotFound = status === 404 || status === 403 || status === 401;
      const isApiError = Array.isArray(apiErrors) && apiErrors.length > 0;
      if (isNotFound || isApiError) {
        return res.status(200).json({ synced: false, reason: 'no_stripe_account' });
      }
      handleError(res, e);
    });
};
