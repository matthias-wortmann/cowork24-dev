import React from 'react';
import loadable from '@loadable/component';

import { privacyPolicyPageAsset } from '../../assets/hosted-page-defaults/privacyPolicyPageAsset';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

/**
 * Fallback, wenn das Hosted Asset privacy-policy nicht geladen werden kann.
 * Inhalt entspricht `ext/page-assets/privacy-policy.json` (Sharetribe Console).
 */
export const fallbackSections = privacyPolicyPageAsset;

const FallbackPage = props => {
  return <PageBuilder pageAssetsData={fallbackSections} {...props} />;
};

export default FallbackPage;
