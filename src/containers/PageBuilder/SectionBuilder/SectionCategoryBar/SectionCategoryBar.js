import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Armchair,
  Monitor,
  DoorClosed,
  Users,
  Zap,
  Presentation,
  Coffee,
  Bed,
  PlaneTakeoff,
  MapPin,
} from 'lucide-react';

import { useIntl } from '../../../../util/reactIntl';
import { useConfiguration } from '../../../../context/configurationContext';
import { stringify, parse } from '../../../../util/urlHelpers';
import { constructQueryParamName } from '../../../../util/search';
import { pathByRouteName } from '../../../../util/routes';
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';

import CategoryItem from './CategoryItem';
import css from './SectionCategoryBar.module.css';

const ICON_PROPS = { size: 24, strokeWidth: 1.5 };

/**
 * Category display definitions: Lucide icon component + short label.
 * We store components (not pre-created <Icon /> elements) so each list item gets
 * its own React element instance. Reusing the same element object for multiple
 * children breaks rendering (notably the shared MapPin fallback).
 */
const CATEGORY_DEFINITIONS = [
  {
    match: (id, name) => /open.?space/i.test(id) || /open.?space/i.test(name),
    Icon: Armchair,
    label: 'Open',
  },
  {
    match: (id, name) => /fix.?desk/i.test(id) || /fix.?desk/i.test(name),
    Icon: Monitor,
    label: 'Fix',
  },
  {
    match: (id, name) => (/privat/i.test(id) || /privat/i.test(name)) && !/team/i.test(name),
    Icon: DoorClosed,
    label: 'Privat',
  },
  {
    match: (id, name) => /team/i.test(id) || /team/i.test(name),
    Icon: Users,
    label: 'Team',
  },
  {
    match: (id, name) => /hot.?desk/i.test(id) || /hot.?desk/i.test(name) || /flex/i.test(name),
    Icon: Zap,
    label: 'Flex',
  },
  {
    match: (id, name) => /meeting/i.test(id) || /meeting/i.test(name) || /konferenz/i.test(name),
    Icon: Presentation,
    label: 'Meeting',
  },
  {
    match: (id, name) =>
      /community/i.test(id) || /community/i.test(name) || /coworking/i.test(name),
    Icon: Coffee,
    label: 'Cowork',
  },
  {
    match: (id, name) => /coliving/i.test(id) || /coliving/i.test(name) || /wohnen/i.test(name),
    Icon: Bed,
    label: 'Coliving',
  },
  {
    match: (id, name) =>
      /lounge|airport|flughafen/i.test(id) || /lounge|airport|flughafen/i.test(name),
    Icon: PlaneTakeoff,
    label: 'Lounge',
  },
];

/**
 * Hardcoded fallback list used when hosted categories (listing-categories.json)
 * are not configured or the asset has not loaded yet.
 */
const FALLBACK_CATEGORIES = CATEGORY_DEFINITIONS.map((def, i) => ({
  id: `fallback-${i}`,
  name: def.label,
}));

/**
 * Resolve icon and short label for a category by matching its id and name
 * against known patterns. Falls back to MapPin icon + original name.
 *
 * @param {Object} category - Category object ({ id, name })
 * @returns {{ icon: React.ReactNode, label: string }}
 */
const resolveCategoryDisplay = category => {
  const id = (category.id || '').toLowerCase();
  const name = category.name || '';
  const matched = CATEGORY_DEFINITIONS.find(def => def.match(id, name));
  const Icon = matched?.Icon ?? MapPin;

  return {
    icon: <Icon {...ICON_PROPS} />,
    label: matched?.label ?? category.name,
  };
};

/**
 * Airbnb-style horizontal CategoryBar section.
 * Reads categories dynamically from marketplace configuration (listing-categories.json).
 * Falls back to a hardcoded list when no hosted categories are available.
 *
 * Clicking a category navigates to SearchPage with the corresponding pub_categoryLevel1
 * filter. Clicking the already-active category removes the filter (toggle behaviour).
 *
 * @component
 * @param {Object} props
 * @param {string?} props.sectionId - Section ID for the container
 * @returns {JSX.Element}
 */
const SectionCategoryBar = props => {
  const { sectionId } = props;

  const intl = useIntl();
  const config = useConfiguration();
  const history = useHistory();
  const location = useLocation();
  const routeConfiguration = useRouteConfiguration();

  const categoryConfiguration = config?.categoryConfiguration;
  const hostedCategories = categoryConfiguration?.categories ?? [];
  const categoryKey = categoryConfiguration?.key ?? 'categoryLevel';

  // Use hosted categories if available, otherwise fall back to hardcoded list
  const categories = hostedCategories.length > 0 ? hostedCategories : FALLBACK_CATEGORIES;

  const paramName = constructQueryParamName(`${categoryKey}1`, 'public');
  const searchPagePath = pathByRouteName('SearchPage', routeConfiguration);

  // Determine which category (if any) is active based on current URL
  const searchParams = parse(location.search);
  const activeCategoryId = location.pathname === searchPagePath ? searchParams[paramName] : null;

  const navAriaLabel = intl.formatMessage({ id: 'CategoryBar.navAriaLabel' });

  const handleCategoryClick = categoryId => {
    const isAlreadyActive = activeCategoryId === categoryId;
    if (isAlreadyActive) {
      const { [paramName]: _removed, ...rest } = searchParams;
      const search = stringify(rest);
      history.push({ pathname: searchPagePath, search: search ? `?${search}` : '' });
    } else {
      const params = { [paramName]: categoryId };
      const search = `?${stringify(params)}`;
      history.push({ pathname: searchPagePath, search });
    }
  };

  return (
    <section id={sectionId} className={css.root}>
      <nav className={css.scrollContainer} aria-label={navAriaLabel}>
        <div className={css.track}>
          {categories.map(category => {
            const { icon, label } = resolveCategoryDisplay(category);
            return (
              <CategoryItem
                key={category.id}
                icon={icon}
                label={label}
                isActive={activeCategoryId === category.id}
                onClick={() => handleCategoryClick(category.id)}
              />
            );
          })}
        </div>
      </nav>
    </section>
  );
};

export default SectionCategoryBar;
