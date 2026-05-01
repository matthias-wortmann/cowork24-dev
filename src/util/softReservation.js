import {
  OFFER,
  isBookingProcess,
  isNegotiationProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../transactions/transaction';

export const SOFT_RESERVATION_STATUS_SETUP_PENDING = 'setup-pending';
export const SOFT_RESERVATION_SETUP_DEADLINE_HOURS = 24;

const formatDateMaybe = value => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }
  return value.toISOString();
};

const normalizeBookingDates = orderData => {
  const nested = orderData?.bookingDates;
  if (nested?.bookingStart && nested?.bookingEnd) {
    return nested;
  }
  if (nested?.startDate && nested?.endDate) {
    return {
      bookingStart: nested.startDate,
      bookingEnd: nested.endDate,
    };
  }
  if (orderData?.bookingStart && orderData?.bookingEnd) {
    return {
      bookingStart: orderData.bookingStart,
      bookingEnd: orderData.bookingEnd,
    };
  }
  return null;
};

export const requiresSoftReservationFallback = listing => {
  const transactionProcessAlias = listing?.attributes?.publicData?.transactionProcessAlias || '';
  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const unitType = listing?.attributes?.publicData?.unitType;
  const isPaymentProcess =
    isBookingProcess(processName) ||
    isPurchaseProcess(processName) ||
    (isNegotiationProcess(processName) && unitType === OFFER);
  // currentUser.attributes.stripeConnected is private and not available on included
  // author entities via the Marketplace API. We mirror it into profile.publicData
  // (see stripeConnectAccount.duck.js / user.duck.js) so it is readable by anyone.
  const authorPublicData = listing?.author?.attributes?.profile?.publicData;
  const authorStripeConnected = !!authorPublicData?.stripeConnected;

  // Debug: log what the API returned for the author so we can diagnose detection
  if (typeof window !== 'undefined') {
    console.log('[softReservation] author.attributes:', listing?.author?.attributes);
    console.log('[softReservation] authorPublicData:', authorPublicData);
    console.log('[softReservation] authorStripeConnected:', authorStripeConnected);
    console.log('[softReservation] isPaymentProcess:', isPaymentProcess, '→ requiresFallback:', isPaymentProcess && !authorStripeConnected);
  }

  return isPaymentProcess && !authorStripeConnected;
};

/**
 * Structured booking-like payload for soft reservations.
 * Stored in transaction protectedData.
 */
export const createSoftReservationProtectedData = orderData => {
  const bookingDates = normalizeBookingDates(orderData);
  const setupDeadline = new Date(
    Date.now() + SOFT_RESERVATION_SETUP_DEADLINE_HOURS * 60 * 60 * 1000
  );

  return {
    softReservation: {
      status: SOFT_RESERVATION_STATUS_SETUP_PENDING,
      setupDeadline: setupDeadline.toISOString(),
      bookingStart: formatDateMaybe(bookingDates?.bookingStart),
      bookingEnd: formatDateMaybe(bookingDates?.bookingEnd),
      priceVariantName: orderData?.priceVariantName || null,
      quantity: Number.isInteger(orderData?.quantity) ? orderData.quantity : null,
      seats: Number.isInteger(orderData?.seats) ? orderData.seats : null,
      deliveryMethod: orderData?.deliveryMethod || null,
    },
  };
};
