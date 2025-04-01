import React, { useState, useEffect } from 'react';

// Define the shape of the market data
interface MarketItem {
  name: string;
  price: number;
}

const MarketData: React.FC = () => {
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/crypto')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: MarketItem[]) => {
        setData(data);
        setLoading(false);
      })
      .catch((error: Error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">Error: {error}</div>;

  return (
    <section className="market-data py-5">
      <h2 className="text-center mb-4">Live Market Data</h2>
      <div className="market-cards-container">
        {data.map((item, index) => (
          <div key={index} className="market-card">
            <h5 className="card-title">{item.name}</h5>
            <p className="card-text">${item.price} USD</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarketData;