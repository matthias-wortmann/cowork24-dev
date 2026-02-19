const {
  calculateQuantityFromDates,
  calculateQuantityFromHours,
  calculateOverlappingHours,
  calculateShippingFee,
  slugifyLabel,
  getProviderCommissionMaybe,
  getCustomerCommissionMaybe,
} = require('./lineItemHelpers');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

/**
 * Get quantity and add extra line-items that are related to delivery method
 *
 * @param {Object} orderData should contain stockReservationQuantity and deliveryMethod
 * @param {*} publicData should contain shipping prices
 * @param {*} currency should point to the currency of listing's price.
 */
const getItemQuantityAndLineItems = (orderData, publicData, currency) => {
  // Check delivery method and shipping prices
  const quantity = orderData ? orderData.stockReservationQuantity : null;
  const deliveryMethod = orderData && orderData.deliveryMethod;
  const isShipping = deliveryMethod === 'shipping';
  const isPickup = deliveryMethod === 'pickup';
  const { shippingPriceInSubunitsOneItem, shippingPriceInSubunitsAdditionalItems } =
    publicData || {};

  // Calculate shipping fee if applicable
  const shippingFee = isShipping
    ? calculateShippingFee(
        shippingPriceInSubunitsOneItem,
        shippingPriceInSubunitsAdditionalItems,
        currency,
        quantity
      )
    : null;

  // Add line-item for given delivery method.
  // Note: by default, pickup considered as free and, therefore, we don't add pickup fee line-item
  const deliveryLineItem = !!shippingFee
    ? [
        {
          code: 'line-item/shipping-fee',
          unitPrice: shippingFee,
          quantity: 1,
          includeFor: ['customer', 'provider'],
        },
      ]
    : [];

  return { quantity, extraLineItems: deliveryLineItem };
};

const getOfferQuantityAndLineItems = orderData => {
  return { quantity: 1, extraLineItems: [] };
};

/**
 * Get quantity for fixed bookings with seats.
 * @param {Object} orderData
 * @param {number} [orderData.seats]
 */
const getFixedQuantityAndLineItems = orderData => {
  const { seats } = orderData || {};
  const hasSeats = !!seats;
  // If there are seats, the quantity is split to factors: units and seats.
  // E.g. 1 session x 2 seats (aka unit price is multiplied by 2)
  return hasSeats ? { units: 1, seats, extraLineItems: [] } : { quantity: 1, extraLineItems: [] };
};

/**
 * Rule-type handler map. Each handler receives a rule config, orderData, timezone,
 * and currency, and returns a line item object or null.
 */
const RULE_TYPE_HANDLERS = {
  'time-of-day': (rule, orderData, timezone, currency) => {
    const { bookingStart, bookingEnd } = orderData || {};
    const { surchargePerHourSubunits, fromHour = 17, toHour = 24 } = rule;

    if (!surchargePerHourSubunits || surchargePerHourSubunits <= 0 || !bookingStart || !bookingEnd) {
      return null;
    }

    const hours = calculateOverlappingHours(bookingStart, bookingEnd, timezone, fromHour, toHour);

    if (hours <= 0) {
      return null;
    }

    const slug = slugifyLabel(rule.label);
    return {
      code: `line-item/${slug}`,
      unitPrice: new Money(surchargePerHourSubunits, currency),
      quantity: hours,
      includeFor: ['customer', 'provider'],
    };
  },
};

/**
 * Ensure all line item codes in a set are unique by appending a numeric suffix on collision.
 * @param {Array<Object>} lineItems
 * @returns {Array<Object>} lineItems with unique codes
 */
const deduplicateLineItemCodes = lineItems => {
  const seenCodes = new Set();
  return lineItems.map(item => {
    let code = item.code;
    if (seenCodes.has(code)) {
      let counter = 2;
      while (seenCodes.has(`${code}-${counter}`)) {
        counter++;
      }
      code = `${code}-${counter}`;
    }
    seenCodes.add(code);
    return { ...item, code };
  });
};

/**
 * Get pricing rule line items for hourly bookings.
 * Reads pricingRules from publicData, with backward compatibility for legacy
 * eveningSurchargePerHourSubunits field.
 *
 * @param {Object} orderData
 * @param {Object} listing full listing object
 * @param {string} currency
 * @returns {Array} surcharge line items (empty array if not applicable)
 */
