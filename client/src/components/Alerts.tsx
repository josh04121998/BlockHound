import React from 'react';
import './Alerts.css';

const Alerts: React.FC = () => {
  return (
    <div className="alerts-page">
      <h1>Join the Block Hound Community</h1>
      <p className="sales-pitch">
        Join our community of traders & investors! Get the latest Blockhound updates, live whale alerts, and trade smarter together. Jump in now!
      </p>
      <a 
        href="https://discord.gg/n7U5EYZuUX" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="discord-button"
      >
        Join the Discord Pack
      </a>
    </div>
  );
};

export default Alerts;