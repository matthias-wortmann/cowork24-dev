import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { storableError } from '../../util/errors';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import {
  buildLandingRowQueryParams,
  publishedListingResultIds,
} from '../../util/landingPageListings';

export const ASSET_NAME = 'landing-page';

// ================ Action types ================ //

const FETCH_LANDING_LISTING_ROW_REQUEST = 'app/LandingPage/FETCH_LANDING_LISTING_ROW_REQUEST';
const FETCH_LANDING_LISTING_ROW_SUCCESS = 'app/LandingPage/FETCH_LANDING_LISTING_ROW_SUCCESS';
const FETCH_LANDING_LISTING_ROW_ERROR = 'app/LandingPage/FETCH_LANDING_LISTING_ROW_ERROR';

// ================ Reducer ================ //

const initialState = {
  /** @type {Object<string, { ids: Array, inProgress: boolean, error: *, viewAllSearchParams: Object }>} */
  listingRows: {},
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_LANDING_LISTING_ROW_REQUEST:
      return {
        ...state,
        listingRows: {
          ...state.listingRows,
          [payload.rowId]: {
            ...state.listingRows[payload.rowId],
            ids: state.listingRows[payload.rowId]?.ids || [],
            inProgress: true,
            error: null,
            viewAllSearchParams: state.listingRows[payload.rowId]?.viewAllSearchParams || {},
          },
        },
      };
    case FETCH_LANDING_LISTING_ROW_SUCCESS:
      return {
        ...state,
        listingRows: {
          ...state.listingRows,
          [payload.rowId]: {
            ids: payload.ids,
            inProgress: false,
            error: null,
            viewAllSearchParams: payload.viewAllSearchParams || {},
          },
        },
      };
    case FETCH_LANDING_LISTING_ROW_ERROR:
      return {
        ...state,
        listingRows: {
          ...state.listingRows,
          [payload.rowId]: {
            ids: state.listingRows[payload.rowId]?.ids || [],
            inProgress: false,
            error: payload.error,
            viewAllSearchParams: state.listingRows[payload.rowId]?.viewAllSearchParams || {},
          },
        },
      };
    default:
      return state;
  }
}

// ================ Action creators ================ //

const fetchLandingListingRowRequest = rowId => ({
  type: FETCH_LANDING_LISTING_ROW_REQUEST,
  payload: { rowId },
});

const fetchLandingListingRowSuccess = (rowId, ids, viewAllSearchParams) => ({
  type: FETCH_LANDING_LISTING_ROW_SUCCESS,
  payload: { rowId, ids, viewAllSearchParams },
});

const fetchLandingListingRowError = (rowId, error) => ({
  type: FETCH_LANDING_LISTING_ROW_ERROR,
  payload: { rowId, error },
});

// ================ Thunks ================ //

/**
 * Load horizontal “highlight” listing rows for the landing page (SSR + client).
 *
 * @param {Object} config merged marketplace config
 */
export const fetchLandingListingRows = config => async (dispatch, getState, sdk) => {
  const rows = config.landingPage?.listingRows || [];
  const listingFields = config?.listing?.listingFields;
  const sanitizeConfig = { listingFields };

  rows.forEach(row => {
    dispatch(fetchLandingListingRowRequest(row.id));
  });

  await Promise.all(
    rows.map(async row => {
      try {
        const built = buildLandingRowQueryParams(config, row);
        if (!built) {
          dispatch(fetchLandingListingRowSuccess(row.id, [], {}));
          return;
        }
        const response = await sdk.listings.query(built.sdkParams);
        dispatch(addMarketplaceEntities(response, sanitizeConfig));
        const ids = publishedListingResultIds(response.data);
        dispatch(fetchLandingListingRowSuccess(row.id, ids, built.viewAllSearchParams));
      } catch (e) {
        dispatch(fetchLandingListingRowError(row.id, storableError(e)));
      }
    })
  );
};

// ================ loadData ================ //

export const loadData = (params, search, config) => async (dispatch, getState, sdk) => {
  const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
  const state = getState();
  const currentUser = state.user?.currentUser;
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const hasViewingRights = currentUser && hasPermissionToViewData(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const canFetchListings =
    !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized && hasViewingRights);

  const listingRowsPromise = canFetchListings
    ? dispatch(fetchLandingListingRows(config))
    : Promise.resolve();

  await Promise.all([dispatch(fetchPageAssets(pageAsset, true)), listingRowsPromise]);
};
