import { useCallback } from 'react';
import { useKewa } from './useKewa';

export const useAutoTracker = () => {
  const { trackEvent } = useKewa();

  const trackButtonPress = useCallback((buttonName: string, additionalData: Record<string, any> = {}) => {
    return () => trackEvent('button_press', { buttonName, ...additionalData });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string, formData: Record<string, any> = {}) => {
    return () => trackEvent('form_submit', { formName, ...formData });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context: Record<string, any> = {}) => {
    return trackEvent('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      context,
    });
  }, [trackEvent]);

  return {
    trackButtonPress,
    trackFormSubmit,
    trackError,
  };
};