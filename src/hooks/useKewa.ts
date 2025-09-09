import { useCallback, useContext } from 'react';
import { KewaContext } from '../components/KewaProvider';
import { BaseEventData } from '../types';

export const useKewa = () => {
  const kewa = useContext(KewaContext);

  if (!kewa) {
    throw new Error('useKewa must be used within a KewaProvider');
  }

  const trackEvent = useCallback((eventName: string, eventData?: BaseEventData) => {
    return kewa.trackEvent(eventName, eventData);
  }, [kewa]);

  const trackScreenView = useCallback((screenName: string, additionalData?: any) => {
    return kewa.trackScreenView(screenName, additionalData);
  }, [kewa]);

  const trackLogin = useCallback((userData: any) => {
    return kewa.trackLogin(userData);
  }, [kewa]);

  const identifyUser = useCallback((userId: string, properties?: Record<string, any>) => {
    return kewa.identifyUser(userId, properties);
  }, [kewa]);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    return kewa.setUserProperties(properties);
  }, [kewa]);

  return {
    trackEvent,
    trackScreenView,
    trackLogin,
    identifyUser,
    setUserProperties,
    getKtcId: kewa.getKtcId.bind(kewa),
    getSessionId: kewa.getSessionId.bind(kewa),
    isInitialized: kewa.isSDKInitialized.bind(kewa),
  };
};
