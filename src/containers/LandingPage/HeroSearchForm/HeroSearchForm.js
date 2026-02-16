import React, { useState } from 'react';
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
  OutsideClickHandler,
  IconDate,
  FieldDateRangeController,
} from '../../../components';
import css from './HeroSearchForm.module.css';

const identity = v => v;

const isEmpty = value => {
  if (value == null) return true;
  return value.hasOwnProperty('length') && value.length === 0;
};

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

  const onSubmit = values => {
    const queryParams = {};

    if (values.location?.selectedPlace) {
      const { search, selectedPlace: { origin, bounds } } = values.location;
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
          <Form
            onSubmit={handleSubmit}
            className={css.form}
            enforcePagePreloadFor="SearchPage"
          >
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
                        placeholder={intl.formatMessage({ id: 'LandingPage.heroSearchLocationPlaceholder' })}
                        useDarkText
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
                  <OutsideClickHandler
                    className={css.fieldDateWrap}
                    onOutsideClick={() => setDatePickerOpen(false)}
                  >
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
                    {datePickerOpen ? (
                      <div className={css.dateDropdown}>
                        <FieldDateRangeController
                          name="dateRange"
                          onChange={val => val?.startDate && val?.endDate && setDatePickerOpen(false)}
                          showClearButton
                          minimumNights={0}
                          className={css.datePicker}
                        />
                      </div>
                    ) : null}
                  </OutsideClickHandler>
                )}
              />
              <PrimaryButton
                type="submit"
                className={css.submitBtn}
                disabled={submitDisabled}
              >
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
