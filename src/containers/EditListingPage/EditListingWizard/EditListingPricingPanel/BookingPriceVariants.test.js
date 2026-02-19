import {
  getInitialValuesForPriceVariants,
  handleSubmitValuesForPriceVariants,
  minutesToUnitAndValue,
} from './BookingPriceVariants';

describe('minutesToUnitAndValue()', () => {
  it('returns { hours: 1 } for null/undefined/0/negative', () => {
    expect(minutesToUnitAndValue(null)).toEqual({ unit: 'hours', value: 1 });
    expect(minutesToUnitAndValue(undefined)).toEqual({ unit: 'hours', value: 1 });
    expect(minutesToUnitAndValue(0)).toEqual({ unit: 'hours', value: 1 });
    expect(minutesToUnitAndValue(-30)).toEqual({ unit: 'hours', value: 1 });
  });

  it('converts exact minutes', () => {
    expect(minutesToUnitAndValue(15)).toEqual({ unit: 'minutes', value: 15 });
    expect(minutesToUnitAndValue(30)).toEqual({ unit: 'minutes', value: 30 });
    expect(minutesToUnitAndValue(45)).toEqual({ unit: 'minutes', value: 45 });
  });

  it('converts exact hours', () => {
    expect(minutesToUnitAndValue(60)).toEqual({ unit: 'hours', value: 1 });
    expect(minutesToUnitAndValue(120)).toEqual({ unit: 'hours', value: 2 });
    expect(minutesToUnitAndValue(180)).toEqual({ unit: 'hours', value: 3 });
    expect(minutesToUnitAndValue(720)).toEqual({ unit: 'hours', value: 12 });
  });

  it('falls back to minutes for non-round hour values', () => {
    expect(minutesToUnitAndValue(90)).toEqual({ unit: 'minutes', value: 90 });
    expect(minutesToUnitAndValue(150)).toEqual({ unit: 'minutes', value: 150 });
  });

  it('converts exact days', () => {
    expect(minutesToUnitAndValue(1440)).toEqual({ unit: 'days', value: 1 });
    expect(minutesToUnitAndValue(2880)).toEqual({ unit: 'days', value: 2 });
    expect(minutesToUnitAndValue(10080)).toEqual({ unit: 'days', value: 7 });
  });

  it('converts exact months (30 days)', () => {
    expect(minutesToUnitAndValue(43200)).toEqual({ unit: 'months', value: 1 });
    expect(minutesToUnitAndValue(86400)).toEqual({ unit: 'months', value: 2 });
    expect(minutesToUnitAndValue(172800)).toEqual({ unit: 'months', value: 4 });
  });

  it('prefers months over days when evenly divisible', () => {
    // 30 days = 1 month
    expect(minutesToUnitAndValue(43200)).toEqual({ unit: 'months', value: 1 });
  });

  it('prefers days over hours when evenly divisible', () => {
    // 24 hours = 1 day
    expect(minutesToUnitAndValue(1440)).toEqual({ unit: 'days', value: 1 });
  });

  it('falls back to hours for partial-day values divisible by 60', () => {
    // 3 hours = 180 min, not a full day
    expect(minutesToUnitAndValue(180)).toEqual({ unit: 'hours', value: 3 });
  });
});

