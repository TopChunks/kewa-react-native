export interface KewaConfig {
  appUrl: string;
  apiKey: string;
  projectId?: string;
  disableTracking?: boolean;
  disableEventTracking?: boolean;
  disableAppStateTracking?: boolean;
  disableScreenViewTracking?: boolean;
  batchSize?: number;
  maxQueueSize?: number;
  enableDebugLogging?: boolean;
  /** @deprecated Use appUrl instead */
  apiUrl?: string;
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
