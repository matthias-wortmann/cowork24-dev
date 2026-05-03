/**
 * GET /api/sync-stripe-status
 *
 * Fetches the current user's Stripe account and, if found, writes
 * `stripeConnected: true` into their profile.publicData so it is
 * readable by other users (e.g. customers on ListingPage).
 *
 * This endpoint is called by user.duck.js whenever fetchCurrentUser
 * detects a stripeAccount but no publicData.stripeConnected flag.
 */
const { getSdk, handleError } = require('../api-util/sdk');

module.exports = (req, res) => {
  const sdk = getSdk(req, res);

  // Fetch currentUser with stripeAccount relationship.
  // currentUser.attributes.stripeConnected is the authoritative flag — it is true
  // only when the provider has completed Stripe Connect onboarding (not just created
  // an account object). We mirror this exact value into profile.publicData so that
  // listing authors' Stripe readiness is readable by customers.
  sdk.currentUser
    .show({ include: ['stripeAccount'] })
    .then(response => {
      const currentUser = response.data.data;
      const isFullyConnected = !!currentUser?.attributes?.stripeConnected;

      if (!isFullyConnected) {
        // Account exists but onboarding is incomplete — mark as not connected.
        return sdk.currentUser
          .updateProfile({ publicData: { stripeConnected: false } })
          .then(() => res.status(200).json({ synced: false, reason: 'stripe_not_onboarded' }));
      }

      return sdk.currentUser
        .updateProfile({ publicData: { stripeConnected: true } })
        .then(() => res.status(200).json({ synced: true }));
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
