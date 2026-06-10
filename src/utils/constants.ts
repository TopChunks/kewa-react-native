export const KEWA_CONSTANTS = {
  STORAGE_KEYS: {
    KTC_ID: 'kewa_ktc_id',
    DEVICE_ID: 'kewa_device_id',
    QUEUED_EVENTS: 'kewa_queued_events',
    USER_PROPERTIES: 'kewa_user_properties',
  },
  EVENTS: {
    APP_LAUNCH: 'app_launch',
    APP_FOREGROUND: 'app_foreground',
    APP_BACKGROUND: 'app_background',
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_REGISTRATION: 'user_registration',
    SCREEN_VIEW: 'screen_view',
    ERROR: 'error',
    BUTTON_PRESS: 'button_press',
    FORM_SUBMIT: 'form_submit',
  },
  DEFAULTS: {
    BATCH_SIZE: 10,
    MAX_QUEUE_SIZE: 100,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  },
} as const;
