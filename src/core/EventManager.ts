import { KewaEvent, KewaConfig, BaseEventData, DeviceInfo, ContactData } from '../types';
import { StorageManager } from '../utils/StorageManager';
import { NetworkManager } from '../utils/NetworkManager';
import { KEWA_CONSTANTS } from '../utils/constants';

export class EventManager {
  private networkManager: NetworkManager;
  private config: KewaConfig;
  private isProcessingQueue: boolean = false;

  constructor(networkManager: NetworkManager, config: KewaConfig) {
    this.networkManager = networkManager;
    this.config = config;
  }

  async processEvent(
    eventName: string,
    eventData: BaseEventData,
    contactData: ContactData,
    deviceId: string | null,
    deviceInfo: DeviceInfo
  ): Promise<void> {
    const event: KewaEvent = {
      eventName,
      eventData: {
        ...eventData,
      },
      contactData : contactData,
      deviceId,
      deviceInfo,
      timestamp: eventData.timestamp || new Date().toISOString(),
      metadata: {
        eventId: this.generateEventId(),
        attemptCount: 1,
        queuedAt: new Date().toISOString(),
      },
    };

    if (this.networkManager.getNetworkStatus()) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        console.error('Failed to send event, queuing for retry:', error);
        await StorageManager.addQueuedEvent(event);
      }
    } else {
      await StorageManager.addQueuedEvent(event);
    }
  }

  private async sendEvent(event: KewaEvent): Promise<void> {
    try {

      if (this.config.enableDebugLogging) {
        console.log('Sending event data: eventName :' + event.eventName + ' eventData: ' + JSON.stringify(event.eventData) + ' contactData: ' + JSON.stringify(event.contactData) + ' deviceId: ' + event.deviceId);
      }

      const response = await this.networkManager.sendEvent(event);

      const ktcId = await StorageManager.getKtcId();
      const deviceId = await StorageManager.getDeviceId();

      if (this.config.enableDebugLogging) {
        console.log('Response from kewa :' + JSON.stringify(response));
      }

      // Logout clears identity after send — do not persist ids from its response
      if (event.eventName !== KEWA_CONSTANTS.EVENTS.USER_LOGOUT) {
        if (response.id && response.id !== ktcId) {
          await StorageManager.setKtcId(response.id);

          if (this.config.enableDebugLogging) {
            console.log('Updated ktc_id from kewa:', response.id);
          }
        }

        if (response.device_id && response.device_id !== deviceId) {
          await StorageManager.setDeviceId(response.device_id);
          if (this.config.enableDebugLogging) {
            console.log('Updated device_id from kewa:', response.device_id);
          }
        }
      }

    } catch (error) {
      console.warn('Error sending event to kewa, queuing for retry:', error);
      throw error;
    }
  }

  async processAppStateEvent(
    eventName: string,
    eventData: BaseEventData,
    contactData: ContactData,
    deviceId: string | null,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const event: KewaEvent = {
      eventName,
      eventData: { ...eventData },
      contactData,
      deviceId,
      deviceInfo,
      timestamp: eventData.timestamp || new Date().toISOString(),
      metadata: {
        eventId: this.generateEventId(),
        attemptCount: 1,
        queuedAt: new Date().toISOString(),
      },
    };

    if (this.networkManager.getNetworkStatus()) {
      try {
        await this.sendEvent(event);
        return;
      } catch (error) {
        console.warn(`Failed to send ${eventName}, queuing for retry:`, error);
      }
    }

    await StorageManager.addQueuedEvent(event);
  }

  async processQueuedEvents(): Promise<void> {
    if (this.isProcessingQueue || !this.networkManager.getNetworkStatus()) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const queuedEvents = await StorageManager.getQueuedEvents();
      if (queuedEvents.length === 0) {
        return;
      }

      if (this.config.enableDebugLogging) {
        console.log(`Processing ${queuedEvents.length} queued events`);
      }

      //TODO: Consider batch processing if supported by backend

      // Process events one by one
      for (const event of queuedEvents) {
        try {
          await this.networkManager.sendEvent(event);
        } catch (error) {
          console.error('Failed to send event:', error);
          // Keep the failed event in the queue for next retry
          await StorageManager.addQueuedEvent(event);
        }
      }

      // Clear all events after successful processing
      await StorageManager.clearQueuedEvents();

    } finally {
      this.isProcessingQueue = false;
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}