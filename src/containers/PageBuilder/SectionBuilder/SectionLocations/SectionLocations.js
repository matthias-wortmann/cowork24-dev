import React from 'react';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useIntl } from '../../../../util/reactIntl';
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';
import { pathByRouteName } from '../../../../util/routes';
import { stringify } from '../../../../util/urlHelpers';
import { CITY_LANDING_SLUGS } from '../../../../util/cityLandingPageConfig';
import { landingSectionSurfaceClassName } from '../../../LandingPage/landingSectionSurface';

import SectionContainer from '../SectionContainer';
import LocationCard from './LocationCard';
import css from './SectionLocations.module.css';

/**
 * City display data with images, bounds, and address strings for the
 * Sharetribe search page URL pattern.
 *
 * Images: verified Unsplash photos of each city (unsplash.com license).
 * The domain images.unsplash.com must be allowed in your Content Security
 * Policy (server/csp.js → imgSrc).
 */
const CITIES_DATA = [
  {
    id: 'zurich',
    name: 'Zürich',
    // Claudio Schwarz – Zürich Limmat & Grossmünster
    image:
      'https://images.unsplash.com/photo-1554899199-f6d99e6be6f7?w=400&h=400&fit=crop&crop=center',
    address: 'Zürich, Kanton Zürich, Schweiz',
    bounds: '47.434666,8.625452,47.320230,8.448018',
  },
  {
    id: 'genf',
    /** Maps to `/coworking/geneva` (CityLandingPage slug differs from SectionLocations id). */
    cityLandingSlug: 'geneva',
    name: 'Genf',
    // Ryan Klaus – Geneva Jet d'Eau fountain
    image:
      'https://images.unsplash.com/photo-1752346168893-99056677e672?w=400&h=400&fit=crop&crop=center',
    address: 'Genf, Kanton Genf, Schweiz',
    bounds: '46.256360,6.197290,46.177710,6.105360',
  },
  {
    id: 'basel',
    name: 'Basel',
    // Jean-Nicolas Fahrenberg – Basel rooftop cityscape
    image:
      'https://images.unsplash.com/photo-1707321519218-f0a61ce4a249?w=400&h=400&fit=crop&crop=center',
    address: 'Basel, Kanton Basel-Stadt, Schweiz',
    bounds: '47.589600,7.634570,47.517220,7.556580',
  },
  {
    id: 'bern',
    name: 'Bern',
    // Vincenzo Inzone – Bern Zytglogge clock tower & tram
    image:
      'https://images.unsplash.com/photo-1749588292359-9236987cfab3?w=400&h=400&fit=crop&crop=center',
    address: 'Bern, Kanton Bern, Schweiz',
    bounds: '46.990154,7.495558,46.919034,7.294314',
  },
  {
    id: 'lausanne',
    name: 'Lausanne',
    // Ilia Bronskiy – Lausanne city street with cathedral tower
    image:
      'https://images.unsplash.com/photo-1650057915898-6761696fddf8?w=400&h=400&fit=crop&crop=center',
    address: 'Lausanne, Kanton Waadt, Schweiz',
    bounds: '46.559740,6.696390,46.506790,6.579780',
  },
  {
    id: 'winterthur',
    name: 'Winterthur',
    // Claudio Schwarz – Winterthur building reflection
    image:
      'https://images.unsplash.com/photo-1683727610281-26da8c641e4e?w=400&h=400&fit=crop&crop=center',
    address: 'Winterthur, Kanton Zürich, Schweiz',
    bounds: '47.530630,8.808460,47.460210,8.676800',
  },
  {
    id: 'luzern',
    cityLandingSlug: 'lucerne',
    name: 'Luzern',
    // Miltiadis Fragkidis – Luzern Chapel Bridge & water tower
    image:
      'https://images.unsplash.com/photo-1750845372022-f4c633f433d5?w=400&h=400&fit=crop&crop=center',
    address: 'Luzern, Kanton Luzern, Schweiz',
    bounds: '47.075980,8.354470,47.024790,8.240270',
  },
  {
    id: 'stgallen',
    cityLandingSlug: 'st-gallen',
    name: 'St. Gallen',
    // Claudio Schwarz – St. Gallen old town
    image:
      'https://images.unsplash.com/photo-1712839398660-2642f9e21547?w=400&h=400&fit=crop&crop=center',
    address: 'St. Gallen, Kanton St. Gallen, Schweiz',
    bounds: '47.452580,9.432580,47.394530,9.316480',
  },
];

/**
 * Build search page URL for a given city.
 *
 * @param {Object} city - City object from CITIES_DATA
 * @param {string} searchPagePath - Base path for the search page (e.g. "/s")
 * @returns {string} Full search URL with address and bounds params
 */
const buildSearchUrl = (city, searchPagePath) => {
  const params = stringify({ address: city.address, bounds: city.bounds });
  return `${searchPagePath}?${params}`;
};

/**
 * Prefer `/coworking/:slug` when a city landing exists; otherwise map search URL.
 *
 * @param {Object} city - entry from CITIES_DATA
 * @param {Array} routeConfiguration
 * @param {string} searchPagePath
 * @returns {string} path + optional query for History API
 */
const buildCityCardHref = (city, routeConfiguration, searchPagePath) => {
  const landingSlug = city.cityLandingSlug ?? city.id;
  if (CITY_LANDING_SLUGS.includes(landingSlug)) {
    return pathByRouteName('CityLandingPage', routeConfiguration, { citySlug: landingSlug });
  }
  return buildSearchUrl(city, searchPagePath);
};

/**
 * Airbnb Destinations-style section that displays Swiss cities as clickable
 * location cards. Desktop: 4-column grid. Mobile: horizontal card slider.
 *
 * @component
 * @param {Object} props
 * @param {string} props.sectionId - Section ID for the container element
 * @param {string} [props.title] - Custom section title (overrides default)
 * @param {string} [props.subtitle] - Custom section subtitle (overrides default)
 * @returns {JSX.Element}
 */
const SectionLocations = props => {
  const {
    sectionId,
    title,
    subtitle,
    className,
    rootClassName,
    appearance,
    options,
    landingSurface,
  } = props;

  const intl = useIntl();
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const searchPagePath = pathByRouteName('SearchPage', routeConfiguration);

  const sectionTitle = title || intl.formatMessage({ id: 'SectionLocations.title' });
  const sectionSubtitle = subtitle || intl.formatMessage({ id: 'SectionLocations.subtitle' });

  const handleCityClick = (e, city) => {
    e.preventDefault();
    history.push(buildCityCardHref(city, routeConfiguration, searchPagePath));
  };

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={classNames(
        rootClassName,
        css.root,
        landingSectionSurfaceClassName(landingSurface)
      )}
      appearance={appearance}
      options={options}
    >
      <div className={css.wrapper}>
        <div className={css.sectionHeader}>
          <h2 className={css.title}>{sectionTitle}</h2>
          <p className={css.subtitle}>{sectionSubtitle}</p>
        </div>
        <div className={css.grid}>
          {CITIES_DATA.map(city => (
            <LocationCard
              key={city.id}
              name={city.name}
              image={city.image}
              href={buildCityCardHref(city, routeConfiguration, searchPagePath)}
              onClick={e => handleCityClick(e, city)}
            />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionLocations;
