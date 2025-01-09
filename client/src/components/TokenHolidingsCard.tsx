import React from 'react';
import './TokenHoldingsCard.css';
import * as utilities from './Utilities';

interface Token {
  name: string;
  symbol: string;
  logo: string | null;
  balance_formatted: string;
  usd_price: string;
  usd_price_24hr_percent_change: number | null;
  usd_price_24hr_usd_change: number | null;
  usd_value: string;
  usd_value_24hr_usd_change: number | null;
  portfolio_percentage: number;
}

interface TokenHoldingsCardProps {
  tokenBalances: Token[];
}

const TokenHoldingsCard: React.FC<TokenHoldingsCardProps> = ({ tokenBalances }) => {
  const validTokens = tokenBalances.filter(
    (token) =>
      token.usd_price !== '' &&
      token.usd_price_24hr_percent_change !== null &&
      token.usd_price_24hr_usd_change !== null &&
      token.usd_value !== '' &&
      token.usd_value_24hr_usd_change !== null
  );

  return (
<div className="wallet-card token-holdings-card">
  <div className="token-list-wrapper">
    <div className="token-list">
      {/* Table Header */}
      <div className="table-header">
        <div className="table-cell">Token</div>
        <div className="table-cell">Price</div>
        <div className="table-cell">Balance</div>
        <div className="table-cell">Value</div>
        <div className="table-cell">24hr Change</div>
        <div className="table-cell">Portfolio Percentage</div>
      </div>

      {/* Table Rows */}
      <div className="table-body">
        {validTokens.map((token, index) => (
          <div className="table-row" key={index}>
            <div className="table-cell">
              <div className="token">
                <img
                  src={token.logo || '/images/unknown.png'}
                  alt={token.name}
                  className="token-logo"
                />
                <div>
                  <div className="token-name">{token.name}</div>
                  <div className="token-symbol">{token.symbol}</div>
                </div>
              </div>
            </div>
            <div className="table-cell">${token.usd_price}</div>
            <div className="table-cell">{token.balance_formatted}</div>
            <div className="table-cell">${utilities.formatPriceNumber(Number(token.usd_value).toFixed(2))}</div>
            <div className="table-cell">
              <span
                className={token.usd_price_24hr_percent_change && token.usd_price_24hr_percent_change > 0 ? 'positive' : 'negative'}
              >
                {token.usd_price_24hr_percent_change !== null
                    ? token.usd_price_24hr_percent_change.toFixed(2)
                    : '0.00'}%
              </span>
            </div>
            <div className="table-cell">{token.portfolio_percentage.toFixed(2)}%</div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
  );
};

export default TokenHoldingsCard;
