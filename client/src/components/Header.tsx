import React from 'react';
import './Header.css'
const Header: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <a className="navbar-brand" href="/">Block Hound</a>
        <div className="menu">
          <a href="/wallets" className="btn btn-primary">Portfolio Tracker</a>
          <a
            href="https://discord.gg/n7U5EYZuUX"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Join Now
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Header;