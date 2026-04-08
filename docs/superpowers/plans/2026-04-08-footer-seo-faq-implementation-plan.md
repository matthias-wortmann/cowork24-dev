# SEO Footer + FAQ Landingpage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-redundant, SEO-focused footer navigation block (tabs on desktop, accordion on mobile) in front of the existing hosted footer, and create a dedicated FAQ landing page at `/p/faq` that reuses existing `LandingPage.faq*` content.

**Architecture:** Keep the hosted footer (SectionBuilder of the hosted `footer` asset) untouched, and render an additional “SEO Footer Navigation” block before it. The FAQ page is a new SSR-capable route that fetches a hosted page asset (optional) and falls back to rendering existing FAQ UI/content when the asset is missing.

**Tech Stack:** React 18, Sharetribe Web Template, Redux Toolkit (hostedAssets), React Router v5, React Intl, CSS Modules.

---

## File map (create/modify)

**Create:**
- `src/containers/FooterContainer/FooterSeoNavigation/FooterSeoNavigation.js`
- `src/containers/FooterContainer/FooterSeoNavigation/FooterSeoNavigation.module.css`
- `src/containers/FAQLandingPage/FAQLandingPage.js`
- `src/containers/FAQLandingPage/FAQLandingPage.duck.js`
- `src/containers/FAQLandingPage/FallbackPage.js`

**Modify:**
- `src/containers/FooterContainer/FooterContainer.js`
- `src/routing/routeConfiguration.js`
- `src/containers/pageDataLoadingAPI.js`
- `src/translations/en.json`
- `src/translations/de.json`
- `src/translations/es.json`
- `src/translations/fr.json`

**Optional follow-up (if needed by lint/tests):**
- `src/components/index.js` (only if we decide to export new shared components; avoid if footer stays container-local)

---

## Task 1: Add FAQLandingPage route `/p/faq` (SSR + hosted asset + fallback)

**Files:**
- Create: `src/containers/FAQLandingPage/FAQLandingPage.js`
- Create: `src/containers/FAQLandingPage/FAQLandingPage.duck.js`
- Create: `src/containers/FAQLandingPage/FallbackPage.js`
- Modify: `src/containers/pageDataLoadingAPI.js`
- Modify: `src/routing/routeConfiguration.js`

- [ ] **Step 1: Add the duck loader for FAQ page asset**

Create `src/containers/FAQLandingPage/FAQLandingPage.duck.js`:

```js
import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const ASSET_NAME = 'faq-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { faqPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
```

- [ ] **Step 2: Add fallback page that renders existing FAQ UI**

Create `src/containers/FAQLandingPage/FallbackPage.js`:

```js
import React from 'react';
import loadable from '@loadable/component';

import SectionFaq from '../PageBuilder/SectionBuilder/SectionFaq';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

export const fallbackSections = {
  sections: [
    {
      sectionType: 'faq',
      sectionId: 'faq',
      landingSurface: 'white',
    },
  ],
  meta: {
    pageTitle: {
      fieldType: 'metaTitle',
      content: 'FAQ – Coworking in der Schweiz | cowork24',
    },
    pageDescription: {
      fieldType: 'metaDescription',
      content:
        'Antworten auf häufige Fragen zu Coworking Spaces, flexiblen Büros und Buchungen in der Schweiz.',
    },
  },
};

const FallbackPage = props => {
  return (
    <PageBuilder
      pageAssetsData={fallbackSections}
      options={{
        sectionComponents: {
          faq: { component: SectionFaq },
        },
      }}
      {...props}
    />
  );
};

export default FallbackPage;
```

Notes:
- This reuses `LandingPage.faq*` translation keys via `SectionFaq`.
- `SectionFaq` already injects `FAQPage` JSON-LD.

- [ ] **Step 3: Create the page component (pattern like Terms/Privacy)**

Create `src/containers/FAQLandingPage/FAQLandingPage.js`:

```js
import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';

import FallbackPage from './FallbackPage';
import { ASSET_NAME } from './FAQLandingPage.duck';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

const FAQLandingPageComponent = props => {
  const { pageAssetsData, inProgress, error } = props;
  return (
    <PageBuilder
      pageAssetsData={pageAssetsData?.[camelize(ASSET_NAME)]?.data}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage />}
    />
  );
};

FAQLandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const FAQLandingPage = compose(connect(mapStateToProps))(FAQLandingPageComponent);
export { FAQLandingPageComponent };
export default FAQLandingPage;
```

