import React from 'react';

import css from './SectionLocations.module.css';

/**
 * A single location card in the Airbnb Destinations-style grid.
 * Renders a 1:1 city image with the city name below.
 *
 * @component
 * @param {Object} props
 * @param {string} props.name - City display name
 * @param {string} props.image - Image URL for the city
 * @param {string} props.href - Target search URL (used as link href)
 * @param {Function} props.onClick - Click handler for client-side navigation
 * @returns {JSX.Element}
 */
const LocationCard = props => {
  const { name, image, href, onClick } = props;

  return (
    <a className={css.card} href={href} onClick={onClick}>
      <div className={css.imageWrapper}>
        <img src={image} alt={name} className={css.image} loading="lazy" />
      </div>
      <p className={css.cityName}>{name}</p>
    </a>
  );
};

export default LocationCard;
