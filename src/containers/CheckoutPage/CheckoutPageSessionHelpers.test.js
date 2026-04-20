import { types as sdkTypes } from '../../util/sdkLoader';
import { createListing } from '../../util/testData';
import { clearData, handlePageData, storeData } from './CheckoutPageSessionHelpers';

const { UUID } = sdkTypes;

const STORAGE_KEY = 'CheckoutPageTest';

describe('CheckoutPageSessionHelpers', () => {
  beforeEach(() => {
    clearData(STORAGE_KEY);
  });

  it('handlePageData uses Redux props when history.action is POP but listing and orderData exist', () => {
    const listing = createListing(
      '00000000-0000-0000-0000-0000000000aa',
      {},
      { author: { id: new UUID('00000000-0000-0000-0000-0000000000ab'), type: 'user' } }
    );
    const orderData = { quantity: 1 };
    const transaction = null;
    const history = { action: 'POP' };

    const pageData = handlePageData({ orderData, listing, transaction }, STORAGE_KEY, history);

    expect(pageData.listing).toEqual(listing);
    expect(pageData.orderData).toEqual(orderData);
    expect(pageData.transaction).toBeNull();
  });

  it('handlePageData still prefers session when Redux has no listing', () => {
    const listing = createListing(
      '00000000-0000-0000-0000-0000000000cc',
      {},
      { author: { id: new UUID('00000000-0000-0000-0000-0000000000cd'), type: 'user' } }
    );
    const orderData = { quantity: 2 };
    storeData(orderData, listing, null, STORAGE_KEY);

    const pageData = handlePageData(
      { orderData: null, listing: null, transaction: null },
      STORAGE_KEY,
      { action: 'POP' }
    );

    expect(pageData.listing?.id?.uuid).toBe(listing.id.uuid);
    expect(pageData.orderData?.quantity).toBe(2);
  });
});
