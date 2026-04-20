import React from 'react';
import loadable from '@loadable/component';

import { termsOfServicePageAsset } from '../../assets/hosted-page-defaults/termsOfServicePageAsset';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

/**
 * Fallback, wenn das Hosted Asset terms-of-service nicht geladen werden kann.
 * Inhalt entspricht `ext/page-assets/terms-of-service.json` (Sharetribe Console).
 */
export const fallbackSections = termsOfServicePageAsset;

const FallbackPage = props => {
  return <PageBuilder pageAssetsData={fallbackSections} {...props} />;
};

export default FallbackPage;
