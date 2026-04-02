import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { decodeLatLngBounds } from '../../util/urlHelpers';
import { storableError } from '../../util/errors';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import {
  buildLandingRowQueryParams,
  publishedListingResultIds,
} from '../../util/landingPageListings';

export const ASSET_NAME = 'landing-page';

// ================ City bounds for listing count queries ================ //

/**
 * Bounds strings in the format "ne.lat,ne.lng,sw.lat,sw.lng".
 * These must match the city IDs used in SectionLocations CITIES_DATA.
 */
const CITY_BOUNDS_STRINGS = {
  zurich: '47.434666,8.625452,47.320230,8.448018',
  genf: '46.256360,6.197290,46.177710,6.105360',
  basel: '47.589600,7.634570,47.517220,7.556580',
  bern: '46.990154,7.495558,46.919034,7.294314',
  lausanne: '46.559740,6.696390,46.506790,6.579780',
  winterthur: '47.530630,8.808460,47.460210,8.676800',
  luzern: '47.075980,8.354470,47.024790,8.240270',
  stgallen: '47.452580,9.432580,47.394530,9.316480',
};

// ================ Action types ================ //

const FETCH_LOCATION_COUNTS_REQUEST = 'app/LandingPage/FETCH_LOCATION_COUNTS_REQUEST';
const FETCH_LOCATION_COUNTS_SUCCESS = 'app/LandingPage/FETCH_LOCATION_COUNTS_SUCCESS';
const FETCH_LOCATION_COUNTS_ERROR = 'app/LandingPage/FETCH_LOCATION_COUNTS_ERROR';

const FETCH_LANDING_LISTING_ROW_REQUEST = 'app/LandingPage/FETCH_LANDING_LISTING_ROW_REQUEST';
const FETCH_LANDING_LISTING_ROW_SUCCESS = 'app/LandingPage/FETCH_LANDING_LISTING_ROW_SUCCESS';
const FETCH_LANDING_LISTING_ROW_ERROR = 'app/LandingPage/FETCH_LANDING_LISTING_ROW_ERROR';

// ================ Reducer ================ //

const initialState = {
  locationCounts: {},
  locationCountsInProgress: false,
  locationCountsError: null,
  /** @type {Object<string, { ids: Array, inProgress: boolean, error: *, viewAllSearchParams: Object }>} */
  listingRows: {},
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_LOCATION_COUNTS_REQUEST:
      return { ...state, locationCountsInProgress: true, locationCountsError: null };
    case FETCH_LOCATION_COUNTS_SUCCESS:
      return {
        ...state,
        locationCounts: payload,
        locationCountsInProgress: false,
      };
    case FETCH_LOCATION_COUNTS_ERROR:
      return { ...state, locationCountsInProgress: false, locationCountsError: payload };

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

const fetchLocationCountsRequest = () => ({ type: FETCH_LOCATION_COUNTS_REQUEST });
const fetchLocationCountsSuccess = counts => ({
  type: FETCH_LOCATION_COUNTS_SUCCESS,
  payload: counts,
});
const fetchLocationCountsError = error => ({
  type: FETCH_LOCATION_COUNTS_ERROR,
  payload: error,
});

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
 * Fetch listing counts for all cities in parallel.
 * Each query uses perPage: 1 so only the meta.totalItems count is loaded,
 * keeping the response payload minimal.
 */
export const fetchLocationCounts = () => (dispatch, getState, sdk) => {
  dispatch(fetchLocationCountsRequest());

  const queries = Object.entries(CITY_BOUNDS_STRINGS).map(([cityId, boundsStr]) => {
    const bounds = decodeLatLngBounds(boundsStr);
    if (!bounds) {
      return Promise.resolve({ cityId, count: null });
    }
    return sdk.listings
      .query({ bounds, perPage: 1 })
      .then(response => ({ cityId, count: response.data.meta.totalItems }))
      .catch(() => ({ cityId, count: null }));
  });

  return Promise.all(queries)
    .then(results => {
      const counts = results.reduce((acc, { cityId, count }) => {
        if (count !== null) {
          acc[cityId] = count;
        }
        return acc;
      }, {});
      dispatch(fetchLocationCountsSuccess(counts));
    })
    .catch(e => {
      dispatch(fetchLocationCountsError(e));
    });
};

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
        dispatch(
          fetchLandingListingRowSuccess(row.id, ids, built.viewAllSearchParams)
        );
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

  await Promise.all([
    dispatch(fetchPageAssets(pageAsset, true)),
    dispatch(fetchLocationCounts()),
    listingRowsPromise,
  ]);
};
