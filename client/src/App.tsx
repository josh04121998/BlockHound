import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './App.css'; // Your custom CSS
import WalletInfo from './WalletInfo'; // Import your new component

const App: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletAddress, setAddress] = useState('');
  const [showWalletInfo, setShowWalletInfo] = useState(false); // Track whether wallet info should be displayed

  const handleCheckWallet = async () => {
    if (!walletAddress) {
      alert('Please enter an EVM address or ENS domain.');
      return;
    }

    setIsLoading(true);
    setWalletInfo(null); // Clear any previous data
    setShowWalletInfo(false); // Hide wallet info until it's fetched

    try {
      const response = await fetch(`/api/portfolio?address=${encodeURIComponent(walletAddress)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWalletInfo(JSON.stringify(data, null, 2)); // Format the data as a string for display
    } catch (error) {
      if (error instanceof Error) {
        setWalletInfo(`Error fetching wallet information: ${error.message}`);
      } else {
        setWalletInfo('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
      setShowWalletInfo(true); // Show wallet info after data is fetched
    }
  };

  return (
    <div className="app-container">
      {!showWalletInfo ? (
        <div className="content-wrapper">
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
        </div>
      ) : (
        // Display WalletInfo component once data is fetched
        <WalletInfo walletData={walletInfo} />
      )}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default App;
