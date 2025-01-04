import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { useData } from './DataContext'; // Import the custom hook
import WalletInfo from './WalletInfo'; // Import your WalletInfo component

const App: React.FC = () => {
  const { globalDataCache, setGlobalDataCache } = useData(); // Access the cache
  const [walletAddress, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);

  console.log(globalDataCache);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Any client-side logic for localStorage or window-based operations
      const savedWalletAddress = localStorage.getItem('walletAddress');
      if (savedWalletAddress) {
        setAddress(savedWalletAddress);
      }
    }
  }, []);

  const handleCheckWallet = async () => {
    if (!walletAddress) {
      alert('Please enter an EVM address or ENS domain.');
      return;
    }

    // Save the current wallet address to the cache and localStorage
    setGlobalDataCache((prevCache) => ({
      ...prevCache,
      walletAddress: walletAddress, // Save the current wallet address
    }));

    // Save wallet address to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletAddress', walletAddress);
    }

    // Check if wallet data is already in the cache
    const cachedData = globalDataCache.wallets?.[walletAddress];
    if (cachedData) {
      setShowWalletInfo(true);
      return; // Data already in cache, no need to fetch again
    }

    setIsLoading(true);
    setShowWalletInfo(false);

    try {
      const response = await fetch(`/api/portfolio?address=${encodeURIComponent(walletAddress)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Store wallet data in the cache
      setGlobalDataCache((prevCache) => ({
        ...prevCache,
        wallets: {
          ...prevCache.wallets,
          [walletAddress]: data,
        },
      }));

      setShowWalletInfo(true);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error fetching wallet information: ${error.message}`);
      } else {
        alert('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* Only show this part if wallet info hasn't been shown */}
        {!showWalletInfo && (
          <>
            <h1 className="header">BlockHound</h1>
            <p className="explorer-text">
              Explore token balances, NFT holdings, activity, and insights for any EVM wallet
            </p>
            <div className="search-container">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter EVM address or ENS domain"
                className="form-control"
              />
              <button
                className="btn btn-primary"
                onClick={handleCheckWallet}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Check Wallet'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Now, WalletInfo reads directly from the cache */}
      {showWalletInfo && <WalletInfo />}
      
      {/* Show loading spinner only if data is still being fetched */}
      {isLoading && !showWalletInfo && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default App;
