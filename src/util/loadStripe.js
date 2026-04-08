import { loadScriptOnce } from './loadScript';

const STRIPE_JS_URL = 'https://js.stripe.com/v3/';

export const loadStripeJs = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Stripe cannot be loaded on server.');
  }

  if (window.Stripe) {
    return window.Stripe;
  }

  await loadScriptOnce(STRIPE_JS_URL, { async: true, crossorigin: 'anonymous' });

  if (!window.Stripe) {
    throw new Error('Stripe loaded, but window.Stripe is missing.');
  }

  return window.Stripe;
};
