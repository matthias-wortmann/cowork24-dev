/**
 * Stripe Payment Request (Apple Pay / Google Pay) helpers for checkout.
 *
 * @see https://stripe.com/docs/stripe-js/elements/payment-request-button
 */

/**
 * Pick a Stripe Payment Request `country` (ISO 3166-1 alpha-2) from marketplace currency.
 * When several countries share a currency, the first match in `supportedCountries` wins.
 *
 * @param {string} currency - ISO currency code (e.g. EUR)
 * @param {Array<{ code: string, currency: string }>} supportedCountries - from config.stripe.supportedCountries
 * @returns {string}
 */
export const getPaymentRequestCountryForCurrency = (currency, supportedCountries) => {
  if (!currency || !Array.isArray(supportedCountries)) {
    return 'US';
  }
  const upper = currency.toUpperCase();
  const match = supportedCountries.find(c => c.currency?.toUpperCase() === upper);
  return match?.code || 'US';
};
