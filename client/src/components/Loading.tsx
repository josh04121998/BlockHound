import React from 'react';
import './Loading.css';

const Loading: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div className="loading-text">Loading...</div>
    </div>
  );
};

export default Loading;
