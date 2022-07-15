import { DeviceErrorType } from '@cypherock/communication';
import { FlowErrorType } from '@cypherock/protocols';
import { WalletErrorType } from '@cypherock/wallet';

import { I18nStrings } from '../constants/i18n';
import Analytics from '../utils/analytics';
import logger from '../utils/logger';

import { CyError } from './error';
import { CodeToErrorMap, CysyncError } from './types';

const handleErrors = (
  currError: CyError,
  err: CyError,
  flow?: string,
  metadata?: any
) => {
  //TODO:  handle cascade effect properly
  if (currError.isSet) {
    logger.info(currError);
    // return;
  }

  // log the original error
  if (err.childErrors.length > 0) {
    logger.error('Origin Errors');
    err.childErrors.forEach(e => logger.error(e));
  }
  // log the display error
  logger.error(`${flow ? flow : ''}: ${err.showError()}`);

  // logging the metadata
  if (metadata) {
    logger.info('Metadata for the error');
    logger.info(metadata);
  }

  // report to analytics
  Analytics.Instance.event(flow, Analytics.Actions.ERROR);

  return err;
};

const handleDeviceErrors = (cyError: CyError, err: any, flow: string) => {
  cyError.pushSubErrors(err.code);
  if (
    [
      DeviceErrorType.CONNECTION_CLOSED,
      DeviceErrorType.CONNECTION_NOT_OPEN
    ].includes(err.errorType)
  ) {
    cyError.setError(DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW);
  } else if (err.errorType === DeviceErrorType.NOT_CONNECTED) {
    cyError.setError(DeviceErrorType.NOT_CONNECTED);
  } else if (
    [DeviceErrorType.WRITE_TIMEOUT, DeviceErrorType.READ_TIMEOUT].includes(
      err.errorType
    )
  ) {
    cyError.setError(DeviceErrorType.TIMEOUT_ERROR);
  } else {
    cyError.setError(DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR, flow);
  }
};

const handleAxiosErrors = (cyError: CyError, error: any) => {
  if (error && error.response) {
    cyError.setError(CysyncError.NETWORK_FAILURE);
  } else {
    cyError.setError(CysyncError.NETWORK_UNREACHABLE);
  }
};

const handleWalletErrors = (
  cyError: CyError,
  error: any,
  metadata: {
    coinType: string;
  }
) => {
  if (error.errorType === WalletErrorType.SUFFICIENT_CONFIRMED_BALANCE)
    cyError.setError(WalletErrorType.SUFFICIENT_CONFIRMED_BALANCE);
  else if (error.errorType === WalletErrorType.INSUFFICIENT_FUNDS)
    cyError.setError(WalletErrorType.INSUFFICIENT_FUNDS, metadata.coinType);
};

