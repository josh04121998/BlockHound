import React, { useState } from 'react';
import './Alerts.css'
const Alerts: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      // Call the /api/alerts endpoint with the email
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }), // Assumes you have `email` in state
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to subscribe');
      }
  
      const result = await response.json();
      console.log('Success:', result);
  
      // Show confirmation or feedback
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting email:', error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="alerts-page">
      <h1>Coming Soon</h1>
      <p className="sales-pitch">
        Stay ahead of the market with real-time alerts! Track whale wallet movements and receive
        insights from our AI-powered trading bot. Don't miss out on the latest trends and
        opportunities.
      </p>
      {submitted ? (
        <p className="thank-you-message">Thank you for signing up! We'll keep you updated.</p>
      ) : (
        <form className="email-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Sign up for updates:</label>
          <div className="form-group">
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Alerts;
