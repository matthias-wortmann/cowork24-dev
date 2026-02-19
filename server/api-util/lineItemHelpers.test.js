const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

const {
  calculateTotalPriceFromQuantity,
  calculateTotalPriceFromPercentage,
  calculateTotalPriceFromSeats,
  calculateQuantityFromDates,
  calculateQuantityFromHours,
  calculateNonBusinessHours,
  calculateLineTotal,
  calculateShippingFee,
  calculateTotalFromLineItems,
  calculateTotalForProvider,
  calculateTotalForCustomer,
  constructValidLineItems,
  hasCommissionPercentage,
  hasMinimumCommission,
  getProviderCommissionMaybe,
  getCustomerCommissionMaybe,
} = require('./lineItemHelpers');

describe('calculateTotalPriceFromQuantity()', () => {
  it('should calculate price based on quantity', () => {
    const unitPrice = new Money(1000, 'EUR');
    const quantity = 3;
    expect(calculateTotalPriceFromQuantity(unitPrice, quantity)).toEqual(new Money(3000, 'EUR'));
  });
});

describe('calculateTotalPriceFromPercentage()', () => {
  it('should calculate price based on percentage', () => {
    const unitPrice = new Money(1000, 'EUR');
    const percentage = 10;
    expect(calculateTotalPriceFromPercentage(unitPrice, percentage)).toEqual(new Money(100, 'EUR'));
  });

  it('should return negative sum if percentage is negative', () => {
    const unitPrice = new Money(1000, 'EUR');
    const percentage = -10;
    expect(calculateTotalPriceFromPercentage(unitPrice, percentage)).toEqual(
      new Money(-100, 'EUR')
    );
  });
});

describe('calculateTotalPriceFromSeats()', () => {
  it('should calculate price based on seats and units', () => {
    const unitPrice = new Money(1000, 'EUR');
    const unitCount = 1;
    const seats = 3;
    expect(calculateTotalPriceFromSeats(unitPrice, unitCount, seats)).toEqual(
      new Money(3000, 'EUR')
    );
  });

  it('should throw error if value of seats is negative', () => {
    const unitPrice = new Money(1000, 'EUR');
    const unitCount = 1;
    const seats = -3;
    expect(() => calculateTotalPriceFromSeats(unitPrice, unitCount, seats)).toThrowError(
      "Value of seats can't be negative"
    );
  });
});

describe('calculateQuantityFromDates()', () => {
  it('should calculate quantity based on given dates with nightly bookings', () => {
    const start = new Date(2017, 0, 1);
    const end = new Date(2017, 0, 3);
    const type = 'line-item/night';
    expect(calculateQuantityFromDates(start, end, type)).toEqual(2);
  });

  it('should calculate quantity based on given dates with daily bookings', () => {
    const start = new Date(2017, 0, 1);
    const end = new Date(2017, 0, 3);
    const type = 'line-item/day';
    expect(calculateQuantityFromDates(start, end, type)).toEqual(2);
  });

  it('should throw error if unit type is not night or day', () => {
    const start = new Date(2017, 0, 1);
    const end = new Date(2017, 0, 3);
    const type = 'line-item/units';
    expect(() => calculateQuantityFromDates(start, end, type)).toThrowError(
      `Can't calculate quantity from dates to unit type: ${type}`
    );
  });
});

describe('calculateQuantityFromHours()', () => {
  it('should calculate quantity based on given dates with hourly bookings', () => {
    const start = new Date(2017, 0, 1, 12, 0, 0);
    const end = new Date(2017, 0, 1, 16, 0, 0);
    expect(calculateQuantityFromHours(start, end)).toEqual(4);
  });

  it('should calculate quantity based on given dates with hourly bookings', () => {
    const start = new Date(2017, 0, 1, 12, 30, 0);
    const end = new Date(2017, 0, 1, 16, 0, 0);
    expect(calculateQuantityFromHours(start, end)).toEqual(3.5);
  });
});

