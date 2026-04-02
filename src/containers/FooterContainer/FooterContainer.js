import React, { Fragment } from 'react';
import loadable from '@loadable/component';

import { useConfiguration } from '../../context/configurationContext';

import FooterCityDestinations from './FooterCityDestinations/FooterCityDestinations';

const SectionBuilder = loadable(
  () => import(/* webpackChunkName: "SectionBuilder" */ '../PageBuilder/PageBuilder'),
  {
    resolveComponent: components => components.SectionBuilder,
  }
);

const FooterComponent = () => {
  const { footer = {}, topbar } = useConfiguration();

  const hasHostedFooter = Object.keys(footer).length > 0;

  const footerSection = hasHostedFooter
    ? {
        ...footer,
        sectionId: 'footer',
        sectionType: 'footer',
        linkLogoToExternalSite: topbar?.logoLink,
      }
    : null;

  return (
    <Fragment>
      <FooterCityDestinations />
      {footerSection ? <SectionBuilder sections={[footerSection]} /> : null}
    </Fragment>
  );
};

// NOTE: if you want to add dynamic data to FooterComponent,
//       you could just connect this FooterContainer to Redux Store
//
// const mapStateToProps = state => {
//   const { currentUser } = state.user;
//   return { currentUser };
// };
// const FooterContainer = compose(connect(mapStateToProps))(FooterComponent);
// export default FooterContainer;

export default FooterComponent;
