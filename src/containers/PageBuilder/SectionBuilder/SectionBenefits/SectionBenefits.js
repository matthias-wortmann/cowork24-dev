import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';

import SectionContainer from '../SectionContainer';
import css from './SectionBenefits.module.css';

const BENEFITS = [
  {
    id: 'free',
    titleId: 'SpaceOwnerLandingPage.benefit1Title',
    descId: 'SpaceOwnerLandingPage.benefit1Desc',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'flexible',
    titleId: 'SpaceOwnerLandingPage.benefit2Title',
    descId: 'SpaceOwnerLandingPage.benefit2Desc',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'secure',
    titleId: 'SpaceOwnerLandingPage.benefit3Title',
    descId: 'SpaceOwnerLandingPage.benefit3Desc',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

/**
 * Benefits section with 3-column grid and icons.
 *
 * @component
 * @param {Object} props
 * @param {string} props.sectionId
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object?} props.defaultClasses
 * @param {Object?} props.appearance
 * @param {Object?} props.options
 * @returns {JSX.Element}
 */
const SectionBenefits = props => {
  const { sectionId, className, rootClassName, defaultClasses, appearance, options } = props;

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={classNames(rootClassName, css.root)}
      appearance={appearance}
      options={options}
    >
      <div className={css.wrapper}>
        <h2 className={css.sectionTitle}>
          <FormattedMessage id="SpaceOwnerLandingPage.benefitsTitle" />
        </h2>
        <p className={css.sectionSubtitle}>
          <FormattedMessage id="SpaceOwnerLandingPage.benefitsSubtitle" />
        </p>
        <div className={css.grid}>
          {BENEFITS.map(({ id, titleId, descId, icon }) => (
            <article key={id} className={css.card}>
              <div className={css.iconCircle}>{icon}</div>
              <h3 className={css.cardTitle}>
                <FormattedMessage id={titleId} />
              </h3>
              <p className={css.cardDesc}>
                <FormattedMessage id={descId} />
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionBenefits;
