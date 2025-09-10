export interface KewaConfig {
  appUrl: string;
  apiKey: string;
  enableAutoTracking?: boolean;
  batchSize?: number;
  maxQueueSize?: number;
  sessionTimeoutMs?: number;
  enableDebugLogging?: boolean;
  enableCrashReporting?: boolean;
}

export interface DeviceInfo {
  appName: string;
  platform: string;
  userAgent: string;
  platformVersion: string | number;
  appVersion: string;
  deviceName?: string;
  buildNumber?: string;
  deviceModel: string;
  deviceId?: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  carrier?: string;
  isTablet?: boolean;
  brand?: string;
  manufacturer?: string;
}
