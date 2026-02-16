import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';

import SectionContainer from '../SectionContainer';
import css from './SectionStats.module.css';

const STATS = [
  { id: 'spaces', valueId: 'SpaceOwnerLandingPage.stat1Value', labelId: 'SpaceOwnerLandingPage.stat1Label' },
  { id: 'users', valueId: 'SpaceOwnerLandingPage.stat2Value', labelId: 'SpaceOwnerLandingPage.stat2Label' },
  { id: 'satisfaction', valueId: 'SpaceOwnerLandingPage.stat3Value', labelId: 'SpaceOwnerLandingPage.stat3Label' },
  { id: 'cities', valueId: 'SpaceOwnerLandingPage.stat4Value', labelId: 'SpaceOwnerLandingPage.stat4Label' },
];

/**
 * Statistics section with key numbers.
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
const SectionStats = props => {
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
          <FormattedMessage id="SpaceOwnerLandingPage.statsTitle" />
        </h2>
        <div className={css.grid}>
          {STATS.map(({ id, valueId, labelId }) => (
            <div key={id} className={css.stat}>
              <span className={css.value}>
                <FormattedMessage id={valueId} />
              </span>
              <span className={css.label}>
                <FormattedMessage id={labelId} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionStats;
