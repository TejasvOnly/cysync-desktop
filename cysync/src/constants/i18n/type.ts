export interface I18nStrings {
  ERRORS: {
    UNKNOWN_COMMUNICATION_ERROR: (flow: string) => string;

    NETWORK_ERROR: string;
    NETWORK_UNREACHABLE: string;

    DEVICE_NOT_CONNECTED: string;
    DEVICE_DISCONNECTED_IN_FLOW: string;
    DEVICE_TIMEOUT_ERROR: string;
    DEVICE_NOT_READY: string;
    DEVICE_NOT_READY_IN_INITIAL: string;
    DEVICE_NOT_SUPPORTED: string;
    DEVICE_MISCONFIGURED: string;
    DEVICE_INFO_UNKNOWN_ERROR: string;

    WALLET_NOT_FOUND_IN_DEVICE: string;
    WALLET_NOT_FOUND_IN_CARD: string;
    WALLET_PARTIAL_STATE: string;
    ALL_WALLET_PARTIAL_STATE: string;
    NO_WALLET_ON_DEVICE: string;
    WALLET_IS_LOCKED: string;
    WALLET_LOCKED_DUE_TO_INCORRECT_PIN: string;

    ADD_WALLET_REJECTED: string;
    ADD_WALLET_LIMIT_EXCEEDED: string;
    ADD_WALLET_DUPLICATE: string;
    ADD_WALLET_DUPLICATE_WITH_DIFFERENT_NAME: string;
    ADD_WALLET_WITH_SAME_NAME: string;
    ADD_WALLET_UNKNOWN_ERROR: string;

    ADD_COIN_FAILED_DUE_TO_SERVER_ERROR: (coins: string) => string;
    ADD_COIN_FAILED_INTERNAL_ERROR: (coins: string) => string;
    ADD_COIN_FAILED: (coins: string) => string;
    ADD_COIN_REJECTED: string;
    ADD_COIN_UNKNOWN_ERROR: string;

    CARD_AUTH_REJECTED: string;
    CARD_AUTH_FAILED: string;
    CARD_AUTH_DEVICE_PAIRING_FAILED: string;
    UNKNOWN_CARD_ERROR: string;
    CARD_AUTH_UNKNOWN_ERROR: string;

    DEVICE_AUTH_REJECTED: string;
    DEVICE_AUTH_FAILED: string;
    DEVICE_AUTH_UNKNOWN_ERROR: string;

    DEVICE_UPGRADE_REJECTED: string;
    DEVICE_UPGRADE_FAILED: string;
    DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED: string;
    DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH: string;
    DEVICE_UPGRADE_UNKNOWN_ERROR: string;

    LOG_FETCHER_REJECTED: string;
    LOG_FETCHER_DISABLED_ON_DEVICE: string;
    LOG_FETCHING_CANCEL_FAILED: string;
    LOG_FETCHER_UNKNOWN_ERROR: string;

    RECEIVE_TXN_REJECTED: (coin: string) => string;
    RECEIVE_TXN_DEVICE_MISCONFIGURED: string;
    RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE: string;
    RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER: string;
    RECEIVE_TXN_XPUB_MISSING: string;
    RECEIVE_TXN_UNKNOWN_ERROR: string;

    SEND_TXN_REJECTED: (coin: string) => string;
    SEND_TXN_INSUFFICIENT_BALANCE: (coin: string) => string;
    SEND_TXN_SUFFICIENT_CONFIRMED_BALANCE: string;
    SEND_TXN_SIZE_TOO_LARGE: string;
    SENX_TXN_BROADCAST_FAILED: string;
    SEND_TXN_UNKNOWN_ERROR: string;

    INCOMPATIBLE_DEVICE: string;
    INCOMPATIBLE_DESKTOP: string;
    INCOMPATIBLE_DEVICE_AND_DESKTOP: string;

    TUTORIALS_UNKNOWN_ERROR: string;
  };
}
