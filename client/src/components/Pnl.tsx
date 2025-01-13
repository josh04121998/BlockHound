import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './PNL.css';
import Loading from './Loading';
import TokenPnlCard from './TokenPnlCard';

const PNL: React.FC = () => {
  const { walletAddress } = useParams();
  const [pnlData, setPnlData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

    fetchPNLData();
  }, [walletAddress]);

  if (loading) {
    return <Loading/>
  }

  if (!pnlData) {
    return <div>No data available.</div>;
  }

  const { profitabilitySummary } = pnlData;

  return (
    <div className="container pnl-container">
      <h2>Profit and Loss (PNL)</h2>

      {/* PNL Summary Card */}
      <div className="pnl-card">
        <div className="pnl-box">
          <div className="pnl-heading">Realized PnL %</div>
          <div className="pnl-value">
            {profitabilitySummary.total_realized_profit_percentage.toFixed(2)}%
          </div>
        </div>
        <div className="pnl-box">
          <div className="pnl-heading">Realized PnL $</div>
          <div className="pnl-value">
            ${parseFloat(profitabilitySummary.total_realized_profit_usd).toLocaleString()}
          </div>
        </div>
        <div className="pnl-box">
          <div className="pnl-heading">Total Trade Volume</div>
          <div className="pnl-value">
            ${parseFloat(profitabilitySummary.total_trade_volume).toLocaleString()}
          </div>
        </div>
        <div className="pnl-box">
          <div className="pnl-heading">Total Trades</div>
          <div className="pnl-value">{profitabilitySummary.total_count_of_trades}</div>
        </div>
      </div>
      <TokenPnlCard tokens={pnlData.profitability.result} />

    </div>
  );
};

export default PNL;
