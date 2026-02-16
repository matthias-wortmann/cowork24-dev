import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { decodeLatLngBounds } from '../../util/urlHelpers';

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

// ================ Reducer ================ //

const initialState = {
  locationCounts: {},
  locationCountsInProgress: false,
  locationCountsError: null,
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

// ================ loadData ================ //

export const loadData = (params, search) => dispatch => {
  const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
  return Promise.all([
    dispatch(fetchPageAssets(pageAsset, true)),
    dispatch(fetchLocationCounts()),
  ]);
};
