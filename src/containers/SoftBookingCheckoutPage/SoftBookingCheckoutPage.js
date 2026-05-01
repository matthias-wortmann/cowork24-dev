import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { loadStripeJs } from '../../util/loadStripe';
import { softBookingSetupIntent, softBookingInitiate } from '../../util/api';
import {
  addPaymentMethod,
  createStripeCustomer,
} from '../../ducks/paymentMethods.duck';

import { LayoutSingleColumn, Page, PrimaryButton, Heading } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './SoftBookingCheckoutPage.module.css';

// -------------------------------------------------------------------
// Stripe card styles (mirrors StripePaymentForm / PaymentMethodsForm)
// -------------------------------------------------------------------
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const cardStyles = {
  base: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", Helvetica, Arial, sans-serif',
    fontSize: isMobile ? '14px' : '16px',
    fontSmoothing: 'antialiased',
    lineHeight: '24px',
    letterSpacing: '-0.1px',
    color: '#4A4A4A',
    '::placeholder': {
      color: '#B2B2B2',
    },
  },
};

const stripeElementsOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css?family=Inter',
    },
  ],
};

// -------------------------------------------------------------------
// Progress indicator
// -------------------------------------------------------------------
const ProgressIndicator = ({ step }) => {
  if (step === 'saving-card') {
    return (
      <p className={css.progress}>
        <FormattedMessage id="SoftBookingCheckoutPage.step1Progress" />
      </p>
    );
  }
  if (step === 'registering-card') {
    return (
      <p className={css.progress}>
        <FormattedMessage id="SoftBookingCheckoutPage.step2Progress" />
      </p>
    );
  }
  if (step === 'initiating') {
    return (
      <p className={css.progress}>
        <FormattedMessage id="SoftBookingCheckoutPage.step3Progress" />
      </p>
    );
  }
  return null;
};

// -------------------------------------------------------------------
// Booking summary (right column)
// -------------------------------------------------------------------
const BookingSummary = ({ listingTitle, bookingStart, bookingEnd, price, intl }) => {
  const startStr = bookingStart
    ? new Date(bookingStart).toLocaleDateString(intl.locale)
    : '–';
  const endStr = bookingEnd ? new Date(bookingEnd).toLocaleDateString(intl.locale) : '–';
  const priceStr =
    price && price.amount != null
      ? `${(price.amount / 100).toFixed(2)} ${price.currency}`
      : '–';

  return (
    <div className={css.bookingSummary}>
      <Heading as="h3" rootClassName={css.summaryHeading}>
        <FormattedMessage id="SoftBookingCheckoutPage.bookingSummaryTitle" />
      </Heading>
      {listingTitle ? <p className={css.summaryTitle}>{listingTitle}</p> : null}
      <p className={css.summaryDates}>
        <FormattedMessage id="SoftBookingCheckoutPage.bookingDates" />
        {': '}
        {startStr} – {endStr}
      </p>
      <p className={css.summaryPrice}>{priceStr}</p>
    </div>
  );
};

