import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WalletInput.css'; // Import the CSS file
import { isAddress } from 'web3-validator';

const WalletInput: React.FC = () => {
  const [walletAddress, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null); // Track input errors
  const navigate = useNavigate();

  const handleCheckWallet = async () => {
    setError(null); // Reset any existing error

    if (!walletAddress.trim()) {
      setError('Please enter an EVM address or ENS domain.');
      return;
    }

    if (!isAddress(walletAddress)) {
      setError('Please enter a valid EVM address or ENS domain.');
      return;
    }

    // Navigate only if input is valid
    await navigate(`/wallets/${walletAddress}`);
  };

  return (
    <div className="wallet-container">
      <h1 className="wallet-title">BlockHound</h1>
      <p className="wallet-description">
        Explore token balances, activity, and insights for any EVM wallet.
      </p>
      <div className="wallet-input-group">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setAddress(e.target.value)}
          className={`wallet-input ${error ? 'input-error' : ''}`}
          placeholder="Enter ethereum address"
          aria-label="Ethereum wallet address input"
        />
        <button onClick={handleCheckWallet} className="wallet-button">
          Check Wallet
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default WalletInput;