describe('calculateLineTotal()', () => {
  it('should calculate lineTotal for lineItem with quantity', () => {
    const lineItem = {
      code: 'line-item/cleaning-fee',
      unitPrice: new Money(1000, 'EUR'),
      quantity: 3,
      includeFor: ['customer', 'provider'],
    };
    expect(calculateLineTotal(lineItem)).toEqual(new Money(3000, 'EUR'));
  });

  it('should calculate lineTotal for lineItem with percentage', () => {
    const lineItem = {
      code: 'line-item/customer-commission',
      unitPrice: new Money(3000, 'EUR'),
      percentage: 10,
      includeFor: ['customer', 'provider'],
    };
    expect(calculateLineTotal(lineItem)).toEqual(new Money(300, 'EUR'));
  });

  it('should calculate lineTotal for lineItem with percentage=0', () => {
    const lineItem = {
      code: 'line-item/customer-commission',
      unitPrice: new Money(3000, 'EUR'),
      percentage: 0,
      includeFor: ['customer', 'provider'],
    };
    expect(calculateLineTotal(lineItem)).toEqual(new Money(0, 'EUR'));
  });

  it('should calculate lineTotal for lineItem with seats and units', () => {
    const lineItem = {
      code: 'line-item/customer-fee',
      unitPrice: new Money(1000, 'EUR'),
      seats: 4,
      units: 2,
      includeFor: ['customer', 'provider'],
    };
    expect(calculateLineTotal(lineItem)).toEqual(new Money(8000, 'EUR'));
  });

  it('should throw error if no pricing params are found', () => {
    const lineItem = {
      code: 'line-item/customer-fee',
      unitPrice: new Money(1000, 'EUR'),
      includeFor: ['customer', 'provider'],
    };
    const code = lineItem.code;
    expect(() => calculateLineTotal(lineItem)).toThrowError(
      `Can't calculate the lineTotal of lineItem: ${code}. Make sure the lineItem has quantity, percentage or both seats and units`
    );
  });
});

describe('calculateShippingFee()', () => {
  it('should calculate shipping with quantity 1', () => {
    const shippingPriceInSubunitsOneItem = 1000;
    const shippingPriceInSubunitsAdditionalItems = 100;
    const currency = 'EUR';
    const quantity = 1;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(new Money(1000, 'EUR'));
  });

  it('should calculate shipping with quantity 2', () => {
    const shippingPriceInSubunitsOneItem = 1000;
    const shippingPriceInSubunitsAdditionalItems = 100;
    const currency = 'EUR';
    const quantity = 2;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(new Money(1100, 'EUR'));
  });

  it('should calculate shipping with quantity 3', () => {
    const shippingPriceInSubunitsOneItem = 1000;
    const shippingPriceInSubunitsAdditionalItems = 100;
    const currency = 'EUR';
    const quantity = 3;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(new Money(1200, 'EUR'));
  });

  it('should calculate shipping with quantity 2 and additional fee 0', () => {
    const shippingPriceInSubunitsOneItem = 1000;
    const shippingPriceInSubunitsAdditionalItems = 0;
    const currency = 'EUR';
    const quantity = 2;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(new Money(1000, 'EUR'));
  });

  it('should calculate shipping with quantity 2, base fee 0, and additional fee 0', () => {
    const shippingPriceInSubunitsOneItem = 0;
    const shippingPriceInSubunitsAdditionalItems = 0;
    const currency = 'EUR';
    const quantity = 2;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(new Money(0, 'EUR'));
  });
  it('should calculate shipping with quantity 2, base fee 0, and additional fee 100', () => {
    const shippingPriceInSubunitsOneItem = 0;
    const shippingPriceInSubunitsAdditionalItems = 100;
    const currency = 'EUR';
    const quantity = 2;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(new Money(100, 'EUR'));
  });

  it('should calculate shipping with quantity 1, negative fee', () => {
    const shippingPriceInSubunitsOneItem = -1000;
    const shippingPriceInSubunitsAdditionalItems = -100;
    const currency = 'EUR';
    const quantity = 1;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(null);
  });

  it('should calculate shipping with quantity 2, negative fees', () => {
    const shippingPriceInSubunitsOneItem = -1000;
    const shippingPriceInSubunitsAdditionalItems = -100;
    const currency = 'EUR';
    const quantity = 2;
    const shippingFee = calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );
    expect(shippingFee).toEqual(null);
  });
});

describe('calculateTotalFromLineItems()', () => {
  it('should calculate total of given lineItems lineTotals', () => {
    const lineItems = [
      {
        code: 'line-item/night',
        unitPrice: new Money(10000, 'USD'),
        quantity: 3,
        includeFor: ['customer', 'provider'],
      },

      {
        code: 'line-item/cleaning-fee',
        unitPrice: new Money(5000, 'USD'),
        quantity: 1,
        includeFor: ['customer', 'provider'],
      },
    ];
    expect(calculateTotalFromLineItems(lineItems)).toEqual(new Money(35000, 'USD'));
  });
});

