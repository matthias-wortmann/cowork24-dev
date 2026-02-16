import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';

import SectionContainer from '../SectionContainer';
import css from './SectionSpaceOwner.module.css';
import spaceOwnerImg from './space-owner-cta.jpg';

/**
 * Split-screen CTA section for coworking space owners.
 * Left column: heading, description, and CTA button.
 * Right column: coworking image.
 *
 * @component
 * @param {Object} props
 * @param {string} props.sectionId - Unique section identifier
 * @param {string?} props.className - Additional CSS class
 * @param {string?} props.rootClassName - Override root CSS class
 * @param {Object?} props.defaultClasses - Shared styling classes from SectionBuilder
 * @param {Object?} props.appearance - Appearance settings (e.g. background)
 * @param {Object?} props.options - Extra options for the section
 * @returns {JSX.Element}
 */
const SectionSpaceOwner = props => {
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
        <div className={css.grid}>
          <div className={css.textColumn}>
            <h2 className={classNames(defaultClasses?.title, css.title)}>
              <FormattedMessage id="SectionSpaceOwner.title" />
            </h2>
            <p className={classNames(defaultClasses?.description, css.description)}>
              <FormattedMessage id="SectionSpaceOwner.description" />
            </p>
            <NamedLink
              name="CMSPage"
              params={{ pageId: 'space_owner' }}
              className={classNames(defaultClasses?.ctaButton, css.cta)}
            >
              <FormattedMessage id="SectionSpaceOwner.ctaButton" />
            </NamedLink>
          </div>

          <div className={css.imageColumn}>
            <img
              src={spaceOwnerImg}
              alt="Coworking Space"
              className={css.image}
              width={800}
              height={449}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionSpaceOwner;
