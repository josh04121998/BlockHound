import React from 'react';
import { OpenProfit } from './PnlDTO';
import './OpenProfits.css'; // Import the new CSS

interface OpenProfitsProps {
  openProfits: OpenProfit[];
}

const OpenProfits: React.FC<OpenProfitsProps> = ({ openProfits }) => {
  return (
    <div className="open-profits-card">
      <h3>Open Profits</h3>
      <div className="open-profits-list-wrapper">
        <div className="open-profits-list">
          {/* Table Header */}
          <div className="open-profits-header">
            <div className="table-cell">Token</div>
            <div className="table-cell">Remaining</div>
            <div className="table-cell">Current Value</div>
            <div className="table-cell">Cost Basis</div>
            <div className="table-cell">Open Profit</div>
          </div>

          {/* Table Body */}
          <div className="open-profits-body">
            {openProfits.length === 0 ? (
              <div className="open-profit-row">
                <div className="open-profit-cell">No open profits to display.</div>
              </div>
            ) : (
              openProfits.map((token) => (
                <div key={token.symbol} className="open-profit-row">
                  <div className="open-profit-cell">
                    <div className="token">
                      <img
                        src={token.logo}
                        alt={token.name}
                        className="token-logo"
                      />
                      <div>
                        <div className="token-name">{token.name}</div>
                        <div className="token-symbol">{token.symbol}</div>
                      </div>
                    </div>
                  </div>
                  <div className="open-profit-cell">{token.remainingTokens.toFixed(4)}</div>
                  <div className="open-profit-cell">${token.currentValue.toLocaleString()}</div>
                  <div className="open-profit-cell">${token.costBasis.toLocaleString()}</div>
                  <div className={`open-profit-cell ${token.openProfit >= 0 ? 'positive' : 'negative'}`}>
                    ${token.openProfit.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenProfits;
