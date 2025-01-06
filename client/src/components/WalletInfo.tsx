import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as utilities from './Utilities';
import CopyToClipboard from './CopyToClipboard';
import { useData } from '../DataContext'; // Import the useData hook
import './WalletInfo.css';

const WalletInfo: React.FC = () => {
  const { walletAddress } = useParams();
  const navigate = useNavigate();
  const { globalDataCache, setGlobalDataCache } = useData();
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      navigate('/wallets'); // Redirect if walletAddress is missing
      return;
    }

    const fetchWalletData = async () => {
      setIsLoading(true);
      setError(null);

      // Check if wallet data is already cached
      if (globalDataCache.walletData && globalDataCache.walletData[walletAddress]) {
        setWalletData(globalDataCache.walletData[walletAddress]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/portfolio?address=${encodeURIComponent(walletAddress)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Cache the fetched wallet data
        setGlobalDataCache({
          ...globalDataCache,
          walletData: {
            ...globalDataCache.walletData,
            [walletAddress]: data,
          },
        });

        setWalletData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [walletAddress, navigate, globalDataCache, setGlobalDataCache]);

  if (isLoading) {
    return <div className="loading-message">Loading wallet data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!walletData) {
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
                <img className="etherscan" src="/images/etherscan.svg" alt="etherscan" />
                {utilities.shortAddress(walletAddress)}
              </a>
            </div>
          </div>
        </h2>
      </div>

      <div className="wallet-card top">
        <div className="title">Wallet Profile</div>

        <div className="row">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="row">
              <div className="col-12">
                <div className="profile-intro">
                  <div>
                    <div className="heading">Address</div>
                    <div className="big-value networth copy-container">
                      {utilities.shortAddress(walletAddress)}
                      <CopyToClipboard valueToCopy={walletAddress || ''} />
                    </div>
                  </div>
                  <div className="col networth">
                    <div className="heading">Cross-chain Networth</div>
                    <div className="big-value">
                      $
                      {walletData.netWorth?.total_networth_usd
                        ? utilities.formatPriceNumber(walletData.netWorth.total_networth_usd)
                        : '0'}
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
