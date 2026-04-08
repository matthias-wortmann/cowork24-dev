import React from 'react';

import FooterSeoNavigation from './FooterSeoNavigation/FooterSeoNavigation';

const FooterComponent = () => {
  return <FooterSeoNavigation />;
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
