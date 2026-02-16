import React from 'react';
import loadable from '@loadable/component';

import SectionSpaceOwnerHero from '../PageBuilder/SectionBuilder/SectionSpaceOwnerHero';
import SectionBenefits from '../PageBuilder/SectionBuilder/SectionBenefits';
import SectionHowItWorks from '../PageBuilder/SectionBuilder/SectionHowItWorks';
import SectionFaqOwner from '../PageBuilder/SectionBuilder/SectionFaqOwner';
import SectionFinalCta from '../PageBuilder/SectionBuilder/SectionFinalCta';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

/**
 * Section definitions for the Space Owner Landing Page.
 */
const spaceOwnerSections = () => [
  { sectionType: 'spaceOwnerHero', sectionId: 'hero' },
  { sectionType: 'benefits', sectionId: 'benefits' },
  { sectionType: 'howItWorks', sectionId: 'how-it-works' },
  { sectionType: 'faqOwner', sectionId: 'faq' },
  { sectionType: 'finalCta', sectionId: 'final-cta' },
];

/**
 * Page data for the Space Owner Landing Page. Exported for use in SpaceOwnerLandingPage.
 */
export const getSpaceOwnerPageData = () => ({
  sections: spaceOwnerSections(),
  meta: {
    pageTitle: {
      fieldType: 'metaTitle',
      content: 'Coworking Space vermieten | Workspace kostenlos listen auf cowork24',
    },
    pageDescription: {
      fieldType: 'metaDescription',
      content:
        'Vermieten Sie Ihren Coworking Space, Bueroraum oder Meetingraum auf cowork24. Kostenlos inserieren, flexible Buchungen erhalten und sicher Geld verdienen – die Plattform fuer Workspace-Anbieter in der Schweiz.',
    },
  },
});

/**
 * Section component mapping for the Space Owner page.
 */
export const spaceOwnerSectionComponents = {
  spaceOwnerHero: { component: SectionSpaceOwnerHero },
  benefits: { component: SectionBenefits },
  howItWorks: { component: SectionHowItWorks },
  faqOwner: { component: SectionFaqOwner },
  finalCta: { component: SectionFinalCta },
};

const SectionMaintenanceMode = props => {
  const { sectionId, error } = props;
  return (
    <section id={sectionId}>
      <div>
        <h2>Oops, something went wrong!</h2>
        <p>{error?.message}</p>
      </div>
    </section>
  );
};

/**
 * Fallback page for the Space Owner Landing Page.
 */
const FallbackPage = props => {
  const { error, ...rest } = props;
  const is404 = error?.status === 404;

  const fallbackData = is404
    ? getSpaceOwnerPageData()
    : {
        sections: [
          { sectionType: 'customMaintenance', sectionId: 'maintenance-mode', error },
        ],
        meta: {
          pageTitle: { fieldType: 'metaTitle', content: 'Wartung – cowork24' },
          pageDescription: {
            fieldType: 'metaDescription',
            content: 'Die Seite wird gerade gewartet. Bitte versuche es in Kuerze erneut.',
          },
        },
      };

  return (
    <PageBuilder
      pageAssetsData={fallbackData}
      options={{
        sectionComponents: {
          customMaintenance: { component: SectionMaintenanceMode },
          ...spaceOwnerSectionComponents,
        },
      }}
      {...rest}
    />
  );
};

export default FallbackPage;
