import NetInfo from '@react-native-community/netinfo';
import { KewaEvent, KewaResponse, KewaBatchResponse } from '../types';

export class NetworkManager {
  private appUrl: string = '';
  private apiKey: string = '';
  private isOnline: boolean = true;
  private unsubscribe: (() => void) | null = null;

  constructor(appUrl: string, apiKey: string) {
    this.appUrl = appUrl;
    this.apiKey = apiKey;
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring(): void {
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? true;
    });
  }

  async sendEvent(event: KewaEvent): Promise<KewaResponse> {
    const eventPayload = {
      event : event.eventName,
      data : event.eventData,
      contact : event.contactData,
      kewa_device_id : event.deviceId,
      device : event.deviceInfo,
    };

    const response = await fetch(`${this.appUrl}/mtc/event/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'secret': `${this.apiKey}`,
        'User-Agent': 'Kewa-SDK/1.0.0',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendEventBatch(events: KewaEvent[]): Promise<KewaBatchResponse> {
    const response = await fetch(`${this.appUrl}/events/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'Kewa-SDK/1.0.0',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}