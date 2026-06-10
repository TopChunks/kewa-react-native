import { AppState, AppStateStatus } from 'react-native';

import {
  KewaConfig,
  DeviceInfo,
  BaseEventData,
  UserLoginEvent,
  UserRegistrationEvent,
  ScreenViewEvent,
  ErrorEvent,
  AppLaunchEvent,
  ContactData,
} from '../types';
import { StorageManager } from '../utils/StorageManager';
import { NetworkManager } from '../utils/NetworkManager';
import { EventManager } from '../core/EventManager';
import { DeviceInfoCollector } from '../utils/DeviceInfo';
import { KEWA_CONSTANTS } from '../utils/constants';

interface IdentityCache {
  ktcId: string | null;
  deviceId: string | null;
  userProperties: ContactData;
}

export class KewaAnalytics {
  private config: KewaConfig | null = null;
  private networkManager: NetworkManager | null = null;
  private eventManager: EventManager | null = null;
  private isInitialized: boolean = false;
  private deviceInfo: DeviceInfo | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  private hasLaunched: boolean = false;
  private currentAppState: AppStateStatus = 'active';
  private identityCache: IdentityCache = {
    ktcId: null,
    deviceId: null,
    userProperties: {},
  };

  async init(config: KewaConfig): Promise<void> {
    try {
      this.config = this.normalizeConfig(config);

      if (this.config.disableTracking) {
        this.isInitialized = true;
        if (this.config.enableDebugLogging) {
          console.log('Kewa Analytics SDK initialized with tracking disabled');
        }
        return;
      }

      if (!this.config.projectId) {
        throw new Error('Kewa: projectId is required when tracking is enabled');
      }

      this.networkManager = new NetworkManager(
        this.config.appUrl,
        this.config.apiKey,
        this.config.projectId,
      );
      this.eventManager = new EventManager(this.networkManager, this.config);
      this.deviceInfo = await DeviceInfoCollector.collect();
      await this.refreshIdentityCache();

      if (!this.isAppStateTrackingDisabled() && !this.isInitialized) {
        this.setupAppStateMonitoring();
      }

      await this.eventManager.processQueuedEvents();

      this.isInitialized = true;
      this.hasLaunched = true;

      if (!this.isEventTrackingDisabled()) {
        await this.trackAppLaunch();
      }

      if (this.config.enableDebugLogging) {
        console.log('Kewa Analytics SDK initialized successfully');
      }
    } catch (error) {
      console.warn('Failed to initialize Kewa Analytics SDK:', error);
    }
  }

  private normalizeConfig(config: KewaConfig): KewaConfig {
    const appUrl = config.appUrl ?? config.apiUrl;
    if (!appUrl) {
      throw new Error('Kewa: appUrl is required');
    }

    return {
      batchSize: KEWA_CONSTANTS.DEFAULTS.BATCH_SIZE,
      maxQueueSize: KEWA_CONSTANTS.DEFAULTS.MAX_QUEUE_SIZE,
      disableTracking: false,
      disableEventTracking: false,
      disableAppStateTracking: false,
      disableScreenViewTracking: false,
      enableDebugLogging: false,
      ...config,
      appUrl,
    };
  }

  private isTrackingDisabled(): boolean {
    return this.config?.disableTracking ?? false;
  }

  private isEventTrackingDisabled(): boolean {
    return this.isTrackingDisabled() || (this.config?.disableEventTracking ?? false);
  }

  private isAppStateTrackingDisabled(): boolean {
    return this.isTrackingDisabled() || (this.config?.disableAppStateTracking ?? false);
  }

  isAutoScreenViewTrackingEnabled(): boolean {
    if (this.isTrackingDisabled() || this.isEventTrackingDisabled()) {
      return false;
    }
    return !(this.config?.disableScreenViewTracking ?? false);
  }

  private async refreshIdentityCache(): Promise<void> {
    const [ktcId, deviceId, userProperties] = await Promise.all([
      StorageManager.getKtcId(),
      StorageManager.getDeviceId(),
      StorageManager.getUserProperties(),
    ]);

    this.identityCache = { ktcId, deviceId, userProperties };
  }

  private async trackAppLaunch(): Promise<void> {
    const isFirstLaunch = !(await StorageManager.getDeviceId());

    const launchData: AppLaunchEvent = {
      ...this.deviceInfo,
      isFirstLaunch,
      timestamp: new Date().toISOString(),
    };

    await this.emitEvent(KEWA_CONSTANTS.EVENTS.APP_LAUNCH, launchData);
  }

  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (!this.hasLaunched || this.currentAppState === nextAppState) {
        return;
      }

      const previousState = this.currentAppState;
      this.currentAppState = nextAppState;