- [ ] **Step 4: Register `FAQLandingPage` in `pageDataLoadingAPI.js`**

Update `src/containers/pageDataLoadingAPI.js`:

```js
import { loadData as FAQLandingPageLoader } from './FAQLandingPage/FAQLandingPage.duck';

// inside getPageDataLoadingAPI() return object:
FAQLandingPage: {
  loadData: FAQLandingPageLoader,
},
```

- [ ] **Step 5: Register route in `routeConfiguration.js`**

Update `src/routing/routeConfiguration.js`:

```js
const FAQLandingPage = loadable(() =>
  import(/* webpackChunkName: "FAQLandingPage" */ '../containers/FAQLandingPage/FAQLandingPage')
);

// in routes array, near other /p/* pages:
{
  path: '/p/faq',
  name: 'FAQLandingPage',
  component: FAQLandingPage,
  loadData: pageDataLoadingAPI.FAQLandingPage.loadData,
},
```

- [ ] **Step 6: Manual smoke test**

Run (dev server already running):
- Open: `http://localhost:3000/p/faq`
- Expected:
  - Page renders without errors even if hosted asset `content/pages/faq-page.json` is missing.
  - Accordion items show the existing “LandingPage” FAQ content.

- [ ] **Step 7: Optional unit test (only if this repo’s test coverage expects it)**

If adding tests is desired, create:
- `src/containers/FAQLandingPage/FAQLandingPage.test.js`

Minimal test idea:

```js
import React from 'react';
import { renderWithIntl } from '../../util/testHelpers';
import { FAQLandingPageComponent } from './FAQLandingPage';

test('renders with fallback page when no pageAssetsData', () => {
  const { getByText } = renderWithIntl(
    <FAQLandingPageComponent pageAssetsData={{}} inProgress={false} error={null} />
  );
  // Since fallback is rendered by PageBuilder, this may be integration-heavy.
  // If brittle, skip test and rely on manual smoke check.
});
```

- [ ] **Step 8: Commit**

```bash
git add \
  src/containers/FAQLandingPage \
  src/containers/pageDataLoadingAPI.js \
  src/routing/routeConfiguration.js
git commit -m "feat: add /p/faq landing page with hosted asset fallback"
```

---

## Task 2: Build “SEO Footer Navigation” (tabs desktop / accordion mobile)

**Files:**
- Create: `src/containers/FooterContainer/FooterSeoNavigation/FooterSeoNavigation.js`
- Create: `src/containers/FooterContainer/FooterSeoNavigation/FooterSeoNavigation.module.css`
- Modify: `src/containers/FooterContainer/FooterContainer.js`
- Modify: `src/translations/en.json`
- Modify: `src/translations/de.json`
- Modify: `src/translations/es.json`
- Modify: `src/translations/fr.json`

- [ ] **Step 1: Define the footer IA and link targets**

Implementation targets:
- **Tab/Accordion “Städte”**:
  - List all `CITY_LANDING_SLUGS` via `NamedLink name="CityLandingPage" params={{ citySlug: slug }}`.
- **Tab/Accordion “Entdecken”**:
  - “Kategorien/Collections”: curated list derived from `config.categoryConfiguration` (Top N, default N=8).
  - “Anbieter / Space Owner”: `NamedLink name="SpaceOwnerLandingPage"`.
  - “FAQ”: `NamedLink name="FAQLandingPage"`.
- Bottom bar: text `© 2026 cowork24` (translated).

- [ ] **Step 2: Add i18n keys (4 locales)**

Add keys in:
- `src/translations/en.json`
- `src/translations/de.json`
- `src/translations/es.json`
- `src/translations/fr.json`

Keys (example set):
- `Footer.seoNavAriaLabel`
- `Footer.seoNavTabCities`
- `Footer.seoNavTabExplore`
- `Footer.seoNavCitiesTitle`
- `Footer.seoNavExploreTitle`
- `Footer.seoNavExploreCategories`
- `Footer.seoNavExploreSpaceOwner`
- `Footer.seoNavExploreFaq`
- `Footer.copyright2026`

