import { createListing, createUser } from './testData';
import {
  createSoftReservationProtectedData,
  requiresSoftReservationFallback,
  SOFT_RESERVATION_STATUS_SETUP_PENDING,
} from './softReservation';

describe('softReservation', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-25T10:00:00.000Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true for booking listing with disconnected provider stripe', () => {
    const listing = createListing(
      'listing-soft-booking',
      {
        publicData: {
          transactionProcessAlias: 'default-booking/release-1',
          unitType: 'day',
        },
      },
      { author: createUser('provider-1', { profile: { displayName: 'Provider 1', abbreviatedName: 'P1', publicData: { stripeConnected: false } } }) }
    );

    expect(requiresSoftReservationFallback(listing)).toBe(true);
  });

  it('returns false when provider stripe is connected', () => {
    const listing = createListing(
      'listing-stripe-ready',
      {
        publicData: {
          transactionProcessAlias: 'default-booking/release-1',
          unitType: 'day',
        },
      },
      { author: createUser('provider-2', { profile: { displayName: 'Provider 2', abbreviatedName: 'P2', publicData: { stripeConnected: true } } }) }
    );

    expect(requiresSoftReservationFallback(listing)).toBe(false);
  });

  it('creates structured booking details for transaction protectedData', () => {
    const protectedData = createSoftReservationProtectedData({
      bookingDates: {
        bookingStart: new Date('2026-05-01T08:00:00.000Z'),
        bookingEnd: new Date('2026-05-01T10:00:00.000Z'),
      },
      quantity: 2,
      seats: 1,
      priceVariantName: 'Morning slot',
      deliveryMethod: 'pickup',
    });

    expect(protectedData.softReservation.status).toBe(SOFT_RESERVATION_STATUS_SETUP_PENDING);
    expect(protectedData.softReservation.setupDeadline).toBe('2026-04-26T10:00:00.000Z');
    expect(protectedData).toEqual({
      softReservation: {
        status: SOFT_RESERVATION_STATUS_SETUP_PENDING,
        setupDeadline: '2026-04-26T10:00:00.000Z',
        bookingStart: '2026-05-01T08:00:00.000Z',
        bookingEnd: '2026-05-01T10:00:00.000Z',
        priceVariantName: 'Morning slot',
        quantity: 2,
        seats: 1,
        deliveryMethod: 'pickup',
      },
    });
  });
});
