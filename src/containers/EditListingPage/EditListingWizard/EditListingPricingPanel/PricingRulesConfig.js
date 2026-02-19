import React, { useState } from 'react';
import { FieldArray } from 'react-final-form-arrays';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import * as validators from '../../../../util/validators';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import {
  FieldCurrencyInput,
  FieldSelect,
  FieldTextInput,
  IconDelete,
  InlineTextButton,
} from '../../../../components';

import css from './PricingRulesConfig.module.css';

const { Money } = sdkTypes;

const MAX_RULES = 10;

const RULE_TYPES = [{ value: 'time-of-day', labelId: 'PricingRulesConfig.typeTimeOfDay' }];

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => ({
  value: String(i),
  labelId: `PricingRulesConfig.hour${i}`,
}));

const generateRuleId = () => `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Read initial form values for pricing rules from listing publicData.
 * Handles backward-compatible migration from the old eveningSurcharge fields.
 *
 * @param {Object} params
 * @param {Object} params.listing
 * @param {string} params.marketplaceCurrency
 * @param {Object} [params.intl] - react-intl intl object for localized migration labels
 * @returns {Object} initialValues fragment with pricingRules array
 */
export const getInitialValuesForPricingRules = params => {
  const { listing, marketplaceCurrency, intl } = params;
  const { publicData } = listing?.attributes || {};
  const { pricingRules, eveningSurchargePerHourSubunits, businessHoursEnd } = publicData || {};

  if (Array.isArray(pricingRules) && pricingRules.length > 0) {
    return {
      pricingRules: pricingRules.map(rule => ({
        id: rule.id,
        type: rule.type,
        label: rule.label || '',
        surchargePerHour:
          typeof rule.surchargePerHourSubunits === 'number' && rule.surchargePerHourSubunits > 0
            ? new Money(rule.surchargePerHourSubunits, marketplaceCurrency)
            : null,
        fromHour: rule.fromHour != null ? String(rule.fromHour) : '17',
        toHour: rule.toHour != null ? String(rule.toHour) : '24',
      })),
    };
  }

  // Backward compatibility: migrate old eveningSurcharge fields
  const hasLegacySurcharge =
    typeof eveningSurchargePerHourSubunits === 'number' && eveningSurchargePerHourSubunits > 0;

  if (hasLegacySurcharge) {
    const migrationLabel = intl
      ? intl.formatMessage({ id: 'PricingRulesConfig.legacyMigrationLabel' })
      : 'Evening surcharge';

    return {
      pricingRules: [
        {
          id: generateRuleId(),
          type: 'time-of-day',
          label: migrationLabel,
          surchargePerHour: new Money(eveningSurchargePerHourSubunits, marketplaceCurrency),
          fromHour: businessHoursEnd != null ? String(businessHoursEnd) : '17',
          toHour: '24',
        },
      ],
    };
  }

  return { pricingRules: [] };
};

/**
 * Convert form values into publicData fields for the listing update.
 * Clears legacy evening surcharge fields on save.
 *
 * @param {Object} values form values
 * @returns {Object} { publicData: { ... } }
 */
export const handleSubmitValuesForPricingRules = values => {
  const { pricingRules = [] } = values;

  const rules = pricingRules
    .filter(rule => rule.type && rule.label)
    .map(rule => {
      const surchargeAmount =
        rule.surchargePerHour instanceof Money ? rule.surchargePerHour.amount : 0;

      return {
        id: rule.id || generateRuleId(),
        type: rule.type,
        label: rule.label,
        surchargePerHourSubunits: surchargeAmount,
        fromHour: rule.fromHour != null ? parseInt(rule.fromHour, 10) : 17,
        toHour: rule.toHour != null ? parseInt(rule.toHour, 10) : 24,
      };
    });

  return {
    publicData: {
      pricingRules: rules.length > 0 ? rules : null,
      // Clear legacy fields
      eveningSurchargePerHourSubunits: null,
      businessHoursEnd: null,
    },
  };
};

/**
 * Renders the type-specific fields for a time-of-day pricing rule.
 */
const TimeOfDayFields = props => {
  const { name, formId, index, marketplaceCurrency, intl } = props;

  const surchargeRequiredMsg = intl.formatMessage({
    id: 'PricingRulesConfig.surchargeRequired',
  });

  return (
    <div className={css.ruleFields}>
      <FieldCurrencyInput
        id={`${formId}_pricingRules_${index}_surchargePerHour`}
        name={`${name}.surchargePerHour`}
        className={css.surchargeInput}
        label={intl.formatMessage({ id: 'PricingRulesConfig.surchargePerHourLabel' })}
        placeholder={intl.formatMessage({ id: 'PricingRulesConfig.surchargePerHourPlaceholder' })}
        currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
        validate={validators.required(surchargeRequiredMsg)}
      />

      <div className={css.hourSelects}>
        <FieldSelect
          id={`${formId}_pricingRules_${index}_fromHour`}
          name={`${name}.fromHour`}
          className={css.selectInput}
          label={intl.formatMessage({ id: 'PricingRulesConfig.fromHourLabel' })}
        >
          {HOUR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {intl.formatMessage({ id: opt.labelId })}
            </option>
          ))}
        </FieldSelect>

        <FieldSelect
          id={`${formId}_pricingRules_${index}_toHour`}
          name={`${name}.toHour`}
          className={css.selectInput}
          label={intl.formatMessage({ id: 'PricingRulesConfig.toHourLabel' })}
        >
          {HOUR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {intl.formatMessage({ id: opt.labelId })}
            </option>
          ))}
        </FieldSelect>
      </div>
    </div>
  );
};

/**
 * Renders a single pricing rule card with label, type selector, and type-specific fields.
 */
const PricingRule = props => {
  const { name, formId, index, marketplaceCurrency, onRemove, ruleValues, intl } = props;

  const labelRequiredMsg = intl.formatMessage({ id: 'PricingRulesConfig.labelRequired' });

  return (
    <div className={css.ruleCard}>
      <div className={css.ruleHeader}>
        <FieldTextInput
          id={`${formId}_pricingRules_${index}_label`}
          name={`${name}.label`}
          className={css.labelInput}
          label={intl.formatMessage({ id: 'PricingRulesConfig.labelField' })}
          placeholder={intl.formatMessage({ id: 'PricingRulesConfig.labelPlaceholder' })}
          validate={validators.required(labelRequiredMsg)}
        />

        <button type="button" className={css.deleteButton} onClick={onRemove}>
          <IconDelete className={css.deleteIcon} />
        </button>
      </div>

      <FieldSelect
        id={`${formId}_pricingRules_${index}_type`}
        name={`${name}.type`}
        className={css.typeSelect}
        label={intl.formatMessage({ id: 'PricingRulesConfig.typeField' })}
      >
        {RULE_TYPES.map(opt => (
          <option key={opt.value} value={opt.value}>
            {intl.formatMessage({ id: opt.labelId })}
          </option>
        ))}
      </FieldSelect>

      {ruleValues?.type === 'time-of-day' ? (
        <TimeOfDayFields
          name={name}
          formId={formId}
          index={index}
          marketplaceCurrency={marketplaceCurrency}
          intl={intl}
        />
      ) : null}
    </div>
  );
};

const initRuleKeys = initialLength => {
  const counter = initialLength || 0;
  const keys =
    counter > 0 ? [...Array(initialLength)].map((_, i) => `ruleKey_${i}`) : [];
  return [counter, keys];
};

const addNewRuleKey = setRuleKeys => {
  setRuleKeys(([counter, ruleKeys]) => [
    counter + 1,
    [...ruleKeys, `ruleKey_${counter}`],
  ]);
};

const removeRuleKey = (setRuleKeys, index) => {
  setRuleKeys(([counter, ruleKeys]) => [
    counter,
    [...ruleKeys.slice(0, index), ...ruleKeys.slice(index + 1)],
  ]);
};

/**
 * UI section for configuring dynamic pricing rules on hourly listings.
 * Supports multiple rules using FieldArray from react-final-form-arrays.
 *
 * @component
 * @param {Object} props
 * @param {string} props.formId
 * @param {string} props.marketplaceCurrency
 * @param {Object} props.formValues - current React Final Form values
 * @param {number} props.initialRuleCount - initial number of rules for stable keys
 * @returns {JSX.Element}
 */
const PricingRulesConfig = props => {
  const { formId, marketplaceCurrency, formValues, initialRuleCount = 0 } = props;
  const intl = useIntl();
  const [data, setRuleKeys] = useState(initRuleKeys(initialRuleCount));
  const [, ruleKeys] = data;

  return (
    <fieldset className={css.root}>
      <legend className={css.legend}>
        <FormattedMessage id="PricingRulesConfig.sectionTitle" />
      </legend>

      <p className={css.hint}>
        <FormattedMessage id="PricingRulesConfig.hint" />
      </p>

      <FieldArray name="pricingRules">
        {({ fields }) => {
          const rulesValues = fields?.value || [];
          return (
            <>
              <div className={css.rules}>
                {fields.map((name, index) => (
                  <PricingRule
                    key={ruleKeys[index] || `rule_${index}`}
                    name={name}
                    formId={formId}
                    index={index}
                    marketplaceCurrency={marketplaceCurrency}
                    ruleValues={rulesValues[index]}
                    onRemove={() => {
                      fields.remove(index);
                      removeRuleKey(setRuleKeys, index);
                    }}
                    intl={intl}
                  />
                ))}
              </div>

              {fields.length < MAX_RULES ? (
                <InlineTextButton
                  className={css.addRuleButton}
                  type="button"
                  onClick={() => {
                    fields.push({
                      id: generateRuleId(),
                      type: 'time-of-day',
                      label: '',
                      surchargePerHour: null,
                      fromHour: '17',
                      toHour: '24',
                    });
                    addNewRuleKey(setRuleKeys);
                  }}
                >
                  <FormattedMessage id="PricingRulesConfig.addRule" />
                </InlineTextButton>
              ) : null}
            </>
          );
        }}
      </FieldArray>
    </fieldset>
  );
};

export default PricingRulesConfig;
