import React from 'react';
import classNames from 'classnames';
import loadable from '@loadable/component';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink } from '../../components';

import SectionCategoryBar from '../PageBuilder/SectionBuilder/SectionCategoryBar';
import SectionCategoryShortcuts from '../PageBuilder/SectionBuilder/SectionCategoryShortcuts';
import SectionLogoSlider from '../PageBuilder/SectionBuilder/SectionLogoSlider';
import SectionSpaceOwner from '../PageBuilder/SectionBuilder/SectionSpaceOwner';
import SectionFaq from '../PageBuilder/SectionBuilder/SectionFaq';
import SectionLandingListingRows from '../PageBuilder/SectionBuilder/SectionLandingListingRows/SectionLandingListingRows';
import SectionLocations from '../PageBuilder/SectionBuilder/SectionLocations';

import HeroSearchForm from './HeroSearchForm';
import css from './FallbackPage.module.css';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

const is404 = error => error?.status === 404;

// Default landing sections: clear white / light-grey alternation (sticky bar stays white)
const defaultLandingSections = () => [
  { sectionType: 'defaultLandingHero', sectionId: 'hero' },
  { sectionType: 'categoryBar', sectionId: 'category-bar' },
  { sectionType: 'logoSlider', sectionId: 'logo-slider', landingSurface: 'muted' },
  {
    sectionType: 'landingListingRows',
    sectionId: 'landing-listings-newest-coliving',
    rowIds: ['newest', 'coliving'],
    landingSurface: 'white',
  },
  {
    sectionType: 'categoryShortcuts',
    sectionId: 'category-shortcuts',
    landingSurface: 'muted',
  },
  {
    sectionType: 'landingListingRows',
    sectionId: 'landing-listings-workation',
    rowIds: ['workation'],
    landingSurface: 'white',
  },
  { sectionType: 'sectionLocations', sectionId: 'locations', landingSurface: 'muted' },
  { sectionType: 'sectionSpaceOwner', sectionId: 'space-owner', landingSurface: 'white' },
  { sectionType: 'faq', sectionId: 'faq', landingSurface: 'muted' },
];

/** Page data for the custom start page (hero + categories). Exported for use in LandingPage. */
export const getDefaultLandingPageData = () => ({
  sections: defaultLandingSections(),
  meta: {
    pageTitle: {
      fieldType: 'metaTitle',
      content: 'Coworking Spaces in der Schweiz flexibel buchen | cowork24',
    },
    pageDescription: {
      fieldType: 'metaDescription',
      content:
        'Finde und buche Coworking Spaces, Büros und Meetingräume in der ganzen Schweiz. Flexible Arbeitsplätze nach Stunde, Tag oder Monat mieten – einfach und sicher auf cowork24.',
    },
  },
});

// Create fallback content (array of sections) in page asset format:
export const fallbackSections = error => {
  if (is404(error)) {
    return getDefaultLandingPageData();
  }
  return {
    sections: [
      {
        sectionType: 'customMaintenance',
        sectionId: 'maintenance-mode',
        error,
      },
    ],
    meta: {
      pageTitle: {
        fieldType: 'metaTitle',
        content: 'Wartung – cowork24',
      },
      pageDescription: {
        fieldType: 'metaDescription',
        content: 'Die Seite wird gerade gewartet. Bitte versuche es in Kürze erneut.',
      },
    },
  };
};

/**
 * Default hero section (Airbnb-style) with headline and floating search bar.
 * Exported so LandingPage can use it for the custom start page.
 */
export const SectionDefaultLandingHero = props => {
  const { sectionId } = props;
  return (
    <section id={sectionId} className={css.heroSection}>
      <div className={css.heroOrbs} aria-hidden="true">
        <div className={classNames(css.heroOrb, css.heroOrbCoral)} />
        <div className={classNames(css.heroOrb, css.heroOrbBrand)} />
        <div className={classNames(css.heroOrb, css.heroOrbSlate)} />
      </div>
      <div className={css.heroContent}>
        <h1 className={css.heroTitle}>
          <FormattedMessage id="LandingPage.defaultHeroTitle" />
        </h1>
        <p className={css.heroDescription}>
          <FormattedMessage id="LandingPage.defaultHeroDescription" />
        </p>
        <HeroSearchForm />
        <NamedLink name="NewListingPage" className={css.heroCta}>
          <FormattedMessage id="LandingPage.heroListSpaceCta" />
        </NamedLink>
      </div>
    </section>
  );
};

// Note: this microcopy/translation does not come from translation file.
//       It needs to be something that is not part of fetched assets but built-in text
const SectionMaintenanceMode = props => {
  const { sectionId, error } = props;

  return (
    <section id={sectionId} className={css.root}>
      <div className={css.content}>
        <h2>Oops, something went wrong!</h2>
        <p>{error?.message}</p>
      </div>
    </section>
  );
};

// This is the fallback page, in case there's no Landing Page asset defined in Console.
const FallbackPage = props => {
  const { error, ...rest } = props;
  return (
    <PageBuilder
      pageAssetsData={fallbackSections(error)}
      options={{
        sectionComponents: {
          customMaintenance: { component: SectionMaintenanceMode },
          defaultLandingHero: { component: SectionDefaultLandingHero },
          categoryBar: { component: SectionCategoryBar },
          landingListingRows: { component: SectionLandingListingRows },
          logoSlider: { component: SectionLogoSlider },
          categoryShortcuts: { component: SectionCategoryShortcuts },
          sectionLocations: { component: SectionLocations },
          sectionSpaceOwner: { component: SectionSpaceOwner },
          faq: { component: SectionFaq },
        },
      }}
      {...rest}
    />
  );
};

export default FallbackPage;
