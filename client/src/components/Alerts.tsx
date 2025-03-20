import React, { useState } from 'react';
import './Alerts.css'; // Assuming you’ll tweak CSS to match

const Alerts: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to subscribe');
      }

      const result = await response.json();
      console.log('Success:', result);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting email:', error);
    }
  };

  return (
    <div className="alerts-page">
      <h1>Join the Block Hound Community</h1>
      <p className="sales-pitch">
      Join our community of traders & investors! Get the latest Blockhound updates, live whale alerts, and trade smarter together. Jump in now!
      </p>
      <a 
        href="https://discord.gg/nFvyF78A" 
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