import React from 'react';
import classNames from 'classnames';
import css from './SectionCategoryShortcuts.module.css';

/**
 * Airbnb-style line icons for coworking categories.
 * Maps category id/name to an SVG icon.
 */
const iconMap = {
  office: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  meeting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  desk: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 6h16M4 10h16M4 14h10M4 18h6M20 14v4M20 14h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  event: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const matchCategoryToIcon = category => {
  const id = (category?.id || '').toLowerCase();
  const name = (category?.name || '').toLowerCase();
  const combined = `${id} ${name}`;
  if (/\b(büro|office|einzel|raum)\b/.test(combined) && !/meeting|besprechung|event/.test(combined))
    return 'office';
  if (/\b(meeting|besprechung|konferenz)\b/.test(combined)) return 'meeting';
  if (/\b(desk|arbeitsplatz|hot.?desk)\b/.test(combined)) return 'desk';
  if (/\b(event|veranstaltung|fläche)\b/.test(combined)) return 'event';
  return 'default';
};

export const CategoryIcon = ({ category, className }) => {
  const key = matchCategoryToIcon(category);
  const icon = iconMap[key] || iconMap.default;
  return (
    <span className={classNames(css.cardIconSvg, className)} aria-hidden>
      {icon}
    </span>
  );
};
