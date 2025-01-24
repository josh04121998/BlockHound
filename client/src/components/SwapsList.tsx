// components/SwapList.tsx
import React, { useEffect, useState } from 'react';
import SwapTable from './SwapTable';
import SwapCard from './SwapCard';
import Loading from './Loading';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Swap } from './swaps';
import * as utilities from './Utilities';

const SwapList: React.FC = () => {
  const navigate = useNavigate();
  const { walletAddress } = useParams();
  const [loading, setLoading] = useState(false);
  const [swaps, setSwaps] = useState<Swap[]>([]); // Ensure swaps is always an array

  useEffect(() => {
    if (!walletAddress) {
      navigate('/wallets'); // Redirect if walletAddress is missing
      return;
    }

    const fetchSwapsData = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/swaps?address=${encodeURIComponent(walletAddress)}`);

        if (!response.ok) {
          console.error(`Error: Received status ${response.status}`);
          setSwaps([]); // Set swaps to an empty array on error
          return;
        }

        const data = await response.json();

        // Ensure `swaps` is always an array
        const result = Array.isArray(data.result) ? data.result : [];
        setSwaps(result);
      } catch (error) {
        console.error('Error fetching Swaps data:', error);
        setSwaps([]); // Set swaps to an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchSwapsData();
  }, [walletAddress, navigate]);

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
