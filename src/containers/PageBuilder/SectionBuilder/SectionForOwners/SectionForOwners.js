import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';
import SectionContainer from '../SectionContainer';
import css from './SectionForOwners.module.css';

/**
 * Section für Coworking-Anbieter: CTA zum Anbieten von Räumen.
 */
const SectionForOwners = props => {
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
          <h2 className={classNames(defaultClasses?.title, css.title)}>
            <FormattedMessage id="LandingPage.forOwnersTitle" />
          </h2>
          <p className={classNames(defaultClasses?.description, css.description)}>
            <FormattedMessage id="LandingPage.forOwnersDescription" />
          </p>
          <NamedLink name="NewListingPage" className={css.cta}>
            <FormattedMessage id="LandingPage.forOwnersCta" />
          </NamedLink>
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionForOwners;
