import React, { useId, useMemo, useState } from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { CITY_LANDING_SLUGS } from '../../../util/cityLandingPageConfig';
import { stringify } from '../../../util/urlHelpers';
import { constructQueryParamName } from '../../../util/search';
import { LinkedLogo, NamedLink } from '../../../components';

import css from './FooterSeoNavigation.module.css';

const cityMsg = slug => ({ id: `CityLandingPage.${slug}.linkLabel` });

const TAB_CITIES = 'cities';
const TAB_EXPLORE = 'explore';
const TAB_SPACE_OWNERS = 'spaceOwners';

const FooterSeoNavigation = () => {
  const intl = useIntl();
  const config = useConfiguration();
  const baseId = useId();

  const [activeTab, setActiveTab] = useState(TAB_CITIES);
  const [openAccordion, setOpenAccordion] = useState(TAB_CITIES);

  const categoryConfiguration = config?.categoryConfiguration;
  const categories = categoryConfiguration?.categories ?? [];
  const categoryKey = categoryConfiguration?.key ?? 'categoryLevel';
  const categoryParamName = constructQueryParamName(`${categoryKey}1`, 'public');

  const curatedCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const navAriaLabel = intl.formatMessage({ id: 'FooterSeoNavigation.navAriaLabel' });

  const citiesTabId = `${baseId}-tab-cities`;
  const exploreTabId = `${baseId}-tab-explore`;
  const citiesPanelId = `${baseId}-panel-cities`;
  const explorePanelId = `${baseId}-panel-explore`;

  const toggleAccordion = key => {
    setOpenAccordion(prev => (prev === key ? null : key));
  };

  const handleTabsKeyDown = e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      return;
    }

    e.preventDefault();
    const order = [TAB_CITIES, TAB_EXPLORE, TAB_SPACE_OWNERS];
    const currentIndex = order.indexOf(activeTab);
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + delta + order.length) % order.length;
    const nextTab = order[nextIndex];
    setActiveTab(nextTab);

    const nextId =
      nextTab === TAB_CITIES
        ? citiesTabId
        : nextTab === TAB_EXPLORE
        ? exploreTabId
        : `${baseId}-tab-space-owners`;
    const el = typeof document !== 'undefined' ? document.getElementById(nextId) : null;
    el?.focus?.();
  };

  const CitiesPanel = () => (
    <div className={css.panelInner}>
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
            <NamedLink name="CityLandingPage" params={{ citySlug: slug }} className={css.link}>
              <FormattedMessage {...cityMsg(slug)} />
            </NamedLink>
          </li>
        ))}
      </ul>
    </div>
  );

  const ExplorePanel = () => (
    <div className={css.panelInner}>
      <div className={css.headingBlock}>
        <p className={css.title}>
          <FormattedMessage id="FooterSeoNavigation.exploreTitle" />
        </p>
      </div>

      {curatedCategories.length > 0 ? (
        <div className={css.subGroup}>
          <p className={css.subTitle}>
            <FormattedMessage id="FooterSeoNavigation.exploreCategoriesTitle" />
          </p>
          <ul className={css.linkList}>
            {curatedCategories.map(category => {
              const searchParams = { [categoryParamName]: category.id };
              const searchString = stringify(searchParams);
              return (
                <li key={category.id} className={css.linkItem}>
                  <NamedLink
                    name="SearchPage"
                    to={{ search: searchString ? `?${searchString}` : '' }}
                    className={css.link}
                  >
                    {category.name}
                  </NamedLink>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className={css.subGroup}>
        <ul className={classNames(css.linkList, css.exploreLinks)}>
          <li className={css.linkItem}>
            <NamedLink name="FAQLandingPage" className={css.link}>
              <FormattedMessage id="FooterSeoNavigation.exploreFaqLink" />
            </NamedLink>
          </li>
        </ul>
      </div>
    </div>
  );

  const SpaceOwnersPanel = () => (
    <div className={css.panelInner}>
      <div className={css.headingBlock}>
        <p className={css.title}>
          <FormattedMessage id="FooterSeoNavigation.spaceOwnersTitle" />
        </p>
        <p className={css.subtitle}>
          <FormattedMessage id="FooterSeoNavigation.spaceOwnersSubtitle" />
        </p>
      </div>

      <ul className={classNames(css.linkList, css.spaceOwnerLinks)}>
        <li className={css.linkItem}>
          <NamedLink name="SpaceOwnerLandingPage" className={css.link}>
            <FormattedMessage id="FooterSeoNavigation.exploreSpaceOwnersLink" />
          </NamedLink>
        </li>
        <li className={css.linkItem}>
          <NamedLink name="NewListingPage" className={css.link}>
            <FormattedMessage id="FooterSeoNavigation.spaceOwnersStartLink" />
          </NamedLink>
        </li>
      </ul>
    </div>
  );

  return (
    <nav className={css.root} aria-label={navAriaLabel}>
      <div className={css.inner}>
        <div className={css.brandRow}>
          <LinkedLogo className={css.logoLink} logoImageClassName={css.logoImage} />
          <p className={css.brandClaim}>
            <FormattedMessage id="FooterSeoNavigation.brandClaim" />
          </p>
        </div>

        {/* Desktop: tabs */}
        <div className={css.desktopTabs}>
          <div className={css.tabList} role="tablist" onKeyDown={handleTabsKeyDown}>
            <button
              type="button"
              id={citiesTabId}
              className={classNames(css.tab, { [css.tabActive]: activeTab === TAB_CITIES })}
              role="tab"
              tabIndex={activeTab === TAB_CITIES ? 0 : -1}
              aria-selected={activeTab === TAB_CITIES}
              aria-controls={citiesPanelId}
              onClick={() => setActiveTab(TAB_CITIES)}
            >
              <FormattedMessage id="FooterSeoNavigation.tabCities" />
            </button>
            <button
              type="button"
              id={exploreTabId}
              className={classNames(css.tab, { [css.tabActive]: activeTab === TAB_EXPLORE })}
              role="tab"
              tabIndex={activeTab === TAB_EXPLORE ? 0 : -1}
              aria-selected={activeTab === TAB_EXPLORE}
              aria-controls={explorePanelId}
              onClick={() => setActiveTab(TAB_EXPLORE)}
            >
              <FormattedMessage id="FooterSeoNavigation.tabExplore" />
            </button>
            <button
              type="button"
              id={`${baseId}-tab-space-owners`}
              className={classNames(css.tab, {
                [css.tabActive]: activeTab === TAB_SPACE_OWNERS,
              })}
              role="tab"
              tabIndex={activeTab === TAB_SPACE_OWNERS ? 0 : -1}
              aria-selected={activeTab === TAB_SPACE_OWNERS}
              aria-controls={`${baseId}-panel-space-owners`}
              onClick={() => setActiveTab(TAB_SPACE_OWNERS)}
            >
              <FormattedMessage id="FooterSeoNavigation.tabSpaceOwners" />
            </button>
          </div>

          <div
            id={citiesPanelId}
            className={classNames(css.tabPanel, { [css.tabPanelActive]: activeTab === TAB_CITIES })}
            role="tabpanel"
            aria-labelledby={citiesTabId}
            hidden={activeTab !== TAB_CITIES}
          >
            {activeTab === TAB_CITIES ? <CitiesPanel /> : null}
          </div>

          <div
            id={explorePanelId}
            className={classNames(css.tabPanel, {
              [css.tabPanelActive]: activeTab === TAB_EXPLORE,
            })}
            role="tabpanel"
            aria-labelledby={exploreTabId}
            hidden={activeTab !== TAB_EXPLORE}
          >
            {activeTab === TAB_EXPLORE ? <ExplorePanel /> : null}
          </div>

          <div
            id={`${baseId}-panel-space-owners`}
            className={classNames(css.tabPanel, {
              [css.tabPanelActive]: activeTab === TAB_SPACE_OWNERS,
            })}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-space-owners`}
            hidden={activeTab !== TAB_SPACE_OWNERS}
          >
            {activeTab === TAB_SPACE_OWNERS ? <SpaceOwnersPanel /> : null}
          </div>
        </div>

        {/* Mobile: accordion */}
        <div className={css.mobileAccordion}>
          <div className={css.accordionItem}>
            <button
              type="button"
              className={css.accordionButton}
              aria-expanded={openAccordion === TAB_CITIES}
              aria-controls={`${baseId}-acc-cities`}
              onClick={() => toggleAccordion(TAB_CITIES)}
            >
              <span className={css.accordionLabel}>
                <FormattedMessage id="FooterSeoNavigation.tabCities" />
              </span>
              <span className={css.accordionIcon} aria-hidden="true">
                {openAccordion === TAB_CITIES ? '−' : '+'}
              </span>
            </button>
            <div
              id={`${baseId}-acc-cities`}
              className={classNames(css.accordionPanel, {
                [css.accordionPanelOpen]: openAccordion === TAB_CITIES,
              })}
              hidden={openAccordion !== TAB_CITIES}
            >
              {openAccordion === TAB_CITIES ? <CitiesPanel /> : null}
            </div>
          </div>

          <div className={css.accordionItem}>
            <button
              type="button"
              className={css.accordionButton}
              aria-expanded={openAccordion === TAB_EXPLORE}
              aria-controls={`${baseId}-acc-explore`}
              onClick={() => toggleAccordion(TAB_EXPLORE)}
            >
              <span className={css.accordionLabel}>
                <FormattedMessage id="FooterSeoNavigation.tabExplore" />
              </span>
              <span className={css.accordionIcon} aria-hidden="true">
                {openAccordion === TAB_EXPLORE ? '−' : '+'}
              </span>
            </button>
            <div
              id={`${baseId}-acc-explore`}
              className={classNames(css.accordionPanel, {
                [css.accordionPanelOpen]: openAccordion === TAB_EXPLORE,
              })}
              hidden={openAccordion !== TAB_EXPLORE}
            >
              {openAccordion === TAB_EXPLORE ? <ExplorePanel /> : null}
            </div>
          </div>

          <div className={css.accordionItem}>
            <button
              type="button"
              className={css.accordionButton}
              aria-expanded={openAccordion === TAB_SPACE_OWNERS}
              aria-controls={`${baseId}-acc-space-owners`}
              onClick={() => toggleAccordion(TAB_SPACE_OWNERS)}
            >
              <span className={css.accordionLabel}>
                <FormattedMessage id="FooterSeoNavigation.tabSpaceOwners" />
              </span>
              <span className={css.accordionIcon} aria-hidden="true">
                {openAccordion === TAB_SPACE_OWNERS ? '−' : '+'}
              </span>
            </button>
            <div
              id={`${baseId}-acc-space-owners`}
              className={classNames(css.accordionPanel, {
                [css.accordionPanelOpen]: openAccordion === TAB_SPACE_OWNERS,
              })}
              hidden={openAccordion !== TAB_SPACE_OWNERS}
            >
              {openAccordion === TAB_SPACE_OWNERS ? <SpaceOwnersPanel /> : null}
            </div>
          </div>
        </div>
      </div>

      <div className={css.bottomBar}>
        <div className={css.bottomBarInner}>
          <span>
            <FormattedMessage id="FooterSeoNavigation.copyright" />
          </span>
          <div className={css.bottomLinks}>
            <NamedLink name="TermsOfServicePage" className={css.bottomLink}>
              <FormattedMessage id="FooterSeoNavigation.termsLink" />
            </NamedLink>
            <NamedLink name="PrivacyPolicyPage" className={css.bottomLink}>
              <FormattedMessage id="FooterSeoNavigation.privacyLink" />
            </NamedLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default FooterSeoNavigation;
