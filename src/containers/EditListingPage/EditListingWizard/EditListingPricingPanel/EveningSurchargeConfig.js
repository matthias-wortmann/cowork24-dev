import React from 'react';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import * as validators from '../../../../util/validators';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import { FieldCheckbox, FieldCurrencyInput, FieldSelect } from '../../../../components';

import css from './EveningSurchargeConfig.module.css';

const { Money } = sdkTypes;

const BUSINESS_HOURS_OPTIONS = [
  { value: '15', labelId: 'EveningSurchargeConfig.hour15' },
  { value: '16', labelId: 'EveningSurchargeConfig.hour16' },
  { value: '17', labelId: 'EveningSurchargeConfig.hour17' },
  { value: '18', labelId: 'EveningSurchargeConfig.hour18' },
  { value: '19', labelId: 'EveningSurchargeConfig.hour19' },
  { value: '20', labelId: 'EveningSurchargeConfig.hour20' },
];

/**
 * Read initial form values for evening surcharge from listing publicData.
 *
 * @param {Object} params
 * @param {Object} params.listing
 * @param {string} params.marketplaceCurrency
 * @returns {Object} initialValues fragment
 */
export const getInitialValuesForEveningSurcharge = params => {
  const { listing, marketplaceCurrency } = params;
  const { publicData } = listing?.attributes || {};
  const {
    eveningSurchargePerHourSubunits,
    businessHoursEnd,
  } = publicData || {};

  const hasSurcharge =
    typeof eveningSurchargePerHourSubunits === 'number' && eveningSurchargePerHourSubunits > 0;

  return {
    eveningSurchargeEnabled: hasSurcharge ? ['true'] : [],
    eveningSurchargePerHour: hasSurcharge
      ? new Money(eveningSurchargePerHourSubunits, marketplaceCurrency)
      : null,
    businessHoursEnd: businessHoursEnd != null ? String(businessHoursEnd) : '17',
  };
};

/**
 * Convert form values into publicData fields for the listing update.
 *
 * @param {Object} values form values
 * @returns {Object} { publicData: { ... } }
 */
export const handleSubmitValuesForEveningSurcharge = values => {
  const { eveningSurchargeEnabled, eveningSurchargePerHour, businessHoursEnd } = values;
  const isEnabled = Array.isArray(eveningSurchargeEnabled)
    ? eveningSurchargeEnabled.includes('true')
    : !!eveningSurchargeEnabled;

  if (!isEnabled) {
    return {
      publicData: {
        eveningSurchargePerHourSubunits: null,
        businessHoursEnd: null,
      },
    };
  }

  const surchargeAmount =
    eveningSurchargePerHour instanceof Money ? eveningSurchargePerHour.amount : 0;

  return {
    publicData: {
      eveningSurchargePerHourSubunits: surchargeAmount,
      businessHoursEnd: businessHoursEnd ? parseInt(businessHoursEnd, 10) : 17,
    },
  };
};

/**
 * UI section for configuring an evening/off-hours surcharge on hourly listings.
 *
 * @component
 * @param {Object} props
 * @param {string} props.formId
 * @param {string} props.marketplaceCurrency
 * @param {Object} props.formValues - current React Final Form values
 * @returns {JSX.Element}
 */
const EveningSurchargeConfig = props => {
  const { formId, marketplaceCurrency, formValues } = props;
  const intl = useIntl();
  const surchargeValue = formValues?.eveningSurchargeEnabled;
  const isEnabled = Array.isArray(surchargeValue)
    ? surchargeValue.includes('true')
    : !!surchargeValue;

  const surchargeRequiredMsg = intl.formatMessage({
    id: 'EveningSurchargeConfig.surchargeRequired',
  });
  const surchargeValidator = validators.required(surchargeRequiredMsg);

  return (
    <fieldset className={css.root}>
      <legend className={css.legend}>
        <FormattedMessage id="EveningSurchargeConfig.sectionTitle" />
      </legend>

      <FieldCheckbox
        id={`${formId}_eveningSurchargeEnabled`}
        name="eveningSurchargeEnabled"
        label={intl.formatMessage({ id: 'EveningSurchargeConfig.enableLabel' })}
        value="true"
        useSuccessColor={false}
      />

      {isEnabled ? (
        <div className={css.fields}>
          <FieldCurrencyInput
            id={`${formId}_eveningSurchargePerHour`}
            name="eveningSurchargePerHour"
            className={css.surchargeInput}
            label={intl.formatMessage({ id: 'EveningSurchargeConfig.surchargePerHourLabel' })}
            placeholder={intl.formatMessage({
              id: 'EveningSurchargeConfig.surchargePerHourPlaceholder',
            })}
            currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
            validate={surchargeValidator}
          />

          <FieldSelect
            id={`${formId}_businessHoursEnd`}
            name="businessHoursEnd"
            className={css.selectInput}
            label={intl.formatMessage({ id: 'EveningSurchargeConfig.businessHoursEndLabel' })}
          >
            {BUSINESS_HOURS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {intl.formatMessage({ id: opt.labelId })}
              </option>
            ))}
          </FieldSelect>

          <p className={css.hint}>
            <FormattedMessage id="EveningSurchargeConfig.hint" />
          </p>
        </div>
      ) : null}
    </fieldset>
  );
};

export default EveningSurchargeConfig;