Example values (DE):
- `Footer.seoNavAriaLabel`: `Footer Navigation`
- `Footer.seoNavTabCities`: `Städte`
- `Footer.seoNavTabExplore`: `Entdecken`
- `Footer.seoNavExploreCategories`: `Kategorien & Collections`
- `Footer.seoNavExploreSpaceOwner`: `Anbieter / Space Owner`
- `Footer.seoNavExploreFaq`: `FAQ`
- `Footer.copyright2026`: `© 2026 cowork24`

Repeat equivalent meaning in EN/ES/FR.

- [ ] **Step 3: Implement `FooterSeoNavigation` component**

Create `src/containers/FooterContainer/FooterSeoNavigation/FooterSeoNavigation.js`:

```js
import React, { useMemo, useState } from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { stringify } from '../../../util/urlHelpers';
import { constructQueryParamName } from '../../../util/search';
import { CITY_LANDING_SLUGS } from '../../../util/cityLandingPageConfig';

import { NamedLink } from '../../../components';
import css from './FooterSeoNavigation.module.css';

const TAB_CITIES = 'cities';
const TAB_EXPLORE = 'explore';

const FooterSeoNavigation = props => {
  const { className } = props;
  const intl = useIntl();
  const config = useConfiguration();

  const [activeTab, setActiveTab] = useState(TAB_CITIES);

  const categoryConfiguration = config?.categoryConfiguration;
  const categories = categoryConfiguration?.categories ?? [];
  const categoryKey = categoryConfiguration?.key ?? 'categoryLevel';
  const categoryParam = constructQueryParamName(`${categoryKey}1`, 'public');

  const curatedCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const ariaLabel = intl.formatMessage({ id: 'Footer.seoNavAriaLabel' });

  return (
    <footer className={classNames(css.root, className)}>
      <nav className={css.nav} aria-label={ariaLabel}>
        {/* Desktop tabs */}
        <div className={css.desktopTabs} role="tablist" aria-label={ariaLabel}>
          <button
            type="button"
            className={classNames(css.tab, { [css.tabActive]: activeTab === TAB_CITIES })}
            role="tab"
            aria-selected={activeTab === TAB_CITIES}
            aria-controls="footer-tabpanel-cities"
            id="footer-tab-cities"
            onClick={() => setActiveTab(TAB_CITIES)}
          >
            <FormattedMessage id="Footer.seoNavTabCities" />
          </button>
          <button
            type="button"
            className={classNames(css.tab, { [css.tabActive]: activeTab === TAB_EXPLORE })}
            role="tab"
            aria-selected={activeTab === TAB_EXPLORE}
            aria-controls="footer-tabpanel-explore"
            id="footer-tab-explore"
            onClick={() => setActiveTab(TAB_EXPLORE)}
          >
            <FormattedMessage id="Footer.seoNavTabExplore" />
          </button>
        </div>

        {/* Desktop panels */}
        <div className={css.desktopPanels}>
          <section
            role="tabpanel"
            id="footer-tabpanel-cities"
            aria-labelledby="footer-tab-cities"
            hidden={activeTab !== TAB_CITIES}
            className={css.panel}
          >
            <h2 className={css.panelTitle}>
              <FormattedMessage id="Footer.seoNavCitiesTitle" />
            </h2>
            <ul className={css.linkGrid}>
              {CITY_LANDING_SLUGS.map(slug => (
                <li key={slug} className={css.linkItem}>
                  <NamedLink name="CityLandingPage" params={{ citySlug: slug }} className={css.link}>
                    <FormattedMessage id={`CityLandingPage.${slug}.linkLabel`} />
                  </NamedLink>
                </li>
              ))}
            </ul>
          </section>

          <section
            role="tabpanel"
            id="footer-tabpanel-explore"
            aria-labelledby="footer-tab-explore"
            hidden={activeTab !== TAB_EXPLORE}
            className={css.panel}
          >
            <h2 className={css.panelTitle}>
              <FormattedMessage id="Footer.seoNavExploreTitle" />
            </h2>

            <div className={css.exploreColumns}>
              <div className={css.exploreCol}>
                <h3 className={css.exploreHeading}>
                  <FormattedMessage id="Footer.seoNavExploreCategories" />
                </h3>
                <ul className={css.exploreList}>
                  {curatedCategories.map(cat => {
                    const searchString = stringify({ [categoryParam]: cat.id });
                    return (
                      <li key={cat.id} className={css.linkItem}>
                        <NamedLink
                          name="SearchPage"
                          to={{ search: searchString ? `?${searchString}` : '' }}
                          className={css.link}
                        >
                          {cat.name}
                        </NamedLink>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className={css.exploreCol}>
                <h3 className={css.exploreHeading}>
                  <FormattedMessage id="Footer.seoNavExploreSpaceOwner" />
                </h3>
                <ul className={css.exploreList}>
                  <li className={css.linkItem}>
                    <NamedLink name="SpaceOwnerLandingPage" className={css.link}>
                      <FormattedMessage id="Footer.seoNavExploreSpaceOwner" />
                    </NamedLink>
                  </li>
                  <li className={css.linkItem}>
                    <NamedLink name="FAQLandingPage" className={css.link}>
                      <FormattedMessage id="Footer.seoNavExploreFaq" />
                    </NamedLink>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Mobile accordion */}
        <div className={css.mobileAccordion}>
          {/* Cities accordion */}
          <details className={css.accordionItem}>
            <summary className={css.accordionSummary}>
              <FormattedMessage id="Footer.seoNavTabCities" />
            </summary>
            <ul className={css.linkGrid}>
              {CITY_LANDING_SLUGS.map(slug => (
                <li key={slug} className={css.linkItem}>
                  <NamedLink name="CityLandingPage" params={{ citySlug: slug }} className={css.link}>
                    <FormattedMessage id={`CityLandingPage.${slug}.linkLabel`} />
                  </NamedLink>
                </li>
              ))}
            </ul>
          </details>

          {/* Explore accordion */}
          <details className={css.accordionItem}>
            <summary className={css.accordionSummary}>
              <FormattedMessage id="Footer.seoNavTabExplore" />
            </summary>
            <div className={css.exploreColumns}>
              <div className={css.exploreCol}>
                <h3 className={css.exploreHeading}>
                  <FormattedMessage id="Footer.seoNavExploreCategories" />
                </h3>
                <ul className={css.exploreList}>
                  {curatedCategories.map(cat => {
                    const searchString = stringify({ [categoryParam]: cat.id });
                    return (
                      <li key={cat.id} className={css.linkItem}>
                        <NamedLink
                          name="SearchPage"
                          to={{ search: searchString ? `?${searchString}` : '' }}
                          className={css.link}
                        >
                          {cat.name}
                        </NamedLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className={css.exploreCol}>
                <ul className={css.exploreList}>
                  <li className={css.linkItem}>
                    <NamedLink name="SpaceOwnerLandingPage" className={css.link}>
                      <FormattedMessage id="Footer.seoNavExploreSpaceOwner" />
                    </NamedLink>
                  </li>
                  <li className={css.linkItem}>
                    <NamedLink name="FAQLandingPage" className={css.link}>
                      <FormattedMessage id="Footer.seoNavExploreFaq" />
                    </NamedLink>
                  </li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      </nav>

      <div className={css.bottomBar}>
        <p className={css.copyright}>
          <FormattedMessage id="Footer.copyright2026" />
        </p>
      </div>
    </footer>
  );
};

export default FooterSeoNavigation;
```

