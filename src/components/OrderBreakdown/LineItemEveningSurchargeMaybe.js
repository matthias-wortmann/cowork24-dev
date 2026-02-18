import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LINE_ITEM_EVENING_SURCHARGE = 'line-item/evening-surcharge';

/**
 * Renders the evening surcharge line item if present.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems
 * @param {intlShape} props.intl
 * @returns {JSX.Element|null}
 */
const LineItemEveningSurchargeMaybe = props => {
  const { lineItems, intl } = props;

  const surchargeLineItem = lineItems.find(
    item => item.code === LINE_ITEM_EVENING_SURCHARGE && !item.reversal
  );

  if (!surchargeLineItem) {
    return null;
  }

  const rawQuantity = surchargeLineItem.quantity;
  const quantity = typeof rawQuantity?.toNumber === 'function' ? rawQuantity.toNumber() : rawQuantity;
  const formattedUnitPrice = formatMoney(intl, surchargeLineItem.unitPrice);
  const formattedTotal = formatMoney(intl, surchargeLineItem.lineTotal);

  return (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage
          id="OrderBreakdown.eveningSurcharge"
          values={{ unitPrice: formattedUnitPrice, quantity }}
        />
      </span>
      <span className={css.itemValue}>{formattedTotal}</span>
    </div>
  );
};

export default LineItemEveningSurchargeMaybe;
