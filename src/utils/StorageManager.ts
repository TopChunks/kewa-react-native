import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactData, KewaEvent } from '../types';
import { KEWA_CONSTANTS } from '../utils/constants';

export class StorageManager {
  static async getKtcId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEWA_CONSTANTS.STORAGE_KEYS.KTC_ID);
    } catch (error) {
      console.error('Failed to get ktc_id:', error);
      return null;
    }
  }

  static async setKtcId(ktcId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEWA_CONSTANTS.STORAGE_KEYS.KTC_ID, ktcId);
    } catch (error) {
      console.error('Failed to set ktc_id:', error);
    }
  }

  static async removeKtcId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEWA_CONSTANTS.STORAGE_KEYS.KTC_ID);
    } catch (error) {
      console.error('Failed to remove ktc_id:', error);
    }
  }

  static async getDeviceId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEWA_CONSTANTS.STORAGE_KEYS.DEVICE_ID);
    } catch (error) {
      console.error('Failed to get device_id:', error);
      return null;
    }
  }

  static async setDeviceId(deviceId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEWA_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);
    } catch (error) {
      console.error('Failed to set device_id:', error);
    }
  }

  static async removeDeviceId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEWA_CONSTANTS.STORAGE_KEYS.DEVICE_ID);
    } catch (error) {
      console.error('Failed to remove device_id:', error);
    }
  }

  static async getUserProperties(): Promise<ContactData> {
    try {
      const props = await AsyncStorage.getItem(KEWA_CONSTANTS.STORAGE_KEYS.USER_PROPERTIES);
      return props ? JSON.parse(props) : {};
    } catch (error) {
      console.error('Failed to get user properties:', error);
      return {};
    }
  }

  static async setUserProperties(properties: ContactData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        KEWA_CONSTANTS.STORAGE_KEYS.USER_PROPERTIES,
        JSON.stringify(properties)
      );
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  static async removeUserProperties(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEWA_CONSTANTS.STORAGE_KEYS.USER_PROPERTIES);
    } catch (error) {
      console.error('Failed to remove user properties:', error);
    }
  }

  static async getQueuedEvents(): Promise<KewaEvent[]> {
    try {
      const events = await AsyncStorage.getItem(KEWA_CONSTANTS.STORAGE_KEYS.QUEUED_EVENTS);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('Failed to get queued events:', error);
      return [];
    }
  }

  static async setQueuedEvents(events: KewaEvent[]): Promise<void> {
    try {
      // Limit queue size
      const limitedEvents = events.slice(-KEWA_CONSTANTS.DEFAULTS.MAX_QUEUE_SIZE);
      await AsyncStorage.setItem(
        KEWA_CONSTANTS.STORAGE_KEYS.QUEUED_EVENTS,
        JSON.stringify(limitedEvents)
      );
    } catch (error) {
      console.error('Failed to set queued events:', error);
    }
  }

  static async addQueuedEvent(event: KewaEvent): Promise<void> {
    const events = await this.getQueuedEvents();
    events.push(event);
    await this.setQueuedEvents(events);
  }

  static async clearQueuedEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEWA_CONSTANTS.STORAGE_KEYS.QUEUED_EVENTS);
    } catch (error) {
      console.error('Failed to clear queued events:', error);
    }
  }
}