describe('getInitialValuesForPriceVariants()', () => {
  const baseListing = {
    attributes: {
      price: { amount: 1000, currency: 'USD' },
      publicData: {
        unitType: 'fixed',
        priceVariants: [],
      },
    },
  };

  const makeListingWithVariant = (bookingLengthInMinutes, extras = {}) => ({
    attributes: {
      price: { amount: 1000, currency: 'USD' },
      publicData: {
        unitType: 'fixed',
        priceVariants: [
          {
            name: 'Test',
            priceInSubunits: 1000,
            bookingLengthInMinutes,
            ...extras,
          },
        ],
      },
    },
  });

  it('reads bookingLengthInMinutes as-is for fixed unitType', () => {
    const listing = makeListingWithVariant(120);
    const result = getInitialValuesForPriceVariants({ listing }, false);
    expect(result.priceVariants[0].bookingLengthInMinutes).toBe(120);
  });

  it('defaults bookingLengthInMinutes to 60 when null', () => {
    const listing = makeListingWithVariant(null);
    const result = getInitialValuesForPriceVariants({ listing }, false);
    expect(result.priceVariants[0].bookingLengthInMinutes).toBe(60);
  });

  it('defaults bookingLengthInMinutes to 60 when undefined', () => {
    const listing = {
      attributes: {
        price: { amount: 1000, currency: 'USD' },
        publicData: {
          unitType: 'fixed',
          priceVariants: [{ name: 'Test', priceInSubunits: 1000 }],
        },
      },
    };
    const result = getInitialValuesForPriceVariants({ listing }, false);
    expect(result.priceVariants[0].bookingLengthInMinutes).toBe(60);
  });

  it('preserves large values (1440 = 1 day, 43200 = 1 month)', () => {
    const dayListing = makeListingWithVariant(1440);
    expect(getInitialValuesForPriceVariants({ listing: dayListing }, false).priceVariants[0].bookingLengthInMinutes).toBe(1440);

    const monthListing = makeListingWithVariant(43200);
    expect(getInitialValuesForPriceVariants({ listing: monthListing }, false).priceVariants[0].bookingLengthInMinutes).toBe(43200);
  });

  it('creates default variant with bookingLengthInMinutes=60 when no priceVariants exist for fixed type', () => {
    const emptyListing = {
      attributes: {
        price: { amount: 1000, currency: 'USD' },
        publicData: { unitType: 'fixed', priceVariants: [] },
      },
    };
    const result = getInitialValuesForPriceVariants({ listing: emptyListing }, false);
    expect(result.priceVariants).toHaveLength(1);
    expect(result.priceVariants[0].bookingLengthInMinutes).toBe(60);
  });

  it('does not include bookingLengthInMinutes for non-fixed unitType', () => {
    const hourListing = {
      attributes: {
        price: { amount: 1000, currency: 'USD' },
        publicData: {
          unitType: 'hour',
          priceVariants: [{ name: 'Standard', priceInSubunits: 5000 }],
        },
      },
    };
    const result = getInitialValuesForPriceVariants({ listing: hourListing }, true);
    expect(result.priceVariants[0]).not.toHaveProperty('bookingLengthInMinutes');
  });

  it('includes bookingStartDate as { date: Date } in initial values for fixed unitType', () => {
    const listing = makeListingWithVariant(43200, { bookingStartDate: '2026-03-01' });
    const initial = getInitialValuesForPriceVariants({ listing }, false);
    const startDate = initial.priceVariants[0].bookingStartDate;
    expect(startDate).toBeDefined();
    expect(startDate.date).toBeInstanceOf(Date);
    expect(startDate.date.getFullYear()).toBe(2026);
    expect(startDate.date.getMonth()).toBe(2);
    expect(startDate.date.getDate()).toBe(1);
  });
});

