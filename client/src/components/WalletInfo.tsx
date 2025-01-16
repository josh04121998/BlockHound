import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import * as utilities from './Utilities';
import CopyToClipboard from './CopyToClipboard';
import { useData } from '../DataContext';
import './WalletInfo.css';
import TokenDistributionChart from './TokenDistributionChart';
import TokenHoldingsCard from './TokenHolidingsCard';
import Loading from './Loading';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import SwapList from './SwapsList';

const WalletInfo: React.FC = () => {
  const { walletAddress } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
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
    return <Loading />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!walletData) {
    return <div className="error-message">No data available for this wallet.</div>;
  }

  const activeChain = walletData.activeChains?.active_chains?.[0];
  const firstSeen = activeChain?.first_transaction?.block_timestamp || 'N/A';
  const lastSeen = activeChain?.last_transaction?.block_timestamp || 'N/A';
  const tokenBalances = walletData.tokenBalancesPrice.map((token: any) => ({
    name: token.name,
    portfolio_percentage: token.portfolio_percentage,
  }));

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Check if current route is PNL
  const isPNLPage = location.pathname.endsWith('/pnl');
  const isSwapsPage = location.pathname.endsWith('/swaps');
  

  return (
    <>
    <Navbar />
    <div className="container overview">
      {/* Only show the Outlet (PNL content) if on the PNL page */}
      {isPNLPage ? (
        <Outlet />
      ) : isSwapsPage ? (
      <SwapList/>
      ) : (
        <>
          <div className="page-header">
            <h2>
              Wallet Profile
              <div className="wallet-info-pill">
                <Link to={`https://etherscan.io/address/${walletAddress}`} target="_blank" className="wallet-link">
                  <img className="etherscan" src="/images/etherscan.svg" alt="etherscan" />
                  {utilities.shortAddress(walletAddress)}
                </Link>
              </div>
            </h2>
          </div>

          <div className="wallet-card">
            <div className="info-section">
              <div className="row">
                <div className="col-lg-4">
                  <div className="heading">Address</div>
                  <div className="big-value networth copy-container">
                    {utilities.shortAddress(walletAddress)}
                    <CopyToClipboard valueToCopy={walletAddress || ''} />
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="heading">Chain</div>
                  <div className="big-value">Ethereum</div>
                </div>
                <div className="col-lg-4">
                  <div className="heading">Networth</div>
                  <div className="big-value">
                    $
                    {walletData.netWorth?.total_networth_usd
                      ? utilities.formatPriceNumber(walletData.netWorth.total_networth_usd)
                      : '0'}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-4">
                  <div className="heading">First Seen</div>
                  <div className="big-value">
                    {firstSeen !== 'N/A' ? formatTimestamp(firstSeen) : 'N/A'}
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="heading">Last Seen</div>
                  <div className="big-value">
                    {lastSeen !== 'N/A' ? formatTimestamp(lastSeen) : 'N/A'}
                  </div>
                </div>
                <div className="col-lg-4"></div>
              </div>
            </div>

            <div className="chart-section">
              <div className="chart-header">Portfolio Breakdown</div>
              <TokenDistributionChart tokenBalances={tokenBalances} />
            </div>
          </div>

          <TokenHoldingsCard tokenBalances={walletData.tokenBalancesPrice} />
        </>
      )}
    </div>
    </>
  );
};

export default WalletInfo;
