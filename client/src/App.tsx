import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './App.css'; // Your custom CSS

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="content-wrapper">
        <h1 className="header">BlockHound</h1>
        <p className="explorer-text">
          Explore token balances, NFT holdings, activity and insights for any EVM wallet
        </p>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Enter EVM address or ENS domain" 
            className="form-control" 
          />
          <button className="btn btn-primary">Check Wallet</button>
        </div>
      </div>
    </div>
  );
};

export default App;