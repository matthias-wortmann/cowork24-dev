import { getInitialValuesForPriceVariants, handleSubmitValuesForPriceVariants } from './BookingPriceVariants';

describe('BookingPriceVariants helpers', () => {
  const listing = {
    attributes: {
      price: { amount: 1000, currency: 'USD' },
      publicData: {
        unitType: 'fixed',
        priceVariants: [
          {
            name: 'Monthly',
            priceInSubunits: 1000,
            bookingLengthInMinutes: 43200, // 30 days
            bookingStartDate: '2026-03-01',
          },
        ],
      },
    },
  };

  it('includes bookingStartDate in initial values for fixed unitType', () => {
    const initial = getInitialValuesForPriceVariants({ listing }, false);
    expect(initial).toBeDefined();
    expect(initial.priceVariants).toBeDefined();
    expect(initial.priceVariants[0].bookingStartDate).toBe('2026-03-01');
    expect(initial.priceVariants[0].bookingLengthInMinutes).toBe(43200);
  });

  it('normalizes bookingLengthInMinutes stored as object on submit', () => {
    const values = {
      priceVariants: [
        {
          name: 'Monthly',
          price: { amount: 1000, currency: 'USD' },
          bookingLengthInMinutes: { __minutes: 43200, unit: 'months', value: 1 },
          bookingStartDate: '2026-03-01',
        },
      ],
    };

    const publicData = {};
    const unitType = 'fixed';
    const listingTypeConfig = {};

    const out = handleSubmitValuesForPriceVariants(values, publicData, unitType, listingTypeConfig);
    expect(out.publicData).toBeDefined();
    expect(out.publicData.priceVariants).toHaveLength(1);
    const pv = out.publicData.priceVariants[0];
    expect(pv.bookingLengthInMinutes).toBe(43200);
    expect(pv.bookingStartDate).toBe('2026-03-01');
    expect(pv.priceInSubunits).toBe(1000);
  });
});
