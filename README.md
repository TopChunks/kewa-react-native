# Kewa Analytics SDK for React Native

A comprehensive TypeScript-first analytics SDK for React Native applications that provides automatic user behavior tracking, custom event tracking, and seamless user identification.

## Features

- 🚀 **Automatic Event Tracking**: App launch, session management, screen views
- 🔄 **User Identification**: Smart ktc_id management with backend synchronization
- 📱 **Offline Support**: Event queuing and batch processing when offline
- 🎯 **Custom Events**: Flexible API for tracking business-specific events
- 🔒 **TypeScript First**: Full type safety and IntelliSense support
- ⚡ **Performance Optimized**: Minimal impact on app performance
- 🎨 **React Hooks**: Modern React patterns with custom hooks

## Installation

```bash
npm install @yourcompany/kewa-analytics
# or
yarn add @yourcompany/kewa-analytics
```

### Required Dependencies

```bash
npm install @react-native-async-storage/async-storage @react-native-community/netinfo
# or
yarn add @react-native-async-storage/async-storage @react-native-community/netinfo
```

## Quick Start

### 1. Initialize the SDK

```typescript
import Kewa from '@yourcompany/kewa-analytics';

// Initialize in your App.js or index.js
await Kewa.init({
  apiUrl: 'https://your-backend.com/api',
  apiKey: 'your-api-key',
  enableAutoTracking: true,
  enableDebugLogging: __DEV__,
});
```

### 2. Using with React Context (Recommended)

```typescript
import { KewaProvider } from '@yourcompany/kewa-analytics';

export default function App() {
  return (
    <KewaProvider config={{
      apiUrl: 'https://your-backend.com/api',
      apiKey: 'your-api-key',
      enableAutoTracking: true,
    }}>
      <YourAppContent />
    </KewaProvider>
  );
}
```

### 3. Track Events with Hooks

```typescript
import { useKewa } from '@yourcompany/kewa-analytics';

function HomeScreen() {
  const { trackEvent, trackScreenView } = useKewa();

  useEffect(() => {
    trackScreenView('HomeScreen');
  }, []);

  const handleButtonPress = async () => {
    await trackEvent('button_clicked', {
      buttonName: 'get_started',
      location: 'home_screen'
    });
  };

  return <Button onPress={handleButtonPress} title="Get Started" />;
}
```

## API Reference

### Configuration

```typescript
interface KewaConfig {
  apiUrl: string;
  apiKey: string;
  enableAutoTracking?: boolean; // default: true
  batchSize?: number; // default: 10
  maxQueueSize?: number; // default: 100
  sessionTimeoutMs?: number; // default: 30 minutes
  enableDebugLogging?: boolean; // default: false
  enableCrashReporting?: boolean; // default: true
}
```

### Core Methods

#### trackEvent(eventName, eventData)
Track custom events with optional data.

```typescript
await Kewa.trackEvent('product_viewed', {
  productId: 'abc123',
  category: 'electronics',
  price: 299.99
});
```

#### trackLogin(userData)
Track user login events.

```typescript
await Kewa.trackLogin({
  userId: 'user123',
  email: 'user@example.com',
  loginMethod: 'google'
});
```

#### trackPurchase(purchaseData)
Track purchase/transaction events.

```typescript
await Kewa.trackPurchase({
  transactionId: 'txn_123',
  revenue: 29.99,
  currency: 'USD',
  productId: 'premium_plan',
  quantity: 1
});
```

#### identifyUser(userId, properties)
Identify a user and set properties.

```typescript
await Kewa.identifyUser('user123', {
  email: 'user@example.com',
  plan: 'premium',
  signupDate: '2024-01-01'
});
```

### React Hooks

#### useKewa()
Main hook for accessing Kewa functionality.

```typescript
const {
  trackEvent,
  trackScreenView,
  trackLogin,
  trackPurchase,
  identifyUser,
  setUserProperties,
  getKtcId,
  getSessionId,
  isInitialized
} = useKewa();
```

#### useAutoTracker()
Utility hooks for common tracking patterns.

```typescript
const { trackButtonPress, trackFormSubmit, trackError } = useAutoTracker();

// Usage
<Button 
  onPress={trackButtonPress('subscribe', { plan: 'premium' })}
  title="Subscribe"
/>
```

### Navigation Integration

#### React Navigation v6

```typescript
import { KewaAutoTracker } from '@yourcompany/kewa-analytics';

function App() {
  const navigationRef = useRef();
  const { onReady, onStateChange } = KewaAutoTracker.setupNavigationTracking(navigationRef);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={onStateChange}
    >
      {/* Your navigation stack */}
    </NavigationContainer>
  );
}
```

### Automatic Events

The SDK automatically tracks the following events when `enableAutoTracking` is true:

- `app_launch`: When the app starts
- `session_start`: When a new session begins
- `session_end`: When a session ends
- `screen_view`: When navigating between screens (with navigation integration)

### Error Tracking

```typescript
// Automatic error boundary
import { KewaAutoTracker } from '@yourcompany/kewa-analytics';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    KewaAutoTracker.trackError(error, errorInfo);
  }
}

// Manual error tracking
try {
  // Some risky operation
} catch (error) {
  await Kewa.trackError(error, { context: 'user_action' });
}
```

## Backend Integration

Your backend should handle the following endpoints:

### POST /events
Single event endpoint.

**Request:**
```json
{
  "eventName": "button_click",
  "eventData": { "buttonName": "subscribe" },
  "ktcId": "user123",
  "deviceInfo": { "platform": "ios" },
  "userProperties": { "plan": "free" }
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "user123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### POST /events/batch
Batch events endpoint for processing queued events.

**Request:**
```json
{
  "events": [
    { "eventName": "event1", "eventData": {...} },
    { "eventName": "event2", "eventData": {...} }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "user123",
  "processed_count": 2,
  "failed_count": 0
}
```

### User Identification Flow

1. **Anonymous User**: App launches without ktc_id → Backend creates new user → Returns user_id
2. **User Login**: Login event sent → Backend identifies existing user → Returns existing user_id
3. **Event Linking**: All events from anonymous session automatically linked to identified user

## Best Practices

### 1. Event Naming
Use consistent, descriptive event names:
```typescript
// Good
'product_viewed', 'user_registered', 'purchase_completed'

// Avoid
'click', 'event', 'action'
```

### 2. Event Data Structure
Keep event data flat and meaningful:
```typescript
// Good
{
  productId: 'abc123',
  category: 'electronics',
  price: 299.99,
  source: 'search'
}

// Avoid deeply nested objects
{
  product: {
    details: {
      info: { id: 'abc123' }
    }
  }
}
```

### 3. User Properties
Set user properties that help with analysis:
```typescript
await Kewa.setUserProperties({
  plan: 'premium',
  signupDate: '2024-01-01',
  lastActiveDate: new Date().toISOString(),
  totalPurchases: 5
});
```

### 4. Error Handling
Always handle tracking errors gracefully:
```typescript
try {
  await Kewa.trackEvent('critical_action', data);
} catch (error) {
  console.warn('Analytics tracking failed:', error);
  // Continue with app flow
}
```

## Troubleshooting

### Common Issues

1. **Events not sending**: Check network connectivity and API configuration
2. **ktc_id not updating**: Verify backend returns user_id in responses
3. **Memory issues**: Adjust maxQueueSize in configuration
4. **Performance impact**: Disable debug logging in production

### Debug Mode

Enable debug logging to see detailed information:

```typescript
await Kewa.init({
  // ... other config
  enableDebugLogging: true,
});
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.