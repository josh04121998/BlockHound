import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WalletInput.css'; // Import the CSS file

const WalletInput: React.FC = () => {
  const [walletAddress, setAddress] = useState('');
  const navigate = useNavigate();

  const handleCheckWallet = async () => {
    if (!walletAddress) {
      alert('Please enter an EVM address or ENS domain.');
      return;
    }

    await navigate(`/wallets/${walletAddress}`);
  };

  return (
    <div className="wallet-container">
      <h1 className="wallet-title">View Wallet</h1>
      <p className="wallet-description">
        Explore token balances, NFT holdings, activity, and insights for any EVM wallet.
      </p>
      <div className="wallet-input-group">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setAddress(e.target.value)}
          className="wallet-input"
          placeholder="Enter EVM address or ENS domain"
        />
        <button onClick={handleCheckWallet} className="wallet-button">
          Check Wallet
        </button>
      </div>
    </div>
  );
};

export default WalletInput;
