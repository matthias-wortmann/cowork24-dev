const { getSdk, getTrustedSdk, fetchCommission } = require('../../api-util/sdk');
const { transactionLineItems } = require('../../api-util/lineItems');
const { constructValidLineItems } = require('../../api-util/lineItemHelpers');
const { types } = require('sharetribe-flex-sdk');
const { UUID } = types;

module.exports = async (req, res) => {
  const sdk = getSdk(req, res);
  const { listingId, bookingStart, bookingEnd, seats } = req.body;

  try {
    console.log('[soft-booking/initiate] body:', { listingId, bookingStart, bookingEnd, seats });

    console.log('[soft-booking/initiate] fetching listing...');
    const listingRes = await sdk.listings.show({ id: listingId });
    const listing = listingRes.data.data;
    console.log('[soft-booking/initiate] listing ok');

    const fetchAssetsResponse = await fetchCommission(sdk);
    const commissionAsset = fetchAssetsResponse.data.data[0];
    const { providerCommission, customerCommission } =
      commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

    const orderData = {
      bookingStart: new Date(bookingStart),
      bookingEnd: new Date(bookingEnd),
      seats: seats || 1,
    };

    const lineItems = transactionLineItems(listing, orderData, providerCommission, customerCommission);
    const validLineItems = constructValidLineItems(lineItems);

    console.log('[soft-booking/initiate] fetching currentUser...');
    const userRes = await sdk.currentUser.show({
      include: ['stripeCustomer.defaultPaymentMethod'],
    });
    console.log('[soft-booking/initiate] currentUser ok');
    const hasPaymentMethod = userRes.data.included?.some(i => i.type === 'stripePaymentMethod');
    if (!hasPaymentMethod) {
      return res.status(400).json({
        error: 'NO_PAYMENT_METHOD',
        message: 'Bitte speichern Sie zuerst eine Karte.',
      });
    }

    console.log('[soft-booking/initiate] initiating transaction...');
    const trustedSdk = await getTrustedSdk(req);
    const response = await trustedSdk.transactions.initiate(
      {
        processAlias: 'cowork24-soft-booking/release-1',
        transition: 'transition/request-soft-booking',
        params: {
          listingId: new UUID(listingId),
          bookingStart: new Date(bookingStart),
          bookingEnd: new Date(bookingEnd),
          seats: seats || 1,
          lineItems: validLineItems,
        },
      },
      { isPrivileged: true }
    );

    res.json({ transactionId: response.data.data.id.uuid });
  } catch (e) {
    const status = e.status || e.statusCode || (e.data && e.data.status);
    console.error('[soft-booking/initiate] ERROR status=%s message=%s', status, e.message, JSON.stringify(e.data || {}));
    if (status === 401 || status === 403) {
      return res.status(401).json({ error: 'Unauthorized', detail: e.message });
    }
    res.status(500).json({ error: e.message });
  }
};
