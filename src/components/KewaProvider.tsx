import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { KewaAnalytics } from '../core/KewaAnalytics';
import { KewaConfig } from '../types';

export const KewaContext = createContext<KewaAnalytics | null>(null);

interface KewaProviderProps {
  config: KewaConfig;
  children: ReactNode;
}

export const KewaProvider: React.FC<KewaProviderProps> = ({ config, children }) => {
  const [kewa] = useState(() => new KewaAnalytics());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await kewa.init(config);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Kewa SDK:', error);
      }
    };

    initializeSDK();

    // Cleanup on unmount
    return () => {
      kewa.cleanup();
    };
  }, [kewa, config]);

  if (!isInitialized) {
    // You can return a loading component here if needed
    return null;
  }

  return (
    <KewaContext.Provider value={kewa}>
      {children}
    </KewaContext.Provider>
  );
};