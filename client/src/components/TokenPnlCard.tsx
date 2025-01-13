import React from 'react';
import './TokenPnlCard.css';

interface Token {
  name: string;
  symbol: string;
  logo: string | null;
  count_of_trades: number;
  realized_profit_usd: string;
  realized_profit_percentage: number;
  total_buys: number;
  total_sells: number;
}

interface TokenPnlCardProps {
  tokens: Token[];
}

const TokenPnlCard: React.FC<TokenPnlCardProps> = ({ tokens }) => {
    const filteredTokens = tokens.filter(
        (token) => token.realized_profit_usd && token.realized_profit_percentage
      );
  return (
    <div className="wallet-card token-pnl-card">
    <div className="token-pnl-list-wrapper">
      <div className="token-pnl-list">
        {/* Table Header */}
        <div className="table-header">
          <div className="table-cell">Token</div>
          <div className="table-cell">Trades</div>
          <div className="table-cell">Realized PnL $</div>
          <div className="table-cell">Realized PnL %</div>
        </div>
  
        {/* Table Rows */}
        <div className="table-body">
          {filteredTokens.map((token, index) => (
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
              <div className="table-cell">{token.count_of_trades}</div>
              <div className="table-cell">${parseFloat(token.realized_profit_usd).toFixed(2)}</div>
              <div className="table-cell">
                <span
                  className={
                    token.realized_profit_percentage > 0 ? 'positive' : 'negative'
                  }
                >
                  {token.realized_profit_percentage.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  
  );
};

export default TokenPnlCard;
