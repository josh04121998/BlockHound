import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from './DataContext';
import * as utilities from './Utilities';
import CopyToClipboard from '././components/CopyToClipboard'; // Ensure correct import path

const WalletInfo: React.FC = () => {
  const { globalDataCache } = useData(); // Access the cache
  const walletAddress = globalDataCache.walletAddress;

  if (!walletAddress) {
    // Handle the case where walletAddress is missing or invalid
    return <div className="error-message">Wallet address is missing.</div>;
  }

  const walletData = globalDataCache.wallets[walletAddress];

  if (!walletData) {
    return <div className="error-message">No data available for this wallet.</div>;
  }

  return (
    <div className="wallet-info-container">
      <div className="container overview">
        <div className="page-header">
          <h2>
            Wallet Summary
            <div className="domains">
              <div>
                <Link
                  to={`https://etherscan.io/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className="etherscan"
                    src="/images/etherscan.svg"
                    alt="etherscan"
                  />
                  {utilities.shortAddress(walletAddress)}
                </Link>
              </div>
            </div>
          </h2>
        </div>

        <div className="wallet-card top">
          <div className="title">Wallet Profile</div>

          <div className="row">
            <div className="col-lg-9">
              <div className="row">
                <div className="col-lg-4">
                  <div className="profile-intro">
                    <div>
                      <img
                        src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${walletAddress}`}
                        alt="profile"
                        className="profile-image"
                      />
                    </div>

                    <div>
                      <div className="heading">Address</div>
                      <div className="big-value networth copy-container">
                        {utilities.shortAddress(walletAddress)}
                        <CopyToClipboard valueToCopy={walletAddress || ''} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional wallet data display logic (e.g., balances, NFTs, etc.) */}
                <div className="col-lg-8">
                  {/* You can display additional wallet data such as balances here */}
                  <div className="wallet-details">
                    <h4>Wallet Details</h4>
                    <div>
                      {/* Example of wallet data */}
                      <p><strong>Token Balance:</strong> {walletData.tokenBalance || 'N/A'}</p>
                      <p><strong>NFTs:</strong> {walletData.nfts ? walletData.nfts.length : 'N/A'} NFTs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
