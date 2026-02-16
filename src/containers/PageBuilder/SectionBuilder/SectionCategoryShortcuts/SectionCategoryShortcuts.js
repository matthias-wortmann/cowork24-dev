import React from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { useConfiguration } from '../../../../context/configurationContext';
import { stringify } from '../../../../util/urlHelpers';
import { constructQueryParamName } from '../../../../util/search';
import { NamedLink } from '../../../../components';
import SectionContainer from '../SectionContainer';
import { getCategoryImage } from './categoryImages';
import css from './SectionCategoryShortcuts.module.css';

/**
 * Section component that displays category shortcut cards linking to SearchPage with category filter.
 * Uses listing categories from marketplace configuration (listing-categories.json).
 *
 * @component
 * @param {Object} props
 * @param {string?} props.sectionId - id of the section
 * @param {string?} props.className - additional class names
 * @param {string?} props.rootClassName - overwrite root class
 * @param {Object?} props.defaultClasses - shared section classes
 * @param {Object?} props.appearance - section appearance
 * @param {Object} props.options - extra options
 * @returns {JSX.Element|null} Section with category shortcut cards or null if no categories
 */
const SectionCategoryShortcuts = props => {
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    appearance,
    options,
  } = props;

  const intl = useIntl();
  const config = useConfiguration();
  const categoryConfiguration = config?.categoryConfiguration;
  const categories = categoryConfiguration?.categories ?? [];
  const categoryKey = categoryConfiguration?.key ?? 'categoryLevel';

  if (!categories.length) {
    return null;
  }

  const paramName = constructQueryParamName(`${categoryKey}1`, 'public');
  const navAriaLabel = intl.formatMessage({ id: 'LandingPage.categoryShortcutsTitle' });

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={classNames(rootClassName, css.root)}
      appearance={appearance}
      options={options}
    >
      <div className={css.wrapper}>
        <h2 className={classNames(defaultClasses?.title, css.title)}>
          <FormattedMessage id="LandingPage.categoryShortcutsTitle" />
        </h2>
        <p className={classNames(defaultClasses?.description, css.description)}>
          <FormattedMessage id="LandingPage.categoryShortcutsDescription" />
        </p>
        <nav className={css.grid} aria-label={navAriaLabel}>
          {categories.map(category => {
            const searchParams = { [paramName]: category.id };
            const searchString = stringify(searchParams);
            return (
              <NamedLink
                key={category.id}
                name="SearchPage"
                to={{ search: searchString ? `?${searchString}` : '' }}
                className={css.card}
              >
                <img
                  src={getCategoryImage(category)}
                  alt=""
                  className={css.cardImage}
                  loading="lazy"
                />
                <span className={css.cardOverlay} aria-hidden="true" />
                <span className={css.cardLabel}>{category.name}</span>
              </NamedLink>
            );
          })}
        </nav>
      </div>
    </SectionContainer>
  );
};

export default SectionCategoryShortcuts;
