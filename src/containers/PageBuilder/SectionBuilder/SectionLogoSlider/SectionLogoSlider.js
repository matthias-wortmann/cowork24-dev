import React from 'react';
import classNames from 'classnames';

import SectionContainer from '../SectionContainer';
import css from './SectionLogoSlider.module.css';

/**
 * Coworking spaces active on the platform.
 * Each entry needs an id, name, and logo URL.
 */
const LOGOS = [
  {
    id: 'coworking-seefeld',
    name: 'Coworking Seefeld',
    logo: 'https://sharetribe.imgix.net/68a32a0c-65b6-47ae-97b1-43643e03bc76/698f3d90-c887-4a6b-9d73-bb38f62dc864?auto=format&crop=edges&fit=crop&h=240&w=240&s=fb40ba1dedabeb3959c77d9d83879692',
  },
  {
    id: 'impact-hub-zurich',
    name: 'Impact Hub Zürich',
    logo: 'https://sharetribe.imgix.net/68a32a0c-65b6-47ae-97b1-43643e03bc76/691d9c3c-0e4b-451b-a9e5-e1dd4081b66f?auto=format&crop=edges&fit=crop&h=240&w=240&s=a376d06ec72318c4d0031415c100bced',
  },
  {
    id: 'flexoffice-schweiz',
    name: 'FlexOffice Schweiz',
    logo: 'https://sharetribe.imgix.net/68a32a0c-65b6-47ae-97b1-43643e03bc76/690367ae-f58e-43b0-b823-bea8bad6559e?auto=format&crop=edges&fit=crop&h=240&w=240&s=883b065ebaf0a561a94298474db36461',
  },
  {
    id: 'workspace4you',
    name: 'workspace4you',
    logo: 'https://www.workspace4you.ch/assets/logo.logo.jpg',
  },
  {
    id: 'headsquarter',
    name: 'Headsquarter',
    logo: 'https://media.licdn.com/dms/image/v2/D4E0BAQE6T6aL37Q_xg/company-logo_200_200/company-logo_200_200/0/1666610164128/headsquarter_logo?e=2147483647&v=beta&t=hsy-NxKvSt6xF3Lq6H1k3gwwu7zMJ4VBJ_cdFuVbD2c',
  },
  {
    id: 'zeitplatz',
    name: 'ZEITPLATZ',
    logo: 'https://sharetribe.imgix.net/68a32a0c-65b6-47ae-97b1-43643e03bc76/68e54ae5-153b-43bd-a8eb-e61d6814d6e5?auto=format&crop=edges&fit=crop&h=240&w=240&s=5bd9fef8c2716c8a19cb03d020049040',
  },
  {
    id: '1905-business-center',
    name: '1905 Business Center Baden',
    logo: 'https://cdn.prod.website-files.com/6348198d13b4affbea4ab9aa/6348198d13b4afa5714aba03_1905%20Logo%20Web.png',
  },
  {
    id: 'coworking-bodensee',
    name: 'Coworking Bodensee',
    logo: 'https://sharetribe.imgix.net/68a32a0c-65b6-47ae-97b1-43643e03bc76/68ff4fb2-1062-4637-b383-1499b28a4f79?auto=format&crop=edges&fit=crop&h=240&w=240&s=f9f2b10936124552b1ad8b3965eea761',
  },
];

/**
 * Single logo item rendered inside the marquee track.
 * Shows an <img> when a `logo` URL is provided, otherwise a styled placeholder.
 */
const LogoItem = ({ name, logo, color }) => {
  if (logo) {
    return (
      <div className={css.logoItem}>
        <img src={logo} alt={name} className={css.logoImage} loading="lazy" />
      </div>
    );
  }

  // Placeholder: coloured circle with initials
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2);

  return (
    <div className={css.logoItem}>
      <div className={css.logoPlaceholder} style={{ backgroundColor: color }}>
        <span className={css.logoInitials}>{initials}</span>
      </div>
      <span className={css.logoName}>{name}</span>
    </div>
  );
};

/**
 * Infinite marquee logo slider showcasing coworking spaces active on the platform.
 * Uses pure CSS animation with duplicated content for a seamless loop.
 *
 * @component
 * @param {Object} props
 * @param {string} props.sectionId - Unique section identifier
 * @param {string?} props.className - Additional CSS class
 * @param {string?} props.rootClassName - Override root CSS class
 * @param {Object?} props.defaultClasses - Shared styling classes from SectionBuilder
 * @param {Object?} props.appearance - Appearance settings
 * @param {Object?} props.options - Extra options
 * @returns {JSX.Element}
 */
const SectionLogoSlider = props => {
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
        <div className={css.marqueeContainer}>
          {/* Fade edges */}
          <div className={css.fadeLeft} />
          <div className={css.fadeRight} />

          {/* Marquee track: two identical sets for seamless loop */}
          <div className={css.marqueeTrack}>
            <div className={css.marqueeContent} aria-label="Logo slider">
              {LOGOS.map(l => (
                <LogoItem key={l.id} {...l} />
              ))}
            </div>
            <div className={css.marqueeContent} aria-hidden="true">
              {LOGOS.map(l => (
                <LogoItem key={`dup-${l.id}`} {...l} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default SectionLogoSlider;
