import { AppState, AppStateStatus } from 'react-native';

import {
  KewaConfig,
  DeviceInfo,
  BaseEventData,
  UserLoginEvent,
  UserRegistrationEvent,
  ScreenViewEvent,
  ErrorEvent,
  SessionEvent,
  AppLaunchEvent,
  ContactData,
} from '../types';
import { StorageManager } from '../utils/StorageManager';
import { NetworkManager } from '../utils/NetworkManager';
import { EventManager } from '../core/EventManager';
import { DeviceInfoCollector } from '../utils/DeviceInfo';
import { SessionManager, SessionData } from '../utils/SessionManager';
import { KEWA_CONSTANTS } from '../utils/constants';

export class KewaAnalytics {
  private config: KewaConfig | null = null;
  private networkManager: NetworkManager | null = null;
  private eventManager: EventManager | null = null;
  private isInitialized: boolean = false;
  private deviceInfo: DeviceInfo | null = null;
  private currentSession: SessionData | null = null;
  private appStateSubscription: any = null;

  async init(config: KewaConfig): Promise<void> {
    try {
      this.config = {
        batchSize: KEWA_CONSTANTS.DEFAULTS.BATCH_SIZE,
        maxQueueSize: KEWA_CONSTANTS.DEFAULTS.MAX_QUEUE_SIZE,
        sessionTimeoutMs: KEWA_CONSTANTS.DEFAULTS.SESSION_TIMEOUT_MS,
        enableAutoTracking: true,
        enableDebugLogging: false,
        enableCrashReporting: true,
        ...config,
      };

      // Initialize managers
      this.networkManager = new NetworkManager(this.config.appUrl, this.config.apiKey);
      this.eventManager = new EventManager(this.networkManager, this.config);

      // Collect device information
      this.deviceInfo = await DeviceInfoCollector.collect();

      // Setup session management
      this.currentSession = SessionManager.startSession();

      // Setup auto tracking
      if (this.config.enableAutoTracking && !this.isInitialized) {
        this.setupAppStateMonitoring();
      }

      // Process queued events
      await this.eventManager.processQueuedEvents();

      // Track app launch
      if (this.config.enableAutoTracking && !this.isInitialized) {
        await this.trackAppLaunch();
      }

      if (this.config.enableDebugLogging) {
        console.log('Kewa Analytics SDK initialized successfully');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Kewa Analytics SDK:', error);
      throw error;
    }
  }

  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        this.handleAppForeground();
      } else if (nextAppState === 'background') {
        this.handleAppBackground();
      }
    });
  }

  private async handleAppForeground(): Promise<void> {
    // Check if session expired
    if (SessionManager.isSessionExpired()) {
      this.currentSession = SessionManager.startSession();
      await this.trackSessionStart();
    } else {
      SessionManager.updateActivity();
    }

    // Process queued events when app becomes active
    if (this.eventManager) {
      await this.eventManager.processQueuedEvents();
    }
  }

  private async handleAppBackground(): Promise<void> {
    await this.trackSessionEnd();
  }

  private async trackAppLaunch(): Promise<void> {
    const launchData: AppLaunchEvent = {
      ...this.deviceInfo,
      sessionId: this.currentSession?.sessionId,
      isFirstLaunch: !(await StorageManager.getDeviceId()),
      timestamp: new Date().toISOString(),
    };

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.APP_LAUNCH, launchData);
  }

  private async trackSessionStart(): Promise<void> {
    if (!this.currentSession) return;

    const sessionData: SessionEvent = {
      ...this.deviceInfo,
      sessionId: this.currentSession.sessionId,
      sessionStartTime: this.currentSession.startTime,
      timestamp: new Date().toISOString(),
    };

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.SESSION_START, sessionData);
  }

  private async trackSessionEnd(): Promise<void> {
    const endedSession = SessionManager.endSession();
    if (!endedSession) return;

    const sessionData: SessionEvent = {
      ...this.deviceInfo,
      sessionId: endedSession.sessionId,
      sessionDuration: SessionManager.getSessionDuration(),
      timestamp: new Date().toISOString(),
    };

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.SESSION_END, sessionData);
  }

  async trackEvent(eventName: string, eventData: BaseEventData = {}, contactData?: ContactData ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Kewa Analytics SDK not initialized. Call init() first.');
      return;
    }

    if (!this.eventManager || !this.deviceInfo) {
      throw new Error('SDK not properly initialized');
    }

    // Add session info if available
    if (this.currentSession) {
      eventData.sessionId = this.currentSession.sessionId;
    }

    const ktcId = await StorageManager.getKtcId();
    const deviceId = await StorageManager.getDeviceId();
    const userProperties = await StorageManager.getUserProperties();

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

    // Update activity
    SessionManager.updateActivity();
  }

  async identifyUser(userId: string, properties: ContactData = {}): Promise<void> {
    await StorageManager.setKtcId(userId);

    if (Object.keys(properties).length > 0) {
      await this.setUserProperties(properties);
    }

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.USER_IDENTIFY, {
      userId,
      ...properties
    });
  }

  async setUserProperties(properties: ContactData): Promise<void> {
    const curentUserProperties = await StorageManager.getUserProperties();
    const userProperties = { ...curentUserProperties, ...properties };
    await StorageManager.setUserProperties(userProperties);

    await this.trackEvent(KEWA_CONSTANTS.EVENTS.USER_PROPERTIES, {
      ...properties,
    });
  }

  // Predefined event methods
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
    await this.trackEvent(KEWA_CONSTANTS.EVENTS.USER_LOGOUT, {});
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
    await StorageManager.removeKtcId();
    await StorageManager.removeDeviceId();
    await StorageManager.removeUserProperties();


    await this.trackEvent('user_reset', {});
  }

  // Getters
  async getKtcId(): Promise<string | null> {
    return await StorageManager.getKtcId();
  }

  async getDeviceId(): Promise<string | null> {
    return await StorageManager.getDeviceId();
  }

  getSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  getUserProperties(): Promise<ContactData> {
    return StorageManager.getUserProperties();
  }

  isSDKInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.networkManager) {
      this.networkManager.cleanup();
    }
    SessionManager.endSession();
  }
}