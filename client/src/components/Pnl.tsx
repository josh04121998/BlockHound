import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

// **Types**
import { OpenProfit, CacheToken } from './PnlDTO';

// **Utilities & Context**
import { useData } from '../DataContext';
import { calculateOpenProfits } from '../function/openProfit';
import * as utilities from './Utilities';

// **Components**
import Loading from './Loading';
import TokenPnlCard from './TokenPnlCard';
import OpenProfits from '../components/OpenProfits';

// **Styles**
import './PNL.css';

const PNL: React.FC = () => {
  const { walletAddress } = useParams<{ walletAddress: string }>();
  const navigate = useNavigate();
  const { globalDataCache } = useData();

  // **State**
  const [pnlData, setPnlData] = useState<any>(null);
  const [openProfits, setOpenProfits] = useState<OpenProfit[]>([]);
  const [loading, setLoading] = useState(false);

  // **Redirect if Wallet Address is Missing**
  useEffect(() => {
    if (!walletAddress) {
      navigate('/wallets');
    }
  }, [walletAddress, navigate]);

  // **Fetch PNL Data**
  useEffect(() => {
    const fetchPNLData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/pnl?address=${walletAddress}`);
        const data = await response.json();
        setPnlData(data);
      } catch (error) {
        console.error('Error fetching PNL data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchPNLData();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (pnlData && walletAddress) {
      const walletEntry = globalDataCache.walletData?.[walletAddress];
      const cacheData = Array.isArray(walletEntry?.tokenBalancesPrice)
        ? (walletEntry.tokenBalancesPrice as CacheToken[])
        : [];
  
      if (cacheData.length > 0) {
        setOpenProfits(calculateOpenProfits(cacheData, pnlData));
      } else {
        console.warn(`⚠️ Warning: No token balance data found for wallet ${walletAddress}.`);
      }
    }
  }, [pnlData, walletAddress, globalDataCache]);

  // **Show Loading Screen**
  if (loading) {
    return <Loading />;
  }

  // **Show No Data Message**
  if (!pnlData) {
    return <div>No data available.</div>;
  }

  // **Extract PnL Summary**
  const { profitabilitySummary } = pnlData;

  return (
    <div className="container pnl-container">
      <div className="page-header">
        <h2>
          Profit and Loss (PNL)
          <div className="wallet-info-pill">
            <Link to={`https://etherscan.io/address/${walletAddress}`} target="_blank" className="wallet-link">
              <img className="etherscan" src="/images/etherscan.svg" alt="etherscan" />
              {utilities.shortAddress(walletAddress)}
            </Link>
          </div>
        </h2>
      </div>

      {/* PNL Summary Card */}
      <div className="pnl-card">
        <div className="pnl-box">
          <div className="pnl-heading">Realized PnL %</div>
          <div className="pnl-value">{profitabilitySummary.total_realized_profit_percentage.toFixed(2)}%</div>
        </div>
        <div className="pnl-box">
          <div className="pnl-heading">Realized PnL $</div>
          <div className="pnl-value">${parseFloat(profitabilitySummary.total_realized_profit_usd).toLocaleString()}</div>
        </div>
        <div className="pnl-box">
          <div className="pnl-heading">Total Trade Volume</div>
          <div className="pnl-value">${parseFloat(profitabilitySummary.total_trade_volume).toLocaleString()}</div>
        </div>
        <div className="pnl-box">
          <div className="pnl-heading">Total Trades</div>
          <div className="pnl-value">{profitabilitySummary.total_count_of_trades}</div>
        </div>
      </div>

      <div className="pnl-separator">
      {/* Token PnL Section */}
      <TokenPnlCard tokens={pnlData.profitability.result} />
      </div>
      {/* Open Profits Section */}
      <OpenProfits openProfits={openProfits} />
    </div>
  );
};

export default PNL;
