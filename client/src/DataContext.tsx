import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of the data cache
interface DataCache {
  selectedChain: string;
  wallets: Record<string, any>;
  walletAddress: string | null; // Store a single wallet address
}

// Define the shape of the context value
interface DataContextValue {
  globalDataCache: DataCache;
  setGlobalDataCache: React.Dispatch<React.SetStateAction<DataCache>>;
}

// Initial data cache (set default value as 'eth')
const initialDataCache: DataCache = {
  selectedChain: 'eth', // Default chain if no localStorage data available
  wallets: {},
  walletAddress: null, // Initialize with null, can be updated later
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

// Custom hook to use the context
export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Data provider component
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globalDataCache, setGlobalDataCache] = useState<DataCache>(initialDataCache);

  // Run this effect only once when the component mounts in the browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedChain = localStorage.getItem('selectedChain') || 'eth'; // Fallback to 'eth'
      setGlobalDataCache((prevCache) => ({
        ...prevCache,
        selectedChain,
      }));
    }
  }, []);

  return (
    <DataContext.Provider value={{ globalDataCache, setGlobalDataCache }}>
      {children}
    </DataContext.Provider>
  );
};
