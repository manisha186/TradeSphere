import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockDetailPage = () => {
  const { symbol } = useParams();
  const { user, refreshBalance } = useAuth();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [holdingQuantity, setHoldingQuantity] = useState(0);
  const [loading, setLoading] = useState(true);

  // Order state
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('BUY'); // BUY or SELL
  const [feedback, setFeedback] = useState(null); // { success: boolean, message: string }

  const fetchData = async () => {
    try {
      const [stockRes, historyRes, portfolioRes] = await Promise.all([
        api.get(`/stocks/${symbol}`),
        api.get(`/stocks/${symbol}/history`),
        api.get('/portfolio')
      ]);

      if (stockRes.data.success) {
        setStock(stockRes.data.data);
      }
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }
      if (portfolioRes.data.success) {
        const owned = portfolioRes.data.data.holdings.find(
          (h) => h.symbol === symbol.toUpperCase()
        );
        setHoldingQuantity(owned ? owned.quantity : 0);
      }
    } catch (error) {
      console.error('Error loading stock details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll current quote every 10 seconds (keep order terminal and price up-to-date)
    const interval = setInterval(async () => {
      try {
        const stockRes = await api.get(`/stocks/${symbol}`);
        if (stockRes.data.success) {
          setStock(stockRes.data.data);
        }
      } catch (err) {
        console.error('Quote poll error:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [symbol]);

  const handleExecuteOrder = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFeedback({ success: false, message: 'Please specify a positive quantity.' });
      return;
    }

    try {
      const response = await api.post('/transactions/order', {
        symbol: symbol.toUpperCase(),
        quantity: parsedQty,
        type: orderType
      });

      if (response.data.success) {
        setFeedback({
          success: true,
          message: `${orderType} order executed successfully! ${parsedQty} shares of ${symbol.toUpperCase()}.`
        });
        setQuantity('');
        // Sync user state and holding quantity
        await refreshBalance();
        fetchData();
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: err.response?.data?.message || 'Order failed. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading stock details...</span>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="container py-5 text-center">
        <div className="glass-card my-5 py-5">
          <i className="bi bi-x-circle text-danger fs-1 mb-3"></i>
          <h2 className="text-white">Stock Not Found</h2>
          <p className="text-muted">The requested ticker symbol {symbol} does not exist.</p>
          <Link to="/market" className="btn btn-primary-custom mt-3">
            Back to Market Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Prep Chart Data
  const chartLabels = history.map((node) => {
    const d = new Date(node.date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartPrices = history.map((node) => node.price);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: `${stock.symbol} Price`,
        data: chartPrices,
        borderColor: stock.changePercent >= 0 ? '#10b981' : '#ef4444',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, stock.changePercent >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          return gradient;
        },
        fill: true,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 6,
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#0f172a',
        titleFont: { family: 'Outfit', size: 13 },
        bodyFont: { family: 'Space Grotesk', size: 13 },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af', font: { family: 'Space Grotesk', size: 11 } }
      }
    }
  };

  // Compute live cost estimations
  const computedQty = parseFloat(quantity) || 0;
  const estimatedTotal = Number((computedQty * stock.currentPrice).toFixed(2));

  // Determine validation states
  const hasSufficientFunds = user && user.virtualBalance >= estimatedTotal;
  const hasSufficientShares = holdingQuantity >= computedQty;

  return (
    <div className="container py-4">
      {/* Back button */}
      <Link to="/market" className="text-muted text-decoration-none small mb-4 d-inline-block">
        <i className="bi bi-chevron-left me-1"></i> Back to Market Catalog
      </Link>

      {/* Stock Quote Header */}
      <div className="row g-4 align-items-end mb-4">
        <div className="col-12 col-md-8">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h1 className="h1 text-white fw-bold mono mb-0">{stock.symbol}</h1>
            <div className="d-flex flex-column">
              <h2 className="h4 text-light fw-semibold mb-0">{stock.companyName}</h2>
              <span className="text-muted small">Sector: Technology / Equity</span>
            </div>
            <span className={`fs-5 fw-bold ms-md-2 ${stock.changePercent >= 0 ? 'badge-up' : 'badge-down'}`}>
              {stock.changePercent >= 0 ? '▲' : '▼'} {stock.changePercent}%
            </span>
          </div>
        </div>
        <div className="col-12 col-md-4 text-md-end">
          <span className="text-muted small text-uppercase block">Current Price</span>
          <h2 className="h1 text-white fw-bold mono mb-0">
            ${stock.currentPrice.toFixed(2)}
          </h2>
        </div>
      </div>

      {/* Charts & Trade Panel Row */}
      <div className="row g-4 mb-5">
        {/* Chart Column */}
        <div className="col-12 col-lg-8">
          <div className="glass-card h-100 p-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 text-white fw-bold mb-0">Historical Trend (30 Days)</h3>
                <span className="text-muted small">Daily Close Prices</span>
              </div>
              <div style={{ height: '350px', position: 'relative' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Key Statistics Grid */}
            <div className="row g-3 mt-4 pt-3 border-top border-secondary">
              <div className="col-6 col-md-3">
                <span className="text-muted small block">Day High</span>
                <strong className="text-white mono block fs-5">${stock.dayHigh.toFixed(2)}</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small block">Day Low</span>
                <strong className="text-white mono block fs-5">${stock.dayLow.toFixed(2)}</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small block">Volume</span>
                <strong className="text-white mono block fs-5">{stock.volume.toLocaleString()}</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small block">Market Cap</span>
                <strong className="text-white mono block fs-5">${(stock.marketCap / 1e9).toFixed(2)}B</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Terminal Column */}
        <div className="col-12 col-lg-4">
          <div className="glass-card h-100 p-4">
            <h3 className="h5 text-white fw-bold mb-3">Order Terminal</h3>

            {/* Account Capital Info */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-2 bg-dark rounded border border-secondary">
              <div>
                <span className="text-muted small block">Your Cash</span>
                <strong className="text-success mono">${user?.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="text-end">
                <span className="text-muted small block">Owned Shares</span>
                <strong className="text-info mono">{holdingQuantity}</strong>
              </div>
            </div>

            {/* Tab Switches (BUY/SELL) */}
            <div className="btn-group w-100 mb-4" role="group">
              <button
                type="button"
                className={`btn py-2 ${orderType === 'BUY' ? 'btn-success-custom' : 'btn-outline-success'}`}
                onClick={() => {
                  setOrderType('BUY');
                  setFeedback(null);
                }}
              >
                BUY
              </button>
              <button
                type="button"
                className={`btn py-2 ${orderType === 'SELL' ? 'btn-danger-custom' : 'btn-outline-danger'}`}
                onClick={() => {
                  setOrderType('SELL');
                  setFeedback(null);
                }}
              >
                SELL
              </button>
            </div>

            {feedback && (
              <div className={`alert ${feedback.success ? 'alert-success bg-success-glow text-success' : 'alert-danger bg-danger-glow text-danger'} py-2 px-3 small border-0 rounded-3 mb-4`}>
                {feedback.success ? <i className="bi bi-check-circle-fill me-2"></i> : <i className="bi bi-exclamation-triangle-fill me-2"></i>}
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleExecuteOrder}>
              <div className="mb-4">
                <label className="form-label text-muted small">Quantity</label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="form-control form-control-custom"
                    placeholder="Enter number of shares"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  <span className="input-group-text bg-dark border-secondary text-muted">SHARES</span>
                </div>
              </div>

              {/* Live Cost Estimate Panel */}
              <div className="d-flex flex-column gap-2 mb-4">
                <div className="d-flex justify-content-between text-muted small">
                  <span>Price per share</span>
                  <span className="mono text-light">${stock.currentPrice.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-white fw-semibold pt-2 border-top border-secondary">
                  <span>Estimated Total</span>
                  <span className="mono">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Order Validation Alerts */}
              {orderType === 'BUY' && computedQty > 0 && !hasSufficientFunds && (
                <div className="alert alert-warning bg-warning bg-opacity-10 border-0 text-warning small p-2 rounded mb-3">
                  <i className="bi bi-exclamation-triangle me-1"></i> Insufficient cash balance for this order.
                </div>
              )}

              {orderType === 'SELL' && computedQty > 0 && !hasSufficientShares && (
                <div className="alert alert-warning bg-warning bg-opacity-10 border-0 text-warning small p-2 rounded mb-3">
                  <i className="bi bi-exclamation-triangle me-1"></i> You do not own enough shares to execute this sale.
                </div>
              )}

              <button
                type="submit"
                className={`btn w-100 py-3 fw-bold rounded-3 ${orderType === 'BUY' ? 'btn-success-custom' : 'btn-danger-custom'}`}
                disabled={
                  (orderType === 'BUY' && (!hasSufficientFunds || computedQty <= 0)) ||
                  (orderType === 'SELL' && (!hasSufficientShares || computedQty <= 0))
                }
              >
                Place {orderType} Order
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Corporate profile/description */}
      <div className="glass-card mb-5">
        <h3 className="h5 text-white fw-bold mb-3">Company Profile</h3>
        <p className="text-muted mb-0">{stock.description || 'No company description details available.'}</p>
      </div>
    </div>
  );
};

export default StockDetailPage;
