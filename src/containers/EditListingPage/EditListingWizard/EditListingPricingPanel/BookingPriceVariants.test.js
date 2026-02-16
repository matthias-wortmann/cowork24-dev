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

  it('includes bookingStartDate as { date: Date } in initial values for fixed unitType', () => {
    const initial = getInitialValuesForPriceVariants({ listing }, false);
    expect(initial).toBeDefined();
    expect(initial.priceVariants).toBeDefined();
    // FieldSingleDatePicker expects { date: Date }, so the ISO string must be parsed
    const startDate = initial.priceVariants[0].bookingStartDate;
    expect(startDate).toBeDefined();
    expect(startDate.date).toBeInstanceOf(Date);
    // Check local date parts instead of toISOString() which converts to UTC and
    // would shift the date backwards in timezones with positive UTC offsets.
    expect(startDate.date.getFullYear()).toBe(2026);
    expect(startDate.date.getMonth()).toBe(2); // March = 2 (0-indexed)
    expect(startDate.date.getDate()).toBe(1);
    expect(initial.priceVariants[0].bookingLengthInMinutes).toBe(43200);
  });

  it('normalizes bookingLengthInMinutes stored as object on submit', () => {
    // On submit, bookingStartDate comes from FieldSingleDatePicker as { date: Date }
    const values = {
      priceVariants: [
        {
          name: 'Monthly',
          price: { amount: 1000, currency: 'USD' },
          bookingLengthInMinutes: { __minutes: 43200, unit: 'months', value: 1 },
          bookingStartDate: { date: new Date('2026-03-01') },
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
