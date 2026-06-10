import {
  KewaProvider,
  useKewa,
  getDefaultKewaInstance,
} from './KewaProvider';

export * from './types';

export { KEWA_CONSTANTS } from './utils/constants';
export { DeviceInfoCollector } from './utils/DeviceInfo';
export { KewaProvider, useKewa };

const Kewa = getDefaultKewaInstance();
export default Kewa;

export class KewaTracker {
  static setupNavigationTracking(navigationRef: any) {
    const kewa = getDefaultKewaInstance();
    const routeNameRef = { current: '' };

    return {
      onReady: () => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute) {
          routeNameRef.current = currentRoute.name;
        }
      },
      onStateChange: async () => {
        if (!kewa.isAutoScreenViewTrackingEnabled()) {
          return;
        }

        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.current?.getCurrentRoute();

        if (currentRoute && previousRouteName !== currentRoute.name) {
          await kewa.trackScreenView(currentRoute.name, {
            previousScreen: previousRouteName,
            params: currentRoute.params,
          });
          routeNameRef.current = currentRoute.name;
        }
      },
    };
  }

  static trackButtonPress(buttonName: string, additionalData: Record<string, any> = {}) {
    const kewa = getDefaultKewaInstance();
    return async () => {
      await kewa.trackEvent('button_press', {
        buttonName,
        ...additionalData,
      });
    };
  }

  static trackFormSubmission(formName: string, formData: Record<string, any> = {}) {
    const kewa = getDefaultKewaInstance();
    return async () => {
      await kewa.trackEvent('form_submit', {
        formName,
        ...formData,
      });
    };
  }

  static trackError(error: Error, context: Record<string, any> = {}) {
    return getDefaultKewaInstance().trackError(error, context);
  }
}

export const KewaAutoTracker = KewaTracker;

export function useAutoTracker() {
  const kewa = useKewa();

  return {
    setupNavigationTracking: KewaTracker.setupNavigationTracking,
    trackButtonPress: (buttonName: string, additionalData: Record<string, any> = {}) =>
      async () => {
        await kewa.trackEvent('button_press', { buttonName, ...additionalData });
      },
    trackFormSubmission: (formName: string, formData: Record<string, any> = {}) =>
      async () => {
        await kewa.trackEvent('form_submit', { formName, ...formData });
      },
    trackError: kewa.trackError.bind(kewa),
  };
}
