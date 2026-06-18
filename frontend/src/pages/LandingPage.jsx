import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  const [tickerStocks, setTickerStocks] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/stocks/market/summary');
        if (response.data.success) {
          const all = [
            ...response.data.data.topGainers,
            ...response.data.data.topLosers,
            ...response.data.data.trending
          ];
          // Remove duplicates by symbol
          const unique = Array.from(new Map(all.map(item => [item.symbol, item])).values());
          setTickerStocks(unique.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching market summary for ticker:', error);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="container py-5">
      {/* Ticker Row */}
      {tickerStocks.length > 0 && (
        <div className="glass-card mb-5 p-3 overflow-hidden" style={{ borderRadius: '12px' }}>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary mono text-uppercase me-2">Market Ticker</span>
            <div className="d-flex gap-4 align-items-center flex-wrap">
              {tickerStocks.map(stock => (
                <div key={stock.symbol} className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-white mono">{stock.symbol}</span>
                  <span className="text-muted mono">${stock.currentPrice.toFixed(2)}</span>
                  <span className={`mono fw-bold ${stock.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-gradient d-flex flex-column-reverse flex-lg-row align-items-center justify-content-between gap-5">
        <div className="col-lg-6 text-center text-lg-start">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="market-status-pulse"></span>
            <span className="text-primary fw-semibold small">Real-time Stock Trading Simulator</span>
          </div>
          <h1 className="display-4 fw-extrabold text-white mb-3" style={{ lineHeight: 1.15 }}>
            Master the Markets with <span className="text-primary text-gradient">TradeSphere</span>
          </h1>
          <p className="lead text-muted mb-4 fs-5" style={{ maxWidth: '550px' }}>
            Risk-free paper trading platform to practice investing. Trade global tech giants with $100,000 in virtual cash, track analytics, and refine your portfolio strategies.
          </p>
          <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
            {user ? (
              <Link className="btn btn-primary-custom btn-lg px-4 fs-6" to="/dashboard">
                <i className="bi bi-speedometer2 me-2"></i>Go to Dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary-custom btn-lg px-4 fs-6" to="/register">
                  Get Started Free
                </Link>
                <Link className="btn btn-outline-light btn-lg px-4 fs-6" to="/login">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="col-lg-5 text-center float-anim">
          <i className="bi bi-bar-chart-fill text-primary" style={{ fontSize: '10rem', filter: 'drop-shadow(0 0 45px rgba(59, 130, 246, 0.4))' }}></i>
        </div>
      </div>

      {/* Platform Features Grid */}
      <div className="row g-4 mt-5">
        <div className="col-md-4">
          <div className="glass-card h-100 glow-card-blue d-flex flex-column gap-3">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 text-white" style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.15)' }}>
              <i className="bi bi-activity fs-4 text-primary"></i>
            </div>
            <h3 className="h4 text-white">Live Price Feeds</h3>
            <p className="text-muted mb-0">
              Watch real-time market fluctuations with our automated price simulator. Experience realistic ticks, gainers, losers, and trading volumes.
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card h-100 glow-card-green d-flex flex-column gap-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-3 text-white" style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <i className="bi bi-wallet2 fs-4 text-success"></i>
            </div>
            <h3 className="h4 text-white">Virtual Capital</h3>
            <p className="text-muted mb-0">
              Start with $100,000 of simulated currency. Learn when to enter buy positions and exit sell orders without losing real-world savings.
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card h-100 glow-card-red d-flex flex-column gap-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-3 text-white" style={{ width: '48px', height: '48px', background: 'rgba(239, 68, 68, 0.15)' }}>
              <i className="bi bi-pie-chart fs-4 text-danger"></i>
            </div>
            <h3 className="h4 text-white">Portfolio Analytics</h3>
            <p className="text-muted mb-0">
              Track allocation charts, overall profits or losses, and check your asset distribution using interactive visual graph dashboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
