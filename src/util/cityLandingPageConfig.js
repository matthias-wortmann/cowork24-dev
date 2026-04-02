import { decodeLatLngBounds } from './urlHelpers';

/**
 * Swiss city coworking landing pages: URL slug → bounding box for listing search.
 * Bounds format: ne_lat,ne_lng,sw_lat,sw_lng (see decodeLatLngBounds).
 */
export const CITY_LANDING_SLUGS = [
  'zurich',
  'bern',
  'basel',
  'geneva',
  'lausanne',
  'lucerne',
  'st-gallen',
  'winterthur',
  'zug',
];

/** Open Graph preview (Unsplash; allow in CSP imgSrc). Motifs aligned with SectionLocations where applicable. */
export const CITY_LANDING_CONFIG = {
  zurich: {
    boundsStr: '47.434,8.625,47.320,8.448',
    ogImageUrl:
      'https://images.unsplash.com/photo-1554899199-f6d99e6be6f7?w=1200&h=630&fit=crop&crop=center',
  },
  bern: {
    boundsStr: '46.980,7.520,46.920,7.380',
    ogImageUrl:
      'https://images.unsplash.com/photo-1749588292359-9236987cfab3?w=1200&h=630&fit=crop&crop=center',
  },
  basel: {
    boundsStr: '47.595,7.645,47.520,7.550',
    ogImageUrl:
      'https://images.unsplash.com/photo-1707321519218-f0a61ce4a249?w=1200&h=630&fit=crop&crop=center',
  },
  geneva: {
    boundsStr: '46.230,6.200,46.170,6.050',
    ogImageUrl:
      'https://images.unsplash.com/photo-1752346168893-99056677e672?w=1200&h=630&fit=crop&crop=center',
  },
  lausanne: {
    boundsStr: '46.545,6.690,46.500,6.580',
    ogImageUrl:
      'https://images.unsplash.com/photo-1650057915898-6761696fddf8?w=1200&h=630&fit=crop&crop=center',
  },
  lucerne: {
    boundsStr: '47.075,8.340,47.005,8.230',
    ogImageUrl:
      'https://images.unsplash.com/photo-1750845372022-f4c633f433d5?w=1200&h=630&fit=crop&crop=center',
  },
  'st-gallen': {
    boundsStr: '47.450,9.420,47.400,9.350',
    ogImageUrl:
      'https://images.unsplash.com/photo-1712839398660-2642f9e21547?w=1200&h=630&fit=crop&crop=center',
  },
  winterthur: {
    boundsStr: '47.520,8.800,47.470,8.700',
    ogImageUrl:
      'https://images.unsplash.com/photo-1683727610281-26da8c641e4e?w=1200&h=630&fit=crop&crop=center',
  },
  zug: {
    boundsStr: '47.185,8.545,47.155,8.490',
    ogImageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=630&fit=crop&crop=center',
  },
};

/**
 * @param {string} slug URL segment
 * @returns {{ slug: string, boundsStr: string, ogImageUrl?: string } | null}
 */
export const getCityLandingConfig = slug => {
  if (!slug || !CITY_LANDING_CONFIG[slug]) {
    return null;
  }
  return { slug, ...CITY_LANDING_CONFIG[slug] };
};

/**
 * @param {string} boundsStr
 * @returns {object|null} SDK LatLngBounds or null
 */
export const getBoundsForSdk = boundsStr => decodeLatLngBounds(boundsStr);
