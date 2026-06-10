let debugEnabled = false;

export function setDebugLogging(enabled: boolean): void {
  debugEnabled = enabled;
}

export function isDebugLoggingEnabled(): boolean {
  return debugEnabled;
}

export function kewaDebug(...args: unknown[]): void {
  if (debugEnabled) {
    console.log('[Kewa]', ...args);
  }
}
