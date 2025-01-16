// components/SwapList.tsx
import React, { useEffect, useState } from 'react';
import SwapTable from './SwapTable';
import SwapCard from './SwapCard';
import Loading from './Loading';
import { Link, useParams } from 'react-router-dom';
import { Swap } from './swaps';
import * as utilities from './Utilities';

const SwapList: React.FC = () => {
  const { walletAddress } = useParams();
  const [loading, setLoading] = useState(false);
  const [swaps, setSwaps] = useState<Swap[] | null>(null);

  useEffect(() => {
    const fetchPNLData = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/swaps?address=${walletAddress}`);
        const data = await response.json();
        setSwaps(data.result || []); // Use the `result` key from the API response
      } catch (error) {
        console.error('Error fetching PNL data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPNLData();
  }, [walletAddress]);

  if (loading) {
    return <Loading />;
  }

  if (!swaps || swaps.length === 0) {
    return <div>No data available.</div>;
  }

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="swap-list">
                <div className="page-header">
            <h2>
              Recent Swaps
              <div className="wallet-info-pill">
                <Link to={`https://etherscan.io/address/${walletAddress}`} target="_blank" className="wallet-link">
                  <img className="etherscan" src="/images/etherscan.svg" alt="etherscan" />
                  {utilities.shortAddress(walletAddress)}
                </Link>
              </div>
            </h2>
          </div>
      {isMobile ? (
        swaps.map((swap) => <SwapCard key={swap.transactionHash} swap={swap} />)
      ) : (
        <SwapTable swaps={swaps} />
      )}
    </div>
  );
};

export default SwapList;
