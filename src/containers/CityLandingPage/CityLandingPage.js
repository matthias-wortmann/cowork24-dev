import React, { useMemo, useCallback } from 'react';
import loadable from '@loadable/component';
import classNames from 'classnames';
import { bool, object, arrayOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { stringify, decodeLatLngBounds, createSlug } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { CITY_LANDING_SLUGS, getCityLandingConfig } from '../../util/cityLandingPageConfig';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H1, H2, Page, NamedLink, ListingCard, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import css from './CityLandingPage.module.css';

const CityLandingMap = loadable(
  () => import(/* webpackChunkName: "CityLandingMap" */ '../SearchPage/SearchMap/SearchMap'),
  { fallback: <div className={css.mapFallback} aria-hidden /> }
);

const FAQ_COUNT = 5;

const listingCardSizes = [
  '(max-width: 549px) 100vw',
  '(max-width: 767px) 50vw',
  '(max-width: 1439px) 26vw',
  '(max-width: 1920px) 18vw',
  '14vw',
].join(', ');

const msg = (slug, key) => ({ id: `CityLandingPage.${slug}.${key}` });

/**
 * SEO landing page for coworking in a Swiss city (SSR via loadData).
 */
export const CityLandingPageComponent = props => {
  const {
    match,
    location,
    staticContext,
    listingIds,
    fetchInProgress,
    fetchError,
    scrollingDisabled,
  } = props;

  const citySlug = match?.params?.citySlug;
  const city = getCityLandingConfig(citySlug);
  const intl = useIntl();
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();

  const listings = props.listings || [];

  const marketplaceRootURL = config.marketplaceRootURL.replace(/\/$/, '');
  const cityPath = createResourceLocatorString(
    'CityLandingPage',
    routeConfiguration,
    { citySlug },
    {}
  );
  const canonicalPath = `${marketplaceRootURL}${cityPath}`;

  const searchExplorePath = useMemo(
    () => createResourceLocatorString('SearchPage', routeConfiguration, {}, {}),
    [routeConfiguration]
  );
  const searchExploreUrl = `${marketplaceRootURL}${searchExplorePath}`;

  const searchQuery = city ? stringify({ bounds: decodeLatLngBounds(city.boundsStr) }) : '';

  const mapBounds = useMemo(() => {
    if (!city) {
      return null;
    }
    return decodeLatLngBounds(city.boundsStr);
  }, [city]);

  const noopMapMoveEnd = useCallback(() => {}, []);

  const pageTitle = intl.formatMessage(msg(citySlug, 'metaTitle'));
  const pageDescription = intl.formatMessage(msg(citySlug, 'metaDescription'));

  const faqEntities = useMemo(() => {
    if (!city) {
      return [];
    }
    return Array.from({ length: FAQ_COUNT }, (_, i) => {
      const n = i + 1;
      return {
        '@type': 'Question',
        name: intl.formatMessage(msg(citySlug, `faq${n}q`)),
        acceptedAnswer: {
          '@type': 'Answer',
          text: intl.formatMessage(msg(citySlug, `faq${n}a`)),
        },
      };
    });
  }, [city, citySlug, intl]);

  const schemaBlocks = useMemo(() => {
    if (!city) {
      return null;
    }

    const itemListId = `${canonicalPath}#itemlist`;
    const hasListings = listings.length > 0;

    const webPage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalPath}#webpage`,
      url: canonicalPath,
      name: pageTitle,
      description: pageDescription,
      inLanguage: intl.locale,
      about: {
        '@type': 'AdministrativeArea',
        name: intl.formatMessage(msg(citySlug, 'placeName')),
        containedInPlace: {
          '@type': 'Country',
          name: 'CH',
        },
      },
      ...(hasListings ? { mainEntity: { '@id': itemListId } } : {}),
    };

    const faqPage = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${canonicalPath}#faq`,
      mainEntity: faqEntities,
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: intl.formatMessage({ id: 'CityLandingPage.breadcrumbHome' }),
          item: `${marketplaceRootURL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: intl.formatMessage({ id: 'CityLandingPage.breadcrumbCoworking' }),
          item: searchExploreUrl,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: intl.formatMessage(msg(citySlug, 'linkLabel')),
          item: canonicalPath,
        },
      ],
    };

    const blocks = [webPage, faqPage, breadcrumbSchema];

    if (hasListings) {
      const listingsHeading = intl.formatMessage(msg(citySlug, 'listingsHeading'));
      const itemListElement = listings.map((listing, i) => {
        const listingTitle = listing.attributes?.title || '';
        const listingSlug = createSlug(listingTitle);
        const listingPath = createResourceLocatorString(
          'ListingPage',
          routeConfiguration,
          { id: listing.id.uuid, slug: listingSlug },
          {}
        );
        const listingUrl = `${marketplaceRootURL}${listingPath}`;
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Thing',
            '@id': listingUrl,
            name: listingTitle,
            url: listingUrl,
          },
        };
      });

      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': itemListId,
        name: listingsHeading,
        numberOfItems: listings.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement,
      });
    }

    return blocks;
  }, [
    city,
    canonicalPath,
    pageTitle,
    pageDescription,
    faqEntities,
    intl,
    citySlug,
    marketplaceRootURL,
    listings,
    routeConfiguration,
    searchExploreUrl,
  ]);

  const socialSharing = useMemo(() => {
    if (!city?.ogImageUrl) {
      return undefined;
    }
    return {
      title: pageTitle,
      description: pageDescription,
      images1200: [
        {
          name: 'city-open-graph',
          url: city.ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
    };
  }, [city, pageTitle, pageDescription]);

  if (!city) {
    return <NotFoundPage staticContext={staticContext} />;
  }

  const showFetchError = !!fetchError;

  const heroBgStyle =
    city?.ogImageUrl != null
      ? { '--cityHeroBg': `url(${city.ogImageUrl})` }
      : undefined;

  return (
    <Page
      className={css.root}
      title={pageTitle}
      description={pageDescription}
      scrollingDisabled={scrollingDisabled}
      schema={schemaBlocks}
      socialSharing={socialSharing}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
        mainColumnClassName={css.layoutMain}
      >
        <div className={css.shell}>
          <header className={css.hero} style={heroBgStyle}>
            <div className={css.heroImageLayer} aria-hidden />
            <div className={css.heroScrim} aria-hidden />

            <nav
              className={classNames(css.breadcrumbs, css.heroBreadcrumbs, css.inner)}
              aria-label={intl.formatMessage({ id: 'CityLandingPage.breadcrumbAriaLabel' })}
            >
              <ol className={css.breadcrumbList}>
                <li className={css.breadcrumbItem}>
                  <NamedLink name="LandingPage" className={css.breadcrumbLink}>
                    <FormattedMessage id="CityLandingPage.breadcrumbHome" />
                  </NamedLink>
                </li>
                <li className={css.breadcrumbItem}>
                  <NamedLink name="SearchPage" className={css.breadcrumbLink} to={{ search: '' }}>
                    <FormattedMessage id="CityLandingPage.breadcrumbCoworking" />
                  </NamedLink>
                </li>
                <li className={css.breadcrumbItem} aria-current="page">
                  <span className={css.breadcrumbCurrent}>
                    <FormattedMessage {...msg(citySlug, 'linkLabel')} />
                  </span>
                </li>
              </ol>
            </nav>

            <div className={classNames(css.heroTextBlock, css.inner)}>
              <H1 className={css.heroTitle}>
                <FormattedMessage {...msg(citySlug, 'h1')} />
              </H1>
              <p className={css.heroIntro}>
                <FormattedMessage {...msg(citySlug, 'intro')} />
              </p>
              {searchQuery ? (
                <NamedLink
                  name="SearchPage"
                  to={{ search: `?${searchQuery}` }}
                  className={css.heroCta}
                >
                  <FormattedMessage id="CityLandingPage.heroCta" />
                </NamedLink>
              ) : null}
            </div>
          </header>

          <section
            className={classNames(css.section, css.sectionListings)}
            aria-labelledby="city-listings-heading"
          >
            <div className={css.inner}>
              <div className={css.sectionHeadingRow}>
                <H2 as="h2" className={css.sectionTitle} id="city-listings-heading">
                  <FormattedMessage {...msg(citySlug, 'listingsHeading')} />
                </H2>
                {searchQuery ? (
                  <NamedLink
                    name="SearchPage"
                    to={{ search: `?${searchQuery}` }}
                    className={css.sectionLink}
                  >
                    <FormattedMessage {...msg(citySlug, 'viewAllListings')} />
                  </NamedLink>
                ) : null}
              </div>

              {showFetchError ? (
                <p className={css.error} role="alert">
                  <FormattedMessage id="CityLandingPage.fetchError" />
                </p>
              ) : null}
              {!fetchInProgress && !showFetchError && listings.length === 0 ? (
                <p className={css.sectionLead}>
                  <FormattedMessage {...msg(citySlug, 'noListings')} />
                </p>
              ) : null}

              <ul className={css.listingsGrid}>
                {listings.map((listing, index) => (
                  <li className={css.listingItem} key={listing.id.uuid}>
                    <ListingCard
                      listing={listing}
                      renderSizes={listingCardSizes}
                      showAuthorInfo={false}
                      intl={intl}
                      highImagePriority={index < 2}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {mapBounds ? (
            <section className={css.sectionMap} aria-labelledby="city-map-heading">
              <div className={css.inner}>
                <H2 as="h2" className={css.mapSectionTitle} id="city-map-heading">
                  <FormattedMessage id="CityLandingPage.mapHeading" />
                </H2>
                <div
                  className={css.mapEmbed}
                  role="region"
                  aria-label={intl.formatMessage({ id: 'CityLandingPage.mapRegionAriaLabel' })}
                >
                  <div className={css.mapViewport}>
                    <CityLandingMap
                      id="cityLandingMap"
                      bounds={mapBounds}
                      location={location}
                      listings={listings}
                      onMapMoveEnd={noopMapMoveEnd}
                      messages={intl.messages}
                      reusableContainerClassName={css.cityMapShell}
                      rootClassName={css.cityMapRoot}
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section
            className={classNames(css.section, css.sectionBand)}
            aria-labelledby="why-city-heading"
          >
            <div className={css.inner}>
              <H2 as="h2" className={css.sectionTitle} id="why-city-heading">
                <FormattedMessage {...msg(citySlug, 'whyTitle')} />
              </H2>
              <p className={css.sectionLead}>
                <FormattedMessage {...msg(citySlug, 'whyBody1')} />
              </p>
              <p className={css.sectionBody}>
                <FormattedMessage {...msg(citySlug, 'whyBody2')} />
              </p>
            </div>
          </section>

          <section className={classNames(css.section, css.sectionFaq)} aria-labelledby="faq-heading">
            <div className={css.inner}>
              <H2 as="h2" className={css.sectionTitle} id="faq-heading">
                <FormattedMessage id="CityLandingPage.faqSectionTitle" />
              </H2>
              <div className={css.faqStack}>
                {Array.from({ length: FAQ_COUNT }, (_, i) => {
                  const n = i + 1;
                  return (
                    <details className={css.faqDetails} key={`faq-${n}`}>
                      <summary className={css.faqSummary}>
                        <span className={css.faqSummaryText}>
                          <FormattedMessage {...msg(citySlug, `faq${n}q`)} />
                        </span>
                      </summary>
                      <div className={css.faqAnswer}>
                        <FormattedMessage {...msg(citySlug, `faq${n}a`)} />
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            className={classNames(css.section, css.sectionBand, css.sectionCities)}
            aria-labelledby="other-cities-heading"
          >
            <div className={css.inner}>
              <H2 as="h2" className={css.sectionTitle} id="other-cities-heading">
                <FormattedMessage id="CityLandingPage.otherCitiesHeading" />
              </H2>
              <ul className={css.cityLinks}>
                {CITY_LANDING_SLUGS.filter(s => s !== citySlug).map(slug => (
                  <li key={slug} className={css.cityLinkItem}>
                    <NamedLink
                      name="CityLandingPage"
                      params={{ citySlug: slug }}
                      className={css.cityPill}
                    >
                      <FormattedMessage {...msg(slug, 'linkLabel')} />
                    </NamedLink>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

CityLandingPageComponent.propTypes = {
  match: shape({
    params: shape({
      citySlug: string,
    }),
  }),
  location: shape({
    search: string,
    pathname: string,
  }),
  staticContext: object,
  listings: arrayOf(propTypes.listing),
  listingIds: arrayOf(propTypes.uuid),
  fetchInProgress: bool,
  fetchError: object,
  scrollingDisabled: bool,
};

const mapStateToProps = state => {
  const { listingIds, fetchInProgress, fetchError } = state.CityLandingPage || {};
  const listings = getListingsById(state, listingIds || []);

  return {
    listings,
    listingIds,
    fetchInProgress,
    fetchError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const CityLandingPage = compose(
  withRouter,
  connect(mapStateToProps)
)(CityLandingPageComponent);

export default CityLandingPage;
