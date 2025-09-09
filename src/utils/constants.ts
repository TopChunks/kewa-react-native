export const KEWA_CONSTANTS = {
  STORAGE_KEYS: {
    KTC_ID: 'kewa_ktc_id',
    DEVICE_ID: 'kewa_device_id',
    QUEUED_EVENTS: 'kewa_queued_events',
    SESSION_DATA: 'kewa_session_data',
    USER_PROPERTIES: 'kewa_user_properties',
  },
  EVENTS: {
    APP_LAUNCH: 'app_launch',
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_REGISTRATION: 'user_registration',
    SCREEN_VIEW: 'screen_view',
    USER_IDENTIFY: 'user_identify',
    USER_PROPERTIES: 'update_user_properties',
    ERROR: 'error',
    BUTTON_PRESS: 'button_press',
    FORM_SUBMIT: 'form_submit',
  },
  DEFAULTS: {
    BATCH_SIZE: 10,
    MAX_QUEUE_SIZE: 100,
    SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  },
} as const;