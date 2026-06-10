# kewa-react-native

TypeScript analytics SDK for React Native. Tracks user behavior, sends events to your Kewa backend, manages contact identity (`ktc_id`), and queues events when offline.

**Package:** `kewa-react-native` v0.1.0  
**Entry:** `lib/index.js` · **Types:** `lib/index.d.ts`  
**Author:** Topchunks Solutions Pvt Ltd

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Package Exports](#package-exports)
- [SDK API](#sdk-api)
- [React Integration](#react-integration)
- [Auto Tracking Utilities](#auto-tracking-utilities)
- [Automatic Events](#automatic-events)
- [Event Payload & Backend API](#event-payload--backend-api)
- [Offline Queue](#offline-queue)
- [User Identification](#user-identification)
- [TypeScript Types](#typescript-types)
- [Predefined Event Names](#predefined-event-names)
- [Device Information](#device-information)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| Custom events | `trackEvent()` with arbitrary event names and data |
| User lifecycle | Login, logout, registration, identify, properties, reset |
| Screen tracking | Manual `trackScreenView()` or React Navigation integration |
| App lifecycle | Auto `app_launch`, `app_foreground`, `app_background` |
| Error tracking | `trackError()` with message, stack, and context |
| UI helpers | Button press and form submission trackers |
| Offline queue | Events stored in AsyncStorage and retried when online |
| Identity sync | `ktc_id` and `device_id` synced from backend responses |
| Granular opt-out | Disable all tracking, events only, or app-state only |
| React hooks | `KewaProvider`, `useKewa`, `useAutoTracker` |
| TypeScript | Full types for config, events, contacts, and responses |

Session management is handled by the Kewa backend — this SDK does not track sessions.

---

## Requirements

| Dependency | Version |
|------------|---------|
| `react` | `>= 16.8.0` |
| `react-native` | `>= 0.60.0` |

Bundled dependencies (installed automatically):

- `@react-native-async-storage/async-storage`
- `@react-native-community/netinfo`
- `react-native-device-info`

### Platform notes

- **Bare / core React Native** — fully supported
- **Expo development build** — supported (`expo prebuild` + `expo run:ios/android`)
- **Expo Go** — **not supported** (`react-native-device-info` requires native code)

---

## Installation

```bash
npm install kewa-react-native
# or
yarn add kewa-react-native
```

### Local development

```bash
# In your app
npm install /path/to/kewa-react-native
```

The package runs `npm run build` automatically via the `prepare` script.

---

## Quick Start

### Option 1: `KewaProvider` (recommended)

```tsx
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { KewaProvider, KewaAutoTracker } from 'kewa-react-native';

export default function App() {
  const navigationRef = useRef(null);
  const { onReady, onStateChange } = KewaAutoTracker.setupNavigationTracking(navigationRef);

  return (
    <KewaProvider
      config={{
        appUrl: 'https://your-kewa-instance.com',
        projectId: '39r48kjbddkj',
        apiKey: 'your-api-key',
        enableDebugLogging: __DEV__,
      }}
    >
      <NavigationContainer
        ref={navigationRef}
        onReady={onReady}
        onStateChange={onStateChange}
      >
        {/* screens */}
      </NavigationContainer>
    </KewaProvider>
  );
}
```

`KewaProvider` calls `init()` on mount and `cleanup()` on unmount.

### Option 2: Imperative init

```typescript
import Kewa from 'kewa-react-native';

await Kewa.init({
  appUrl: 'https://your-kewa-instance.com',
  projectId: '39r48kjbddkj',
  apiKey: 'your-api-key',
});

// When tearing down (optional)
Kewa.cleanup();
```

Use a single init path — do not call `Kewa.init()` manually if you already wrap the app in `KewaProvider`.

---

## Configuration

```typescript
interface KewaConfig {
  appUrl: string;                      // Required — base URL of your Kewa instance
  apiKey: string;                      // Required — sent as `secret` header
  projectId?: string;                  // Required when tracking is enabled
  disableTracking?: boolean;           // Default: false
  disableEventTracking?: boolean;      // Default: false
  disableAppStateTracking?: boolean;   // Default: false
  batchSize?: number;                  // Default: 10 (reserved for future batch API)
  maxQueueSize?: number;               // Default: 100
  enableDebugLogging?: boolean;        // Default: false
  /** @deprecated Use appUrl instead */
  apiUrl?: string;
}
```

### Tracking flags

| Flag | Default | Effect |
|------|---------|--------|
| `disableTracking` | `false` | Master switch. No network, no listeners, all SDK methods no-op |
| `disableEventTracking` | `false` | Blocks all events sent via `trackEvent` and its wrappers (`trackLogin`, `trackScreenView`, `app_launch`, etc.) |
| `disableAppStateTracking` | `false` | Blocks only `app_foreground` and `app_background` |

`disableTracking` overrides the other two.

**Independence:** App-state tracking and event tracking are separate. You can set `disableEventTracking: true` and still receive foreground/background events.

### Validation rules

- `appUrl` is always required (falls back to deprecated `apiUrl`)
- `projectId` is required when `disableTracking` is `false`
- Trailing slashes on `appUrl` are stripped automatically

---

## Package Exports

```typescript
// Default singleton
import Kewa from 'kewa-react-native';

// React
import { KewaProvider, useKewa, useAutoTracker } from 'kewa-react-native';

// Auto-tracking utilities
import { KewaTracker, KewaAutoTracker } from 'kewa-react-native';
// KewaAutoTracker is an alias for KewaTracker

// Constants & utilities
import { KEWA_CONSTANTS, DeviceInfoCollector } from 'kewa-react-native';

// Types
import type {
  KewaConfig,
  DeviceInfo,
  ContactData,
  BaseEventData,
  KewaEvent,
  KewaResponse,
  UserLoginEvent,
  UserRegistrationEvent,
  ScreenViewEvent,
  ErrorEvent,
  AppLaunchEvent,
} from 'kewa-react-native';
```

---

## SDK API

All methods below are available on the default `Kewa` singleton and via `useKewa()`.

### `init(config: KewaConfig): Promise<void>`

Initializes the SDK. Collects device info, sets up app-state listeners (unless disabled), drains the offline queue, and sends `app_launch` (unless event tracking is disabled).

### `trackEvent(eventName, eventData?, contactData?): Promise<void>`

Track any custom event.

```typescript
await Kewa.trackEvent('product_viewed', {
  productId: 'abc123',
  category: 'electronics',
  price: 299.99,
});

// Attach contact fields to a single event
await Kewa.trackEvent(
  'user_registration',
  { userId: '123' },
  { email: 'user@example.com', firstname: 'Foo' },
);
```

Every event automatically includes stored `ktc_id`, user properties, `device_id`, and device info.

### `setUserProperties(properties): Promise<void>`

Merges properties into local storage and POSTs to `{appUrl}/t/{projectId}/mtc` with `{ contact: properties }`. All fields including `id` are optional.

```typescript
await Kewa.setUserProperties({
  email: 'user@example.com',
  firstname: 'Jane',
  plan: 'premium',
});
```

### `trackLogin(userData): Promise<void>`

Sends `user_login`. Default `loginMethod` is `'custom'`.

```typescript
await Kewa.trackLogin({
  userId: 'user123',
  email: 'user@example.com',
  loginMethod: 'google', // 'email' | 'google' | 'facebook' | 'apple' | 'phone' | 'custom'
});
```

### `trackLogout(): Promise<void>`

Sends `user_logout`.

```typescript
await Kewa.trackLogout();
```

### `trackRegistration(userData): Promise<void>`

Sends `user_registration`. Default `registrationMethod` is `'email'`.

```typescript
await Kewa.trackRegistration({
  userId: 'user123',
  email: 'user@example.com',
  registrationMethod: 'google',
});
```

### `trackScreenView(screenName, additionalData?): Promise<void>`

Sends `screen_view`.

```typescript
await Kewa.trackScreenView('ProductDetail', {
  previousScreen: 'Home',
  screenClass: 'ProductDetailScreen',
  loadTime: 320,
  params: { productId: 'abc123' },
});
```

### `trackError(error, context?, isFatal?): Promise<void>`

Sends `error` with message, stack trace, name, and optional context.

```typescript
try {
  await riskyOperation();
} catch (error) {
  await Kewa.trackError(error as Error, { screen: 'Checkout' }, false);
}
```

### `reset(): Promise<void>`

Clears `ktc_id`, `device_id`, and stored user properties from AsyncStorage, then sends `user_reset`.

```typescript
await Kewa.reset();
```

### Getters

| Method | Returns | Description |
|--------|---------|-------------|
| `getKtcId()` | `Promise<string \| null>` | Locally stored contact ID |
| `getDeviceId()` | `Promise<string \| null>` | Kewa-assigned device ID |
| `getUserProperties()` | `Promise<ContactData>` | Merged contact properties in storage |
| `isSDKInitialized()` | `boolean` | Whether `init()` completed |

### `cleanup(): void`

Removes the `AppState` listener and network monitor. Called automatically by `KewaProvider` on unmount.

---

## React Integration

### `KewaProvider`

```tsx
<KewaProvider
  config={kewaConfig}
  kewa={optionalCustomInstance}  // for testing; defaults to shared singleton
>
  {children}
</KewaProvider>
```

Re-initializes when `appUrl`, `apiKey`, `projectId`, or any disable flag changes.

### `useKewa()`

Returns the full SDK API. Must be used inside `KewaProvider`.

```tsx
function CheckoutScreen() {
  const {
    trackEvent,
    trackLogin,
    trackLogout,
    trackRegistration,
    trackScreenView,
    trackError,
    setUserProperties,
    reset,
    getKtcId,
    getDeviceId,
    getUserProperties,
    isSDKInitialized,
  } = useKewa();

  // ...
}
```

### `useAutoTracker()`

UI-focused helpers bound to the provider instance. Must be used inside `KewaProvider`.

```tsx
function HomeScreen() {
  const { trackButtonPress, trackFormSubmission, trackError, setupNavigationTracking } = useAutoTracker();

  return (
    <>
      <Button onPress={trackButtonPress('subscribe', { plan: 'premium' })} />
      <Button onPress={trackFormSubmission('newsletter', { source: 'home' })} />
    </>
  );
}
```

---

## Auto Tracking Utilities

`KewaTracker` / `KewaAutoTracker` are static utilities that use the shared `Kewa` singleton.

### `setupNavigationTracking(navigationRef)`

For React Navigation. Returns `onReady` and `onStateChange` handlers.

```typescript
const navigationRef = useRef(null);
const { onReady, onStateChange } = KewaAutoTracker.setupNavigationTracking(navigationRef);

<NavigationContainer ref={navigationRef} onReady={onReady} onStateChange={onStateChange}>
```

On route change, sends `screen_view` with `screenName`, `previousScreen`, and `params`.

### `trackButtonPress(buttonName, additionalData?)`

Returns an async press handler. Sends `button_press`.

```typescript
<Button onPress={KewaTracker.trackButtonPress('cta_signup', { variant: 'hero' })} />
```

### `trackFormSubmission(formName, formData?)`

Returns an async submit handler. Sends `form_submit`.

```typescript
<Button onPress={KewaTracker.trackFormSubmission('contact_form', { fields: 3 })} />
```

### `trackError(error, context?)`

```typescript
KewaAutoTracker.trackError(error, { component: 'PaymentForm' });
```

---

## Automatic Events

| Event | Trigger | Disabled when |
|-------|---------|---------------|
| `app_launch` | SDK init completes | `disableTracking` or `disableEventTracking` |
| `app_foreground` | App returns from background/inactive | `disableTracking` or `disableAppStateTracking` |
| `app_background` | App moves to background | `disableTracking` or `disableAppStateTracking` |
| `screen_view` | Navigation route change (with integration) | `disableTracking` or `disableEventTracking` |

`app_launch` includes full device info and `isFirstLaunch` (true when no `device_id` is stored yet).

When the app returns to foreground, queued events are automatically retried.

---

## Event Payload & Backend API

### Endpoint

```
POST {appUrl}/t/{projectId}/mtc/event/track
```

Example:

```
POST https://your-kewa-instance.com/t/39r48kjbddkj/mtc/event/track
```

### Request headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `secret` | Your `apiKey` |
| `User-Agent` | `Kewa-SDK/1.0.0` |

### Request body

```json
{
  "event": "product_viewed",
  "timestamp": "2026-06-09T12:00:00.000Z",
  "data": { "productId": "abc123" },
  "contact": { "id": "42", "email": "user@example.com" },
  "kewa_device_id": "device-uuid",
  "device": {
    "appName": "MyApp",
    "platform": "ios",
    "appVersion": "1.0.0",
    "deviceModel": "iPhone15,2",
    "screenWidth": 390,
    "screenHeight": 844,
    "timezone": "America/New_York"
  }
}
```

### Response

```typescript
interface KewaResponse {
  success: boolean;
  id?: string;        // contact ID — stored as ktc_id
  sid?: string;
  device_id?: string; // stored locally for future events
  message?: string;
}
```

On each successful response, the SDK updates local `ktc_id` and `device_id` when the backend returns new values.

---

## Offline Queue

1. If the device is offline or a send fails, the event is saved to AsyncStorage.
2. Queue is capped at `maxQueueSize` (default **100**); oldest events are dropped when full.
3. Queue is processed on SDK init and when the app returns to foreground.
4. Events are sent one at a time (batch API not yet implemented on the backend).

Each queued event includes metadata: `eventId`, `attemptCount`, `queuedAt`.

---

## User Identification

```
Anonymous launch
  → events sent without contact id
  → backend returns id + device_id
  → SDK stores both locally

User logs in / setUserProperties()
  → properties stored locally
  → contact updated via POST /t/{projectId}/mtc
  → backend returns id/device_id which SDK stores as ktc_id
  → backend links anonymous history

All subsequent events
  → include stored contact id, user properties, and device id
```

### Stored keys (AsyncStorage)

| Key | Purpose |
|-----|---------|
| `kewa_ktc_id` | Contact / user ID |
| `kewa_device_id` | Kewa device ID |
| `kewa_user_properties` | Merged contact fields |
| `kewa_queued_events` | Offline event queue |

Access constants via `KEWA_CONSTANTS.STORAGE_KEYS`.

---

## TypeScript Types

### `ContactData`

Contact/profile fields attached to events. Supports standard CRM fields:

`id`, `title`, `firstname`, `lastname`, `email`, `mobile`, `phone`, `company`, `position`, address fields, social profiles (`facebook`, `twitter`, `linkedin`, etc.), company fields, and custom keys via index signature.

### Event data types

| Type | Used for |
|------|----------|
| `BaseEventData` | Generic event payload |
| `AppLaunchEvent` | `app_launch` |
| `UserLoginEvent` | `user_login` |
| `UserRegistrationEvent` | `user_registration` |
| `ScreenViewEvent` | `screen_view` |
| `ErrorEvent` | `error` |
| `AppForegroundEvent` | `app_foreground` |
| `AppBackgroundEvent` | `app_background` |
| `KewaEvent` | Internal full event object |

---

## Predefined Event Names

Available on `KEWA_CONSTANTS.EVENTS`:

| Constant | Event name |
|----------|------------|
| `APP_LAUNCH` | `app_launch` |
| `APP_FOREGROUND` | `app_foreground` |
| `APP_BACKGROUND` | `app_background` |
| `USER_LOGIN` | `user_login` |
| `USER_LOGOUT` | `user_logout` |
| `USER_REGISTRATION` | `user_registration` |
| `SCREEN_VIEW` | `screen_view` |
| `ERROR` | `error` |
| `BUTTON_PRESS` | `button_press` |
| `FORM_SUBMIT` | `form_submit` |

Custom event names (e.g. `purchase_completed`) are also supported via `trackEvent()`.

---

## Device Information

Collected automatically on init via `DeviceInfoCollector` and attached to every event:

| Field | Source |
|-------|--------|
| `appName` | Application name |
| `platform` | `ios` or `android` |
| `platformVersion` | OS version |
| `userAgent` | Device user agent |
| `appVersion` | Readable app version |
| `buildNumber` | Build number |
| `deviceName` | Device name |
| `deviceModel` | Device model |
| `screenWidth` / `screenHeight` | Window dimensions |
| `timezone` | IANA timezone |
| `carrier` | Mobile carrier |
| `brand` | Device brand |
| `manufacturer` | Manufacturer |
| `isTablet` | Tablet detection |

`DeviceInfoCollector` is exported if you need to inspect device data directly.

---

## Best Practices

### Event naming

```typescript
// Good
'product_viewed', 'purchase_completed', 'onboarding_step_2'

// Avoid
'click', 'event', 'action'
```

### Flat event data

```typescript
// Good
{ productId: 'abc', price: 29.99, currency: 'USD' }

// Avoid deep nesting
{ product: { details: { id: 'abc' } } }
```

### Privacy / opt-out

```typescript
<KewaProvider config={{
  appUrl: '...',
  projectId: '...',
  apiKey: '...',
  disableTracking: userOptedOut,
}}>
```

### Debug logging

Enable only in development:

```typescript
enableDebugLogging: __DEV__
```

Logs event payloads and backend responses to the Metro console.

### Error boundaries

```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    KewaAutoTracker.trackError(error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Events not sending | Verify `appUrl`, `projectId`, `apiKey`, and network connectivity |
| `projectId is required` error | Pass `projectId` or set `disableTracking: true` |
| `ktc_id` not updating | Confirm backend returns `id` in the response |
| `NativeModule.RNDeviceInfo is null` | Not running in Expo Go — use a dev build or bare RN |
| Queue growing | Check backend availability; adjust `maxQueueSize` if needed |
| Duplicate init | Use either `KewaProvider` or manual `Kewa.init()`, not both |
| SDK not initialized warning | Call `init()` via provider or manually before tracking |

### Verify the endpoint manually

```bash
curl -X POST 'https://your-kewa-instance.com/t/39r48kjbddkj/mtc/event/track' \
  -H 'Content-Type: application/json' \
  -H 'secret: YOUR_API_KEY' \
  -d '{
    "event": "test_event",
    "timestamp": "2026-06-09T00:00:00.000Z",
    "data": {},
    "contact": {},
    "kewa_device_id": null,
    "device": { "platform": "ios", "appVersion": "1.0.0" }
  }'
```

---

## License

MIT — see [LICENSE](LICENSE).
