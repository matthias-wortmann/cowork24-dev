const sharetribeSdk = require('sharetribe-flex-sdk');
const { transactionLineItems } = require('../api-util/lineItems');
const {
  addOfferToMetadata,
  getAmountFromPreviousOffer,
  isIntentionToMakeCounterOffer,
  isIntentionToMakeOffer,
  isIntentionToRevokeCounterOffer,
  isIntentionToUpdateOffer,
  throwErrorIfNegotiationOfferHasInvalidHistory,
} = require('../api-util/negotiation');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

const { Money } = sharetribeSdk.types;

const transactionPromise = (sdk, id) => sdk.transactions.show({ id, include: ['listing'] });
const getListingRelationShip = transactionShowAPIData => {
  const { data, included } = transactionShowAPIData;
  const { relationships } = data;
  const { listing: listingRef } = relationships;
  return included.find(i => i.id.uuid === listingRef.data.id.uuid);
};

const getFullOrderData = (orderData, bodyParams, currency, offers) => {
  const { offerInSubunits } = orderData || {};
  const transitionName = bodyParams.transition;
  const orderDataAndParams = { ...orderData, ...bodyParams.params, currency };

  const isNewOffer =
    isIntentionToMakeOffer(offerInSubunits, transitionName) ||
    isIntentionToMakeCounterOffer(offerInSubunits, transitionName) ||
    isIntentionToUpdateOffer(offerInSubunits, transitionName);

  return isNewOffer
    ? {
        ...orderDataAndParams,
        offer: new Money(offerInSubunits, currency),
      }
    : isIntentionToRevokeCounterOffer(transitionName)
    ? {
        ...orderDataAndParams,
        offer: new Money(getAmountFromPreviousOffer(offers), currency),
      }
    : orderDataAndParams;
};

const getUpdatedMetadata = (orderData, transition, existingMetadata) => {
  const { actor, offerInSubunits } = orderData || {};
  // NOTE: for default-negotiation process, the actor is always "provider" when making an offer.
  const hasActor = ['provider', 'customer'].includes(actor);
  const by = hasActor ? actor : null;

  const isNewOffer =
    isIntentionToMakeOffer(offerInSubunits, transition) ||
    isIntentionToMakeCounterOffer(offerInSubunits, transition) ||
    isIntentionToUpdateOffer(offerInSubunits, transition);

  return isNewOffer
    ? addOfferToMetadata(existingMetadata, {
        offerInSubunits,
        by,
        transition,
      })
    : isIntentionToRevokeCounterOffer(transition)
    ? addOfferToMetadata(existingMetadata, {
        offerInSubunits: getAmountFromPreviousOffer(existingMetadata.offers),
        by,
        transition,
      })
    : addOfferToMetadata(existingMetadata, null);
};

// Soft-booking accept: Sharetribe uses the existing payinTotal set during
// request-soft-booking. The stripe-create-payment-intent action reads it
// from the transaction directly. We must NOT recalculate line items here
// (no booking dates in orderData) and must NOT pass lineItems in params
// (the process has no privileged-set-line-items action for this transition).
const SOFT_BOOKING_ACCEPT_TRANSITION = 'transition/accept-and-charge';

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body || {};

  const sdk = getSdk(req, res);
  const transitionName = bodyParams.transition;
  let lineItems = null;
  let metadataMaybe = {};

  // Special path for soft-booking accept: skip line-item recalculation entirely.
  // The transaction already carries the correct line items / payinTotal from initiation.
  // Sharetribe's stripe-create-payment-intent + stripe-capture-payment-intent actions
  // charge the customer's saved payment method using that existing payinTotal.
  if (transitionName === SOFT_BOOKING_ACCEPT_TRANSITION) {
    return getTrustedSdk(req)
      .then(trustedSdk => {
        const body = {
          ...bodyParams,
          params: {}, // no line items — process reads existing payinTotal
        };
        if (isSpeculative) {
          return trustedSdk.transactions.transitionSpeculative(body, queryParams);
        }
        return trustedSdk.transactions.transition(body, queryParams);
      })
      .then(apiResponse => {
        const { status, statusText, data } = apiResponse;
        res
          .status(status)
          .set('Content-Type', 'application/transit+json')
          .send(serialize({ status, statusText, data }))
          .end();
      })
      .catch(e => handleError(res, e));
  }

  Promise.all([transactionPromise(sdk, bodyParams?.id), fetchCommission(sdk)])
    .then(responses => {
      const [showTransactionResponse, fetchAssetsResponse] = responses;
      const transaction = showTransactionResponse.data.data;
      const listing = getListingRelationShip(showTransactionResponse.data);
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const existingMetadata = transaction?.attributes?.metadata;
      const existingOffers = existingMetadata?.offers || [];
      const transitions = transaction.attributes.transitions;

      // Check if the transition is related to negotiation offers and if the offers are valid
      throwErrorIfNegotiationOfferHasInvalidHistory(transitionName, existingOffers, transitions);

      const currency =
        transaction.attributes.payinTotal?.currency ||
        listing.attributes.price?.currency ||
        orderData.currency;
      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      lineItems = transactionLineItems(
        listing,
        getFullOrderData(orderData, bodyParams, currency, existingOffers),
        providerCommission,
        customerCommission
      );

      metadataMaybe = getUpdatedMetadata(orderData, transitionName, existingMetadata);

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      // Omit listingId from params (transition/request-payment-after-inquiry does not need it)
      const { listingId, ...restParams } = bodyParams?.params || {};

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...restParams,
          lineItems,
          ...metadataMaybe,
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.transitionSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.transition(body, queryParams);
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
