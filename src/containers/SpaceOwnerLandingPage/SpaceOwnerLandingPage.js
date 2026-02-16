import React from 'react';
import loadable from '@loadable/component';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { propTypes } from '../../util/types';

import FallbackPage, {
  getSpaceOwnerPageData,
  spaceOwnerSectionComponents,
} from './FallbackPage';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

/**
 * Dedicated landing page for coworking space owners.
 * Uses PageBuilder with hardcoded section components, optimized for SEO and conversion.
 */
export const SpaceOwnerLandingPageComponent = props => {
  const { error } = props;

  return (
    <PageBuilder
      pageAssetsData={getSpaceOwnerPageData()}
      inProgress={false}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
      options={{
        sectionComponents: spaceOwnerSectionComponents,
      }}
    />
  );
};

SpaceOwnerLandingPageComponent.propTypes = {
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { error } = state.hostedAssets || {};
  return { error };
};

const SpaceOwnerLandingPage = compose(connect(mapStateToProps))(
  SpaceOwnerLandingPageComponent
);

export default SpaceOwnerLandingPage;