Notes:
- Uses `<details>`/`<summary>` for mobile accordion (native, accessible, minimal JS).
- Desktop tabs use controlled state.

- [ ] **Step 4: Add CSS module for layout + responsiveness**

Create `src/containers/FooterContainer/FooterSeoNavigation/FooterSeoNavigation.module.css`:

```css
@import '../../../styles/customMediaQueries.css';

.root {
  border-top: 1px solid var(--colorGrey100);
  background: var(--colorGrey50);
}

.nav {
  max-width: var(--contentMaxWidthPages);
  margin: 0 auto;
  padding: 24px 24px 12px;
  box-sizing: border-box;
}

.desktopTabs {
  display: none;
}

.desktopPanels {
  display: none;
}

.mobileAccordion {
  display: block;
}

@media (--viewportMedium) {
  .nav {
    padding: 28px 32px 16px;
  }

  .desktopTabs {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  .desktopPanels {
    display: block;
  }

  .mobileAccordion {
    display: none;
  }
}

.tab {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--colorGrey700);
  font-weight: var(--fontWeightMedium);
  cursor: pointer;
}

.tabActive {
  background: var(--colorWhite);
  color: var(--colorGrey900);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}

.panel {
  padding: 8px 0 0;
}

.panelTitle {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: var(--fontWeightSemiBold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--colorGrey900);
}

.linkGrid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;
}

@media (--viewportMedium) {
  .linkGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 28px;
  }
}

@media (--viewportLarge) {
  .linkGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.linkItem {
  margin: 0;
  min-width: 0;
}

.link {
  display: inline-block;
  max-width: 100%;
  text-decoration: none;
  color: var(--colorGrey800);
  font-weight: var(--fontWeightMedium);
  line-height: 1.4;
}

.link:hover,
.link:focus-visible {
  color: var(--colorMarketplace);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.accordionItem {
  border-top: 1px solid var(--colorGrey100);
  padding: 10px 0;
}

.accordionSummary {
  cursor: pointer;
  font-weight: var(--fontWeightMedium);
  color: var(--colorGrey900);
  padding: 8px 0;
}

.exploreColumns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 8px;
}

@media (--viewportMedium) {
  .exploreColumns {
    grid-template-columns: 1fr 1fr;
  }
}

.exploreCol {
  min-width: 0;
}

.exploreHeading {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: var(--fontWeightSemiBold);
  color: var(--colorGrey900);
}

.exploreList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.bottomBar {
  border-top: 1px solid var(--colorGrey100);
  background: var(--colorGrey50);
}

.copyright {
  max-width: var(--contentMaxWidthPages);
  margin: 0 auto;
  padding: 14px 24px;
  box-sizing: border-box;
  font-size: 13px;
  color: var(--colorGrey600);
}

@media (--viewportMedium) {
  .copyright {
    padding: 16px 32px;
  }
}
```

