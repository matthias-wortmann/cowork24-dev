import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { storableError } from '../../util/errors';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { publishedListingResultIds } from '../../util/landingPageListings';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { getCityLandingConfig, getBoundsForSdk } from '../../util/cityLandingPageConfig';

const RESULT_PAGE_SIZE = 8;

const listingTypesParams = config =>
  config.listing.enforceValidListingType
    ? { pub_listingType: config.listing.listingTypes.map(l => l.listingType) }
    : {};

const buildSdkParams = (config, boundsStr) => {
  const bounds = getBoundsForSdk(boundsStr);
  if (!bounds) {
    return null;
  }

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return {
    bounds,
    page: 1,
    perPage: RESULT_PAGE_SIZE,
    include: ['author', 'images'],
    minStock: 1,
    stockMode: 'match-undefined',
    ...listingTypesParams(config),
    'fields.listing': [
      'title',
      'geolocation',
      'price',
      'deleted',
      'state',
      'publicData.listingType',
      'publicData.transactionProcessAlias',
      'publicData.unitType',
      'publicData.cardStyle',
      'publicData.pickupEnabled',
      'publicData.shippingEnabled',
      'publicData.priceVariationsEnabled',
      'publicData.priceVariants',
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': [
      'variants.scaled-small',
      'variants.scaled-medium',
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    'limit.images': 1,
  };
};

export const fetchCityListings = createAsyncThunk(
  'CityLandingPage/fetchCityListings',
  async ({ citySlug, config }, thunkAPI) => {
    const { dispatch, rejectWithValue, extra: sdk } = thunkAPI;
    const city = getCityLandingConfig(citySlug);
    if (!city) {
      return rejectWithValue(storableError(new Error('Unknown city')));
    }
    const params = buildSdkParams(config, city.boundsStr);
    if (!params) {
      return rejectWithValue(storableError(new Error('Invalid bounds')));
    }

    try {
      const response = await sdk.listings.query(params);
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };
      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      return {
        citySlug,
        ids: publishedListingResultIds(response.data),
      };
    } catch (e) {
      return rejectWithValue(storableError(e));
    }
  }
);

const cityLandingPageSlice = createSlice({
  name: 'CityLandingPage',
  initialState: {
    currentCitySlug: null,
    listingIds: [],
    fetchInProgress: false,
    fetchError: null,
  },
  reducers: {
    clearCityLanding: () => ({
      currentCitySlug: null,
      listingIds: [],
      fetchInProgress: false,
      fetchError: null,
    }),
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCityListings.pending, (state, action) => {
        state.currentCitySlug = action.meta.arg.citySlug;
        state.fetchInProgress = true;
        state.fetchError = null;
      })
      .addCase(fetchCityListings.fulfilled, (state, action) => {
        state.listingIds = action.payload.ids;
        state.fetchInProgress = false;
      })
      .addCase(fetchCityListings.rejected, (state, action) => {
        state.fetchInProgress = false;
        state.fetchError = action.payload;
        state.listingIds = [];
      });
  },
});

export const { clearCityLanding } = cityLandingPageSlice.actions;

export default cityLandingPageSlice.reducer;

export const loadData = (params, search, config) => async (dispatch, getState, sdk) => {
  const { citySlug } = params || {};
  const city = getCityLandingConfig(citySlug);
  if (!city) {
    return Promise.resolve();
  }

  const state = getState();
  const currentUser = state.user?.currentUser;
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const hasViewingRights = currentUser && hasPermissionToViewData(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const canFetchListings =
    !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized && hasViewingRights);

  if (!canFetchListings) {
    return Promise.resolve();
  }

  await dispatch(fetchCityListings({ citySlug, config }));
};
