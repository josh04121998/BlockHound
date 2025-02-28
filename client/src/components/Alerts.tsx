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
      <h1>Join the Block Hound Pack</h1>
      <p className="sales-pitch">
        Into crypto? Block Hound’s your crew. We’re a community that lives it—tracking whale moves, 
        swapping market vibes, and keeping it real. No fluff, just the pack. Hop in now!
      </p>
      <a 
        href="https://discord.gg/nFvyF78A" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="discord-button"
      >
        Join the Discord Pack
      </a>
      {!submitted ? (
        <form className="email-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Want updates from the pack?</label>
          <div className="form-group">
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Sign Up</button>
          </div>
        </form>
      ) : (
        <p className="thank-you-message">Thanks for joining the hunt! We’ll bark at you soon.</p>
      )}
    </div>
  );
};

export default Alerts;