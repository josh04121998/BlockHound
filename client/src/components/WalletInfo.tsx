import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as utilities from './Utilities';
import CopyToClipboard from './CopyToClipboard';
import './WalletInfo.css';

const WalletInfo: React.FC = () => {
  const { walletAddress } = useParams();
  const { state } = useLocation(); // Access passed state
  const navigate = useNavigate();

  // If state was passed, it will contain the walletData
  const walletData = state?.walletData;

  useEffect(() => {
    if (!walletAddress || !walletData) {
      navigate('/wallets'); // Redirect back to main page if data is missing
    }
  }, [walletAddress, walletData, navigate]);

  if (!walletAddress || !walletData) {
    return <div className="error-message">No data available for this wallet.</div>;
  }

  return (
    <div className="container overview">
      <div className="page-header">
        <h2>
          Wallet Summary
          <div className="domains">
            <div>
              <a
                href={`https://etherscan.io/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="etherscan"
                  src="/images/etherscan.svg"
                  alt="etherscan"
                />
                {utilities.shortAddress(walletAddress)}
              </a>
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
                    <div className="heading">Address</div>
                    <div className="big-value networth copy-container">
                      {utilities.shortAddress(walletAddress)}
                      <CopyToClipboard valueToCopy={walletAddress || ''} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="wallet-details">
                  <h4>Wallet Details</h4>
                  <div>
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
  );
};

export default WalletInfo;