- [ ] **Step 5: Integrate the new SEO footer block into `FooterContainer` and keep hosted footer**

Update `src/containers/FooterContainer/FooterContainer.js`:
- Replace `FooterCityDestinations` usage with `FooterSeoNavigation`.
- Keep `SectionBuilder` rendering of hosted footer asset below it.

Expected structure:
- `<FooterSeoNavigation />`
- `{footerSection ? <SectionBuilder sections={[footerSection]} /> : null}`

- [ ] **Step 6: Manual smoke test**

Open any page and scroll to footer:
- Desktop (>=768px): tabs visible, accordion hidden.
- Mobile (<768px): accordion visible, tabs hidden.
- Links:
  - City links navigate to `/coworking/:slug`.
  - SpaceOwner link navigates to `/p/space_owner`.
  - FAQ link navigates to `/p/faq`.
  - Category links navigate to `/s?...` with correct category param.
- Hosted footer still renders below (if configured).

- [ ] **Step 7: Lint check for modified files**

Use editor diagnostics; if needed run:

```bash
yarn format-ci
```

- [ ] **Step 8: Commit**

```bash
git add \
  src/containers/FooterContainer/FooterContainer.js \
  src/containers/FooterContainer/FooterSeoNavigation \
  src/translations/en.json \
  src/translations/de.json \
  src/translations/es.json \
  src/translations/fr.json
git commit -m "feat: add SEO footer navigation with cities and explore links"
```

---

## Task 3: Verify redundancy constraints with hosted footer content

**Files:**
- No mandatory code changes; adjust only if duplication is visible.

- [ ] **Step 1: Inspect hosted footer in staging/local**
Identify if hosted footer already contains:
- “FAQ”
- “Space owner”
- “Categories”

- [ ] **Step 2: If duplication exists, remove duplicates from hosted footer (Console)**
This is a content operation (outside git), but it’s the correct place to fix duplication since the hosted footer is meant to be content-managed.

- [ ] **Step 3: If we must avoid Console edits, add a config flag**
Optional fallback: add config boolean like `footer.hideHostedFaqLink` and conditionally hide specific links in the SEO block. Only do this if Console edit is not possible.

---

## Plan Self-Review (done inline)

- Spec coverage: footer (tabs/accordion, cities, explore links, © 2026, non-redundant + hosted footer kept) and `/p/faq` page covered.
- Placeholder scan: no “TBD/TODO”; all files and steps specified with concrete code/commands.
- Naming consistency: route name `FAQLandingPage`, path `/p/faq`, asset `faq-page` consistent across tasks.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-08-footer-seo-faq-implementation-plan.md`.

Two execution options:

1. **Subagent-Driven (recommended)** – dispatch a fresh subagent per task, review between tasks  
2. **Inline Execution** – execute tasks in this session with checkpoints

Which approach?

