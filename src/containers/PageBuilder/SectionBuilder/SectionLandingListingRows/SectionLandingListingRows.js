import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { getListingsById } from '../../../../ducks/marketplaceData.duck';
import { useConfiguration } from '../../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { stringify } from '../../../../util/urlHelpers';
import { landingSectionSurfaceClassName } from '../../../LandingPage/landingSectionSurface';

import { ListingCard, NamedLink } from '../../../../components';

import css from './SectionLandingListingRows.module.css';

const LANDING_CARD_RENDER_SIZES = [
  '(max-width: 767px) 70vw',
  '(max-width: 1023px) 38vw',
  '(max-width: 1439px) 26vw',
  '260px',
].join(', ');

const SCROLL_EDGE_TOLERANCE = 4;

/**
 * One horizontal listing row (title, “view all”, scrollable cards).
 *
 * @param {Object} props
 * @param {Object} props.row - landingPage.listingRows entry
 * @returns {JSX.Element|null}
 */
const LandingListingRow = ({ row, isFirstRow }) => {
  const intl = useIntl();
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const rowState = useSelector(state => state.LandingPage?.listingRows?.[row.id] || {});
  const { ids = [], inProgress, error, viewAllSearchParams = {} } = rowState;

  const listings = useSelector(state => getListingsById(state, ids));

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > SCROLL_EDGE_TOLERANCE);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - SCROLL_EDGE_TOLERANCE);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, listings.length]);

  const scrollByPage = direction => () => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9) * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

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
          <span className={css.viewAllLabel}>
            <FormattedMessage id="SectionLandingListingRows.viewAll" />
          </span>
          <ChevronRight className={css.viewAllIcon} aria-hidden="true" />
        </NamedLink>
      </div>
      <div className={css.scrollerWrap}>
        <button
          type="button"
          className={classNames(css.navButton, css.navButtonLeft, {
            [css.navButtonHidden]: !canScrollLeft,
          })}
          aria-label={intl.formatMessage({ id: 'SectionLandingListingRows.scrollPrev' })}
          onClick={scrollByPage(-1)}
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className={classNames(css.navButton, css.navButtonRight, {
            [css.navButtonHidden]: !canScrollRight,
          })}
          aria-label={intl.formatMessage({ id: 'SectionLandingListingRows.scrollNext' })}
          onClick={scrollByPage(1)}
          tabIndex={canScrollRight ? 0 : -1}
        >
          <ChevronRight aria-hidden="true" />
        </button>
        <div className={css.scroller} ref={scrollerRef}>
          <ul
            className={css.list}
            aria-label={intl.formatMessage(
              { id: 'SectionLandingListingRows.rowAriaLabel' },
              { title: intl.formatMessage({ id: row.titleTranslationKey }) }
            )}
          >
            {listings.map((listing, index) => (
              <li key={listing.id.uuid} className={css.cardWrap}>
                <div className={css.cardShell}>
                  <ListingCard
                    className={css.listingCard}
                    listing={listing}
                    renderSizes={LANDING_CARD_RENDER_SIZES}
                    intl={intl}
                    highImagePriority={isFirstRow && index === 0}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
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
        {rows.map((row, rowIndex) => (
          <LandingListingRow key={row.id} row={row} isFirstRow={rowIndex === 0} />
        ))}
      </div>
    </section>
  );
};

export default SectionLandingListingRows;