const getPricingRuleLineItems = (orderData, listing, currency) => {
  const publicData = listing?.attributes?.publicData || {};
  const availabilityPlanTz = listing?.attributes?.availabilityPlan?.timezone;
  const timezone = publicData.listingTimezone || availabilityPlanTz || 'Europe/Zurich';

  let rules = publicData.pricingRules;

  // Backward compatibility: convert legacy evening surcharge to a pricing rule
  if (!Array.isArray(rules) || rules.length === 0) {
    const { eveningSurchargePerHourSubunits, businessHoursEnd } = publicData;
    if (eveningSurchargePerHourSubunits && eveningSurchargePerHourSubunits > 0) {
      rules = [
        {
          type: 'time-of-day',
          label: 'evening-surcharge',
          surchargePerHourSubunits: eveningSurchargePerHourSubunits,
          fromHour: businessHoursEnd || 17,
          toHour: 24,
        },
      ];
    } else {
      return [];
    }
  }

  const lineItems = rules
    .map(rule => {
      const handler = RULE_TYPE_HANDLERS[rule.type];
      return handler ? handler(rule, orderData, timezone, currency) : null;
    })
    .filter(Boolean);

  return deduplicateLineItemCodes(lineItems);
};

/**
 * Get quantity for arbitrary units for time-based bookings.
 *
 * @param {Object} orderData
 * @param {string} orderData.bookingStart
 * @param {string} orderData.bookingEnd
 * @param {number} [orderData.seats]
 */
const getHourQuantityAndLineItems = orderData => {
  const { bookingStart, bookingEnd, seats } = orderData || {};
  const hasSeats = !!seats;
  const units =
    bookingStart && bookingEnd ? calculateQuantityFromHours(bookingStart, bookingEnd) : null;

  // If there are seats, the quantity is split to factors: units and seats.
  // E.g. 3 hours x 2 seats (aka unit price is multiplied by 6)
  return hasSeats ? { units, seats, extraLineItems: [] } : { quantity: units, extraLineItems: [] };
};

/**
 * Calculate quantity based on days or nights between given bookingDates.
 *
 * @param {Object} orderData
 * @param {string} orderData.bookingStart
 * @param {string} orderData.bookingEnd
 * @param {number} [orderData.seats]
 * @param {'line-item/day' | 'line-item/night'} code
 */
const getDateRangeQuantityAndLineItems = (orderData, code) => {
  const { bookingStart, bookingEnd, seats } = orderData;
  const hasSeats = !!seats;
  const units =
    bookingStart && bookingEnd ? calculateQuantityFromDates(bookingStart, bookingEnd, code) : null;

  // If there are seats, the quantity is split to factors: units and seats.
  // E.g. 3 nights x 4 seats (aka unit price is multiplied by 12)
  return hasSeats ? { units, seats, extraLineItems: [] } : { quantity: units, extraLineItems: [] };
};

/**
 * Returns collection of lineItems (max 50)
 *
 * All the line-items dedicated to _customer_ define the "payin total".
 * Similarly, the sum of all the line-items included for _provider_ create "payout total".
 * Platform gets the commission, which is the difference between payin and payout totals.
 *
 * Each line items has following fields:
 * - `code`: string, mandatory, indentifies line item type (e.g. \"line-item/cleaning-fee\"), maximum length 64 characters.
 * - `unitPrice`: money, mandatory
 * - `lineTotal`: money
 * - `quantity`: number
 * - `percentage`: number (e.g. 15.5 for 15.5%)
 * - `seats`: number
 * - `units`: number
 * - `includeFor`: array containing strings \"customer\" or \"provider\", default [\":customer\"  \":provider\" ]
 *
 * Line item must have either `quantity` or `percentage` or both `seats` and `units`.
 *
 * `includeFor` defines commissions. Customer commission is added by defining `includeFor` array `["customer"]` and provider commission by `["provider"]`.
 *
 * @param {Object} listing
 * @param {Object} orderData
 * @param {string} [orderData.priceVariantName] - The name of the price variant (potentially used with bookable unit types)
 * @param {Money} [orderData.offer] - The offer for the offer (if transition intent is "make-offer")
 * @param {Object} providerCommission
 * @param {Object} customerCommission
 * @returns {Array} lineItems
 */
