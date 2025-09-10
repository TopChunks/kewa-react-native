import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEWA_CONSTANTS } from './constants';
import uuid from 'react-native-uuid';

export interface SessionData {
  sessionId: string;
  startTime: string;
  lastActiveTime: string;
}

export class SessionManager {
  private static currentSession: SessionData | null = null;
  private static sessionTimeout: number = 30 * 60 * 1000; // 30 minutes

  static async loadSession(): Promise<SessionData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(KEWA_CONSTANTS.STORAGE_KEYS.SESSION_DATA);
      if (sessionData) {
        this.currentSession = JSON.parse(sessionData);
        
        // Check if loaded session is expired
        if (this.isSessionExpired()) {
          await this.clearSession();
          return null;
        }
        
        return this.currentSession;
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
    return null;
  }

  static async startSession(): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();
    
    this.currentSession = {
      sessionId,
      startTime: now,
      lastActiveTime: now,
    };

    await this.saveSession();
    return this.currentSession;
  }

  static async endSession(): Promise<SessionData | null> {
    const endedSession = this.currentSession;
    this.currentSession = null;
    await AsyncStorage.removeItem(KEWA_CONSTANTS.STORAGE_KEYS.SESSION_DATA);
    return endedSession;
  }

  static async updateActivity(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.lastActiveTime = new Date().toISOString();
      await this.saveSession();
    }
  }

  static getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  static isSessionExpired(): boolean {
    if (!this.currentSession) return true;

    const lastActive = new Date(this.currentSession.lastActiveTime).getTime();
    const now = Date.now();
    return (now - lastActive) > this.sessionTimeout;
  }

  static shouldStartNewSession(): boolean {
    return this.isSessionExpired() || !this.currentSession;
  }

  static getSessionDuration(): number {
    if (!this.currentSession) return 0;
    
    const start = new Date(this.currentSession.startTime).getTime();
    const end = Date.now();
    return end - start;
  }

  private static async saveSession(): Promise<void> {
    if (this.currentSession) {
      try {
        await AsyncStorage.setItem(
          KEWA_CONSTANTS.STORAGE_KEYS.SESSION_DATA,
          JSON.stringify(this.currentSession)
        );
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  }

  private static async clearSession(): Promise<void> {
    this.currentSession = null;
    await AsyncStorage.removeItem(KEWA_CONSTANTS.STORAGE_KEYS.SESSION_DATA);
  }

  private static generateSessionId(): string {
    return uuid.v4();
  }
}
