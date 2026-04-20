import { getPaymentRequestCountryForCurrency } from './stripePaymentRequest';

describe('getPaymentRequestCountryForCurrency', () => {
  const supported = [{ code: 'DE', currency: 'EUR' }, { code: 'US', currency: 'USD' }];

  it('returns first config country for currency', () => {
    expect(getPaymentRequestCountryForCurrency('EUR', supported)).toBe('DE');
    expect(getPaymentRequestCountryForCurrency('usd', supported)).toBe('US');
  });

  it('falls back to US when unknown currency', () => {
    expect(getPaymentRequestCountryForCurrency('XYZ', supported)).toBe('US');
  });
});
