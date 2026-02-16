import React from 'react';
import loadable from '@loadable/component';
import { FormattedMessage } from '../../util/reactIntl';

import SectionCategoryBar from '../PageBuilder/SectionBuilder/SectionCategoryBar';
import SectionCategoryShortcuts from '../PageBuilder/SectionBuilder/SectionCategoryShortcuts';
import SectionForOwners from '../PageBuilder/SectionBuilder/SectionForOwners';
import SectionFaq from '../PageBuilder/SectionBuilder/SectionFaq';
import SectionLocations from '../PageBuilder/SectionBuilder/SectionLocations';

import HeroSearchForm from './HeroSearchForm';
import css from './FallbackPage.module.css';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

const is404 = error => error?.status === 404;

// Default landing sections (Airbnb-style: hero, category bar, categories, for owners, FAQ)
const defaultLandingSections = () => [
  { sectionType: 'defaultLandingHero', sectionId: 'hero' },
  { sectionType: 'categoryBar', sectionId: 'category-bar' },
  { sectionType: 'categoryShortcuts', sectionId: 'category-shortcuts' },
  { sectionType: 'sectionLocations', sectionId: 'locations' },
  { sectionType: 'forOwners', sectionId: 'for-owners' },
  { sectionType: 'faq', sectionId: 'faq' },
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
      <div className={css.heroContent}>
        <h1 className={css.heroTitle}>
          <FormattedMessage id="LandingPage.defaultHeroTitle" />
        </h1>
        <p className={css.heroDescription}>
          <FormattedMessage id="LandingPage.defaultHeroDescription" />
        </p>
        <HeroSearchForm />
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
          categoryShortcuts: { component: SectionCategoryShortcuts },
          sectionLocations: { component: SectionLocations },
          forOwners: { component: SectionForOwners },
          faq: { component: SectionFaq },
        },
      }}
      {...rest}
    />
  );
};

export default FallbackPage;
