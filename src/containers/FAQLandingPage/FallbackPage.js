import React from 'react';
import loadable from '@loadable/component';

import { useIntl } from '../../util/reactIntl';
import SectionFaq from '../PageBuilder/SectionBuilder/SectionFaq';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

export const fallbackSections = intl => ({
  sections: [{ sectionType: 'faq', sectionId: 'faq', landingSurface: 'muted' }],
  meta: {
    pageTitle: {
      fieldType: 'metaTitle',
      content: intl.formatMessage({ id: 'FAQLandingPage.fallback.metaTitle' }),
    },
    pageDescription: {
      fieldType: 'metaDescription',
      content: intl.formatMessage({ id: 'FAQLandingPage.fallback.metaDescription' }),
    },
  },
});

// This is the fallback page, in case there's no FAQ Page asset defined in Console.
const FallbackPage = props => {
  const intl = useIntl();

  return (
    <PageBuilder
      pageAssetsData={fallbackSections(intl)}
      options={{ sectionComponents: { faq: { component: SectionFaq } } }}
      {...props}
    />
  );
};

export default FallbackPage;
