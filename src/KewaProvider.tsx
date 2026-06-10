import React, { createContext, useContext, useEffect, ReactNode } from 'react';

import { KewaAnalytics } from './core/KewaAnalytics';
import { KewaConfig, ContactData, BaseEventData, UserLoginEvent, UserRegistrationEvent, ScreenViewEvent } from './types';

export interface KewaContextValue {
  trackEvent: (eventName: string, eventData?: BaseEventData, contactData?: ContactData) => Promise<void>;
  setUserProperties: (properties: ContactData) => Promise<void>;
  trackLogin: (userData: Partial<UserLoginEvent>) => Promise<void>;
  trackLogout: () => Promise<void>;
  trackRegistration: (userData: Partial<UserRegistrationEvent>) => Promise<void>;
  trackScreenView: (screenName: string, additionalData?: Partial<ScreenViewEvent>) => Promise<void>;
  trackError: (error: Error, context?: Record<string, any>, isFatal?: boolean) => Promise<void>;
  reset: () => Promise<void>;
  getKtcId: () => Promise<string | null>;
  getDeviceId: () => Promise<string | null>;
  getUserProperties: () => Promise<ContactData>;
  isSDKInitialized: () => boolean;
}

const KewaContext = createContext<KewaContextValue | null>(null);

interface KewaProviderProps {
  config: KewaConfig;
  children: ReactNode;
  kewa?: KewaAnalytics;
}

const defaultKewaInstance = new KewaAnalytics();

function createContextValue(kewa: KewaAnalytics): KewaContextValue {
  return {
    trackEvent: kewa.trackEvent.bind(kewa),
    setUserProperties: kewa.setUserProperties.bind(kewa),
    trackLogin: kewa.trackLogin.bind(kewa),
    trackLogout: kewa.trackLogout.bind(kewa),
    trackRegistration: kewa.trackRegistration.bind(kewa),
    trackScreenView: kewa.trackScreenView.bind(kewa),
    trackError: kewa.trackError.bind(kewa),
    reset: kewa.reset.bind(kewa),
    getKtcId: kewa.getKtcId.bind(kewa),
    getDeviceId: kewa.getDeviceId.bind(kewa),
    getUserProperties: kewa.getUserProperties.bind(kewa),
    isSDKInitialized: kewa.isSDKInitialized.bind(kewa),
  };
}

export function KewaProvider({ config, children, kewa }: KewaProviderProps) {
  const instance = kewa ?? defaultKewaInstance;
  const value = createContextValue(instance);

  useEffect(() => {
    instance.init(config);

    return () => {
      instance.cleanup();
    };
  }, [
    instance,
    config.appUrl,
    config.apiKey,
    config.projectId,
    config.disableTracking,
    config.disableEventTracking,
    config.disableAppStateTracking,
    config.disableScreenViewTracking,
    config.enableDebugLogging,
  ]);

  return (
    <KewaContext.Provider value={value}>
      {children}
    </KewaContext.Provider>
  );
}

export function useKewa(): KewaContextValue {
  const context = useContext(KewaContext);
  if (!context) {
    throw new Error('useKewa must be used within a KewaProvider');
  }
  return context;
}

export function getDefaultKewaInstance(): KewaAnalytics {
  return defaultKewaInstance;
}
