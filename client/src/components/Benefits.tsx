import React from 'react';
import './Benifits.css';
const Benefits: React.FC = () => {
  return (
    <section className="benefits py-5">
      <h2 className="text-center mb-4">Why Join Us?</h2>
      <div className="benefits-cards-container">
        <div className="card">
          <h3 className="card-title">Real-time Discussions</h3>
          <p className="card-text">Engage in live chats about market trends and opportunities.</p>
        </div>
        <div className="card">
          <h3 className="card-title">Expert Insights</h3>
          <p className="card-text">Learn from experienced traders and investors.</p>
        </div>
        <div className="card">
          <h3 className="card-title">Networking</h3>
          <p className="card-text">Connect with like-minded individuals and grow your network.</p>
        </div>
      </div>
    </section>
  );
};

export default Benefits;