import { KewaAnalytics } from './core/KewaAnalytics';

export * from './types';
export { useKewa } from './hooks/useKewa';
export { useAutoTracker } from './hooks/useAutoTracker';
export { KewaProvider } from './components/KewaProvider';

export { KEWA_CONSTANTS } from './utils/constants';
export { DeviceInfoCollector } from './utils/DeviceInfo';
export { SessionManager } from './utils/SessionManager';


const Kewa = new KewaAnalytics();
export default Kewa;

// Auto tracker utilities
export class KewaAutoTracker {
  static setupNavigationTracking(navigationRef: any) {
    const routeNameRef = { current: '' };

    return {
      onReady: () => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute) {
          routeNameRef.current = currentRoute.name;
        }
      },
      onStateChange: async () => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.current?.getCurrentRoute();

        if (currentRoute && previousRouteName !== currentRoute.name) {
          await Kewa.trackScreenView(currentRoute.name, {
            previousScreen: previousRouteName,
            params: currentRoute.params,
          });
          routeNameRef.current = currentRoute.name;
        }
      },
    };
  }

  static trackButtonPress(buttonName: string, additionalData: Record<string, any> = {}) {
    return async () => {
      await Kewa.trackEvent('button_press', {
        buttonName,
        ...additionalData,
      });
    };
  }

  static trackFormSubmission(formName: string, formData: Record<string, any> = {}) {
    return async () => {
      await Kewa.trackEvent('form_submit', {
        formName,
        ...formData,
      });
    };
  }

  static trackError(error: Error, context: Record<string, any> = {}) {
    return Kewa.trackError(error, context);
  }
}