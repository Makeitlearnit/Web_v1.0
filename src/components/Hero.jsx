import React from 'react';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-badge">Live Projects Available</div>
      <h1>Build Smarter with <em>Real Engineering</em> Projects</h1>
      <p>IoT systems, AI-integrated hardware, robotics, and cybersecurity builds — engineered from the ground up, ready to deploy.</p>
      <div className="hero-btns">
        <button
          className="btn-primary"
          onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
        >Browse Projects</button>
        <button
          className="btn-secondary"
          onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
        >Contact Us</button>
      </div>
      <div className="hero-stats">
        <div className="stat">
          <div className="stat-num">40+</div>
          <div className="stat-label">Projects Available</div>
        </div>
        <div className="stat">
          <div className="stat-num">6</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat">
          <div className="stat-num">100%</div>
          <div className="stat-label">Original Builds</div>
        </div>
        <div className="stat">
          <div className="stat-num">24h</div>
          <div className="stat-label">Response Time</div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
