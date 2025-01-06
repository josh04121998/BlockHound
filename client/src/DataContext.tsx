import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types for the data that will be cached
interface GlobalDataCache {
  walletData: Record<string, any>;
}

// Initialize the cache with default values (e.g., `selectedChain` from localStorage)
const initialDataCache: GlobalDataCache = {
  walletData: {},
};

// Define the context type (to ensure proper typing when using `useContext`)
interface DataContextType {
  globalDataCache: GlobalDataCache;
  setGlobalDataCache: React.Dispatch<React.SetStateAction<GlobalDataCache>>;
}

// Export the context with a default value of `undefined` (which we'll later handle in `useContext`)
export const DataContext = createContext<DataContextType | undefined>(undefined);

// Custom hook to use the context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  
  // Handle the case when the context is used outside the provider
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
};

// Data provider component
interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [globalDataCache, setGlobalDataCache] = useState<GlobalDataCache>(initialDataCache);

  // Debugging line
  console.log('Inside DataProvider', globalDataCache);

  return (
    <DataContext.Provider value={{ globalDataCache, setGlobalDataCache }}>
      {children}
    </DataContext.Provider>
  );
};
