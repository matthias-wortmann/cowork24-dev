import { getProcess } from '../../transactions/transaction';
import * as bookingTransitions from '../../transactions/transactionProcessBooking';
import * as negotiationTransitions from '../../transactions/transactionProcessNegotiation';
import { createTransaction } from '../../util/testData';
import {
  bookingDatesFromOrderData,
  getRequestPaymentTransition,
  hasShippingDetailsForOrder,
  processCheckoutWithPayment,
} from './CheckoutPageTransactionHelpers';

describe('bookingDatesFromOrderData', () => {
  it('returns nested bookingDates when present', () => {
    const start = new Date('2026-04-01T10:00:00Z');
    const end = new Date('2026-04-01T12:00:00Z');
    expect(
      bookingDatesFromOrderData({
        bookingDates: { bookingStart: start, bookingEnd: end },
      })
    ).toEqual({ bookingStart: start, bookingEnd: end });
  });

  it('returns flat bookingStart/bookingEnd when nested bookingDates missing', () => {
    const start = new Date('2026-04-01T10:00:00Z');
    const end = new Date('2026-04-01T12:00:00Z');
    expect(bookingDatesFromOrderData({ bookingStart: start, bookingEnd: end })).toEqual({
      bookingStart: start,
      bookingEnd: end,
    });
  });

  it('returns null when incomplete', () => {
    expect(bookingDatesFromOrderData({ bookingStart: new Date() })).toBe(null);
    expect(bookingDatesFromOrderData(null)).toBe(null);
  });
});

describe('getRequestPaymentTransition', () => {
  it('returns REQUEST_PAYMENT for purchase without transaction', () => {
    const process = getProcess('default-purchase');
    expect(getRequestPaymentTransition(process, 'default-purchase', null)).toBe(
      bookingTransitions.transitions.REQUEST_PAYMENT
    );
  });

  it('returns REQUEST_PAYMENT_AFTER_INQUIRY when last transition is inquire (booking)', () => {
    const process = getProcess('default-booking');
    const tx = createTransaction({
      processName: 'default-booking',
      lastTransition: bookingTransitions.transitions.INQUIRE,
      transitions: [
        {
          createdAt: new Date(),
          by: 'customer',
          transition: bookingTransitions.transitions.INQUIRE,
        },
      ],
    });
    expect(getRequestPaymentTransition(process, 'default-booking', tx)).toBe(
      bookingTransitions.transitions.REQUEST_PAYMENT_AFTER_INQUIRY
    );
  });

  it('returns REQUEST_PAYMENT_TO_ACCEPT_OFFER for negotiation in offer-pending', () => {
    const process = getProcess('default-negotiation');
    const tx = createTransaction({
      processName: 'default-negotiation',
      lastTransition: negotiationTransitions.transitions.MAKE_OFFER,
      transitions: [
        {
          createdAt: new Date(),
          by: 'provider',
          transition: negotiationTransitions.transitions.MAKE_OFFER,
        },
      ],
    });
    expect(getRequestPaymentTransition(process, 'default-negotiation', tx)).toBe(
      negotiationTransitions.transitions.REQUEST_PAYMENT_TO_ACCEPT_OFFER
    );
  });

  it('returns null for negotiation without transaction (no speculate payment)', () => {
    const process = getProcess('default-negotiation');
    expect(getRequestPaymentTransition(process, 'default-negotiation', null)).toBe(null);
  });

  it('returns null for negotiation when not in offer-pending', () => {
    const process = getProcess('default-negotiation');
    const tx = createTransaction({
      processName: 'default-negotiation',
      lastTransition: negotiationTransitions.transitions.INQUIRE,
      transitions: [
        {
          createdAt: new Date(),
          by: 'provider',
          transition: negotiationTransitions.transitions.INQUIRE,
        },
      ],
    });
    expect(getRequestPaymentTransition(process, 'default-negotiation', tx)).toBe(null);
  });
});

describe('hasShippingDetailsForOrder', () => {
  it('returns true when name, line1 and postal are set', () => {
    expect(
      hasShippingDetailsForOrder({
        recipientName: 'A',
        recipientAddressLine1: 'B',
        recipientPostal: 'C',
      })
    ).toBe(true);
  });

  it('returns false when any required field is missing', () => {
    expect(
      hasShippingDetailsForOrder({
        recipientName: 'A',
        recipientAddressLine1: 'B',
      })
    ).toBe(false);
    expect(hasShippingDetailsForOrder(null)).toBe(false);
  });
});

describe('processCheckoutWithPayment', () => {
  it('rejects early when listing processAlias is missing', async () => {
    const process = getProcess('default-booking');
    await expect(
      processCheckoutWithPayment(
        { listingId: { uuid: 'listing-1' } },
        {
          hasPaymentIntentUserActionsDone: false,
          isPaymentFlowUseSavedCard: false,
          isPaymentFlowPayAndSaveCard: false,
          isPaymentFlowWallet: false,
          walletPaymentMethodId: null,
          message: null,
          onConfirmCardPayment: jest.fn(),
          onConfirmPayment: jest.fn(),
          onInitiateOrder: jest.fn(),
          onSavePaymentMethod: jest.fn(),
          onSendMessage: jest.fn(),
          pageData: { listing: { attributes: { publicData: {} } }, transaction: null },
          paymentIntent: null,
          process,
          setPageData: jest.fn(),
          sessionStorageKey: 'CheckoutPage',
          stripeCustomer: null,
          stripePaymentMethodId: null,
          stripe: {},
        }
      )
    ).rejects.toThrow(/missing transaction process alias/i);
  });

  it('handles missing payment_method in save-card flow gracefully', async () => {
    const process = getProcess('default-booking');
    const storedTxBase = createTransaction({
      id: 'tx-pay-save-1',
      processName: 'default-booking',
    });
    const storedTx = {
      ...storedTxBase,
      attributes: {
        ...storedTxBase.attributes,
        protectedData: {
          stripePaymentIntents: {
            default: { stripePaymentIntentClientSecret: 'pi_secret_123' },
          },
        },
      },
    };
    const confirmedTx = createTransaction({
      id: 'tx-pay-save-1',
      processName: 'default-booking',
      lastTransition: bookingTransitions.transitions.CONFIRM_PAYMENT,
    });

    const onSavePaymentMethod = jest.fn();
    const result = await processCheckoutWithPayment(
      { listingId: { uuid: 'listing-1' } },
      {
        hasPaymentIntentUserActionsDone: true,
        isPaymentFlowUseSavedCard: false,
        isPaymentFlowPayAndSaveCard: true,
        isPaymentFlowWallet: false,
        walletPaymentMethodId: null,
        message: null,
        onConfirmCardPayment: jest.fn(),
        onConfirmPayment: jest.fn(() => Promise.resolve(confirmedTx)),
        onInitiateOrder: jest.fn(),
        onSavePaymentMethod,
        onSendMessage: jest.fn(() =>
          Promise.resolve({ orderId: confirmedTx.id, messageSuccess: true })
        ),
        pageData: {
          listing: {
            attributes: { publicData: { transactionProcessAlias: 'default-booking/release-1' } },
          },
          orderData: { quantity: 1 },
          transaction: storedTx,
        },
        paymentIntent: { status: 'requires_capture' },
        process,
        setPageData: jest.fn(),
        sessionStorageKey: 'CheckoutPage',
        stripeCustomer: null,
        stripePaymentMethodId: null,
        stripe: {},
      }
    );

    expect(onSavePaymentMethod).not.toHaveBeenCalled();
    expect(result.paymentMethodSaved).toBe(false);
  });
});
