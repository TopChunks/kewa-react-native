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
        timestamp: eventData.timestamp || new Date().toISOString(),
      },
      contactData : contactData,
      deviceId,
      deviceInfo,
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
        console.log('Sending event:', event);
      }

      const response = await this.networkManager.sendEvent(event);

      const ktcId = await StorageManager.getKtcId();
      const deviceId = await StorageManager.getDeviceId();

      // Update ktc_id if kewa provides user_id
      if (response.id && response.id !== ktcId) {
        await StorageManager.setKtcId(response.id);

        if (this.config.enableDebugLogging) {
          console.log('Updated ktc_id from kewa:', response.id);
        }
      }

      if (response.device_id && response.device_id !== deviceId) {
        await StorageManager.setDeviceId(response.device_id);

        if (this.config.enableDebugLogging) {
          console.log('Updated ktc_id from kewa:', response.id);
        }
      }

    } catch (error) {
      throw error;
    }
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

      // const batchSize = this.config.batchSize || KEWA_CONSTANTS.DEFAULTS.BATCH_SIZE;

      // // Process events in batches
      // for (let i = 0; i < queuedEvents.length; i += batchSize) {
      //   const batch = queuedEvents.slice(i, i + batchSize);

      //   try {
      //     const response = await this.networkManager.sendEventBatch(batch);

      //     // Update ktc_id if backend provides user_id
      //     if (response.user_id) {
      //       await StorageManager.setKtcId(response.user_id);
      //     }
      //   } catch (error) {
      //     console.error('Failed to send event batch:', error);
      //     // Keep failed events in queue for next retry
      //     const failedEvents = queuedEvents.slice(i);
      //     await StorageManager.setQueuedEvents(failedEvents);
      //     return;
      //   }
      // }

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