import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WalletInput: React.FC = () => {
  const [walletAddress, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedWalletAddress = sessionStorage.getItem('walletAddress');
    if (savedWalletAddress) {
      setAddress(savedWalletAddress);
    }
  }, []);

  const handleCheckWallet = async () => {
    if (!walletAddress) {
      alert('Please enter an EVM address or ENS domain.');
      return;
    }

    // Save the wallet address in session storage
    sessionStorage.setItem('walletAddress', walletAddress);

    setIsLoading(true);

    try {
      // Fetch wallet data from the API
      const response = await fetch(`/api/portfolio?address=${encodeURIComponent(walletAddress)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Pass the data through navigate to WalletInfo component
      navigate(`/wallets/${walletAddress}`, { state: { walletData: data } });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An unexpected error occurred.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Enter Wallet Address</h1>
      <input
        type="text"
        value={walletAddress}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter EVM address or ENS domain"
      />
      <button onClick={handleCheckWallet} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Check Wallet'}
      </button>
    </div>
  );
};

export default WalletInput;
