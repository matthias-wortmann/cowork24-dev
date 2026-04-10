import React from 'react';
import loadable from '@loadable/component';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { propTypes } from '../../util/types';

import FallbackPage from './FallbackPage';
import { getDefaultLandingPageData, SectionDefaultLandingHero } from './FallbackPage';
import SectionCategoryBar from '../PageBuilder/SectionBuilder/SectionCategoryBar';
import SectionCategoryShortcuts from '../PageBuilder/SectionBuilder/SectionCategoryShortcuts';
import SectionLandingListingRows from '../PageBuilder/SectionBuilder/SectionLandingListingRows/SectionLandingListingRows';

// Below-the-hero sections: separate chunks to reduce initial JS parse (TBT) on the landing route.
const SectionLogoSlider = loadable(() =>
  import(/* webpackChunkName: "SectionLogoSlider" */ '../PageBuilder/SectionBuilder/SectionLogoSlider/SectionLogoSlider')
);
const SectionLocations = loadable(() =>
  import(/* webpackChunkName: "SectionLocations" */ '../PageBuilder/SectionBuilder/SectionLocations/SectionLocations')
);
const SectionSpaceOwner = loadable(() =>
  import(/* webpackChunkName: "SectionSpaceOwner" */ '../PageBuilder/SectionBuilder/SectionSpaceOwner/SectionSpaceOwner')
);
const SectionFaq = loadable(() =>
  import(/* webpackChunkName: "SectionFaq" */ '../PageBuilder/SectionBuilder/SectionFaq/SectionFaq')
);

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

/**
 * Landing page always shows the custom Airbnb-style start page
 * (hero + category bar + category shortcuts). Hosted landing-page asset from Console is not used.
 */
export const LandingPageComponent = props => {
  const { error } = props;

  return (
    <PageBuilder
      pageAssetsData={getDefaultLandingPageData()}
      inProgress={false}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
      options={{
        sectionComponents: {
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
    />
  );
};

LandingPageComponent.propTypes = {
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { error } = state.hostedAssets || {};
  return { error };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const LandingPage = compose(connect(mapStateToProps))(LandingPageComponent);

export default LandingPage;
