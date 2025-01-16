// components/SwapCard.tsx
import React from 'react';
import { Swap } from './swaps';
import './SwapCard.css'

interface SwapCardProps {
  swap: Swap;
}

const SwapCard: React.FC<SwapCardProps> = ({ swap }) => {
  return (
    <div className="swap-card">
      <h3>{swap.pairLabel}</h3>
      <p>Type: {swap.transactionType}</p>
      <p>
        Bought: <img src={swap.bought.logo} alt={swap.bought.name} className="token-logo" />
        {swap.bought.amount} {swap.bought.symbol}
      </p>
      <p>
        Sold: <img src={swap.sold.logo} alt={swap.sold.name} className="token-logo" />
        {Math.abs(Number(swap.sold.amount))} {swap.sold.symbol}
      </p>
      <p>
        Exchange: <img src={swap.exchangeLogo} alt={swap.exchangeName} className="exchange-logo" />
        {swap.exchangeName}
      </p>
      <p>Value (USD): ${swap.totalValueUsd.toFixed(2)}</p>
      <p>Date: {new Date(swap.blockTimestamp).toLocaleString()}</p>
    </div>
  );
};

export default SwapCard;