// -------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------
const SoftBookingCheckoutPage = () => {
  const history = useHistory();
  const intl = useIntl();
  const config = useConfiguration();
  const dispatch = useDispatch();

  // Redux: current user
  const currentUser = useSelector(state => state.user.currentUser);

  // Location state (passed from ListingPage via history.push)
  const locationState = history.location.state || {};
  const { listingId, bookingStart, bookingEnd, listingTitle, price } = locationState;

  // ---------------- Local state ----------------
  const [clientSecret, setClientSecret] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // step: 'idle' | 'saving-card' | 'registering-card' | 'initiating' | 'done' | 'error'
  const [step, setStep] = useState('idle');
  const [errorStep, setErrorStep] = useState(null); // 1 | 2 | 3
  const [errorMsg, setErrorMsg] = useState(null);
  const [paymentMethodId, setPaymentMethodId] = useState(null);

  // Stripe refs (using raw Stripe.js — matching StripePaymentForm / PaymentMethodsForm pattern)
  const stripeRef = useRef(null);
  const cardRef = useRef(null);
  const cardContainerRef = useRef(null);
  const stripeMountActiveRef = useRef(false);

  // ---------------- Fetch SetupIntent on mount ----------------
  useEffect(() => {
    softBookingSetupIntent()
      .then(({ clientSecret: cs }) => setClientSecret(cs))
      .catch(() =>
        setFetchError(intl.formatMessage({ id: 'SoftBookingCheckoutPage.serviceUnavailable' }))
      );
  }, []); // mount only once

  // ---------------- Mount Stripe card element ----------------
  useEffect(() => {
    const publishableKey = config?.stripe?.publishableKey;
    if (!publishableKey || !cardContainerRef.current) {
      return;
    }

    stripeMountActiveRef.current = true;

    loadStripeJs()
      .then(() => {
        if (!stripeMountActiveRef.current) return;
        stripeRef.current = window.Stripe(publishableKey);
        const elements = stripeRef.current.elements(stripeElementsOptions);
        cardRef.current = elements.create('card', { style: cardStyles });
        cardRef.current.mount(cardContainerRef.current);
      })
      .catch(e => {
        console.error('Stripe load error', e);
      });

    return () => {
      stripeMountActiveRef.current = false;
      if (cardRef.current) {
        cardRef.current.unmount();
        cardRef.current = null;
      }
    };
  }, [config]); // re-mount only when config changes

  // ---------------- Step 2: register card with Sharetribe via Redux thunk ----------------
  const runStep2 = async pmId => {
    setStep('registering-card');
    try {
      const hasStripeCustomer = !!currentUser?.relationships?.stripeCustomer?.data;
      if (hasStripeCustomer) {
        await dispatch(addPaymentMethod(pmId));
      } else {
        await dispatch(createStripeCustomer(pmId));
      }
    } catch (e) {
      console.error('[SoftBooking step2] payment method registration failed:', e);
      setErrorStep(2);
      setErrorMsg(e?.message || 'Karte konnte nicht registriert werden. Bitte erneut versuchen.');
      setStep('error');
      return;
    }
    await runStep3(pmId);
  };

  // ---------------- Step 3: initiate transaction via server API ----------------
  const runStep3 = async _pmId => {
    setStep('initiating');
    try {
      const { transactionId } = await softBookingInitiate({
        listingId,
        bookingStart,
        bookingEnd,
        seats: 1,
      });
      setStep('done');
      history.push(`/order/${transactionId}/details`);
    } catch (e) {
      setErrorStep(3);
      setErrorMsg(e?.detail || e?.message || 'Buchung fehlgeschlagen. Bitte erneut versuchen.');
      setStep('error');
    }
  };

  // ---------------- Form submit (step 1: save card) ----------------
  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripeRef.current || !cardRef.current || !clientSecret) return;

    setStep('saving-card');
    setErrorMsg(null);
    setErrorStep(null);

    const displayName =
      currentUser?.attributes?.profile?.displayName ||
      currentUser?.attributes?.profile?.firstName ||
      '';

    const { error, setupIntent } = await stripeRef.current.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardRef.current,
        billing_details: { name: displayName },
      },
    });

    if (error || setupIntent?.status !== 'succeeded') {
      setErrorStep(1);
      setErrorMsg(error?.message || 'Karte konnte nicht gespeichert werden.');
      setStep('error');
      return;
    }

    const pmId = setupIntent.payment_method;
    setPaymentMethodId(pmId);

    await runStep2(pmId);
  };

  // ---------------- Derived UI state ----------------
  const isLoading = ['saving-card', 'registering-card', 'initiating'].includes(step);
  const isSubmitDisabled = isLoading || !clientSecret || !!fetchError;
  const showMainSubmit = step === 'idle' || step === 'saving-card' || (step === 'error' && errorStep === 1);

  const pageTitle = intl.formatMessage({ id: 'SoftBookingCheckoutPage.heading' });

  return (
    <Page title={pageTitle} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.twoColumns}>
            {/* ---- Left column: form ---- */}
            <div className={css.formColumn}>
              <Heading as="h1" rootClassName={css.heading}>
                <FormattedMessage id="SoftBookingCheckoutPage.heading" />
              </Heading>
              <p className={css.subHeading}>
                <FormattedMessage id="SoftBookingCheckoutPage.subHeading" />
              </p>

              <ProgressIndicator step={step} />

              {fetchError ? (
                <p className={css.error}>{fetchError}</p>
              ) : (
                <form onSubmit={handleSubmit} className={css.form}>
                  {/* Stripe card element container */}
                  <div className={css.cardWrapper}>
                    <div ref={cardContainerRef} className={css.cardElement} />
                  </div>

                  {step === 'error' && errorMsg ? (
                    <p className={css.error}>{errorMsg}</p>
                  ) : null}

                  {/* Retry button for step 2 */}
                  {step === 'error' && errorStep === 2 ? (
                    <PrimaryButton
                      type="button"
                      className={css.retryButton}
                      onClick={() => runStep2(paymentMethodId)}
                    >
                      <FormattedMessage id="SoftBookingCheckoutPage.retryStep2Button" />
                    </PrimaryButton>
                  ) : null}

                  {/* Retry button for step 3 */}
                  {step === 'error' && errorStep === 3 ? (
                    <PrimaryButton
                      type="button"
                      className={css.retryButton}
                      onClick={() => runStep3(paymentMethodId)}
                    >
                      <FormattedMessage id="SoftBookingCheckoutPage.retryStep3Button" />
                    </PrimaryButton>
                  ) : null}

                  {/* Main submit button (shown on idle, saving-card, or step-1 error) */}
                  {showMainSubmit ? (
                    <PrimaryButton
                      type="submit"
                      className={css.submitButton}
                      inProgress={isLoading}
                      disabled={isSubmitDisabled}
                    >
                      <FormattedMessage id="SoftBookingCheckoutPage.submitButton" />
                    </PrimaryButton>
                  ) : null}
                </form>
              )}
            </div>

            {/* ---- Right column: booking summary ---- */}
            <div className={css.summaryColumn}>
              <BookingSummary
                listingTitle={listingTitle}
                bookingStart={bookingStart}
                bookingEnd={bookingEnd}
                price={price}
                intl={intl}
              />
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default SoftBookingCheckoutPage;
