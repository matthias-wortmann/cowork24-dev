/**
 * Transaction process graph for soft bookings:
 *   - cowork24-soft-booking
 */

/**
 * Transitions
 *
 * These strings must sync with values defined in Marketplace API,
 * since transaction objects given by API contain info about last transitions.
 * All the actions in API side happen in transitions,
 * so we need to understand what those strings mean.
 */

export const transitions = {
  // When a customer makes a soft booking request, a transaction is
  // created without immediate payment. The provider can then accept
  // and charge, or decline the request.
  REQUEST_SOFT_BOOKING: 'transition/request-soft-booking',

  // If the provider does not respond in time, the request expires automatically.
  EXPIRE_REQUEST: 'transition/expire-request',

  // When the provider declines the soft booking request.
  DECLINE: 'transition/decline',

  // When the customer cancels before the provider accepts.
  CUSTOMER_CANCEL: 'transition/customer-cancel',

  // When the provider accepts and triggers payment capture.
  ACCEPT_AND_CHARGE: 'transition/accept-and-charge',

  // The backend will mark the transaction completed.
  COMPLETE: 'transition/complete',

  // Reviews are given through transaction transitions. Review 1 can be
  // by provider or customer, and review 2 will be the other party of
  // the transaction.
  REVIEW_1_BY_CUSTOMER: 'transition/review-1-by-customer',
  REVIEW_1_BY_PROVIDER: 'transition/review-1-by-provider',
  REVIEW_2_BY_CUSTOMER: 'transition/review-2-by-customer',
  REVIEW_2_BY_PROVIDER: 'transition/review-2-by-provider',
  EXPIRE_CUSTOMER_REVIEW_PERIOD: 'transition/expire-customer-review-period',
  EXPIRE_PROVIDER_REVIEW_PERIOD: 'transition/expire-provider-review-period',
  EXPIRE_REVIEW_PERIOD: 'transition/expire-review-period',
};

/**
 * States
 *
 * These constants are only for making it clear how transitions work together.
 * You should not use these constants outside of this file.
 *
 * Note: these states are not in sync with states used transaction process definitions
 *       in Marketplace API. Only last transitions are passed along transaction object.
 */
export const states = {
  INITIAL: 'initial',
  SOFT_REQUESTED: 'soft-requested',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  DELIVERED: 'delivered',
  REVIEWED: 'reviewed',
  REVIEWED_BY_CUSTOMER: 'reviewed-by-customer',
  REVIEWED_BY_PROVIDER: 'reviewed-by-provider',
};

/**
 * Description of transaction process graph
 *
 * You should keep this in sync with transaction process defined in Marketplace API
 *
 * Note: we don't use yet any state machine library,
 *       but this description format is following Xstate (FSM library)
 *       https://xstate.js.org/docs/
 */
export const graph = {
  // id is defined only to support Xstate format.
  // However if you have multiple transaction processes defined,
  // it is best to keep them in sync with transaction process aliases.
  id: 'cowork24-soft-booking/release-1',

  // This 'initial' state is a starting point for new transaction
  initial: states.INITIAL,

  // States
  states: {
    [states.INITIAL]: {
      on: {
        [transitions.REQUEST_SOFT_BOOKING]: states.SOFT_REQUESTED,
      },
    },

    [states.SOFT_REQUESTED]: {
      on: {
        [transitions.EXPIRE_REQUEST]: states.EXPIRED,
        [transitions.DECLINE]: states.DECLINED,
        [transitions.CUSTOMER_CANCEL]: states.CANCELLED,
        [transitions.ACCEPT_AND_CHARGE]: states.ACCEPTED,
      },
    },

    [states.EXPIRED]: {},
    [states.DECLINED]: {},
    [states.CANCELLED]: {},
    [states.ACCEPTED]: {
      on: {
        [transitions.COMPLETE]: states.DELIVERED,
      },
    },

    [states.DELIVERED]: {
      on: {
        [transitions.EXPIRE_REVIEW_PERIOD]: states.REVIEWED,
        [transitions.REVIEW_1_BY_CUSTOMER]: states.REVIEWED_BY_CUSTOMER,
        [transitions.REVIEW_1_BY_PROVIDER]: states.REVIEWED_BY_PROVIDER,
      },
    },

    [states.REVIEWED_BY_CUSTOMER]: {
      on: {
        [transitions.REVIEW_2_BY_PROVIDER]: states.REVIEWED,
        [transitions.EXPIRE_PROVIDER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED_BY_PROVIDER]: {
      on: {
        [transitions.REVIEW_2_BY_CUSTOMER]: states.REVIEWED,
        [transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED]: { type: 'final' },
  },
};

// Check if a transition is the kind that should be rendered
// when showing transition history (e.g. ActivityFeed)
// The first transition and most of the expiration transitions made by system are not relevant
export const isRelevantPastTransition = transition => {
  return [
    transitions.REQUEST_SOFT_BOOKING,
    transitions.ACCEPT_AND_CHARGE,
    transitions.COMPLETE,
    transitions.DECLINE,
    transitions.CUSTOMER_CANCEL,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
  ].includes(transition);
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
export const isCustomerReview = transition => {
  return [transitions.REVIEW_1_BY_CUSTOMER, transitions.REVIEW_2_BY_CUSTOMER].includes(transition);
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
export const isProviderReview = transition => {
  return [transitions.REVIEW_1_BY_PROVIDER, transitions.REVIEW_2_BY_PROVIDER].includes(transition);
};

// Check if the given transition is privileged.
//
// Privileged transitions need to be handled from a secure context,
// i.e. the backend. This helper is used to check if the transition
// should go through the local API endpoints, or if using JS SDK is
// enough.
export const isPrivileged = transition => {
  return [transitions.REQUEST_SOFT_BOOKING, transitions.ACCEPT_AND_CHARGE].includes(transition);
};

// Check when transaction is completed (booking over)
export const isCompleted = transition => {
  const txCompletedTransitions = [
    transitions.COMPLETE,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
    transitions.EXPIRE_REVIEW_PERIOD,
    transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD,
    transitions.EXPIRE_PROVIDER_REVIEW_PERIOD,
  ];
  return txCompletedTransitions.includes(transition);
};

// Check when transaction is refunded (booking did not happen)
export const isRefunded = transition => {
  const txRefundedTransitions = [
    transitions.DECLINE,
    transitions.CUSTOMER_CANCEL,
    transitions.EXPIRE_REQUEST,
  ];
  return txRefundedTransitions.includes(transition);
};

// Check if the transition is a soft booking request
export const isSoftRequested = transition => {
  return transition === transitions.REQUEST_SOFT_BOOKING;
};

// Check if the transition is an acceptance with charge
export const isAccepted = transition => {
  return transition === transitions.ACCEPT_AND_CHARGE;
};

// Check if the transition is a decline
export const isDeclined = transition => {
  return transition === transitions.DECLINE;
};

// Check if the transition is an expiry of the request
export const isExpired = transition => {
  return transition === transitions.EXPIRE_REQUEST;
};

// Check if the transition is a customer cancellation
export const isCancelled = transition => {
  return transition === transitions.CUSTOMER_CANCEL;
};

// Check if the transition means both parties have reviewed
export const isReviewedByBoth = transition => {
  return [transitions.REVIEW_2_BY_CUSTOMER, transitions.REVIEW_2_BY_PROVIDER].includes(transition);
};

export const statesNeedingProviderAttention = [states.SOFT_REQUESTED];