exports.transactionLineItems = (listing, orderData, providerCommission, customerCommission) => {
  const publicData = listing.attributes.publicData;
  // Note: the unitType needs to be one of the following:
  // day, night, hour, fixed, week, month, or item (these are related to payment processes)
  const { unitType, priceVariants, priceVariationsEnabled } = publicData;

  const isBookable = ['day', 'night', 'hour', 'fixed', 'week', 'month'].includes(unitType);
  const isNegotiationUnitType = ['offer', 'request'].includes(unitType);
  const priceAttribute = listing.attributes.price;
  const currency = priceAttribute?.currency || orderData.currency;

  const { priceVariantName, offer } = orderData || {};
  const priceVariantConfig = priceVariants
    ? priceVariants.find(pv => pv.name === priceVariantName)
    : null;
  const { priceInSubunits } = priceVariantConfig || {};
  const isPriceInSubunitsValid = Number.isInteger(priceInSubunits) && priceInSubunits >= 0;

  const unitPrice =
    isBookable && priceVariationsEnabled && isPriceInSubunitsValid
      ? new Money(priceInSubunits, currency)
      : offer instanceof Money && isNegotiationUnitType
      ? offer
      : priceAttribute;

  /**
   * Pricing starts with order's base price:
   * Listing's price is related to a single unit. It needs to be multiplied by quantity
   *
   * Initial line-item needs therefore:
   * - code (based on unitType)
   * - unitPrice
   * - quantity
   * - includedFor
   */

  const code = `line-item/${unitType}`;

  // Here "extra line-items" means line-items that are tied to unit type
  // E.g. by default, "shipping-fee" is tied to 'item' aka buying products.
  const quantityAndExtraLineItems =
    unitType === 'item'
      ? getItemQuantityAndLineItems(orderData, publicData, currency)
      : unitType === 'fixed'
      ? getFixedQuantityAndLineItems(orderData)
      : unitType === 'hour'
      ? getHourQuantityAndLineItems(orderData)
      : ['day', 'night', 'week', 'month'].includes(unitType)
      ? getDateRangeQuantityAndLineItems(orderData, code)
      : isNegotiationUnitType
      ? getOfferQuantityAndLineItems(orderData)
      : {};

  const { quantity, units, seats, extraLineItems } = quantityAndExtraLineItems;

  // Throw error if there is no quantity information given
  if (!quantity && !(units && seats)) {
    const missingFields = [];

    if (!quantity) missingFields.push('quantity');
    if (!units) missingFields.push('units');
    if (!seats) missingFields.push('seats');

    const message = `Error: orderData is missing the following information: ${missingFields.join(
      ', '
    )}. Quantity or either units & seats is required.`;

    const error = new Error(message);
    error.status = 400;
    error.statusText = message;
    error.data = {};
    throw error;
  }

  /**
   * If you want to use pre-defined component and translations for printing the lineItems base price for order,
   * you should use one of the codes:
   * line-item/night, line-item/day, line-item/hour or line-item/item.
   *
   * Pre-definded commission components expects line item code to be one of the following:
   * 'line-item/provider-commission', 'line-item/customer-commission'
   *
   * By default OrderBreakdown prints line items inside LineItemUnknownItemsMaybe if the lineItem code is not recognized. */

  const quantityOrSeats = !!units && !!seats ? { units, seats } : { quantity };
  const order = {
    code,
    unitPrice,
    ...quantityOrSeats,
    includeFor: ['customer', 'provider'],
  };

  // Dynamic pricing rules for hourly bookings (surcharges based on time-of-day, etc.)
  const surchargeLineItems =
    unitType === 'hour' ? getPricingRuleLineItems(orderData, listing, currency) : [];

  // Commission is calculated on commissionable line items (base order + surcharges)
  const commissionableLineItems = [order, ...surchargeLineItems];

  // Let's keep the base price (order) as first line item and provider and customer commissions as last.
  // Note: the order matters only if OrderBreakdown component doesn't recognize line-item.
  const lineItems = [
    order,
    ...extraLineItems,
    ...surchargeLineItems,
    ...getProviderCommissionMaybe(providerCommission, commissionableLineItems, currency),
    ...getCustomerCommissionMaybe(customerCommission, commissionableLineItems, currency),
  ];

  return lineItems;
};