describe('calculateTotalForProvider()', () => {
  it('should calculate total of lineItems where includeFor includes provider', () => {
    const lineItems = [
      {
        code: 'line-item/night',
        unitPrice: new Money(5000, 'USD'),
        units: 3,
        seats: 2,
        includeFor: ['customer', 'provider'],
      },
      {
        code: 'line-item/cleaning-fee',
        unitPrice: new Money(7500, 'USD'),
        quantity: 1,
        lineTotal: new Money(7500, 'USD'),
        includeFor: ['customer', 'provider'],
      },
      {
        code: 'line-item/customer-commission',
        unitPrice: new Money(30000, 'USD'),
        percentage: 10,
        includeFor: ['customer'],
      },
      {
        code: 'line-item/provider-commission',
        unitPrice: new Money(30000, 'USD'),
        percentage: -10,
        includeFor: ['provider'],
      },
      {
        code: 'line-item/provider-commission-discount',
        unitPrice: new Money(2500, 'USD'),
        quantity: 1,
        lineTotal: new Money(2500, 'USD'),
        includeFor: ['provider'],
      },
    ];
    expect(calculateTotalForProvider(lineItems)).toEqual(new Money(37000, 'USD'));
  });
});

describe('calculateTotalForCustomer()', () => {
  it('should calculate total of lineItems where includeFor includes customer', () => {
    const lineItems = [
      {
        code: 'line-item/night',
        unitPrice: new Money(5000, 'USD'),
        units: 3,
        seats: 2,
        includeFor: ['customer', 'provider'],
      },
      {
        code: 'line-item/cleaning-fee',
        unitPrice: new Money(7500, 'USD'),
        quantity: 1,
        lineTotal: new Money(7500, 'USD'),
        includeFor: ['customer', 'provider'],
      },
      {
        code: 'line-item/customer-commission',
        unitPrice: new Money(30000, 'USD'),
        percentage: 10,
        includeFor: ['customer'],
      },
      {
        code: 'line-item/provider-commission',
        unitPrice: new Money(30000, 'USD'),
        percentage: -10,
        includeFor: ['provider'],
      },
      {
        code: 'line-item/provider-commission-discount',
        unitPrice: new Money(2500, 'USD'),
        quantity: 1,
        lineTotal: new Money(2500, 'USD'),
        includeFor: ['provider'],
      },
    ];
    expect(calculateTotalForCustomer(lineItems)).toEqual(new Money(40500, 'USD'));
  });
});

describe('constructValidLineItems()', () => {
  it('should add lineTotal and reversal attributes to the lineItem', () => {
    const lineItems = [
      {
        code: 'line-item/night',
        unitPrice: new Money(5000, 'USD'),
        quantity: 2,
        includeFor: ['customer', 'provider'],
      },
    ];
    expect(constructValidLineItems(lineItems)[0].lineTotal).toEqual(new Money(10000, 'USD'));
    expect(constructValidLineItems(lineItems)[0].reversal).toEqual(false);
    expect(constructValidLineItems(lineItems)[0].reversal).not.toBeUndefined();
  });

  it('should throw error if lineItem code is not valid', () => {
    const code = 'nights';
    const lineItems = [
      {
        code,
        unitPrice: new Money(5000, 'USD'),
        quantity: 2,
        includeFor: ['customer', 'provider'],
      },
    ];

    expect(() => constructValidLineItems(lineItems)).toThrowError(
      `Invalid line item code: ${code}`
    );
  });
});

describe('hasCommissionPercentage()', () => {
  it('should return false with object that does not contain percentage', () => {
    expect(hasCommissionPercentage({})).toBe(false);
    expect(hasCommissionPercentage({ foo: 'bar' })).toBe(false);
  });
  it('should return true with object that does contain percentage', () => {
    expect(hasCommissionPercentage({ percentage: 10 })).toBe(true);
    expect(hasCommissionPercentage({ percentage: 10, foo: 'bar' })).toBe(true);
  });
  it('should return false with object that contains percentage zero', () => {
    expect(hasCommissionPercentage({ percentage: 0 })).toBe(false);
  });

  it('should throw error if percentage property does not contain number', () => {
    expect(() => hasCommissionPercentage({ percentage: '10' })).toThrowError('10 is not a number.');
    expect(() => hasCommissionPercentage({ percentage: 'asdf' })).toThrowError(
      'asdf is not a number.'
    );
  });
});

