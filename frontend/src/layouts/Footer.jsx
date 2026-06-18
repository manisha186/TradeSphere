import React from 'react';

const Footer = () => {
  return (
    <footer className="py-4 mt-auto" style={{ background: '#05080e', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container text-center">
        <p className="text-muted mb-0 small">
          &copy; {new Date().getFullYear()} TradeSphere. Built for Educational Stock Trading Simulation. No real money involved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
