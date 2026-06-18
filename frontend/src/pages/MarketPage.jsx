import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MarketPage = () => {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, GAINERS, LOSERS, VOLUME
  const [loading, setLoading] = useState(true);

  const fetchStocks = async () => {
    try {
      const response = await api.get(`/stocks?search=${search}`);
      if (response.data.success) {
        setStocks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stock catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();

    // Set polling interval for live prices
    const interval = setInterval(fetchStocks, 10000);
    return () => clearInterval(interval);
  }, [search]);

  // Apply filters on client-side
  const getFilteredStocks = () => {
    let list = [...stocks];
    if (filter === 'GAINERS') {
      list = list.filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    } else if (filter === 'LOSERS') {
      list = list.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
    } else if (filter === 'VOLUME') {
      list = list.sort((a, b) => b.volume - a.volume);
    }
    return list;
  };

  const filtered = getFilteredStocks();

  return (
    <div className="container py-4">
      {/* Title section */}
      <div className="mb-4">
        <h1 className="h2 text-white fw-bold">Stock Catalog</h1>
        <p className="text-muted">Explore and search live simulated assets on the TradeSphere market.</p>
      </div>

      {/* Controls: Search and Filter Tabs */}
      <div className="row g-3 mb-4 align-items-center">
        <div className="col-12 col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-custom"
              placeholder="Search by Symbol or Company Name (e.g. AAPL, Apple)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderLeft: 'none' }}
            />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
            <button
              className={`btn ${filter === 'ALL' ? 'btn-primary-custom' : 'btn-outline-light'}`}
              onClick={() => setFilter('ALL')}
            >
              All Stocks
            </button>
            <button
              className={`btn ${filter === 'GAINERS' ? 'btn-success-custom' : 'btn-outline-light'}`}
              onClick={() => setFilter('GAINERS')}
            >
              Gainers
            </button>
            <button
              className={`btn ${filter === 'LOSERS' ? 'btn-danger-custom' : 'btn-outline-light'}`}
              onClick={() => setFilter('LOSERS')}
            >
              Losers
            </button>
            <button
              className={`btn ${filter === 'VOLUME' ? 'btn-primary-custom' : 'btn-outline-light'}`}
              onClick={() => setFilter('VOLUME')}
            >
              <i className="bi bi-graph-up me-1"></i> Volume
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Stocks */}
      {loading && stocks.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading stock catalog...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-5">
          <i className="bi bi-search-heart text-muted fs-1 mb-3"></i>
          <h3 className="h4 text-white mb-2">No Stocks Found</h3>
          <p className="text-muted">Try adjusting your search criteria or filter tags.</p>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map(stock => (
            <div key={stock.symbol} className="col-12 col-md-6 col-lg-4 col-xl-3">
              <div className="glass-card glow-card-blue h-100 d-flex flex-column justify-content-between p-4">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h3 className="h5 text-white fw-bold mono mb-0">{stock.symbol}</h3>
                      <span className="text-muted small" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {stock.companyName}
                      </span>
                    </div>
                    <span className={stock.changePercent >= 0 ? 'badge-up' : 'badge-down'}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                    </span>
                  </div>

                  <h4 className="h3 text-white fw-bold my-3 mono">
                    ${stock.currentPrice.toFixed(2)}
                  </h4>

                  <div className="d-flex justify-content-between text-muted small border-top border-secondary pt-2 mt-2">
                    <div>
                      <span>Low:</span> <strong className="text-light mono">${stock.dayLow.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>High:</span> <strong className="text-light mono">${stock.dayHigh.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <Link className="btn btn-outline-light rounded-3 py-2 text-decoration-none text-center" to={`/stocks/${stock.symbol}`}>
                    View Details <i className="bi bi-arrow-right-short ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketPage;
