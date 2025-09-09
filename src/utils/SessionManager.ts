export interface SessionData {
  sessionId: string;
  startTime: string;
  lastActiveTime: string;
  isActive: boolean;
}

export class SessionManager {
  private static currentSession: SessionData | null = null;
  private static sessionTimeout: number = 30 * 60 * 1000; // 30 minutes

  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static startSession(): SessionData {
    const now = new Date().toISOString();
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: now,
      lastActiveTime: now,
      isActive: true,
    };
    return this.currentSession;
  }

  static getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  static updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActiveTime = new Date().toISOString();
    }
  }

  static endSession(): SessionData | null {
    if (this.currentSession) {
      this.currentSession.isActive = false;
      const session = this.currentSession;
      this.currentSession = null;
      return session;
    }
    return null;
  }

  static isSessionExpired(): boolean {
    if (!this.currentSession) return true;

    const lastActive = new Date(this.currentSession.lastActiveTime).getTime();
    const now = Date.now();
    return (now - lastActive) > this.sessionTimeout;
  }

  static getSessionDuration(): number {
    if (!this.currentSession) return 0;

    const start = new Date(this.currentSession.startTime).getTime();
    const end = new Date(this.currentSession.lastActiveTime).getTime();
    return Math.round((end - start) / 1000); // in seconds
  }
}
