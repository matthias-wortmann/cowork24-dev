import React from 'react';
import classNames from 'classnames';

import css from './SectionCategoryBar.module.css';

/**
 * A single category item in the Airbnb-style CategoryBar.
 * Renders an icon on top and a label below, with active/inactive styling.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Lucide React icon element
 * @param {string} props.label - Translated category label
 * @param {boolean} props.isActive - Whether this category is currently selected
 * @param {Function} props.onClick - Click handler to navigate/filter
 * @returns {JSX.Element}
 */
const CategoryItem = props => {
  const { icon, label, isActive, onClick } = props;

  return (
    <button
      type="button"
      className={classNames(css.categoryItem, { [css.categoryItemActive]: isActive })}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={css.categoryIcon}>{icon}</span>
      <span className={css.categoryLabel}>{label}</span>
    </button>
  );
};

export default CategoryItem;
