import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';

import SectionContainer from '../SectionContainer';
import css from './SectionSpaceOwnerHero.module.css';

/**
 * Hero section for the Space Owner Landing Page.
 * Full-width gradient background with headline, subtext, and primary CTA.
 *
 * @component
 * @param {Object} props
 * @param {string} props.sectionId - Unique section identifier
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object?} props.defaultClasses
 * @param {Object?} props.appearance
 * @param {Object?} props.options
 * @returns {JSX.Element}
 */
const SectionSpaceOwnerHero = props => {
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
        <div className={css.content}>
          <h1 className={css.title}>
            <FormattedMessage id="SpaceOwnerLandingPage.heroTitle" />
          </h1>
          <p className={css.subtitle}>
            <FormattedMessage id="SpaceOwnerLandingPage.heroSubtitle" />
          </p>
          <NamedLink
            name="EditListingPage"
            params={{
              slug: 'draft',
              id: '00000000-0000-0000-0000-000000000000',
              type: 'new',
              tab: 'details',
            }}
            className={css.cta}
          >
            <FormattedMessage id="SpaceOwnerLandingPage.heroCta" />
          </NamedLink>
          <p className={css.ctaHint}>
            <FormattedMessage id="SpaceOwnerLandingPage.heroCtaHint" />
          </p>
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionSpaceOwnerHero;