      if (nextAppState === 'active' && (previousState === 'background' || previousState === 'inactive')) {
        void this.handleAppForeground();
      } else if (nextAppState === 'background' && (previousState === 'active' || previousState === 'inactive')) {
        // Fire immediately without awaiting — the OS may suspend the app before async work finishes
        void this.handleAppBackground();
      }
    });
  }

  private async handleAppForeground(): Promise<void> {
    this.backgroundEventPending = false;
    await this.emitAppStateEvent(KEWA_CONSTANTS.EVENTS.APP_FOREGROUND);

    if (this.eventManager) {
      await this.eventManager.processQueuedEvents();
    }
  }

  private backgroundEventPending = false;

  private async handleAppBackground(): Promise<void> {
    if (this.backgroundEventPending) {
      return;
    }

    this.backgroundEventPending = true;

    try {
      await this.emitAppStateEvent(KEWA_CONSTANTS.EVENTS.APP_BACKGROUND);
    } finally {
      // Reset when app returns to foreground
      if (AppState.currentState === 'active') {
        this.backgroundEventPending = false;
      }
    }
  }

  private async emitAppStateEvent(eventName: string): Promise<void> {
    if (this.isAppStateTrackingDisabled()) {
      return;
    }

    if (!this.isInitialized || !this.eventManager || !this.deviceInfo) {
      return;
    }

    const { ktcId, deviceId, userProperties } = this.identityCache;

    await this.eventManager.processAppStateEvent(
      eventName,
      {
        ...this.deviceInfo,
        timestamp: new Date().toISOString(),
      },
      {
        id: ktcId || undefined,
        ...userProperties,
      },
      deviceId,
      this.deviceInfo,
    );

    await this.refreshIdentityCache();
  }

  private async emitEvent(
    eventName: string,
    eventData: BaseEventData = {},
    contactData?: ContactData,
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Kewa Analytics SDK not initialized. Call init() first.');
      return;
    }

    if (!this.eventManager || !this.deviceInfo) {
      console.warn('Kewa Analytics SDK not properly initialized');
      return;
    }

    const { ktcId, deviceId, userProperties } = this.identityCache;

    await this.eventManager.processEvent(
      eventName,
      eventData,
      {
        id: ktcId || undefined,
        ...userProperties,
        ...contactData,
      },
      deviceId,
      this.deviceInfo,
    );

    await this.refreshIdentityCache();
  }

  async trackEvent(eventName: string, eventData: BaseEventData = {}, contactData?: ContactData): Promise<void> {
    if (this.isEventTrackingDisabled()) {
      return;
    }

    await this.emitEvent(eventName, eventData, contactData);
  }

  async setUserProperties(properties: ContactData): Promise<void> {
    if (this.isTrackingDisabled()) {
      return;
    }

    if (!this.networkManager) {
      console.warn('Kewa Analytics SDK not properly initialized');
      return;
    }

    const currentUserProperties = await StorageManager.getUserProperties();
    const userProperties = { ...currentUserProperties, ...properties };
    await StorageManager.setUserProperties(userProperties);
    const deviceId = await StorageManager.getDeviceId();

    const contact: ContactData = {
      ...properties,
      kewa_device_id: deviceId,
    };

    if (!this.networkManager.getNetworkStatus()) {
      if (this.config?.enableDebugLogging) {
        console.warn('Kewa: offline, user properties saved locally only');
      }
      return;
    }

    try {
      if (this.config?.enableDebugLogging) {
        console.log('Updating contact:', JSON.stringify(contact));
      }

      const response = await this.networkManager.updateContact(contact);
      await this.applyIdentityFromResponse(response);

      if (this.config?.enableDebugLogging) {
        console.log('Contact update response:', JSON.stringify(response));
      }
    } catch (error) {
      console.warn('Failed to update contact on Kewa:', error);
    }
  }

  private async applyIdentityFromResponse(response: { id?: string; device_id?: string }): Promise<void> {
    const ktcId = await StorageManager.getKtcId();
    const deviceId = await StorageManager.getDeviceId();

    if (response.id && response.id !== ktcId) {
      await StorageManager.setKtcId(response.id);
    }

    if (response.device_id && response.device_id !== deviceId) {
      await StorageManager.setDeviceId(response.device_id);
    }

    await this.refreshIdentityCache();
  }

  async trackLogin(userData: Partial<UserLoginEvent>): Promise<void> {
    const loginData: UserLoginEvent = {
      loginMethod: 'custom',
      ...userData,
      userId: userData.userId || '',
      timestamp: new Date().toISOString(),
    };

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.USER_LOGIN, loginData);
  }

  async trackLogout(): Promise<void> {
    if (this.isTrackingDisabled()) {
      return;
    }

    if (!this.isEventTrackingDisabled()) {
      await this.trackEvent(KEWA_CONSTANTS.EVENTS.USER_LOGOUT, {});
    }

    await this.clearLocalIdentity();
  }

  async trackRegistration(userData: Partial<UserRegistrationEvent>): Promise<void> {
    const registrationData: UserRegistrationEvent = {
      registrationMethod: 'email',
      ...userData,
      userId: userData.userId || '',
      timestamp: new Date().toISOString(),
    };

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.USER_REGISTRATION, registrationData);
  }

  async trackScreenView(screenName: string, additionalData: Partial<ScreenViewEvent> = {}): Promise<void> {
    const screenData: ScreenViewEvent = {
      screenName,
      ...additionalData,
      timestamp: new Date().toISOString(),
    };

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.SCREEN_VIEW, screenData);
  }

  async trackError(error: Error, context: Record<string, any> = {}, isFatal = false): Promise<void> {
    const errorData: ErrorEvent = {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      isFatal,
      context,
      timestamp: new Date().toISOString(),
    };

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.ERROR, errorData);
  }

  async reset(): Promise<void> {
    await this.clearLocalIdentity();
  }

  private async clearLocalIdentity(): Promise<void> {
    await StorageManager.removeKtcId();
    await StorageManager.removeDeviceId();
    await StorageManager.removeUserProperties();
    this.identityCache = { ktcId: null, deviceId: null, userProperties: {} };
    this.backgroundEventPending = false;
  }

  async getKtcId(): Promise<string | null> {
    return await StorageManager.getKtcId();
  }

  async getDeviceId(): Promise<string | null> {
    return await StorageManager.getDeviceId();
  }

  getUserProperties(): Promise<ContactData> {
    return StorageManager.getUserProperties();
  }

  isSDKInitialized(): boolean {
    return this.isInitialized;
  }

  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.networkManager) {
      this.networkManager.cleanup();
    }
  }
}
