import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';

import SectionContainer from '../SectionContainer';
import css from './SectionHowItWorks.module.css';

const STEPS = [
  {
    id: 'step1',
    number: '1',
    titleId: 'SpaceOwnerLandingPage.step1Title',
    descId: 'SpaceOwnerLandingPage.step1Desc',
  },
  {
    id: 'step2',
    number: '2',
    titleId: 'SpaceOwnerLandingPage.step2Title',
    descId: 'SpaceOwnerLandingPage.step2Desc',
  },
  {
    id: 'step3',
    number: '3',
    titleId: 'SpaceOwnerLandingPage.step3Title',
    descId: 'SpaceOwnerLandingPage.step3Desc',
  },
];

/**
 * How It Works section with 3 numbered steps.
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
const SectionHowItWorks = props => {
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
          <FormattedMessage id="SpaceOwnerLandingPage.howItWorksTitle" />
        </h2>
        <p className={css.sectionSubtitle}>
          <FormattedMessage id="SpaceOwnerLandingPage.howItWorksSubtitle" />
        </p>
        <div className={css.stepsGrid}>
          {STEPS.map(({ id, number, titleId, descId }, index) => (
            <div key={id} className={css.step}>
              <div className={css.stepNumber}>{number}</div>
              {index < STEPS.length - 1 && <div className={css.connector} aria-hidden="true" />}
              <h3 className={css.stepTitle}>
                <FormattedMessage id={titleId} />
              </h3>
              <p className={css.stepDesc}>
                <FormattedMessage id={descId} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionHowItWorks;
