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

  sdk.stripeAccount
    .fetch()
    .then(() => {
      // Provider has a Stripe account — mirror status into publicData.
      return sdk.currentUser.updateProfile({ publicData: { stripeConnected: true } });
    })
    .then(() => {
      res.status(200).json({ synced: true });
    })
    .catch(e => {
      // If stripeAccount.fetch fails (no account, unauthenticated, or any API error)
      // return 200 + synced:false so the caller can silently skip.
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
