import React, { Component, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { userDisplayNameAsString } from '../../../util/data';
import { isMobileSafari } from '../../../util/userAgent';
import { createSlug } from '../../../util/urlHelpers';
import { NEGOTIATION_PROCESS_NAME } from '../../../transactions/transaction';
import { displayPrice } from '../../../util/configHelpers';

import { AvatarLarge, NamedLink, UserDisplayName } from '../../../components';

import { stateDataShape } from '../TransactionPage.stateData';
import SendMessageForm from '../SendMessageForm/SendMessageForm';
import TextMaybe from '../TextMaybe/TextMaybe';

// These are internal components that make this file more readable.
import BreakdownMaybe from './BreakdownMaybe';
import DetailCardHeadingsMaybe from './DetailCardHeadingsMaybe';
import DetailCardImage from './DetailCardImage';
import DeliveryInfoMaybe from './DeliveryInfoMaybe';
import BookingLocationMaybe from './BookingLocationMaybe';
import FeedSection from './FeedSection';
import DiminishedActionButtonMaybe from './DiminishedActionButtonMaybe';
import PanelHeading from './PanelHeading';

import css from './TransactionPanel.module.css';

const formatSoftReservationDateTime = (isoString, intl) => {
  if (!isoString) {
    return null;
  }
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return intl.formatDate(parsed, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SoftReservationDetailsMaybe = props => {
  const {
    softReservation,
    softReservationStart,
    softReservationEnd,
    softReservationDeadline,
    isProvider,
    headingClassName,
  } = props;

  if (!softReservation) {
    return null;
  }

  return (
    <div className={classNames(css.inquiryMessageContainer, css.softReservationCard)}>
      <h3 className={headingClassName || css.detailCardTitle}>
        <FormattedMessage id="TransactionPanel.softReservationHeading" />
      </h3>
      <p className={css.softReservationStatus}>
        <FormattedMessage id="TransactionPanel.softReservation.statusSetupPending" />
      </p>
      {softReservationStart && softReservationEnd ? (
        <p className={css.softReservationRow}>
          <FormattedMessage
            id="TransactionPanel.softReservation.bookingWindow"
            values={{ start: softReservationStart, end: softReservationEnd }}
          />
        </p>
      ) : null}
      {Number.isInteger(softReservation?.quantity) ? (
        <p className={css.softReservationRow}>
          <FormattedMessage
            id="TransactionPanel.softReservation.quantity"
            values={{ quantity: softReservation.quantity }}
          />
        </p>
      ) : null}
      {Number.isInteger(softReservation?.seats) ? (
        <p className={css.softReservationRow}>
          <FormattedMessage
            id="TransactionPanel.softReservation.seats"
            values={{ seats: softReservation.seats }}
          />
        </p>
      ) : null}
      {softReservation?.deliveryMethod ? (
        <p className={css.softReservationRow}>
          <FormattedMessage
            id="TransactionPanel.softReservation.deliveryMethod"
            values={{ deliveryMethod: softReservation.deliveryMethod }}
          />
        </p>
      ) : null}
      {softReservation?.priceVariantName ? (
        <p className={css.softReservationRow}>
          <FormattedMessage
            id="TransactionPanel.softReservation.priceVariant"
            values={{ priceVariant: softReservation.priceVariantName }}
          />
        </p>
      ) : null}
      {softReservationDeadline ? (
        <p className={css.softReservationRow}>
          <FormattedMessage
            id="TransactionPanel.softReservation.setupDeadline"
            values={{ deadline: softReservationDeadline }}
          />
        </p>
      ) : null}
      {isProvider ? (
        <p className={css.softReservationProviderNotice}>
          <FormattedMessage
            id="TransactionPanel.softReservation.providerPayoutHint"
            values={{
              payoutDetailsLink: (
                <NamedLink className={css.softReservationCtaLink} name="StripePayoutPage">
                  <FormattedMessage id="TransactionPanel.softReservation.providerPayoutHintCta" />
                </NamedLink>
              ),
            }}
          />
        </p>
      ) : null}
    </div>
  );
};

const SOFT_BOOKING_PROCESS = 'cowork24-soft-booking';
const TRANSITION_REQUEST_SOFT_BOOKING = 'transition/request-soft-booking';
const TRANSITION_ACCEPT_AND_CHARGE = 'transition/accept-and-charge';
const TRANSITION_DECLINE = 'transition/decline';
const TRANSITION_WITHDRAW = 'transition/customer-cancel';
const STATE_SOFT_REQUESTED = 'soft-requested';
const STATE_ACCEPTED = 'accepted';
const STATE_DECLINED = 'declined';
const STATE_EXPIRED = 'expired';
const STATE_CANCELLED = 'cancelled';

const parseSoftBookingError = (error, intl) => {
  const msg = error?.message || error?.toString() || '';
  if (msg.includes('requires_action') || msg.includes('authentication_required')) {
    return intl.formatMessage({ id: 'TransactionPanel.SoftBooking.error3dsRequired' });
  }
  if (msg.includes('no payment method') || msg.includes('PaymentMethod')) {
    return intl.formatMessage({ id: 'TransactionPanel.SoftBooking.errorNoPaymentMethod' });
  }
  if (msg.includes('availability') || msg.includes('booking conflict')) {
    return intl.formatMessage({ id: 'TransactionPanel.SoftBooking.errorAvailabilityConflict' });
  }
  return msg;
};

const SoftBookingProviderActions = props => {
  const {
    transaction,
    currentUser,
    isProvider,
    onMakeTransition,
    transitionInProgress,
    transitionError,
    intl,
  } = props;

  if (!isProvider) return null;

  const lastTransition = transaction?.attributes?.lastTransition;
  const txState = transaction?.attributes?.state;
  const isSoftRequested =
    lastTransition === TRANSITION_REQUEST_SOFT_BOOKING || txState === STATE_SOFT_REQUESTED;
  if (!isSoftRequested) return null;

  // stripeConnected is a private currentUser attribute — always available for self.
  // Fall back to stripeAccount entity presence for extra safety.
  const stripeReady =
    !!currentUser?.attributes?.stripeConnected || !!currentUser?.stripeAccount?.id;

  const acceptLabel = intl.formatMessage({ id: 'TransactionPanel.SoftBooking.acceptButton' });
  const declineLabel = intl.formatMessage({ id: 'TransactionPanel.SoftBooking.declineButton' });
  const errorMessage = transitionError ? parseSoftBookingError(transitionError, intl) : null;

  if (!stripeReady) {
    return (
      <div className={css.softBookingStripeGate}>
        <h3 className={css.softBookingStripeGateHeading}>
          {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.providerStripeRequiredHeading' })}
        </h3>
        <p className={css.softBookingStripeGateBody}>
          {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.providerStripeRequiredBody' })}
        </p>
        <div className={css.softBookingStripeGateActions}>
          <NamedLink name="StripePayoutPage" className={css.softBookingStripeConnectLink}>
            {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.stripeConnectButton' })}
          </NamedLink>
          <button
            className={css.softBookingDeclineButton}
            onClick={() => onMakeTransition(transaction.id, TRANSITION_DECLINE, {})}
            disabled={transitionInProgress === TRANSITION_DECLINE}
          >
            {transitionInProgress === TRANSITION_DECLINE ? '...' : declineLabel}
          </button>
        </div>
        <p className={css.softBookingStripeGateNote}>
          {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.stripeRequiredTooltip' })}
        </p>
      </div>
    );
  }

  return (
    <div className={css.softBookingActions}>
      {errorMessage ? (
        <div className={css.softBookingError}>{errorMessage}</div>
      ) : null}
      <button
        className={css.softBookingAcceptButton}
        onClick={() => onMakeTransition(transaction.id, TRANSITION_ACCEPT_AND_CHARGE, {})}
        disabled={transitionInProgress === TRANSITION_ACCEPT_AND_CHARGE}
      >
        {transitionInProgress === TRANSITION_ACCEPT_AND_CHARGE ? '...' : acceptLabel}
      </button>
      <button
        className={css.softBookingDeclineButton}
        onClick={() => onMakeTransition(transaction.id, TRANSITION_DECLINE, {})}
        disabled={transitionInProgress === TRANSITION_DECLINE}
      >
        {transitionInProgress === TRANSITION_DECLINE ? '...' : declineLabel}
      </button>
    </div>
  );
};

const SoftBookingCustomerStatus = props => {
  const { transaction, isCustomer, onMakeTransition, transitionInProgress, intl } = props;

  if (!isCustomer) return null;

  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const lastTransition = transaction?.attributes?.lastTransition;
  const txState = transaction?.attributes?.state;

  const isSoftRequested =
    lastTransition === TRANSITION_REQUEST_SOFT_BOOKING || txState === STATE_SOFT_REQUESTED;
  const isAccepted = txState === STATE_ACCEPTED;
  const isDeclined = txState === STATE_DECLINED;
  const isExpired = txState === STATE_EXPIRED;
  const isCancelled = txState === STATE_CANCELLED;

  const handleWithdrawClick = () => setShowWithdrawConfirm(true);
  const cancelWithdraw = () => setShowWithdrawConfirm(false);
  const confirmWithdraw = () => {
    setShowWithdrawConfirm(false);
    onMakeTransition(transaction.id, TRANSITION_WITHDRAW, {});
  };

  if (isSoftRequested) {
    return (
      <div className={css.softBookingCustomerStatus}>
        <h3 className={css.softBookingStatusHeading}>
          {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.customerSoftRequestedHeading' })}
        </h3>
        <p>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.customerSoftRequestedBody' })}</p>
        {!showWithdrawConfirm ? (
          <button
            className={css.softBookingWithdrawButton}
            onClick={handleWithdrawClick}
            disabled={transitionInProgress === TRANSITION_WITHDRAW}
          >
            {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.withdrawButton' })}
          </button>
        ) : (
          <div className={css.softBookingWithdrawConfirm}>
            <p className={css.softBookingWithdrawConfirmText}>
              {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.withdrawConfirmHeading' })}
            </p>
            <p>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.withdrawConfirmBody' })}</p>
            <div className={css.softBookingWithdrawConfirmButtons}>
              <button className={css.softBookingDeclineButton} onClick={confirmWithdraw}>
                {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.withdrawConfirmButton' })}
              </button>
              <button className={css.softBookingSecondaryButton} onClick={cancelWithdraw}>
                {intl.formatMessage({ id: 'TransactionPanel.SoftBooking.withdrawCancelButton' })}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className={css.softBookingCustomerStatus}>
        <h3>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.acceptedHeading' })}</h3>
      </div>
    );
  }

  if (isDeclined) {
    return (
      <div className={css.softBookingCustomerStatus}>
        <h3>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.declinedHeading' })}</h3>
        <p>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.declinedBody' })}</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={css.softBookingCustomerStatus}>
        <h3>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.expiredHeading' })}</h3>
        <p>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.expiredBody' })}</p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className={css.softBookingCustomerStatus}>
        <h3>{intl.formatMessage({ id: 'TransactionPanel.SoftBooking.cancelledHeading' })}</h3>
      </div>
    );
  }

  return null;
};

// Helper function to get display names for different roles
const displayNames = (currentUser, provider, customer, intl) => {
  const authorDisplayName = <UserDisplayName user={provider} intl={intl} />;
  const customerDisplayName = <UserDisplayName user={customer} intl={intl} />;

  let otherUserDisplayName = '';
  let otherUserDisplayNameString = '';
  const currentUserIsCustomer =
    currentUser.id && customer?.id && currentUser.id.uuid === customer?.id?.uuid;
  const currentUserIsProvider =
    currentUser.id && provider?.id && currentUser.id.uuid === provider?.id?.uuid;

  if (currentUserIsCustomer) {
    otherUserDisplayName = authorDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(provider, '');
  } else if (currentUserIsProvider) {
    otherUserDisplayName = customerDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(customer, '');
  }

  return {
    authorDisplayName,
    customerDisplayName,
    otherUserDisplayName,
    otherUserDisplayNameString,
  };
};

const allowShowingExtraInfo = (showExtraInfo, transactionPartyInfo) => {
  const {
    isCustomer,
    isCustomerBanned,
    isCustomerDeleted,
    isProvider,
    isProviderBanned,
    isProviderDeleted,
  } = transactionPartyInfo;
  return (
    !!showExtraInfo &&
    ((isProvider && !isCustomerBanned && !isCustomerDeleted) ||
      (isCustomer && !isProviderBanned && !isProviderDeleted))
  );
};

/**
 * Transaction panel
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {string} props.transactionRole - The transaction role
 * @param {propTypes.listing} props.listing - The listing
 * @param {propTypes.user} props.customer - The customer
 * @param {propTypes.user} props.provider - The provider
 * @param {boolean} props.hasTransitions - Whether the transitions are shown
 * @param {propTypes.uuid} props.transactionId - The transaction id
 * @param {Array<propTypes.message>)} props.messages - The messages
 * @param {boolean} props.initialMessageFailed - Whether the initial message failed
 * @param {boolean} props.savePaymentMethodFailed - Whether the save payment method failed
 * @param {propTypes.error} props.fetchMessagesError - The fetch messages error
 * @param {boolean} props.sendMessageInProgress - Whether the send message is in progress
 * @param {propTypes.error} props.sendMessageError - The send message error
 * @param {Function} props.onOpenDisputeModal - The on open dispute modal function
 * @param {Function} props.onSendMessage - The on send message function
 * @param {stateDataShape} props.stateData - The state data
 * @param {boolean} props.showBookingLocation - Whether the booking location is shown
 * @param {React.ReactNode} props.activityFeed - The activity feed
 * @param {Function} props.actionButtons - The action buttons function
 * @param {React.ReactNode} props.orderBreakdown - The order breakdown
 * @param {React.ReactNode} props.orderPanel - The order panel
 * @param {object} props.config - The config
 * @param {intlShape} props.intl - The intl
 * @returns {JSX.Element} The TransactionPanel component
 */
export class TransactionPanelComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sendMessageFormFocused: false,
    };
    this.isMobSaf = false;
    this.sendMessageFormName = 'TransactionPanel.SendMessageForm';

    this.onSendMessageFormFocus = this.onSendMessageFormFocus.bind(this);
    this.onSendMessageFormBlur = this.onSendMessageFormBlur.bind(this);
    this.onMessageSubmit = this.onMessageSubmit.bind(this);
    this.scrollToMessage = this.scrollToMessage.bind(this);
  }

  componentDidMount() {
    this.isMobSaf = isMobileSafari();
  }

  onSendMessageFormFocus() {
    this.setState({ sendMessageFormFocused: true });
    if (this.isMobSaf) {
      // Scroll to bottom
      window.scroll({ top: document.body.scrollHeight, left: 0, behavior: 'smooth' });
    }
  }

  onSendMessageFormBlur() {
    this.setState({ sendMessageFormFocused: false });
  }

  onMessageSubmit(values, form) {
    const message = values.message ? values.message.trim() : null;
    const { transactionId, onSendMessage, config } = this.props;

    if (!message) {
      return;
    }
    onSendMessage(transactionId, message, config)
      .then(messageId => {
        form.reset();
        this.scrollToMessage(messageId);
      })
      .catch(e => {
        // Ignore, Redux handles the error
      });
  }

  scrollToMessage(messageId) {
    const selector = `#msg-${messageId.uuid}`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }

  render() {
    const {
      rootClassName,
      className,
      currentUser,
      transactionRole,
      listing,
      customer,
      provider,
      transitions,
      protectedData,
      messages,
      initialMessageFailed = false,
      savePaymentMethodFailed = false,
      fetchMessagesError,
      sendMessageInProgress,
      sendMessageError,
      onOpenDisputeModal,
      showListingImage,
      intl,
      stateData = {},
      showBookingLocation = false,
      requestQuote,
      offer,
      activityFeed,
      actionButtons,
      isInquiryProcess,
      orderBreakdown,
      orderPanel,
      config,
      hasViewingRights,
      transaction,
      transitionInProgress,
      transitionError,
      onMakeTransition,
    } = this.props;

    const hasTransitions = transitions.length > 0;
    const isCustomer = transactionRole === 'customer';
    const isProvider = transactionRole === 'provider';

    const listingDeleted = !!listing?.attributes?.deleted;
    const isCustomerBanned = !!customer?.attributes?.banned;
    const isCustomerDeleted = !!customer?.attributes?.deleted;
    const isProviderBanned = !!provider?.attributes?.banned;
    const isProviderDeleted = !!provider?.attributes?.deleted;

    const transactionPartyInfo = {
      isCustomer,
      isCustomerBanned,
      isCustomerDeleted,
      isProvider,
      isProviderBanned,
      isProviderDeleted,
    };

    const { authorDisplayName, customerDisplayName, otherUserDisplayNameString } = displayNames(
      currentUser,
      provider,
      customer,
      intl
    );

    const deletedListingTitle = intl.formatMessage({
      id: 'TransactionPanel.deletedListingTitle',
    });

    const listingTitle = listingDeleted ? deletedListingTitle : listing?.attributes?.title;
    const firstImage = listing?.images?.length > 0 ? listing?.images[0] : null;

    const listingType = listing?.attributes?.publicData?.listingType;
    const listingTypeConfigs = config.listing.listingTypes;
    const listingTypeConfig = listingTypeConfigs.find(conf => conf.listingType === listingType);
    const showPrice = isInquiryProcess && displayPrice(listingTypeConfig);
    const showBreakDown = stateData.showBreakDown !== false; // NOTE: undefined defaults to true due to historical reasons.

    const showSendMessageForm =
      !isCustomerBanned && !isCustomerDeleted && !isProviderBanned && !isProviderDeleted;

    // Only show order panel for users who have listing viewing rights, otherwise
    // show the detail card heading.
    const showOrderPanel = stateData.showOrderPanel && hasViewingRights;
    const showDetailCardHeadings = stateData.showDetailCardHeadings || !hasViewingRights;

    const deliveryMethod = protectedData?.deliveryMethod || 'none';
    const priceVariantName = protectedData?.priceVariantName;
    const softReservation = protectedData?.softReservation;
    const softReservationStart = formatSoftReservationDateTime(softReservation?.bookingStart, intl);
    const softReservationEnd = formatSoftReservationDateTime(softReservation?.bookingEnd, intl);
    const softReservationDeadline = formatSoftReservationDateTime(
      softReservation?.setupDeadline,
      intl
    );

    const inquiryMessage = !isCustomerBanned ? protectedData?.inquiryMessage : null;
    const showInquiryMessage = typeof inquiryMessage === 'string' && inquiryMessage.trim().length > 0;

    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        <div className={css.container}>
          <div className={css.txInfo}>
            <DetailCardImage
              rootClassName={css.imageWrapperMobile}
              avatarWrapperClassName={css.avatarWrapperMobile}
              listingTitle={listingTitle}
              image={firstImage}
              provider={provider}
              isCustomer={isCustomer}
              showListingImage={showListingImage}
              listingImageConfig={config.layout.listingImage}
            />
            {isProvider ? (
              <div className={css.avatarWrapperProviderDesktop}>
                <AvatarLarge user={customer} className={css.avatarDesktop} />
              </div>
            ) : null}

            <PanelHeading
              processName={stateData.processName}
              processState={stateData.processState}
              showExtraInfo={allowShowingExtraInfo(stateData.showExtraInfo, transactionPartyInfo)}
              showPriceOnMobile={showPrice}
              price={listing?.attributes?.price}
              intl={intl}
              deliveryMethod={deliveryMethod}
              isPendingPayment={!!stateData.isPendingPayment}
              transactionRole={transactionRole}
              providerName={authorDisplayName}
              customerName={customerDisplayName}
              listingId={listing?.id?.uuid}
              listingTitle={listingTitle}
              listingDeleted={listingDeleted}
            />

            <TextMaybe
              rootClassName={css.inquiryMessageContainer}
              heading={intl.formatMessage({ id: 'TransactionPanel.inquiryMessageHeading' })}
              text={inquiryMessage}
              isOwn={isCustomer}
              showText={showInquiryMessage}
            />
            {softReservation ? (
              <SoftReservationDetailsMaybe
                softReservation={softReservation}
                softReservationStart={softReservationStart}
                softReservationEnd={softReservationEnd}
                softReservationDeadline={softReservationDeadline}
                isProvider={isProvider}
              />
            ) : null}

            {requestQuote}
            {offer}

            {stateData.processName === SOFT_BOOKING_PROCESS ? (
              isProvider ? (
                <SoftBookingProviderActions
                  transaction={transaction}
                  currentUser={currentUser}
                  isProvider={isProvider}
                  onMakeTransition={onMakeTransition}
                  transitionInProgress={transitionInProgress}
                  transitionError={transitionError}
                  intl={intl}
                />
              ) : (
                <SoftBookingCustomerStatus
                  transaction={transaction}
                  isCustomer={isCustomer}
                  onMakeTransition={onMakeTransition}
                  transitionInProgress={transitionInProgress}
                  intl={intl}
                />
              )
            ) : null}

            {!isInquiryProcess ? (
              <div className={css.orderDetails}>
                <div className={css.orderDetailsMobileSection}>
                  {showBreakDown ? (
                    <BreakdownMaybe
                      orderBreakdown={orderBreakdown}
                      processName={stateData.processName}
                      priceVariantName={priceVariantName}
                    />
                  ) : null}
                  <DiminishedActionButtonMaybe
                    id="mobile_disputeOrderButton"
                    showDispute={stateData.showDispute}
                    onOpenDisputeModal={onOpenDisputeModal}
                  />
                </div>

                {savePaymentMethodFailed ? (
                  <p className={css.genericError}>
                    <FormattedMessage
                      id="TransactionPanel.savePaymentMethodFailed"
                      values={{
                        paymentMethodsPageLink: (
                          <NamedLink name="PaymentMethodsPage">
                            <FormattedMessage id="TransactionPanel.paymentMethodsPageLink" />
                          </NamedLink>
                        ),
                      }}
                    />
                  </p>
                ) : null}
                <DeliveryInfoMaybe
                  className={css.deliveryInfoSection}
                  protectedData={protectedData}
                  listing={listing}
                  locale={config.localization.locale}
                />
                <BookingLocationMaybe
                  className={css.deliveryInfoSection}
                  listing={listing}
                  showBookingLocation={showBookingLocation}
                />
              </div>
            ) : null}

            <FeedSection
              rootClassName={css.feedContainer}
              hasMessages={messages.length > 0}
              hasTransitions={hasTransitions}
              fetchMessagesError={fetchMessagesError}
              initialMessageFailed={initialMessageFailed}
              activityFeed={activityFeed}
              isConversation={isInquiryProcess}
            />
            {showSendMessageForm ? (
              <SendMessageForm
                formId={this.sendMessageFormName}
                rootClassName={css.sendMessageForm}
                messagePlaceholder={intl.formatMessage(
                  { id: 'TransactionPanel.sendMessagePlaceholder' },
                  { name: otherUserDisplayNameString }
                )}
                inProgress={sendMessageInProgress}
                sendMessageError={sendMessageError}
                onFocus={this.onSendMessageFormFocus}
                onBlur={this.onSendMessageFormBlur}
                onSubmit={this.onMessageSubmit}
              />
            ) : (
              <div className={css.sendingMessageNotAllowed}>
                <FormattedMessage id="TransactionPanel.sendingMessageNotAllowed" />
              </div>
            )}

            {stateData.showActionButtons ? (
              <>
                <div className={css.mobileActionButtonSpacer}></div>
                <div className={css.mobileActionButtons}>{actionButtons('mobile')}</div>
              </>
            ) : null}
          </div>

          <div className={css.asideDesktop}>
            <div
              className={classNames(css.stickySection, { [css.noListingImage]: !showListingImage })}
            >
              <div className={css.detailCard}>
                <DetailCardImage
                  avatarWrapperClassName={css.avatarWrapperDesktop}
                  listingTitle={listingTitle}
                  image={firstImage}
                  provider={provider}
                  isCustomer={isCustomer}
                  showListingImage={showListingImage}
                  listingImageConfig={config.layout.listingImage}
                />

                <DetailCardHeadingsMaybe
                  showDetailCardHeadings={showDetailCardHeadings}
                  showListingImage={showListingImage}
                  listingTitle={
                    listingDeleted ? (
                      listingTitle
                    ) : (
                      <NamedLink
                        name="ListingPage"
                        params={{ id: listing.id?.uuid, slug: createSlug(listingTitle) }}
                      >
                        {listingTitle}
                      </NamedLink>
                    )
                  }
                  showPrice={showPrice}
                  price={listing?.attributes?.price}
                  intl={intl}
                />
                {showOrderPanel ? orderPanel : null}
                {softReservation ? (
                  <SoftReservationDetailsMaybe
                    softReservation={softReservation}
                    softReservationStart={softReservationStart}
                    softReservationEnd={softReservationEnd}
                    softReservationDeadline={softReservationDeadline}
                    isProvider={isProvider}
                    headingClassName={css.detailCardTitle}
                  />
                ) : null}
                {showBreakDown ? (
                  <BreakdownMaybe
                    className={css.breakdownContainer}
                    orderBreakdown={orderBreakdown}
                    processName={stateData.processName}
                    priceVariantName={priceVariantName}
                  />
                ) : null}

                {stateData.showActionButtons ? (
                  <div className={css.desktopActionButtons}>{actionButtons('desktop')}</div>
                ) : null}
              </div>
              <DiminishedActionButtonMaybe
                id="desktop_disputeOrderButton"
                showDispute={stateData.showDispute}
                onOpenDisputeModal={onOpenDisputeModal}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const TransactionPanel = injectIntl(TransactionPanelComponent);

export default TransactionPanel;
