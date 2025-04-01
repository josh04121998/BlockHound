import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="hero text-center py-5">
      <h1 className="display-4">Join the Block Hound Community</h1>
      <p className="lead">A free Discord community for trading and investing enthusiasts</p>
      <a
        href="https://discord.gg/n7U5EYZuUX" 
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary btn-lg me-2"
      >
        Join Now
      </a>
    </section>
  );
};

export default Hero;