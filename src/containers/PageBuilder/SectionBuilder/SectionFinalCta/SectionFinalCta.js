import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';

import SectionContainer from '../SectionContainer';
import css from './SectionFinalCta.module.css';

/**
 * Final CTA section at the bottom of the Space Owner Landing Page.
 * Centered layout with headline and large CTA button.
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
const SectionFinalCta = props => {
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
        <h2 className={css.title}>
          <FormattedMessage id="SpaceOwnerLandingPage.finalCtaTitle" />
        </h2>
        <p className={css.subtitle}>
          <FormattedMessage id="SpaceOwnerLandingPage.finalCtaSubtitle" />
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
          <FormattedMessage id="SpaceOwnerLandingPage.finalCtaButton" />
        </NamedLink>
      </div>
    </SectionContainer>
  );
};

export default SectionFinalCta;
