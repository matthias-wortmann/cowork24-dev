import { bool, shape, string } from 'prop-types';
import {
  BOOKING_PROCESS_NAME,
  INQUIRY_PROCESS_NAME,
  PURCHASE_PROCESS_NAME,
  NEGOTIATION_PROCESS_NAME,
  SOFT_BOOKING_PROCESS_NAME,
  resolveLatestProcessName,
  getProcess,
} from '../../transactions/transaction';

import { getStateDataForBookingProcess } from './InboxPage.stateDataBooking.js';
import { getStateDataForInquiryProcess } from './InboxPage.stateDataInquiry.js';
import { getStateDataForPurchaseProcess } from './InboxPage.stateDataPurchase.js';
import { getStateDataForNegotiationProcess } from './InboxPage.stateDataNegotiation.js';

export const stateDataShape = shape({
  processName: string.isRequired,
  processState: string.isRequired,
  actionNeeded: bool,
  isFinal: bool,
  isSaleNotification: bool,
});

// Translated name of the state of the given transaction
export const getStateData = params => {
  const { transaction } = params;
  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  const process = getProcess(processName);

  const processInfo = () => {
    const { getState, states } = process;
    const processState = getState(transaction);
    return {
      processName,
      processState,
      states,
    };
  };

  if (processName === PURCHASE_PROCESS_NAME) {
    return getStateDataForPurchaseProcess(params, processInfo());
  } else if (processName === BOOKING_PROCESS_NAME) {
    return getStateDataForBookingProcess(params, processInfo());
  } else if (processName === INQUIRY_PROCESS_NAME) {
    return getStateDataForInquiryProcess(params, processInfo());
  } else if (processName === NEGOTIATION_PROCESS_NAME) {
    return getStateDataForNegotiationProcess(params, processInfo());
  } else if (processName === SOFT_BOOKING_PROCESS_NAME) {
    return getStateDataForSoftBookingProcess(params, processInfo());
  } else {
    return {};
  }
};

// State data for the cowork24-soft-booking process
const getStateDataForSoftBookingProcess = (txInfo, processInfo) => {
  const { transactionRole } = txInfo;
  const { processName, processState } = processInfo;
  const isProvider = transactionRole === 'provider';

  switch (processState) {
    case 'soft-requested':
      return {
        processName,
        processState,
        actionNeeded: isProvider,
        isSaleNotification: isProvider,
      };
    case 'accepted':
      return { processName, processState, actionNeeded: true };
    case 'declined':
    case 'expired':
    case 'cancelled':
      return { processName, processState, isFinal: true };
    case 'delivered':
      return { processName, processState, actionNeeded: true };
    case 'reviewed-by-customer':
      return { processName, processState, actionNeeded: isProvider };
    case 'reviewed-by-provider':
      return { processName, processState, actionNeeded: !isProvider };
    case 'reviewed':
      return { processName, processState, isFinal: true };
    default:
      return { processName, processState };
  }
};