describe('handleSubmitValuesForPriceVariants()', () => {
  const unitType = 'fixed';
  const listingTypeConfig = {};

  it('normalizes numeric bookingLengthInMinutes on submit', () => {
    const values = {
      priceVariants: [
        { price: { amount: 1000, currency: 'USD' }, bookingLengthInMinutes: 120 },
      ],
    };
    const result = handleSubmitValuesForPriceVariants(values, {}, unitType, listingTypeConfig);
    expect(result.publicData.priceVariants[0].bookingLengthInMinutes).toBe(120);
  });

  it('normalizes object bookingLengthInMinutes (UI format) on submit', () => {
    const values = {
      priceVariants: [
        {
          price: { amount: 1000, currency: 'USD' },
          bookingLengthInMinutes: { __minutes: 43200, unit: 'months', value: 1 },
        },
      ],
    };
    const result = handleSubmitValuesForPriceVariants(values, {}, unitType, listingTypeConfig);
    expect(result.publicData.priceVariants[0].bookingLengthInMinutes).toBe(43200);
  });

  it('normalizes object with days unit', () => {
    const values = {
      priceVariants: [
        {
          price: { amount: 2000, currency: 'USD' },
          bookingLengthInMinutes: { __minutes: 10080, unit: 'days', value: 7 },
        },
      ],
    };
    const result = handleSubmitValuesForPriceVariants(values, {}, unitType, listingTypeConfig);
    expect(result.publicData.priceVariants[0].bookingLengthInMinutes).toBe(10080);
  });

  it('normalizes object with hours unit', () => {
    const values = {
      priceVariants: [
        {
          price: { amount: 500, currency: 'USD' },
          bookingLengthInMinutes: { __minutes: 120, unit: 'hours', value: 2 },
        },
      ],
    };
    const result = handleSubmitValuesForPriceVariants(values, {}, unitType, listingTypeConfig);
    expect(result.publicData.priceVariants[0].bookingLengthInMinutes).toBe(120);
  });

  it('normalizes object with minutes unit', () => {
    const values = {
      priceVariants: [
        {
          price: { amount: 500, currency: 'USD' },
          bookingLengthInMinutes: { __minutes: 45, unit: 'minutes', value: 45 },
        },
      ],
    };
    const result = handleSubmitValuesForPriceVariants(values, {}, unitType, listingTypeConfig);
    expect(result.publicData.priceVariants[0].bookingLengthInMinutes).toBe(45);
  });

  it('does not include bookingLengthInMinutes for non-fixed unitType', () => {
    const values = {
      priceVariants: [
        { name: 'Standard', price: { amount: 1000, currency: 'USD' } },
      ],
    };
    const result = handleSubmitValuesForPriceVariants(values, {}, 'hour', listingTypeConfig);
    const pv = result?.publicData?.priceVariants?.[0];
    expect(pv).not.toHaveProperty('bookingLengthInMinutes');
  });

  it('normalizes bookingStartDate from FieldSingleDatePicker format', () => {
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
    const result = handleSubmitValuesForPriceVariants(values, {}, unitType, listingTypeConfig);
    expect(result.publicData.priceVariants[0].bookingStartDate).toBe('2026-03-01');
  });
});

describe('Round-trip: save → load preserves bookingLengthInMinutes', () => {
  const unitType = 'fixed';
  const listingTypeConfig = {};

  const roundTrip = (bookingLengthInput) => {
    const values = {
      priceVariants: [
        {
          price: { amount: 5000, currency: 'CHF' },
          bookingLengthInMinutes: bookingLengthInput,
        },
      ],
    };

    const submitResult = handleSubmitValuesForPriceVariants(values, {}, unitType, listingTypeConfig);
    const savedVariant = submitResult.publicData.priceVariants[0];

    const listing = {
      attributes: {
        price: { amount: 5000, currency: 'CHF' },
        publicData: {
          unitType: 'fixed',
          priceVariants: [savedVariant],
        },
      },
    };

    const loaded = getInitialValuesForPriceVariants({ listing }, false);
    return loaded.priceVariants[0].bookingLengthInMinutes;
  };

  it('preserves 120 (2 hours) through save/load cycle', () => {
    expect(roundTrip(120)).toBe(120);
  });

  it('preserves 1440 (1 day) through save/load cycle', () => {
    expect(roundTrip(1440)).toBe(1440);
  });

  it('preserves 10080 (7 days) through save/load cycle', () => {
    expect(roundTrip(10080)).toBe(10080);
  });

  it('preserves 43200 (1 month) through save/load cycle', () => {
    expect(roundTrip(43200)).toBe(43200);
  });

  it('preserves object format { __minutes: 120 } through save/load', () => {
    expect(roundTrip({ __minutes: 120, unit: 'hours', value: 2 })).toBe(120);
  });

  it('preserves object format { __minutes: 10080 } through save/load', () => {
    expect(roundTrip({ __minutes: 10080, unit: 'days', value: 7 })).toBe(10080);
  });

  it('preserves object format { __minutes: 43200 } through save/load', () => {
    expect(roundTrip({ __minutes: 43200, unit: 'months', value: 1 })).toBe(43200);
  });

  it('preserves 45 (45 minutes) through save/load cycle', () => {
    expect(roundTrip(45)).toBe(45);
  });
});
