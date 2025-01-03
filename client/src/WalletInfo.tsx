import React from 'react';

interface WalletInfoProps {
  walletData: string | null; // You can modify this type to match your expected data structure
}

const WalletInfo: React.FC<WalletInfoProps> = ({ walletData }) => {
  if (!walletData) {
    return <div>No wallet data available.</div>;
  }
  const parsedData = JSON.parse(walletData);
  return (
    <div>
      <h3>Wallet Information</h3>
      <div><strong>Balance:</strong> {parsedData.balance}</div>
      <div><strong>Token:</strong> {parsedData.token}</div>
    </div>
  );
};

export default WalletInfo;
