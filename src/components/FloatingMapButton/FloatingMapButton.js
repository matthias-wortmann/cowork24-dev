import React from 'react';
import { useLocation } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import NamedLink from '../NamedLink/NamedLink';

import css from './FloatingMapButton.module.css';

// Switzerland viewport: NE_lat,NE_lng,SW_lat,SW_lng
const SWITZERLAND_BOUNDS = '47.808455,10.491944,45.817995,5.955900';

// Routes where the floating button must not appear.
const HIDDEN_PATH_PATTERNS = [
  /^\/s(\/|$|\?)/, // SearchPage
  /^\/checkout(\/|$)/, // CheckoutPage (top-level)
  /^\/inbox(\/|$)/, // InboxPage
  /^\/l\/[^/]+\/[^/]+\/(draft|new|edit|checkout)(\/|$)/, // EditListing & listing checkout
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
  /^\/reset-password(\/|$)/,
  /^\/verify-email(\/|$)/,
  /^\/preview(\/|$)/,
];

const shouldHide = pathname => HIDDEN_PATH_PATTERNS.some(re => re.test(pathname));

/**
 * Globally rendered floating action button that links to the SearchPage with a
 * map view zoomed to Switzerland. Hidden on routes where it would obstruct.
 */
const FloatingMapButton = () => {
  const location = useLocation();
  const intl = useIntl();

  if (!location || shouldHide(location.pathname)) {
    return null;
  }

  const search = `?bounds=${SWITZERLAND_BOUNDS}&mapSearch=true`;
  const ariaLabel = intl.formatMessage({ id: 'FloatingMapButton.aria' });

  return (
    <NamedLink
      name="SearchPage"
      to={{ search }}
      className={css.root}
      ariaLabel={ariaLabel}
      title={ariaLabel}
    >
      <MapIcon className={css.icon} aria-hidden="true" strokeWidth={2.25} />
      <span className={css.label}>
        <FormattedMessage id="FloatingMapButton.label" />
      </span>
    </NamedLink>
  );
};

export default FloatingMapButton;
