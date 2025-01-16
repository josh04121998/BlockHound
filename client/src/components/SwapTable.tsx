// components/SwapTable.tsx
import React from 'react';
import { Swap } from './swaps';
import './SwapTable.css';

interface SwapTableProps {
  swaps: Swap[];
}

const SwapTable: React.FC<SwapTableProps> = ({ swaps }) => {
  return (
    <div className="swap-table-container">
      <table className="swap-table">
        <thead>
          <tr>
            <th>Token Pair</th>
            <th>Type</th>
            <th>Bought</th>
            <th>Sold</th>
            <th>Exchange</th>
            <th>Value (USD)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {swaps.map((swap) => (
            <tr key={swap.transactionHash}>
              <td>{swap.pairLabel}</td>
              <td>{swap.transactionType}</td>
              <td>
                <img src={swap.bought.logo} alt={swap.bought.name} className="token-logo" />
                {swap.bought.amount} {swap.bought.symbol}
              </td>
              <td>
                <img src={swap.sold.logo} alt={swap.sold.name} className="token-logo" />
                {Math.abs(Number(swap.sold.amount))} {swap.sold.symbol}
              </td>
              <td>
                <img src={swap.exchangeLogo} alt={swap.exchangeName} className="exchange-logo" />
                {swap.exchangeName}
              </td>
              <td>${swap.totalValueUsd.toFixed(2)}</td>
              <td>{new Date(swap.blockTimestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SwapTable;
