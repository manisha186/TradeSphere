import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, refreshBalance } = useAuth();
  const [marketData, setMarketData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [marketRes, portfolioRes] = await Promise.all([
          api.get('/stocks/market/summary'),
          api.get('/portfolio')
        ]);
        
        if (marketRes.data.success) {
          setMarketData(marketRes.data.data);
        }
        if (portfolioRes.data.success) {
          setPortfolioData(portfolioRes.data.data);
        }
        // Sync the user context balance just in case it fluctuated
        await refreshBalance();
      } catch (error) {
        console.error('Error fetching dashboard info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Auto-update dashboard metrics on an interval (every 10s) to reflect simulator ticks
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const { topGainers = [], topLosers = [], trending = [], marketStats = {} } = marketData || {};
  const { totalInvestment = 0, currentValue = 0, profitLoss = 0 } = portfolioData || {};
  const netProfitPercent = totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100).toFixed(2) : '0.00';

  return (
    <div className="container py-4">
      {/* Welcome & Overview Headers */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h2 text-white fw-bold mb-1">Hello, {user?.name}</h1>
          <p className="text-muted mb-0">Here is what is happening in the markets today.</p>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)' }}>
          <span className="market-status-pulse"></span>
          <span className="small text-muted fw-semibold">Simulator Live Update (10s)</span>
        </div>
      </div>

      {/* Portfolio & Balance Cards */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-4">
          <div className="glass-card glow-card-blue h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="text-muted small text-uppercase fw-semibold">Virtual Cash Balance</span>
              <h2 className="text-white fw-bold mt-2 mono">
                ${user?.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <Link className="btn btn-outline-primary btn-sm mt-3 align-self-start py-2 px-3 rounded-3" to="/market">
              <i className="bi bi-cart3 me-1"></i> Trade Stocks
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="glass-card glow-card-green h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="text-muted small text-uppercase fw-semibold">Total Portfolio Value</span>
              <h2 className="text-white fw-bold mt-2 mono">
                ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-muted small">Invested: </span>
              <span className="text-light mono small">${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <Link className="btn btn-outline-success btn-sm mt-3 align-self-start py-2 px-3 rounded-3" to="/portfolio">
              <i className="bi bi-briefcase me-1"></i> View Holdings
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="glass-card h-100 d-flex flex-column justify-content-between" style={{ borderLeft: profitLoss >= 0 ? '4px solid var(--color-success)' : '4px solid var(--color-danger)' }}>
            <div>
              <span className="text-muted small text-uppercase fw-semibold">Total Net Return</span>
              <h2 className={`fw-bold mt-2 mono ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className={`badge mono ${profitLoss >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-25 ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {profitLoss >= 0 ? '+' : ''}{netProfitPercent}%
              </span>
            </div>
            <span className="small text-muted mt-3">All-time virtual transactions gains</span>
          </div>
        </div>
      </div>

      {/* Market Ticker Indices */}
      {marketStats && (
        <div className="glass-card mb-5 p-4">
          <h3 className="h5 text-white mb-3 fw-bold">Market Summary</h3>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <span className="text-muted small block">TradeSphere Index</span>
              <div className="d-flex align-items-center gap-2 mt-1">
                <span className={`mono fw-bold fs-5 ${marketStats.indexChangePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {marketStats.indexChangePercent >= 0 ? '▲' : '▼'} {Math.abs(marketStats.indexChangePercent)}%
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted small block">Total System Volume</span>
              <h4 className="text-white mono fw-bold mt-1 fs-5">
                {marketStats.totalVolume ? marketStats.totalVolume.toLocaleString() : '0'}
              </h4>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted small block">Total Capitalization</span>
              <h4 className="text-white mono fw-bold mt-1 fs-5">
                ${marketStats.totalMarketCap ? (marketStats.totalMarketCap / 1e12).toFixed(2) + 'T' : '0'}
              </h4>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted small block">Platform Status</span>
              <div className="mt-1 d-flex align-items-center gap-1 text-success fw-bold small">
                <span className="market-status-pulse"></span> ONLINE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Gainers / Losers / Trending */}
      <div className="row g-4">
        {/* Top Gainers */}
        <div className="col-12 col-lg-4">
          <div className="glass-card h-100">
            <h3 className="h5 text-white fw-bold mb-3 d-flex align-items-center justify-content-between">
              <span>🔥 Top Gainers</span>
              <span className="small text-success fs-6"><i className="bi bi-caret-up-fill"></i></span>
            </h3>
            {topGainers.length === 0 ? (
              <p className="text-muted small">No gainers currently</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topGainers.map(stock => (
                  <Link key={stock.symbol} to={`/stocks/${stock.symbol}`} className="d-flex justify-content-between align-items-center p-2 rounded text-decoration-none bg-hover" style={{ transition: 'var(--transition-smooth)' }}>
                    <div>
                      <div className="text-white fw-bold mono">{stock.symbol}</div>
                      <div className="text-muted small" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.companyName}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-white mono fw-semibold">${stock.currentPrice.toFixed(2)}</div>
                      <span className="badge-up">+{stock.changePercent}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div className="col-12 col-lg-4">
          <div className="glass-card h-100">
            <h3 className="h5 text-white fw-bold mb-3 d-flex align-items-center justify-content-between">
              <span>📉 Top Losers</span>
              <span className="small text-danger fs-6"><i className="bi bi-caret-down-fill"></i></span>
            </h3>
            {topLosers.length === 0 ? (
              <p className="text-muted small">No losers currently</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topLosers.map(stock => (
                  <Link key={stock.symbol} to={`/stocks/${stock.symbol}`} className="d-flex justify-content-between align-items-center p-2 rounded text-decoration-none bg-hover" style={{ transition: 'var(--transition-smooth)' }}>
                    <div>
                      <div className="text-white fw-bold mono">{stock.symbol}</div>
                      <div className="text-muted small" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.companyName}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-white mono fw-semibold">${stock.currentPrice.toFixed(2)}</div>
                      <span className="badge-down">{stock.changePercent}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trending Stocks */}
        <div className="col-12 col-lg-4">
          <div className="glass-card h-100">
            <h3 className="h5 text-white fw-bold mb-3 d-flex align-items-center justify-content-between">
              <span>📈 High Volume / Trending</span>
              <span className="small text-primary fs-6"><i className="bi bi-lightning-charge-fill"></i></span>
            </h3>
            {trending.length === 0 ? (
              <p className="text-muted small">No trending data</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {trending.map(stock => (
                  <Link key={stock.symbol} to={`/stocks/${stock.symbol}`} className="d-flex justify-content-between align-items-center p-2 rounded text-decoration-none bg-hover" style={{ transition: 'var(--transition-smooth)' }}>
                    <div>
                      <div className="text-white fw-bold mono">{stock.symbol}</div>
                      <div className="text-muted small" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.companyName}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-white mono fw-semibold">${stock.currentPrice.toFixed(2)}</div>
                      <span className={`badge mono fw-bold ${stock.changePercent >= 0 ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-10`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
