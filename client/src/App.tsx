import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WalletInput from './components/WalletInput'; // Component for entering wallet address
import WalletInfo from './components/WalletInfo'; // Component for wallet details
import Pnl from './components/Pnl';
import SwapList from './components/SwapsList';
import Alerts from './components/Alerts';
import Landing from './components/Landing';
// import Approvals from './components/Approvals';
// import History from './components/History';
// import DeFiPositions from './components/DefiPositions';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* Main page for wallet input */}
      <Route path="/wallets" element={<WalletInput />} />

      {/* Dynamic route for wallet details */}
      <Route path="/wallets/:walletAddress" element={<WalletInfo />}>
        <Route path="pnl" element={<Pnl />} />
        <Route path="swaps" element={<SwapList />} />
        <Route path="alerts" element={<Alerts />} />
        {/* <Route path="defi-positions" element={<DeFiPositions />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="history" element={<History />} /> */}
      </Route>


      {/* Redirect unknown routes to /wallets */}
      <Route path="*" element={<Navigate to="/wallets" />} />
    </Routes>
  );
};

export default App;