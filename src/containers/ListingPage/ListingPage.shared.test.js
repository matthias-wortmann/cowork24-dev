import { createCurrentUser, createListing, createUser } from '../../util/testData';
import { handleSubmit } from './ListingPage.shared';

describe('ListingPage.shared handleSubmit soft-booking flow', () => {
  const createRoutes = checkoutSetInitialValues => [
    {
      name: 'CheckoutPage',
      setInitialValues: checkoutSetInitialValues,
      path: '/checkout/:id/:slug',
    },
    {
      name: 'OrderDetailsPage',
      path: '/order/:id',
    },
    {
      name: 'SoftBookingCheckoutPage',
      path: '/soft-booking-checkout',
    },
  ];

  it('routes to SoftBookingCheckoutPage when provider has no Stripe Connect', async () => {
    const listing = createListing(
      'listing-soft-booking',
      {
        publicData: {
          transactionProcessAlias: 'default-booking/release-1',
          unitType: 'day',
        },
      },
      { author: createUser('provider-1', { stripeConnected: false }) }
    );
    const currentUser = createCurrentUser('customer-1');
    const getListing = jest.fn(() => listing);
    const callSetInitialValues = jest.fn();
    const onInitializeCardPaymentData = jest.fn();
    const push = jest.fn();
    const onSendInquiry = jest.fn(() => Promise.resolve({ uuid: 'tx-soft-1' }));
    const checkoutSetInitialValues = jest.fn();

    const submit = handleSubmit({
      history: { push },
      params: { id: listing.id.uuid, slug: 'listing-soft-booking' },
      currentUser,
      getListing,
      callSetInitialValues,
      onInitializeCardPaymentData,
      onSendInquiry,
      routes: createRoutes(checkoutSetInitialValues),
    });

    submit({
      bookingDates: {
        startDate: new Date('2026-05-04T08:00:00.000Z'),
        endDate: new Date('2026-05-04T10:00:00.000Z'),
      },
      quantity: '2',
      seats: '1',
      deliveryMethod: 'pickup',
      priceVariantName: 'Morning',
    });

    await Promise.resolve();

    expect(onSendInquiry).not.toHaveBeenCalled();
    expect(callSetInitialValues).not.toHaveBeenCalled();
    expect(onInitializeCardPaymentData).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledTimes(1);
    const [route, state] = push.mock.calls[0];
    expect(route).toBe('/soft-booking-checkout');
    expect(state).toMatchObject({
      listingId: listing.id.uuid,
      listingTitle: listing.attributes.title,
    });
  });

  it('passes booking dates in state when routing to SoftBookingCheckoutPage', async () => {
    const listing = createListing(
      'listing-soft-message',
      {
        publicData: {
          transactionProcessAlias: 'default-booking/release-1',
          unitType: 'day',
        },
      },
      { author: createUser('provider-1', { stripeConnected: false }) }
    );
    const currentUser = createCurrentUser('customer-1');
    const push = jest.fn();

    const submit = handleSubmit({
      history: { push },
      params: { id: listing.id.uuid, slug: 'listing-soft-message' },
      currentUser,
      getListing: jest.fn(() => listing),
      callSetInitialValues: jest.fn(),
      onInitializeCardPaymentData: jest.fn(),
      onSendInquiry: jest.fn(),
      routes: createRoutes(jest.fn()),
    });

    const startDate = new Date('2026-05-04T08:00:00.000Z');
    const endDate = new Date('2026-05-04T10:00:00.000Z');
    submit({
      bookingDates: { startDate, endDate },
      quantity: '1',
      initialMessage: '  Bitte 30 Minuten vorher aufschließen. ',
    });

    await Promise.resolve();

    const [, state] = push.mock.calls[0];
    expect(state.bookingStart).toEqual(startDate);
    expect(state.bookingEnd).toEqual(endDate);
  });

  it('passes booking dates from bookingStartDate/bookingEndDate fields to SoftBookingCheckoutPage', async () => {
    const listing = createListing(
      'listing-soft-date-only',
      {
        publicData: {
          transactionProcessAlias: 'default-booking/release-1',
          unitType: 'day',
        },
      },
      { author: createUser('provider-1', { stripeConnected: false }) }
    );
    const currentUser = createCurrentUser('customer-1');
    const push = jest.fn();

    const submit = handleSubmit({
      history: { push },
      params: { id: listing.id.uuid, slug: 'listing-soft-date-only' },
      currentUser,
      getListing: jest.fn(() => listing),
      callSetInitialValues: jest.fn(),
      onInitializeCardPaymentData: jest.fn(),
      onSendInquiry: jest.fn(),
      routes: createRoutes(jest.fn()),
    });

    submit({
      bookingStartDate: { date: new Date('2026-06-10T00:00:00.000Z') },
      bookingEndDate: { date: new Date('2026-06-12T00:00:00.000Z') },
      quantity: '1',
    });

    await Promise.resolve();

    expect(push).toHaveBeenCalledTimes(1);
    const [route] = push.mock.calls[0];
    expect(route).toBe('/soft-booking-checkout');
  });

  it('keeps regular checkout flow when provider Stripe Connect exists', () => {
    const listing = createListing(
      'listing-regular-checkout',
      {
        publicData: {
          transactionProcessAlias: 'default-booking/release-1',
          unitType: 'day',
        },
      },
      { author: createUser('provider-2', { stripeConnected: true }) }
    );
    const currentUser = createCurrentUser('customer-2');
    const getListing = jest.fn(() => listing);
    const callSetInitialValues = jest.fn();
    const onInitializeCardPaymentData = jest.fn();
    const push = jest.fn();
    const onSendInquiry = jest.fn();
    const checkoutSetInitialValues = jest.fn();

    const submit = handleSubmit({
      history: { push },
      params: { id: listing.id.uuid, slug: 'listing-regular-checkout' },
      currentUser,
      getListing,
      callSetInitialValues,
      onInitializeCardPaymentData,
      onSendInquiry,
      routes: createRoutes(checkoutSetInitialValues),
    });

    submit({
      bookingDates: {
        startDate: new Date('2026-05-04T08:00:00.000Z'),
        endDate: new Date('2026-05-04T10:00:00.000Z'),
      },
      quantity: '2',
    });

    expect(onSendInquiry).not.toHaveBeenCalled();
    expect(callSetInitialValues).toHaveBeenCalledTimes(1);
    expect(onInitializeCardPaymentData).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      '/checkout/listing-regular-checkout/listing-regular-checkout-title'
    );
  });
});
