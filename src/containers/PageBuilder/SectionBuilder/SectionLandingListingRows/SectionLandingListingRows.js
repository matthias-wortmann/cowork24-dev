import React from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { getListingsById } from '../../../../ducks/marketplaceData.duck';
import { useConfiguration } from '../../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { stringify } from '../../../../util/urlHelpers';
import { landingSectionSurfaceClassName } from '../../../LandingPage/landingSectionSurface';

import { ListingCard, NamedLink } from '../../../../components';

import css from './SectionLandingListingRows.module.css';

const LANDING_CARD_RENDER_SIZES = [
  '(max-width: 767px) 58vw',
  '(max-width: 1023px) 30vw',
  '(max-width: 1439px) 20vw',
  '210px',
].join(', ');

/**
 * One horizontal listing row (title, “view all”, scrollable cards).
 *
 * @param {Object} props
 * @param {Object} props.row - landingPage.listingRows entry
 * @returns {JSX.Element|null}
 */
const LandingListingRow = ({ row }) => {
  const intl = useIntl();
  const rowState = useSelector(state => state.LandingPage?.listingRows?.[row.id] || {});
  const { ids = [], inProgress, error, viewAllSearchParams = {} } = rowState;

  const listings = useSelector(state => getListingsById(state, ids));

  const showRow = !error && !inProgress && listings.length > 0;
  if (!showRow) {
    return null;
  }

  const searchString = stringify(viewAllSearchParams);
  const viewAllTo = { search: searchString ? `?${searchString}` : '' };

  return (
    <div className={css.row}>
      <div className={css.rowHeader}>
        <h2 className={css.rowTitle}>
          <FormattedMessage id={row.titleTranslationKey} />
        </h2>
        <NamedLink name="SearchPage" to={viewAllTo} className={css.viewAll}>
          <FormattedMessage id="SectionLandingListingRows.viewAll" />
        </NamedLink>
      </div>
      <div className={css.scroller}>
        <ul
          className={css.list}
          aria-label={intl.formatMessage(
            { id: 'SectionLandingListingRows.rowAriaLabel' },
            { title: intl.formatMessage({ id: row.titleTranslationKey }) }
          )}
        >
          {listings.map(listing => (
            <li key={listing.id.uuid} className={css.cardWrap}>
              <div className={css.cardShell}>
                <ListingCard
                  className={css.listingCard}
                  listing={listing}
                  renderSizes={LANDING_CARD_RENDER_SIZES}
                  intl={intl}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Airbnb-style horizontal listing highlights on the landing page.
 *
 * @param {Object} props
 * @param {string} [props.sectionId]
 * @param {string[]} [props.rowIds] - If set, only these row `id`s from config (in order); otherwise all rows.
 * @param {string} [props.className]
 * @param {string} [props.rootClassName]
 * @returns {JSX.Element|null}
 */
const SectionLandingListingRows = props => {
  const { sectionId, className, rootClassName, rowIds: rowIdsProp, landingSurface } = props;
  const config = useConfiguration();
  const allRows = config.landingPage?.listingRows || [];
  const rows =
    Array.isArray(rowIdsProp) && rowIdsProp.length > 0
      ? rowIdsProp.map(id => allRows.find(r => r.id === id)).filter(Boolean)
      : allRows;

  const listingRowsState = useSelector(state => state.LandingPage?.listingRows || {});

  const hasAnyVisibleRow = rows.some(row => {
    const r = listingRowsState[row.id];
    return r && !r.inProgress && !r.error && (r.ids || []).length > 0;
  });

  if (!rows.length || !hasAnyVisibleRow) {
    return null;
  }

  return (
    <section
      id={sectionId}
      className={classNames(
        css.root,
        landingSectionSurfaceClassName(landingSurface),
        rootClassName,
        className
      )}
    >
      <div className={css.wrapper}>
        {rows.map(row => (
          <LandingListingRow key={row.id} row={row} />
        ))}
      </div>
    </section>
  );
};

export default SectionLandingListingRows;
