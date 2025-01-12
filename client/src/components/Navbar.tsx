import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { walletAddress } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="wallet-navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/wallets">
          <h1>BlockHound</h1>
        </Link>
      </div>

      <div
        className={`burger-menu ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="burger-line"></div>
        <div className="burger-line"></div>
        <div className="burger-line"></div>
      </div>


      <ul className={`nav-links ${isMenuOpen ? 'show' : ''}`}>
        <li>
          <Link to={`/wallets/${walletAddress}`} onClick={() => setIsMenuOpen(false)}>
            Overview
          </Link>
        </li>
        <li>
          <Link to={`/wallets/${walletAddress}/pnl`} onClick={() => setIsMenuOpen(false)}>
            PNL
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
