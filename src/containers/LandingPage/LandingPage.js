import React from 'react';
import loadable from '@loadable/component';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { propTypes } from '../../util/types';

import FallbackPage from './FallbackPage';
import {
  getDefaultLandingPageData,
  SectionDefaultLandingHero,
} from './FallbackPage';
import SectionCategoryBar from '../PageBuilder/SectionBuilder/SectionCategoryBar';
import SectionCategoryShortcuts from '../PageBuilder/SectionBuilder/SectionCategoryShortcuts';
import SectionForOwners from '../PageBuilder/SectionBuilder/SectionForOwners';
import SectionFaq from '../PageBuilder/SectionBuilder/SectionFaq';

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
          categoryShortcuts: { component: SectionCategoryShortcuts },
          forOwners: { component: SectionForOwners },
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
