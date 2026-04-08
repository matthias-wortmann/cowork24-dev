import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Form as FinalForm, Field } from 'react-final-form';
import { useHistory } from 'react-router-dom';
import { useIntl, FormattedMessage } from '../../../util/reactIntl';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useConfiguration } from '../../../context/configurationContext';
import { createResourceLocatorString } from '../../../util/routes';
import { isOriginInUse } from '../../../util/search';
import { stringifyDateToISO8601 } from '../../../util/dates';
import {
  Form,
  PrimaryButton,
  LocationAutocompleteInput,
  IconDate,
  FieldDateRangeController,
} from '../../../components';
import css from './HeroSearchForm.module.css';

const identity = v => v;

/** Unterhalb von --viewportSmall (550px): Bottom-Sheet. Sonst Popup unter dem Trigger. */
const MQ_BELOW_SMALL = '(max-width: 549px)';
const MQ_MEDIUM = '(min-width: 768px)';

/**
 * Hero-Suchleiste: Ort und optional Datum eingeben, dann zur Suchseite mit Parametern.
 */
const HeroSearchForm = () => {
  const history = useHistory();
  const intl = useIntl();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [dateDropdownStyle, setDateDropdownStyle] = useState({});
  const fieldDateWrapRef = useRef(null);
  const dateDropdownRef = useRef(null);

  const updateDateDropdownPosition = useCallback(() => {
    if (!datePickerOpen || typeof window === 'undefined' || !fieldDateWrapRef.current) {
      return;
    }
    const wrap = fieldDateWrapRef.current;
    const rect = wrap.getBoundingClientRect();
    if (window.matchMedia(MQ_BELOW_SMALL).matches) {
      setDateDropdownStyle({
        position: 'fixed',
        top: 'auto',
        right: 0,
        bottom: 0,
        left: 0,
        transform: 'none',
      });
      return;
    }
    const gap = 8;
    if (window.matchMedia(MQ_MEDIUM).matches) {
      setDateDropdownStyle({
        position: 'fixed',
        top: rect.bottom + gap,
        right: window.innerWidth - rect.right,
        bottom: 'auto',
        left: 'auto',
        transform: 'none',
      });
    } else {
      setDateDropdownStyle({
        position: 'fixed',
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        right: 'auto',
        bottom: 'auto',
        transform: 'translateX(-50%)',
      });
    }
  }, [datePickerOpen]);

  useLayoutEffect(() => {
    updateDateDropdownPosition();
  }, [updateDateDropdownPosition]);

  useEffect(() => {
    if (!datePickerOpen) {
      return undefined;
    }
    window.addEventListener('resize', updateDateDropdownPosition);
    window.addEventListener('scroll', updateDateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDateDropdownPosition);
      window.removeEventListener('scroll', updateDateDropdownPosition, true);
    };
  }, [datePickerOpen, updateDateDropdownPosition]);

  useEffect(() => {
    if (!datePickerOpen) {
      return undefined;
    }
    const onPointerDown = e => {
      const t = e.target;
      if (fieldDateWrapRef.current?.contains(t) || dateDropdownRef.current?.contains(t)) {
        return;
      }
      setDatePickerOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [datePickerOpen]);

  const onSubmit = values => {
    const queryParams = {};

    if (values.location?.selectedPlace) {
      const {
        search,
        selectedPlace: { origin, bounds },
      } = values.location;
      queryParams.bounds = bounds;
      queryParams.address = search;
      if (isOriginInUse(config) && origin) {
        queryParams.origin = `${origin.lat},${origin.lng}`;
      }
    }

    if (values.dateRange?.startDate && values.dateRange?.endDate) {
      const start = stringifyDateToISO8601(values.dateRange.startDate);
      const end = stringifyDateToISO8601(values.dateRange.endDate);
      queryParams.dates = `${start},${end}`;
    }

    const to = createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams);
    history.push(to);
  };

  const formatDateRangeLabel = value => {
    if (!value?.startDate || !value?.endDate) return null;
    return intl.formatDateTimeRange(value.startDate, value.endDate, {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={css.strip}>
      <FinalForm
        onSubmit={onSubmit}
        render={({ handleSubmit }) => (
          <Form onSubmit={handleSubmit} className={css.form} enforcePagePreloadFor="SearchPage">
            <div className={css.fields}>
              <Field
                name="location"
                format={identity}
                render={({ input }) => {
                  const { onChange, ...restInput } = input;
                  const searchOnChange = value => {
                    onChange(value);
                    if (value?.selectedPlace || !value?.search) {
                      setSubmitDisabled(false);
                    } else if (value?.search?.length > 0) {
                      setSubmitDisabled(true);
                    }
                  };
                  return (
                    <div className={css.fieldLocation}>
                      <LocationAutocompleteInput
                        id="hero-location-search"
                        className={css.locationRoot}
                        iconClassName={css.locationIcon}
                        inputClassName={css.locationInput}
                        predictionsClassName={css.predictions}
                        placeholder={intl.formatMessage({
                          id: 'LandingPage.heroSearchLocationPlaceholder',
                        })}
                        useDarkText
                        usePredictionsPortal
                        closeOnBlur
                        input={{ ...restInput, onChange: searchOnChange }}
                        meta={{}}
                      />
                    </div>
                  );
                }}
              />
              <Field
                name="dateRange"
                subscription={{ value: true }}
                render={({ input }) => (
                  <div ref={fieldDateWrapRef} className={css.fieldDateWrap}>
                    <button
                      type="button"
                      className={css.dateTrigger}
                      onClick={() => setDatePickerOpen(prev => !prev)}
                      aria-expanded={datePickerOpen}
                      aria-haspopup="dialog"
                    >
                      <IconDate rootClassName={css.dateIcon} />
                      <span className={css.dateLabel}>
                        {formatDateRangeLabel(input.value) ||
                          intl.formatMessage({ id: 'LandingPage.heroSearchDatePlaceholder' })}
                      </span>
                    </button>
                    {datePickerOpen
                      ? createPortal(
                          <div
                            ref={dateDropdownRef}
                            className={css.dateDropdown}
                            style={dateDropdownStyle}
                          >
                            <FieldDateRangeController
                              name="dateRange"
                              onChange={val =>
                                val?.startDate && val?.endDate && setDatePickerOpen(false)
                              }
                              showClearButton
                              minimumNights={0}
                              className={css.datePicker}
                            />
                          </div>,
                          document.body
                        )
                      : null}
                  </div>
                )}
              />
              <PrimaryButton type="submit" className={css.submitBtn} disabled={submitDisabled}>
                <FormattedMessage id="LandingPage.defaultHeroCta" />
              </PrimaryButton>
            </div>
          </Form>
        )}
      />
    </div>
  );
};

export default HeroSearchForm;