export const getMap = (langStrings: I18nStrings): CodeToErrorMap => {
  return {
    0: { message: '' }, // property 0 is required for compilation
    [DeviceErrorType.CONNECTION_CLOSED]: {
      parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
      message: 'Device connection closed'
    },
    [DeviceErrorType.CONNECTION_NOT_OPEN]: {
      parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
      message: 'Device connection not open'
    },
    [DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW]: {
      message: langStrings.ERRORS.DEVICE_DISCONNECTED_IN_FLOW
    },
    [DeviceErrorType.NOT_CONNECTED]: {
      message: langStrings.ERRORS.DEVICE_NOT_CONNECTED
    },

    [CysyncError.NETWORK_FAILURE]: {
      message: langStrings.ERRORS.NETWORK_FAILURE
    },
    [CysyncError.NETWORK_UNREACHABLE]: {
      message: langStrings.ERRORS.NETWORK_UNREACHABLE
    },

    [CysyncError.DEVICE_AUTH_FAILED]: {
      message: langStrings.ERRORS.DEVICE_AUTH_FAILED
    },
    [CysyncError.DEVICE_AUTH_REJECTED]: {
      message: langStrings.ERRORS.DEVICE_AUTH_REJECTED
    },
    [CysyncError.DEVICE_AUTH_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.DEVICE_AUTH_UNKNOWN_ERROR
    },

    [CysyncError.DEVICE_UPGRADE_REJECTED]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_REJECTED
    },
    [CysyncError.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED
    },
    [CysyncError.DEVICE_UPGRADE_FAILED]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_FAILED
    },
    [CysyncError.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH
    },
    [CysyncError.DEVICE_UPGRADE_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_UNKNOWN_ERROR
    },

    [CysyncError.DEVICE_NOT_READY]: {
      message: langStrings.ERRORS.DEVICE_NOT_READY
    },
    [CysyncError.DEVICE_NOT_READY_IN_INITIAL]: {
      message: langStrings.ERRORS.DEVICE_NOT_READY_IN_INITIAL
    },
    [CysyncError.DEVICE_INFO_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.DEVICE_INFO_UNKNOWN_ERROR
    },
    [CysyncError.ADD_WALLET_REJECTED]: {
      message: langStrings.ERRORS.ADD_WALLET_REJECTED
    },
    [CysyncError.NO_WALLET_ON_DEVICE]: {
      message: langStrings.ERRORS.NO_WALLET_ON_DEVICE
    },
    [CysyncError.ALL_WALLET_PARTIAL_STATE]: {
      message: langStrings.ERRORS.ALL_WALLET_PARTIAL_STATE
    },
    [CysyncError.ADD_WALLET_LIMIT_EXCEEDED]: {
      message: langStrings.ERRORS.ADD_WALLET_LIMIT_EXCEEDED
    },
    [CysyncError.ADD_WALLET_DUPLICATE]: {
      message: langStrings.ERRORS.ADD_WALLET_DUPLICATE
    },
    [CysyncError.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_NAME]: {
      message: langStrings.ERRORS.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_NAME
    },
    [CysyncError.ADD_WALLET_WITH_SAME_NAME]: {
      message: langStrings.ERRORS.ADD_WALLET_WITH_SAME_NAME
    },
    [CysyncError.ADD_WALLET_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.ADD_WALLET_UNKNOWN_ERROR
    },
    [CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN]: {
      message: langStrings.ERRORS.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
    },
    [CysyncError.WALLET_PARTIAL_STATE]: {
      message: langStrings.ERRORS.WALLET_PARTIAL_STATE
    },
    [CysyncError.WALLET_NOT_FOUND_IN_DEVICE]: {
      message: langStrings.ERRORS.WALLET_NOT_FOUND_IN_DEVICE
    },
    [CysyncError.WALLET_NOT_FOUND_IN_CARD]: {
      message: langStrings.ERRORS.WALLET_NOT_FOUND_IN_CARD
    },
    [CysyncError.WALLET_IS_LOCKED]: {
      message: langStrings.ERRORS.WALLET_IS_LOCKED
    },
    [CysyncError.WALLET_UNKNOWN_STATE]: {
      message: langStrings.ERRORS.WALLET_UNKNOWN_STATE
    },

    [CysyncError.ADD_COIN_REJECTED]: {
      message: langStrings.ERRORS.ADD_COIN_REJECTED
    },
    [CysyncError.ADD_COIN_FAILED]: {
      message: (coin: string) => langStrings.ERRORS.ADD_COIN_FAILED(coin)
    },
    [CysyncError.ADD_COIN_FAILED_DUE_TO_SERVER_ERROR]: {
      message: (coin: string) =>
        langStrings.ERRORS.ADD_COIN_FAILED_DUE_TO_SERVER_ERROR(coin)
    },
    [CysyncError.ADD_COIN_FAILED_INTERNAL_ERROR]: {
      message: (coin: string) =>
        langStrings.ERRORS.ADD_COIN_FAILED_INTERNAL_ERROR(coin)
    },
    [CysyncError.ADD_COIN_UNKNOWN_ASSET]: {
      message: 'Unknown Coin requested to the device',
      parent: CysyncError.ADD_COIN_UNKNOWN_ASSET
    },
    [CysyncError.ADD_COIN_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.ADD_COIN_UNKNOWN_ERROR
    },
    [CysyncError.UNKNOWN_CARD_ERROR]: {
      message: langStrings.ERRORS.UNKNOWN_CARD_ERROR
    },
    [CysyncError.CARD_AUTH_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.CARD_AUTH_UNKNOWN_ERROR
    },
    [CysyncError.SEND_TXN_SIZE_TOO_LARGE]: {
      message: langStrings.ERRORS.SEND_TXN_SIZE_TOO_LARGE
    },
    [CysyncError.SEND_TXN_REJECTED]: {
      message: (coin: string) => langStrings.ERRORS.SEND_TXN_REJECTED(coin)
    },
    [CysyncError.SEND_TXN_REJECTED_AT_ADDRESS]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_REJECTED_AT_AMOUNT]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_REJECTED_AT_FEE]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_REJECTED_AT_UNKNOWN]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND]: {
      message: 'Signed Transaction was not found',
      parent: CysyncError.SEND_TXN_UNKNOWN_ERROR
    },
    [CysyncError.SEND_TXN_CANCEL_FAILED]: {
      message: ''
    },
    [CysyncError.SEND_TXN_BROADCAST_FAILED]: {
      message: langStrings.ERRORS.SEND_TXN_BROADCAST_FAILED
    },
    [CysyncError.SEND_TXN_VERIFICATION_FAILED]: {
      message: ''
    },
    [CysyncError.SEND_TXN_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.SEND_TXN_UNKNOWN_ERROR
    },
    [CysyncError.RECEIVE_TXN_XPUB_MISSING]: {
      message: langStrings.ERRORS.RECEIVE_TXN_XPUB_MISSING
    },
    [CysyncError.RECEIVE_TXN_DEVICE_MISCONFIGURED]: {
      message: langStrings.ERRORS.RECEIVE_TXN_DEVICE_MISCONFIGURED
    },
    [CysyncError.RECEIVE_TXN_GENERATE_UNVERIFIED_FAILED]: {
      message: langStrings.ERRORS.RECEIVE_TXN_GENERATE_UNVERIFIED_FAILED
    },
    [CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE]: {
      message: langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE
    },
    [CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER]: {
      message: langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER
    },
    [CysyncError.RECEIVE_TXN_CANCEL_FAILED]: {
      message: ''
    },
    [CysyncError.RECEIVE_TXN_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.RECEIVE_TXN_UNKNOWN_ERROR
    },
    // Status Codes
    [CysyncError.DEVICE_HAS_INITIAL_FIRMWARE]: undefined,
    [CysyncError.DEVICE_IN_BOOTLOADER]: {
      message: langStrings.ERRORS.DEVICE_MISCONFIGURED
    },
    [CysyncError.LAST_DEVICE_AUTH_FAILED]: undefined,
    [CysyncError.UNAUTHENTICATED_DEVICE]: undefined,
    [CysyncError.NEW_DEVICE_CONNECTED]: undefined,
    [CysyncError.DEVICE_IN_TEST_APP]: {
      message: langStrings.ERRORS.DEVICE_MISCONFIGURED
    },
    [CysyncError.DEVICE_IN_PARTIAL_STATE]: undefined,
    [CysyncError.UNKNOWN_CONNECTION_ERROR]: undefined,
    [CysyncError.INCOMPATIBLE_DEVICE]: undefined,
    [CysyncError.INCOMPATIBLE_DESKTOP]: undefined,
    [CysyncError.INCOMPATIBLE_DEVICE_AND_DESKTOP]: undefined,

    [CysyncError.LOG_FETCHER_DISABLED_ON_DEVICE]: {
      message: langStrings.ERRORS.LOG_FETCHER_DISABLED_ON_DEVICE
    },
    [CysyncError.LOG_FETCHER_REJECTED]: {
      message: langStrings.ERRORS.LOG_FETCHER_REJECTED
    },
    [CysyncError.LOG_FETCHING_CANCEL_FAILED]: {
      message: langStrings.ERRORS.LOG_FETCHING_CANCEL_FAILED
    },
    [CysyncError.LOG_FETCHER_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.LOG_FETCHER_UNKNOWN_ERROR
    },

    [CysyncError.CARD_AUTH_REJECTED]: {
      message: langStrings.ERRORS.CARD_AUTH_REJECTED
    },
    [CysyncError.CARD_AUTH_FAILED]: {
      message: langStrings.ERRORS.CARD_AUTH_FAILED
    },
    [CysyncError.CARD_PAIRING_FAILED]: {
      message: langStrings.ERRORS.CARD_AUTH_DEVICE_PAIRING_FAILED
    },

    [CysyncError.TXN_INSERT_FAILED]: {
      message: ''
    },
    [CysyncError.TXN_INVALID_RESPONSE]: {
      message: ''
    },
    [CysyncError.LATEST_PRICE_REFRESH_FAILED]: {
      message: ''
    },
    [CysyncError.HISTORY_REFRESH_FAILED]: {
      message: ''
    },
    [CysyncError.NOTIFICATIONS_REFRESH_FAILED]: {
      message: ''
    },

    [CysyncError.SYNC_MAX_TRIES_EXCEEDED]: {
      message: ''
    },
    [CysyncError.TUTORIALS_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.TUTORIALS_UNKNOWN_ERROR
    },

    [DeviceErrorType.WRITE_ERROR]: {
      message: 'Unable to write packet to the device'
    },
    [DeviceErrorType.TIMEOUT_ERROR]: {
      message: 'Timeout Error due to write/read'
    },
    [DeviceErrorType.WRITE_TIMEOUT]: {
      message: 'Did not receive ACK of sent packet on time'
    },
    [DeviceErrorType.READ_TIMEOUT]: {
      message: 'Did not receive the expected data from device on time'
    },
    [DeviceErrorType.FIRMWARE_SIZE_LIMIT_EXCEEDED]: {
      message: 'Firmware Size Limit Exceed'
    },
    [DeviceErrorType.WRONG_FIRMWARE_VERSION]: {
      message: 'Wrong Firmware version'
    },
    [DeviceErrorType.WRONG_HARDWARE_VERSION]: {
      message: 'Wrong Hardware version'
    },
    [DeviceErrorType.WRONG_MAGIC_NUMBER]: {
      message: 'Wrong Magic Number'
    },
    [DeviceErrorType.SIGNATURE_NOT_VERIFIED]: {
      message: 'Signature not verified'
    },
    [DeviceErrorType.LOWER_FIRMWARE_VERSION]: {
      message: 'Lower Firmware Version'
    },
    [DeviceErrorType.NO_WORKING_PACKET_VERSION]: {
      message: 'No working packet version'
    },
    [DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR]: {
      message: 'Unknown Error at communication module'
    },
    [DeviceErrorType.WRITE_REJECTED]: {
      message: 'The write packet operation was rejected by the device'
    },
    [DeviceErrorType.EXECUTING_OTHER_COMMAND]: {
      message: 'The device is executing some other command'
    },
    [WalletErrorType.SUFFICIENT_CONFIRMED_BALANCE]: {
      message: langStrings.ERRORS.SEND_TXN_SUFFICIENT_CONFIRMED_BALANCE
    },
    [WalletErrorType.INSUFFICIENT_FUNDS]: {
      message: (coin: string) =>
        langStrings.ERRORS.SEND_TXN_INSUFFICIENT_BALANCE(coin)
    },
    [FlowErrorType.UNKNOWN_FLOW_ERROR]: {
      message: 'Unknown Flow error at Protocols'
    }
  };
};

export {
  handleErrors,
  handleDeviceErrors,
  handleAxiosErrors,
  handleWalletErrors
};
