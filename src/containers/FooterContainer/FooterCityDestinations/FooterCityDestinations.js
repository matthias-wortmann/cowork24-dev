import React from 'react';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { CITY_LANDING_SLUGS } from '../../../util/cityLandingPageConfig';

import { NamedLink } from '../../../components';

import css from './FooterCityDestinations.module.css';

const cityMsg = slug => ({ id: `CityLandingPage.${slug}.linkLabel` });

/**
 * Footer band: links to Swiss city coworking landing pages (Airbnb-style “explore by destination”).
 */
const FooterCityDestinations = () => {
  const intl = useIntl();
  const routeConfiguration = useRouteConfiguration();

  if (!routeConfiguration?.length) {
    return null;
  }

  return (
    <nav
      className={css.root}
      aria-label={intl.formatMessage({ id: 'Footer.exploreCitiesNavAriaLabel' })}
    >
      <div className={css.inner}>
        <div className={css.headingBlock}>
          <p className={css.title}>
            <FormattedMessage id="Footer.exploreCitiesTitle" />
          </p>
          <p className={css.subtitle}>
            <FormattedMessage id="Footer.exploreCitiesSubtitle" />
          </p>
        </div>
        <ul className={css.linkList}>
          {CITY_LANDING_SLUGS.map(slug => (
            <li key={slug} className={css.linkItem}>
              <NamedLink
                name="CityLandingPage"
                params={{ citySlug: slug }}
                className={css.cityLink}
              >
                <FormattedMessage {...cityMsg(slug)} />
              </NamedLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default FooterCityDestinations;
