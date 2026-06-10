import NetInfo from '@react-native-community/netinfo';
import { ContactData, KewaEvent, KewaResponse } from '../types';
import { StorageManager } from './StorageManager';

export class NetworkManager {
  private appUrl: string = '';
  private apiKey: string = '';
  private projectId: string = '';
  private isOnline: boolean = true;
  private unsubscribe: (() => void) | null = null;

  constructor(appUrl: string, apiKey: string, projectId: string) {
    this.appUrl = appUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.projectId = projectId;
    this.setupNetworkMonitoring();
  }

  private getTrackUrl(): string {
    return `${this.appUrl}/t/${this.projectId}/mtc/event/track`;
  }

  private getContactUrl(): string {
    return `${this.appUrl}/t/${this.projectId}/mtc`;
  }

  private setupNetworkMonitoring(): void {
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? true;
    });
  }

  async sendEvent(event: KewaEvent): Promise<KewaResponse> {
    const eventPayload = {
      event: event.eventName,
      timestamp: event.timestamp,
      data: event.eventData,
      contact: event.contactData,
      kewa_device_id: event.deviceId,
      device: event.deviceInfo,
    };

    return this.post(this.getTrackUrl(), eventPayload);
  }

  async updateContact(contact: ContactData): Promise<KewaResponse> {
    const ktcId = await StorageManager.getKtcId();
    const deviceId = await StorageManager.getDeviceId();
    return this.post(this.getContactUrl(), { contact, mtc_id: ktcId, kewa_device_id: deviceId });
  }

  private async post(url: string, body: Record<string, unknown>): Promise<KewaResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'secret': `${this.apiKey}`,
        'User-Agent': 'Kewa-SDK/1.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData: KewaResponse = await response.json();

    if (!responseData.success) {
      throw new Error('Kewa responded with an error ' + responseData.message);
    }

    return responseData;
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
