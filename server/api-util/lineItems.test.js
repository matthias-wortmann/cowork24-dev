const { types } = require('sharetribe-flex-sdk');
const { Money } = types;
const { transactionLineItems } = require('./lineItems');

describe('transactionLineItems', () => {
  // Mock data for testing
  const mockListing = {
    attributes: {
      price: new Money(10000, 'EUR'), // €100.00
      publicData: {
        unitType: 'day',
        priceVariationsEnabled: false,
      },
    },
  };

  const mockProviderCommission = {
    percentage: 10,
    minimum_amount: 500, // €5.00
  };

  const mockCustomerCommission = {
    percentage: 5,
    minimum_amount: 200, // €2.00
  };

  const mockOrderData = {
    bookingStart: '2024-01-01T00:00:00.000Z',
    bookingEnd: '2024-01-03T00:00:00.000Z',
    seats: 2,
    stockReservationQuantity: 3,
    deliveryMethod: 'shipping',
    currency: 'EUR',
  };

  describe('Default Booking Process - Day Unit Type', () => {
    it('should create line items for day-based booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3); // order + provider commission + customer commission

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/day',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 2, // 2 days between dates
        includeFor: ['customer', 'provider'],
      });

      // Check provider commission
      expect(result[1].code).toBe('line-item/provider-commission');
      expect(result[1].includeFor).toEqual(['provider']);

      // Check customer commission
      expect(result[2].code).toBe('line-item/customer-commission');
      expect(result[2].includeFor).toEqual(['customer']);
    });

    it('should create line items for day-based booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        seats: 3,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/day',
        unitPrice: new Money(10000, 'EUR'),
        units: 2, // 2 days
        seats: 3, // 3 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Booking Process - Night Unit Type', () => {
    it('should create line items for night-based booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'night',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/night',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 2, // 2 nights between dates
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for night-based booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'night',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        seats: 4,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/night',
        unitPrice: new Money(10000, 'EUR'),
        units: 2, // 2 nights
        seats: 4, // 4 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Booking Process - Hour Unit Type', () => {
    it('should create line items for hour-based booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'hour',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T03:00:00.000Z', // 3 hours
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/hour',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 3, // 3 hours
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for hour-based booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'hour',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T03:00:00.000Z', // 3 hours
        seats: 2,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/hour',
        unitPrice: new Money(10000, 'EUR'),
        units: 3, // 3 hours
        seats: 2, // 2 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Booking Process - Fixed Unit Type', () => {
    it('should create line items for fixed-duration booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'fixed',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T02:00:00.000Z',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/fixed',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 1, // 1 fixed session
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for fixed-duration booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'fixed',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T02:00:00.000Z',
        seats: 5,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/fixed',
        unitPrice: new Money(10000, 'EUR'),
        units: 1, // 1 fixed session
        seats: 5, // 5 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Purchase Process - Item Unit Type', () => {
    it('should create line items for item purchase with pickup delivery', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'item',
            shippingPriceInSubunitsOneItem: 500, // €5.00
            shippingPriceInSubunitsAdditionalItems: 200, // €2.00
          },
        },
      };

      const orderData = {
        stockReservationQuantity: 2,
        deliveryMethod: 'pickup',
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3); // order + provider commission + customer commission (no shipping for pickup)

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/item',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 2,
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for item purchase with shipping delivery', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'item',
            shippingPriceInSubunitsOneItem: 500, // €5.00
            shippingPriceInSubunitsAdditionalItems: 200, // €2.00
          },
        },
      };

      const orderData = {
        stockReservationQuantity: 3,
        deliveryMethod: 'shipping',
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(4); // order + shipping + provider commission + customer commission

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/item',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 3,
        includeFor: ['customer', 'provider'],
      });

      // Check shipping line item
      expect(result[1]).toEqual({
        code: 'line-item/shipping-fee',
        unitPrice: new Money(900, 'EUR'), // €5.00 + (2 * €2.00) = €9.00
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for single item purchase with shipping', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'item',
            shippingPriceInSubunitsOneItem: 500, // €5.00
            shippingPriceInSubunitsAdditionalItems: 200, // €2.00
          },
        },
      };

      const orderData = {
        stockReservationQuantity: 1,
        deliveryMethod: 'shipping',
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(4); // order + shipping + provider commission + customer commission

      // Check shipping line item for single item
      expect(result[1]).toEqual({
        code: 'line-item/shipping-fee',
        unitPrice: new Money(500, 'EUR'), // €5.00 for first item only
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Negotiation Process - Request Unit Type (Reverse Flow)', () => {
    it('should create line items for negotiation request with offer', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'request',
          },
        },
      };

      const orderData = {
        offer: new Money(15000, 'EUR'), // €150.00 offer
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3); // order + provider commission + customer commission

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/request',
        unitPrice: new Money(15000, 'EUR'), // Uses the offer amount
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for negotiation request without offer (uses listing price)', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'request',
          },
        },
      };

      const orderData = {
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item uses listing price when no offer
      expect(result[0]).toEqual({
        code: 'line-item/request',
        unitPrice: new Money(10000, 'EUR'), // Uses listing price
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Price Variants', () => {
    it('should use price variant when priceVariationsEnabled is true', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
            priceVariationsEnabled: true,
            priceVariants: [
              {
                name: 'weekend',
                priceInSubunits: 15000, // €150.00
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        priceVariantName: 'weekend',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result[0].unitPrice).toEqual(new Money(15000, 'EUR'));
    });
  });

  describe('Commission Handling', () => {
    it('should not add commission line items when commissions are not provided', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const result = transactionLineItems(listing, orderData, null, null);

      expect(result).toHaveLength(1); // Only order line item
      expect(result[0].code).toBe('line-item/day');
    });

    it('should use minimum commission when it is greater than percentage-based commission', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const providerCommission = {
        percentage: 5,
        minimum_amount: 3000, // €30.00 minimum (greater than 5% of €200 = €10)
      };

      const result = transactionLineItems(listing, orderData, providerCommission, null);

      expect(result).toHaveLength(2); // order + provider commission
      expect(result[1].code).toBe('line-item/provider-commission');
      expect(result[1].unitPrice).toEqual(new Money(3000, 'EUR')); // Uses minimum amount
      expect(result[1].quantity).toBe(-1); // Negative for provider commission
    });

    it('should use percentage-based commission when it is greater than minimum', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const providerCommission = {
        percentage: 15,
        minimum_amount: 100, // €1.00 minimum (less than 15% of €200 = €30)
      };

      const result = transactionLineItems(listing, orderData, providerCommission, null);

      expect(result).toHaveLength(2); // order + provider commission
      expect(result[1].code).toBe('line-item/provider-commission');
      expect(result[1].percentage).toBe(-15); // Negative percentage for provider commission
    });
  });

  describe('Error Handling', () => {
    it('should throw error when orderData is missing required quantity information', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        // Missing bookingStart and bookingEnd
      };

      expect(() => {
        transactionLineItems(listing, orderData, mockProviderCommission, mockCustomerCommission);
      }).toThrow(
        'Error: orderData is missing the following information: quantity, units, seats. Quantity or either units & seats is required.'
      );
    });

    it('should throw error when orderData is missing units and seats for seat-based booking', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        // Missing bookingStart and bookingEnd - this will cause calculateQuantityFromDates to return null
        seats: 2,
      };

      expect(() => {
        transactionLineItems(listing, orderData, mockProviderCommission, mockCustomerCommission);
      }).toThrow(
        'Error: orderData is missing the following information: quantity, units. Quantity or either units & seats is required.'
      );
    });

    it('should throw error when minimum commission is greater than transaction amount', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const providerCommission = {
        percentage: 5,
        minimum_amount: 50000, // €500.00 minimum (greater than transaction amount)
      };

      expect(() => {
        transactionLineItems(listing, orderData, providerCommission, null);
      }).toThrow('Minimum commission amount is greater than the amount of money paid in');
    });
  });

  describe('Pricing Rules for Hourly Bookings', () => {
    const listingWithPricingRules = {
      attributes: {
        price: new Money(30000, 'CHF'), // CHF 300/hour
        availabilityPlan: { timezone: 'Europe/Zurich' },
        publicData: {
          unitType: 'hour',
          priceVariationsEnabled: false,
          pricingRules: [
            {
              id: 'rule-1',
              type: 'time-of-day',
              label: 'Abendaufschlag',
              surchargePerHourSubunits: 10000, // CHF 100/hour
              fromHour: 17,
              toHour: 24,
            },
          ],
        },
      },
    };

    it('should NOT add surcharge for a booking entirely outside the rule window (08:00-15:00 CEST)', () => {
      const orderData = {
        bookingStart: '2025-06-15T06:00:00.000Z', // 08:00 CEST
        bookingEnd: '2025-06-15T13:00:00.000Z', // 15:00 CEST
      };

      const result = transactionLineItems(listingWithPricingRules, orderData, null, null);

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
      expect(result[0].quantity).toBe(7);
    });

    it('should add surcharge for a booking entirely in the rule window (18:00-21:00 CEST)', () => {
      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T19:00:00.000Z', // 21:00 CEST
      };

      const result = transactionLineItems(listingWithPricingRules, orderData, null, null);

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('line-item/hour');
      expect(result[0].quantity).toBe(3);
      expect(result[1].code).toBe('line-item/abendaufschlag');
      expect(result[1].unitPrice).toEqual(new Money(10000, 'CHF'));
      expect(result[1].quantity).toBe(3);
    });

    it('should add surcharge only for overlapping hours (15:00-20:00 CEST = 3h surcharge)', () => {
      const orderData = {
        bookingStart: '2025-06-15T13:00:00.000Z', // 15:00 CEST
        bookingEnd: '2025-06-15T18:00:00.000Z', // 20:00 CEST
      };

      const result = transactionLineItems(listingWithPricingRules, orderData, null, null);

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('line-item/hour');
      expect(result[0].quantity).toBe(5);
      expect(result[1].code).toBe('line-item/abendaufschlag');
      expect(result[1].quantity).toBe(3); // 17:00-20:00 = 3h
    });

    it('should NOT add surcharge when listing has no pricing rules', () => {
      const listingWithoutRules = {
        attributes: {
          price: new Money(30000, 'CHF'),
          publicData: { unitType: 'hour', priceVariationsEnabled: false },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z',
        bookingEnd: '2025-06-15T19:00:00.000Z',
      };

      const result = transactionLineItems(listingWithoutRules, orderData, null, null);

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
    });

    it('should include surcharge in commission calculation', () => {
      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T19:00:00.000Z', // 21:00 CEST (3h, all in window)
      };

      const commission = { percentage: 10 };

      const result = transactionLineItems(listingWithPricingRules, orderData, commission, null);

      // base: CHF 300 * 3h = CHF 900, surcharge: CHF 100 * 3h = CHF 300, total = CHF 1200
      // provider commission = -10% of CHF 1200 = -CHF 120
      const providerCommission = result.find(li => li.code === 'line-item/provider-commission');
      expect(providerCommission).toBeDefined();
      expect(providerCommission.unitPrice).toEqual(new Money(120000, 'CHF'));
      expect(providerCommission.percentage).toBe(-10);
    });

    it('should support multiple pricing rules simultaneously', () => {
      const listingWithMultipleRules = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            pricingRules: [
              {
                id: 'rule-1',
                type: 'time-of-day',
                label: 'Abendaufschlag',
                surchargePerHourSubunits: 10000,
                fromHour: 17,
                toHour: 24,
              },
              {
                id: 'rule-2',
                type: 'time-of-day',
                label: 'Morgenaufschlag',
                surchargePerHourSubunits: 5000,
                fromHour: 6,
                toHour: 9,
              },
            ],
          },
        },
      };

      // Booking 07:00-10:00 CEST (05:00-08:00 UTC in summer)
      const orderData = {
        bookingStart: '2025-06-15T05:00:00.000Z', // 07:00 CEST
        bookingEnd: '2025-06-15T08:00:00.000Z', // 10:00 CEST
      };

      const result = transactionLineItems(listingWithMultipleRules, orderData, null, null);

      expect(result).toHaveLength(2); // base + morning surcharge only
      expect(result[0].code).toBe('line-item/hour');
      expect(result[0].quantity).toBe(3);
      expect(result[1].code).toBe('line-item/morgenaufschlag');
      expect(result[1].unitPrice).toEqual(new Money(5000, 'CHF'));
      expect(result[1].quantity).toBe(2); // 07:00-09:00 = 2h overlap with [6, 9)
    });

    it('should handle backward-compatible legacy eveningSurcharge fields', () => {
      const legacyListing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            eveningSurchargePerHourSubunits: 10000,
            businessHoursEnd: 17,
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T19:00:00.000Z', // 21:00 CEST
      };

      const result = transactionLineItems(legacyListing, orderData, null, null);

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('line-item/hour');
      expect(result[1].code).toBe('line-item/evening-surcharge');
      expect(result[1].unitPrice).toEqual(new Money(10000, 'CHF'));
      expect(result[1].quantity).toBe(3);
    });

    it('should deduplicate line item codes when rules produce the same slug', () => {
      const listingWithDuplicateLabels = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            pricingRules: [
              {
                id: 'rule-1',
                type: 'time-of-day',
                label: 'Aufschlag',
                surchargePerHourSubunits: 10000,
                fromHour: 17,
                toHour: 20,
              },
              {
                id: 'rule-2',
                type: 'time-of-day',
                label: 'Aufschlag',
                surchargePerHourSubunits: 5000,
                fromHour: 20,
                toHour: 24,
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T21:00:00.000Z', // 23:00 CEST
      };

      const result = transactionLineItems(listingWithDuplicateLabels, orderData, null, null);

      const surchargeCodes = result.filter(li => li.code.startsWith('line-item/aufschlag'));
      expect(surchargeCodes).toHaveLength(2);
      expect(surchargeCodes[0].code).toBe('line-item/aufschlag');
      expect(surchargeCodes[1].code).toBe('line-item/aufschlag-2');
    });

    it('should ignore rules with surchargePerHourSubunits of 0', () => {
      const listing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            pricingRules: [
              {
                id: 'rule-zero',
                type: 'time-of-day',
                label: 'Free surcharge',
                surchargePerHourSubunits: 0,
                fromHour: 17,
                toHour: 24,
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T19:00:00.000Z', // 21:00 CEST
      };

      const result = transactionLineItems(listing, orderData, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
    });

    it('should ignore rules with negative surchargePerHourSubunits', () => {
      const listing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            pricingRules: [
              {
                id: 'rule-neg',
                type: 'time-of-day',
                label: 'Discount',
                surchargePerHourSubunits: -5000,
                fromHour: 17,
                toHour: 24,
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z',
        bookingEnd: '2025-06-15T19:00:00.000Z',
      };

      const result = transactionLineItems(listing, orderData, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
    });

    it('should skip rules with an unknown type', () => {
      const listing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            pricingRules: [
              {
                id: 'rule-unknown',
                type: 'day-of-week',
                label: 'Weekend surcharge',
                surchargePerHourSubunits: 5000,
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T06:00:00.000Z',
        bookingEnd: '2025-06-15T10:00:00.000Z',
      };

      const result = transactionLineItems(listing, orderData, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
    });

    it('should NOT apply pricing rules for non-hourly (day) bookings', () => {
      const dayListing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          publicData: {
            unitType: 'day',
            priceVariationsEnabled: false,
            pricingRules: [
              {
                id: 'rule-1',
                type: 'time-of-day',
                label: 'Abendaufschlag',
                surchargePerHourSubunits: 10000,
                fromHour: 17,
                toHour: 24,
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T00:00:00.000Z',
        bookingEnd: '2025-06-17T00:00:00.000Z',
      };

      const result = transactionLineItems(dayListing, orderData, null, null);
      expect(result.find(li => li.code === 'line-item/abendaufschlag')).toBeUndefined();
    });

    it('should handle empty pricingRules array without errors', () => {
      const listing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            pricingRules: [],
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z',
        bookingEnd: '2025-06-15T19:00:00.000Z',
      };

      const result = transactionLineItems(listing, orderData, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
    });

    it('should include surcharges in customer commission calculation', () => {
      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T19:00:00.000Z', // 21:00 CEST (3h in window)
      };

      const customerCommission = { percentage: 5 };
      const result = transactionLineItems(
        listingWithPricingRules,
        orderData,
        null,
        customerCommission
      );

      // base: CHF 300 * 3h = CHF 900, surcharge: CHF 100 * 3h = CHF 300, total = CHF 1200
      // customer commission = 5% of CHF 1200 = CHF 60
      const cc = result.find(li => li.code === 'line-item/customer-commission');
      expect(cc).toBeDefined();
      expect(cc.unitPrice).toEqual(new Money(120000, 'CHF'));
      expect(cc.percentage).toBe(5);
    });

    it('should include surcharges in both provider and customer commission', () => {
      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T19:00:00.000Z', // 21:00 CEST (3h in window)
      };

      const providerCommission = { percentage: 10 };
      const customerCommission = { percentage: 5 };
      const result = transactionLineItems(
        listingWithPricingRules,
        orderData,
        providerCommission,
        customerCommission
      );

      expect(result).toHaveLength(4); // order + surcharge + provider comm + customer comm
      const pc = result.find(li => li.code === 'line-item/provider-commission');
      const cc = result.find(li => li.code === 'line-item/customer-commission');
      expect(pc).toBeDefined();
      expect(cc).toBeDefined();
      // Both commissions calculated on base + surcharge total (CHF 1200)
      expect(pc.unitPrice).toEqual(new Money(120000, 'CHF'));
      expect(cc.unitPrice).toEqual(new Money(120000, 'CHF'));
    });

    it('should use listing timezone from publicData.listingTimezone when available', () => {
      const listing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            listingTimezone: 'America/New_York',
            pricingRules: [
              {
                id: 'rule-ny',
                type: 'time-of-day',
                label: 'Evening NYC',
                surchargePerHourSubunits: 10000,
                fromHour: 17,
                toHour: 24,
              },
            ],
          },
        },
      };

      // 18:00 UTC = 14:00 EDT (outside window) vs 20:00 CEST (inside window)
      const orderData = {
        bookingStart: '2025-06-15T18:00:00.000Z',
        bookingEnd: '2025-06-15T21:00:00.000Z',
      };

      const result = transactionLineItems(listing, orderData, null, null);
      // In New York (EDT = UTC-4): 14:00-17:00 => 0h overlap with [17, 24)
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
    });

    it('should handle legacy listing without businessHoursEnd (defaults to 17)', () => {
      const legacyListing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            eveningSurchargePerHourSubunits: 8000,
            // no businessHoursEnd => defaults to 17
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T13:00:00.000Z', // 15:00 CEST
        bookingEnd: '2025-06-15T18:00:00.000Z', // 20:00 CEST
      };

      const result = transactionLineItems(legacyListing, orderData, null, null);
      expect(result).toHaveLength(2);
      expect(result[1].code).toBe('line-item/evening-surcharge');
      expect(result[1].quantity).toBe(3); // 17:00-20:00 = 3h
      expect(result[1].unitPrice).toEqual(new Money(8000, 'CHF'));
    });

    it('should not apply legacy surcharge when eveningSurchargePerHourSubunits is 0', () => {
      const legacyListing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            eveningSurchargePerHourSubunits: 0,
            businessHoursEnd: 17,
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z',
        bookingEnd: '2025-06-15T19:00:00.000Z',
      };

      const result = transactionLineItems(legacyListing, orderData, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('line-item/hour');
    });

    it('should prefer pricingRules over legacy fields when both exist', () => {
      const listing = {
        attributes: {
          price: new Money(30000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            eveningSurchargePerHourSubunits: 10000,
            businessHoursEnd: 17,
            pricingRules: [
              {
                id: 'rule-1',
                type: 'time-of-day',
                label: 'Custom Surcharge',
                surchargePerHourSubunits: 5000,
                fromHour: 20,
                toHour: 24,
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2025-06-15T16:00:00.000Z', // 18:00 CEST
        bookingEnd: '2025-06-15T20:00:00.000Z', // 22:00 CEST
      };

      const result = transactionLineItems(listing, orderData, null, null);
      // Should use pricingRules, not legacy: window [20, 24) => 2h overlap (20:00-22:00)
      const surcharge = result.find(li => li.code === 'line-item/custom-surcharge');
      expect(surcharge).toBeDefined();
      expect(surcharge.quantity).toBe(2);
      expect(surcharge.unitPrice).toEqual(new Money(5000, 'CHF'));
      // Should NOT have legacy line item
      expect(result.find(li => li.code === 'line-item/evening-surcharge')).toBeUndefined();
    });

    it('should correctly handle booking starting exactly at window boundary', () => {
      const orderData = {
        bookingStart: '2025-06-15T15:00:00.000Z', // 17:00 CEST (exact start of window)
        bookingEnd: '2025-06-15T18:00:00.000Z', // 20:00 CEST
      };

      const result = transactionLineItems(listingWithPricingRules, orderData, null, null);
      expect(result).toHaveLength(2);
      expect(result[1].code).toBe('line-item/abendaufschlag');
      expect(result[1].quantity).toBe(3); // full 17:00-20:00
    });

    it('should handle three overlapping pricing rules', () => {
      const listing = {
        attributes: {
          price: new Money(10000, 'CHF'),
          availabilityPlan: { timezone: 'Europe/Zurich' },
          publicData: {
            unitType: 'hour',
            priceVariationsEnabled: false,
            pricingRules: [
              {
                id: 'r1',
                type: 'time-of-day',
                label: 'Early',
                surchargePerHourSubunits: 1000,
                fromHour: 6,
                toHour: 9,
              },
              {
                id: 'r2',
                type: 'time-of-day',
                label: 'Lunch',
                surchargePerHourSubunits: 2000,
                fromHour: 12,
                toHour: 14,
              },
              {
                id: 'r3',
                type: 'time-of-day',
                label: 'Evening',
                surchargePerHourSubunits: 3000,
                fromHour: 18,
                toHour: 22,
              },
            ],
          },
        },
      };

      // 07:00-08:00 CEST => 1h in early window, 0 in others
      const orderData = {
        bookingStart: '2025-06-15T05:00:00.000Z', // 07:00 CEST
        bookingEnd: '2025-06-15T06:00:00.000Z', // 08:00 CEST
      };

      const result = transactionLineItems(listing, orderData, null, null);
      expect(result).toHaveLength(2);
      expect(result[1].code).toBe('line-item/early');
      expect(result[1].quantity).toBe(1);
    });
  });

  describe('Currency Handling', () => {
    it('should use currency from orderData when listing price has no currency', () => {
      const listing = {
        ...mockListing,
        attributes: {
          price: null, // No price attribute
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        currency: 'USD',
      };

      const result = transactionLineItems(listing, orderData, null, null);

      expect(result[0].unitPrice).toBeNull(); // No unit price when no listing price
    });

    it('should use currency from listing price when available', () => {
      const listing = {
        ...mockListing,
        attributes: {
          price: new Money(10000, 'USD'), // USD currency
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        currency: 'EUR', // Different currency in orderData
      };

      const result = transactionLineItems(listing, orderData, null, null);

      expect(result[0].unitPrice.currency).toBe('USD'); // Uses listing currency
    });
  });
});
