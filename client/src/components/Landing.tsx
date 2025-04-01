import React from 'react';
import Footer from './Footer';
import Header from './Header';
import Hero from './Hero';
import Benefits from './Benefits';
import MarketData from './MarketData';
import './Landing.css'; // Import the new CSS file

const Landing: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <main className="container">
        <Hero />
        <Benefits />
        <MarketData />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;