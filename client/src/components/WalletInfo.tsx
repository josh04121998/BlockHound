import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as utilities from './Utilities';
import CopyToClipboard from './CopyToClipboard';
import { useData } from '../DataContext';
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

  // Extract first and last seen dates
  const activeChain = walletData.activeChains?.active_chains?.[0];
  const firstSeen = activeChain?.first_transaction?.block_timestamp || 'N/A';
  const lastSeen = activeChain?.last_transaction?.block_timestamp || 'N/A';

  // Format the timestamp with date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="container overview">
      <div className="page-header">
        <h2>Wallet Summary
        <div className="wallet-info-pill">
            <Link
              to={`https://etherscan.io/address/${walletAddress}`}
              target="_blank"
              className="wallet-link"
            >
              <img
                className="etherscan"
                src="/images/etherscan.svg"
                alt="etherscan"
              />
              {utilities.shortAddress(walletAddress)}
            </Link>
          </div>
        </h2>
      </div>

      <div className="wallet-card">
        {/* Top row */}
        <div className="row top-row">
          <div className="section">
            <div className="heading">Address</div>
            <div className="value">
              {utilities.shortAddress(walletAddress)}
              <CopyToClipboard valueToCopy={walletAddress || ''} />
            </div>
          </div>
          <div className="section">
            <div className="heading">Chain</div>
            <div className="value">Ethereum</div>
          </div>
          <div className="section">
            <div className="heading">Cross-chain Networth</div>
            <div className="value">
              $
              {walletData.netWorth?.total_networth_usd
                ? utilities.formatPriceNumber(walletData.netWorth.total_networth_usd)
                : '0'}
            </div>
          </div>
        </div>

        {/* Second row */}
        <div className="row second-row">
          <div className="section">
            <div className="heading">First Seen</div>
            <div className="value">{firstSeen !== 'N/A' ? formatTimestamp(firstSeen) : 'N/A'}</div>
          </div>
          <div className="section">
            <div className="heading">Last Seen</div>
            <div className="value">{lastSeen !== 'N/A' ? formatTimestamp(lastSeen) : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
