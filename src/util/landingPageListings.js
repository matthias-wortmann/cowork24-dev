import { constructQueryParamName } from './search';
import { createImageVariantConfig } from './sdkLoader';

/**
 * @param {Object} data SDK listings query response data
 * @returns {Array} listing id objects
 */
export const publishedListingResultIds = data => {
  const listings = data.data || [];
  return listings
    .filter(l => !l.attributes.deleted && l.attributes.state === 'published')
    .map(l => l.id);
};

/**
 * @param {Array<Object>} categories
 * @param {string} categoryId
 * @param {Array<Object>} path
 * @returns {Array<Object>|null} path from root to category
 */
export const findCategoryPathById = (categories, categoryId, path = []) => {
  if (!categories?.length) {
    return null;
  }
  for (const cat of categories) {
    const nextPath = [...path, cat];
    if (cat.id === categoryId) {
      return nextPath;
    }
    const subs = cat.subcategories || [];
    const found = findCategoryPathById(subs, categoryId, nextPath);
    if (found) {
      return found;
    }
  }
  return null;
};

/**
 * Prefer deepest match when a parent name matches but children exist.
 *
 * @param {Array<Object>} categories
 * @param {function(string, string): boolean} matchFn (id, name)
 * @param {Array<Object>} path
 * @returns {Array<Object>|null}
 */
export const findCategoryPathByMatch = (categories, matchFn, path = []) => {
  if (!categories?.length) {
    return null;
  }
  for (const cat of categories) {
    const nextPath = [...path, cat];
    const subs = cat.subcategories || [];
    if (matchFn(cat.id, cat.name)) {
      if (subs.length > 0) {
        const deeper = findCategoryPathByMatch(subs, matchFn, nextPath);
        if (deeper) {
          return deeper;
        }
      }
      return nextPath;
    }
    const deeper = findCategoryPathByMatch(subs, matchFn, nextPath);
    if (deeper) {
      return deeper;
    }
  }
  return null;
};

const constructCategoryPropertiesForAPI = (queryParamPrefix, categories, level, params) => {
  const levelKey = `${queryParamPrefix}${level}`;
  const levelValue =
    typeof params?.[levelKey] !== 'undefined' ? `${params?.[levelKey]}` : undefined;
  const foundCategory = categories.find(cat => cat.id === levelValue);
  const subcategories = foundCategory?.subcategories || [];
  return foundCategory && subcategories.length > 0
    ? {
        [levelKey]: levelValue,
        ...constructCategoryPropertiesForAPI(queryParamPrefix, subcategories, level + 1, params),
      }
    : foundCategory
    ? { [levelKey]: levelValue }
    : {};
};

/**
 * Build raw pub_* params from a category path (root → leaf).
 *
 * @param {Object} config merged app config
 * @param {Array<Object>} categoryPath
 * @returns {Object}
 */
export const categoryPathToLevelParams = (config, categoryPath) => {
  const categoryFilter = config.search.defaultFilters?.find(f => f.schemaType === 'category');
  const key = categoryFilter?.key || config.categoryConfiguration?.key || 'categoryLevel';
  const scope = categoryFilter?.scope || 'public';
  const prefix = constructQueryParamName(key, scope);
  const raw = {};
  categoryPath.forEach((cat, i) => {
    raw[`${prefix}${i + 1}`] = cat.id;
  });
  return raw;
};

/**
 * Validate category params against the configured tree (same rules as SearchPage).
 *
 * @param {Object} config
 * @param {Object} rawLevelParams keys like pub_categoryLevel1
 * @returns {Object} API-ready category params or {}
 */
export const validatedCategoryParams = (config, rawLevelParams) => {
  const categoryFilter = config.search.defaultFilters?.find(f => f.schemaType === 'category');
  const key = categoryFilter?.key || config.categoryConfiguration?.key || 'categoryLevel';
  const scope = categoryFilter?.scope || 'public';
  const prefix = constructQueryParamName(key, scope);
  const categories = config.categoryConfiguration?.categories || [];
  return constructCategoryPropertiesForAPI(prefix, categories, 1, rawLevelParams);
};

const searchValidListingTypes = (listingTypes, config) => {
  return config.listing.enforceValidListingType
    ? {
        pub_listingType: listingTypes.map(l => l.listingType),
      }
    : {};
};

/**
 * Resolve category path for a landing row definition.
 *
 * @param {Object} row from config.landingPage.listingRows
 * @param {Object} config
 * @returns {Array<Object>|null} null if category required but not found
 */
export const resolveCategoryPathForRow = (row, config) => {
  const needsCategory = !!(row.categoryId || row.categoryMatch);
  if (!needsCategory) {
    return [];
  }
  const categories = config.categoryConfiguration?.categories || [];
  if (row.categoryId) {
    const byId = findCategoryPathById(categories, row.categoryId);
    return byId;
  }
  if (row.categoryMatch) {
    return findCategoryPathByMatch(categories, row.categoryMatch);
  }
  return null;
};

/**
 * Build SDK query params and URL params for "view all" for one landing row.
 *
 * @param {Object} config
 * @param {Object} row
 * @returns {{ sdkParams: Object, viewAllSearchParams: Object }|null} null if category missing
 */
export const buildLandingRowQueryParams = (config, row) => {
  const sortKey = row.sort || 'createdAt';
  const relevanceKey = config.search.sortConfig.relevanceKey;
  const sortMaybe = sortKey === relevanceKey ? {} : { sort: sortKey };

  const categoryPath = resolveCategoryPathForRow(row, config);
  if (row.categoryId || row.categoryMatch) {
    if (!categoryPath || categoryPath.length === 0) {
      return null;
    }
  }

  const rawCategory = categoryPath.length ? categoryPathToLevelParams(config, categoryPath) : {};
  const categoryApiParams = rawCategory ? validatedCategoryParams(config, rawCategory) : {};

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  const stockMaybe = { minStock: 1, stockMode: 'match-undefined' };

  const listingTypesMaybe = searchValidListingTypes(config.listing.listingTypes, config);

  const sdkParams = {
    ...categoryApiParams,
    ...listingTypesMaybe,
    ...stockMaybe,
    ...sortMaybe,
    page: 1,
    perPage: row.perPage || 10,
    include: ['author', 'images'],
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

  const viewAllSearchParams = {
    ...sortMaybe,
    ...rawCategory,
  };

  return { sdkParams, viewAllSearchParams };
};