describe('hasMinimumCommission()', () => {
  it('should return false with object that does not contain minimum commission', () => {
    expect(hasMinimumCommission({})).toBe(false);
    expect(hasMinimumCommission({ foo: 'bar' })).toBe(false);
  });
  it('should return true with object that does contain minimum commission', () => {
    expect(hasMinimumCommission({ minimum_amount: 10 })).toBe(true);
    expect(hasMinimumCommission({ minimum_amount: 10, foo: 'bar' })).toBe(true);
  });
  it('should return false with object that contains minimum commission zero', () => {
    expect(hasMinimumCommission({ minimum_amount: 0 })).toBe(false);
  });

  it('should throw error if minimum commission property does not contain number', () => {
    expect(() => hasMinimumCommission({ minimum_amount: '10' })).toThrowError(
      '10 is not a number.'
    );
    expect(() => hasMinimumCommission({ minimum_amount: 'asdf' })).toThrowError(
      'asdf is not a number.'
    );
  });
});

describe('getProviderCommissionMaybe()', () => {
  const currency = 'USD';

  const order = {
    code: 'line-item/night',
    unitPrice: new Money(10000, 'USD'),
    units: 1,
    seats: 1,
    includeFor: ['customer', 'provider'],
  };

  const expectedLineItemsPercentage = [
    {
      code: 'line-item/provider-commission',
      unitPrice: new Money(10000, 'USD'),
      percentage: -5,
      includeFor: ['provider'],
    },
  ];

  const expectedLineItemsFixed = [
    {
      code: 'line-item/provider-commission',
      unitPrice: new Money(250, 'USD'),
      quantity: -1,
      includeFor: ['provider'],
    },
  ];

  // Returns an empty array
  it('should return an empty array when both percentage and minimum commission are null in provider commission', () => {
    const commission = {
      minimum_amount: null,
      percentage: null,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual([]);
  });
  it('should return an empty array when both percentage and minimum commission are undefined in provider commission', () => {
    const commission = {};
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual([]);
  });
  it('should return an empty array when both percentage and minimum commission are negative in provider commission', () => {
    const commission = {
      minimum_amount: -250,
      percentage: -5,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual([]);
  });
  it('should throw an error when percentage is not a number in provider commission', () => {
    const commission = {
      percentage: '5',
    };
    expect(() => getProviderCommissionMaybe(commission, order, currency)).toThrowError(
      '5 is not a number'
    );
  });
  it('should return throw an error when minimum commission is not a number in provider commission', () => {
    const commission = {
      minimum_amount: '250',
    };
    expect(() => getProviderCommissionMaybe(commission, order, currency)).toThrowError(
      '250 is not a number'
    );
  });

  // Returns correct percentage line items
  it('should return correct line items when a percentage is provided and minimum commission is null in provider commission', () => {
    const commission = {
      minimum_amount: null,
      percentage: 5,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });
  it('should return correct line items when a percentage is provided and minimum commission is undefined in provider commission', () => {
    const commission = {
      percentage: 5,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });
  it('should return correct line items when a percentage is provided and minimum commission is negative in provider commission', () => {
    const commission = {
      minimum_amount: -250,
      percentage: 5,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });
  it('should return correct line items when a percentage is provided and minimum commission is a lower value in provider commission', () => {
    const commission = {
      minimum_amount: 250,
      percentage: 5,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });

  // Returns correct fixed line items
  it('should return correct line items when a minimum commission is provided and percentage is null in provider commission', () => {
    const commission = {
      minimum_amount: 250,
      percentage: null,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(expectedLineItemsFixed);
  });
  it('should return correct line items when a minimum commission is provided and percentage is undefined in provider commission', () => {
    const commission = {
      minimum_amount: 250,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(expectedLineItemsFixed);
  });
  it('should return correct line items when a minimum commission is provided and percentage is negative in provider commission', () => {
    const commission = {
      minimum_amount: 250,
      percentage: -5,
    };
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(expectedLineItemsFixed);
  });
  it('should return correct line items when a minimum commission is provided and percentage is a lower value in provider commission', () => {
    const commission = {
      minimum_amount: 1500,
      percentage: 5,
    };
    const expectedLineItems = [
      {
        code: 'line-item/provider-commission',
        unitPrice: new Money(1500, 'USD'),
        quantity: -1,
        includeFor: ['provider'],
      },
    ];
    expect(getProviderCommissionMaybe(commission, order, currency)).toEqual(expectedLineItems);
  });
});

describe('getCustomerCommissionMaybe()', () => {
  const currency = 'USD';

  const order = {
    code: 'line-item/night',
    unitPrice: new Money(10000, 'USD'),
    units: 1,
    seats: 1,
    includeFor: ['customer', 'provider'],
  };

  const expectedLineItemsPercentage = [
    {
      code: 'line-item/customer-commission',
      unitPrice: new Money(10000, 'USD'),
      percentage: 5,
      includeFor: ['customer'],
    },
  ];

  const expectedLineItemsFixed = [
    {
      code: 'line-item/customer-commission',
      unitPrice: new Money(250, 'USD'),
      quantity: 1,
      includeFor: ['customer'],
    },
  ];

  // Returns an empty array
  it('should return an empty array when both percentage and minimum commission are null in customer commission', () => {
    const commission = {
      minimum_amount: null,
      percentage: null,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual([]);
  });
  it('should return an empty array when both percentage and minimum commission are undefined in customer commission', () => {
    const commission = {};
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual([]);
  });
  it('should return an empty array when both percentage and minimum commission are negative in customer commission', () => {
    const commission = {
      minimum_amount: -250,
      percentage: -5,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual([]);
  });
  it('should throw an error when percentage is not a number in customer commission', () => {
    const commission = {
      percentage: '5',
    };
    expect(() => getCustomerCommissionMaybe(commission, order, currency)).toThrowError(
      '5 is not a number'
    );
  });
  it('should return throw an error when minimum commission is not a number in customer commission', () => {
    const commission = {
      minimum_amount: '250',
    };
    expect(() => getCustomerCommissionMaybe(commission, order, currency)).toThrowError(
      '250 is not a number'
    );
  });

  // Returns correct percentage line items
  it('should return correct line items when a percentage is provided and minimum commission is null in customer commission', () => {
    const commission = {
      minimum_amount: null,
      percentage: 5,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });
  it('should return correct line items when a percentage is provided and minimum commission is undefined in customer commission', () => {
    const commission = {
      percentage: 5,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });
  it('should return correct line items when a percentage is provided and minimum commission is negative in customer commission', () => {
    const commission = {
      minimum_amount: -250,
      percentage: 5,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });
  it('should return correct line items when a percentage is provided and minimum commission is a lower value in customer commission', () => {
    const commission = {
      minimum_amount: 250,
      percentage: 5,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(
      expectedLineItemsPercentage
    );
  });

  // Returns correct fixed line items
  it('should return correct line items when a minimum commission is provided and percentage is null in customer commission', () => {
    const commission = {
      minimum_amount: 250,
      percentage: null,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(expectedLineItemsFixed);
  });
  it('should return correct line items when a minimum commission is provided and percentage is undefined in customer commission', () => {
    const commission = {
      minimum_amount: 250,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(expectedLineItemsFixed);
  });
  it('should return correct line items when a minimum commission is provided and percentage is negative in customer commission', () => {
    const commission = {
      minimum_amount: 250,
      percentage: -5,
    };
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(expectedLineItemsFixed);
  });
  it('should return correct line items when a minimum commission is provided and percentage is a lower value in customer commission', () => {
    const commission = {
      minimum_amount: 1500,
      percentage: 5,
    };
    const expectedLineItems = [
      {
        code: 'line-item/customer-commission',
        unitPrice: new Money(1500, 'USD'),
        quantity: 1,
        includeFor: ['customer'],
      },
    ];
    expect(getCustomerCommissionMaybe(commission, order, currency)).toEqual(expectedLineItems);
  });
});

describe('calculateOverlappingHours()', () => {
  const { calculateOverlappingHours } = require('./lineItemHelpers');
  const tz = 'Europe/Zurich';

  it('should return full overlap when booking is entirely within the window', () => {
    // 18:00-21:00 CEST, window [17, 24)
    const start = new Date('2025-06-15T16:00:00.000Z');
    const end = new Date('2025-06-15T19:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 17, 24)).toBe(3);
  });

  it('should return 0 when booking is entirely outside the window', () => {
    // 08:00-12:00 CEST, window [17, 24)
    const start = new Date('2025-06-15T06:00:00.000Z');
    const end = new Date('2025-06-15T10:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 17, 24)).toBe(0);
  });

  it('should return only the overlapping portion when booking crosses into the window', () => {
    // 15:00-20:00 CEST, window [17, 24) => 3h overlap (17:00-20:00)
    const start = new Date('2025-06-15T13:00:00.000Z');
    const end = new Date('2025-06-15T18:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 17, 24)).toBe(3);
  });

  it('should return only the overlapping portion when booking extends past the window end', () => {
    // 07:00-11:00 CEST, window [6, 9) => 2h overlap (07:00-09:00)
    const start = new Date('2025-06-15T05:00:00.000Z');
    const end = new Date('2025-06-15T09:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 6, 9)).toBe(2);
  });

  it('should handle a narrow morning window [6, 9)', () => {
    // 05:00-10:00 CEST, window [6, 9) => 3h overlap
    const start = new Date('2025-06-15T03:00:00.000Z');
    const end = new Date('2025-06-15T08:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 6, 9)).toBe(3);
  });

  it('should return 0 when booking ends exactly at window start', () => {
    // 10:00-17:00 CEST, window [17, 24)
    const start = new Date('2025-06-15T08:00:00.000Z');
    const end = new Date('2025-06-15T15:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 17, 24)).toBe(0);
  });

  it('should return 0 when booking starts exactly at window end', () => {
    // 09:00-12:00 CEST, window [6, 9)
    const start = new Date('2025-06-15T07:00:00.000Z');
    const end = new Date('2025-06-15T10:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 6, 9)).toBe(0);
  });

  it('should handle fractional hours within the window', () => {
    // 17:30-19:00 CEST, window [17, 24) => 1.5h
    const start = new Date('2025-06-15T15:30:00.000Z');
    const end = new Date('2025-06-15T17:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 17, 24)).toBe(1.5);
  });

  it('should handle fractional hours crossing the window start', () => {
    // 16:30-18:00 CEST, window [17, 24) => 1h (17:00-18:00)
    const start = new Date('2025-06-15T14:30:00.000Z');
    const end = new Date('2025-06-15T16:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 17, 24)).toBe(1);
  });

  it('should return 0 when start equals end', () => {
    const t = new Date('2025-06-15T16:00:00.000Z');
    expect(calculateOverlappingHours(t, t, tz, 17, 24)).toBe(0);
  });

  it('should handle window [0, 6) for late-night surcharges', () => {
    // 02:00-05:00 CEST, window [0, 6) => 3h
    const start = new Date('2025-06-15T00:00:00.000Z');
    const end = new Date('2025-06-15T03:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 0, 6)).toBe(3);
  });

  it('should handle a single-hour window [12, 13)', () => {
    // 11:00-14:00 CEST, window [12, 13) => 1h
    const start = new Date('2025-06-15T09:00:00.000Z');
    const end = new Date('2025-06-15T12:00:00.000Z');
    expect(calculateOverlappingHours(start, end, tz, 12, 13)).toBe(1);
  });

  it('should use default timezone and window when not provided', () => {
    // 15:00-20:00 CEST in Europe/Zurich, default window [17, 24) => 3h
    const start = new Date('2025-06-15T13:00:00.000Z');
    const end = new Date('2025-06-15T18:00:00.000Z');
    expect(calculateOverlappingHours(start, end)).toBe(3);
  });
});

describe('slugifyLabel()', () => {
  const { slugifyLabel } = require('./lineItemHelpers');

  it('should lowercase and replace spaces with hyphens', () => {
    expect(slugifyLabel('Evening Surcharge')).toBe('evening-surcharge');
  });

  it('should handle German umlauts', () => {
    expect(slugifyLabel('Abendaufschlag')).toBe('abendaufschlag');
    expect(slugifyLabel('Frühaufschlag')).toBe('fruhaufschlag');
    expect(slugifyLabel('Büroöffnung')).toBe('burooffnung');
    expect(slugifyLabel('Straße')).toBe('strasse');
  });

  it('should handle French accented characters', () => {
    expect(slugifyLabel('Supplément soirée')).toBe('supplement-soiree');
    expect(slugifyLabel('Après-midi')).toBe('apres-midi');
  });

  it('should handle Spanish characters', () => {
    expect(slugifyLabel('Recargo nocturno')).toBe('recargo-nocturno');
    expect(slugifyLabel('Mañana')).toBe('manana');
  });

  it('should strip special characters', () => {
    expect(slugifyLabel('Price (extra)')).toBe('price-extra');
    expect(slugifyLabel('100% surcharge!')).toBe('100-surcharge');
    expect(slugifyLabel('@#$%^&*')).toBe('surcharge');
  });

  it('should collapse consecutive hyphens', () => {
    expect(slugifyLabel('Evening -- Surcharge')).toBe('evening-surcharge');
    expect(slugifyLabel('a---b')).toBe('a-b');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(slugifyLabel('  Evening Surcharge  ')).toBe('evening-surcharge');
  });

  it('should truncate to 50 characters', () => {
    const longLabel = 'A'.repeat(60);
    expect(slugifyLabel(longLabel).length).toBe(50);
  });

  it('should return "surcharge" for null/undefined/empty input', () => {
    expect(slugifyLabel(null)).toBe('surcharge');
    expect(slugifyLabel(undefined)).toBe('surcharge');
    expect(slugifyLabel('')).toBe('surcharge');
  });

  it('should handle labels with only special characters', () => {
    expect(slugifyLabel('***')).toBe('surcharge');
    expect(slugifyLabel('...')).toBe('surcharge');
  });

  it('should preserve numbers in labels', () => {
    expect(slugifyLabel('Phase 2 Aufschlag')).toBe('phase-2-aufschlag');
    expect(slugifyLabel('17-24 Uhr')).toBe('17-24-uhr');
  });
});

describe('calculateNonBusinessHours()', () => {
  const tz = 'Europe/Zurich';

  it('should return 0 for a booking entirely within business hours (08:00-15:00)', () => {
    const start = new Date('2025-06-15T06:00:00.000Z'); // 08:00 CEST
    const end = new Date('2025-06-15T13:00:00.000Z'); // 15:00 CEST
    expect(calculateNonBusinessHours(start, end, tz, 17)).toBe(0);
  });

  it('should return full duration for a booking entirely in non-business hours (18:00-21:00)', () => {
    const start = new Date('2025-06-15T16:00:00.000Z'); // 18:00 CEST
    const end = new Date('2025-06-15T19:00:00.000Z'); // 21:00 CEST
    expect(calculateNonBusinessHours(start, end, tz, 17)).toBe(3);
  });

  it('should return only non-business portion for a booking crossing the threshold (15:00-20:00)', () => {
    const start = new Date('2025-06-15T13:00:00.000Z'); // 15:00 CEST
    const end = new Date('2025-06-15T18:00:00.000Z'); // 20:00 CEST
    expect(calculateNonBusinessHours(start, end, tz, 17)).toBe(3);
  });

  it('should return 0 for a booking ending exactly at 17:00 (10:00-17:00)', () => {
    const start = new Date('2025-06-15T08:00:00.000Z'); // 10:00 CEST
    const end = new Date('2025-06-15T15:00:00.000Z'); // 17:00 CEST
    expect(calculateNonBusinessHours(start, end, tz, 17)).toBe(0);
  });

  it('should handle fractional hours crossing the threshold (16:30-18:00)', () => {
    const start = new Date('2025-06-15T14:30:00.000Z'); // 16:30 CEST
    const end = new Date('2025-06-15T16:00:00.000Z'); // 18:00 CEST
    expect(calculateNonBusinessHours(start, end, tz, 17)).toBe(1);
  });

  it('should return 0 when start equals end', () => {
    const start = new Date('2025-06-15T10:00:00.000Z');
    expect(calculateNonBusinessHours(start, start, tz, 17)).toBe(0);
  });

  it('should use default timezone and businessHoursEnd when not provided', () => {
    const start = new Date('2025-06-15T13:00:00.000Z'); // 15:00 CEST in Europe/Zurich
    const end = new Date('2025-06-15T18:00:00.000Z'); // 20:00 CEST in Europe/Zurich
    expect(calculateNonBusinessHours(start, end)).toBe(3);
  });
});
