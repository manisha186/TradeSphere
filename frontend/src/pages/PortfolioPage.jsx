import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Register components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const PortfolioPage = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      const response = await api.get('/portfolio');
      if (response.data.success) {
        setPortfolio(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();

    // Refresh every 10 seconds to keep track of live simulator fluctuations
    const interval = setInterval(fetchPortfolio, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  const { holdings = [], totalInvestment = 0, currentValue = 0, profitLoss = 0 } = portfolio || {};
  const netProfitPercent = totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100).toFixed(2) : '0.00';

  // Doughnut Chart Data (Asset Allocation Weightings)
  const doughnutLabels = holdings.map(h => h.symbol);
  const doughnutValues = holdings.map(h => h.currentValue);
  
  // Custom colors for Doughnut
  const colorPalette = [
    '#3b82f6', '#10b981', '#ef4444', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'
  ];

  const doughnutData = {
    labels: doughnutLabels,
    datasets: [
      {
        data: doughnutValues,
        backgroundColor: colorPalette.slice(0, holdings.length),
        borderColor: 'rgba(10, 15, 30, 0.8)',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9ca3af',
          font: { family: 'Outfit', size: 12 }
        }
      },
      tooltip: {
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Space Grotesk' },
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const total = doughnutValues.reduce((sum, v) => sum + v, 0);
            const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` $${val.toLocaleString()} (${percent}%)`;
          }
        }
      }
    }
  };

  // Bar Chart Data (Profit/Loss per Stock Position)
  const barLabels = holdings.map(h => h.symbol);
  const barValues = holdings.map(h => h.profitLoss);
  const barColors = holdings.map(h => h.profitLoss >= 0 ? 'rgba(16, 185, 129, 0.75)' : 'rgba(239, 68, 68, 0.75)');
  const barBorders = holdings.map(h => h.profitLoss >= 0 ? '#10b981' : '#ef4444');

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Profit / Loss ($)',
        data: barValues,
        backgroundColor: barColors,
        borderColor: barBorders,
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Space Grotesk' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
        grid: { display: false }
      },
      y: {
        ticks: { color: '#9ca3af', font: { family: 'Space Grotesk' } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-5">
        <div>
          <h1 className="h2 text-white fw-bold">Portfolio Analysis</h1>
          <p className="text-muted mb-0">Track active holdings, ROI statistics, and asset weight allocations.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Liquid Cash:</span>
          <span className="fw-bold text-success mono fs-5">${user?.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-4">
          <div className="glass-card">
            <span className="text-muted small text-uppercase fw-semibold">Net Cost Basis</span>
            <h3 className="h2 text-white fw-bold mt-2 mono">${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="small text-muted">Total amount invested</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="glass-card">
            <span className="text-muted small text-uppercase fw-semibold">Current Valuation</span>
            <h3 className="h2 text-white fw-bold mt-2 mono">${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="small text-muted">Value of active positions</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="glass-card" style={{ borderLeft: profitLoss >= 0 ? '4px solid var(--color-success)' : '4px solid var(--color-danger)' }}>
            <span className="text-muted small text-uppercase fw-semibold">Total Gains / Return</span>
            <h3 className={`h2 fw-bold mt-2 mono ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
              {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <span className={`badge mono ${profitLoss >= 0 ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-25`}>
              {profitLoss >= 0 ? '+' : ''}{netProfitPercent}% ROI
            </span>
          </div>
        </div>
      </div>

      {/* Charts Display Row */}
      {holdings.length > 0 && (
        <div className="row g-4 mb-5">
          <div className="col-12 col-lg-6">
            <div className="glass-card p-4">
              <h3 className="h5 text-white fw-bold mb-4">Asset Weight Allocation</h3>
              <div style={{ height: '280px', position: 'relative' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="glass-card p-4">
              <h3 className="h5 text-white fw-bold mb-4">Position P&L Returns</h3>
              <div style={{ height: '280px', position: 'relative' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holdings Listing Table */}
      <div className="glass-card p-0 overflow-hidden mb-5">
        <div className="p-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
          <h3 className="h5 text-white fw-bold mb-0">Active Holdings</h3>
          <span className="badge bg-secondary mono">{holdings.length} Assets</span>
        </div>

        {holdings.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-briefcase text-muted fs-1 mb-3"></i>
            <h4 className="text-white">Your Portfolio is Empty</h4>
            <p className="text-muted mb-4">You don't own any shares yet. Head over to the market to place your first order.</p>
            <Link className="btn btn-primary-custom" to="/market">
              Explore Market Catalog
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg Buy Price</th>
                  <th>Current Price</th>
                  <th>Total Cost</th>
                  <th>Current Value</th>
                  <th className="text-end">Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(holding => (
                  <tr key={holding.symbol}>
                    <td>
                      <Link to={`/stocks/${holding.symbol}`} className="text-white fw-bold mono text-decoration-none bg-hover p-1 rounded">
                        {holding.symbol}
                      </Link>
                    </td>
                    <td className="mono">{holding.quantity}</td>
                    <td className="mono">${holding.averageBuyPrice.toFixed(2)}</td>
                    <td className="mono">${holding.currentPrice.toFixed(2)}</td>
                    <td className="mono">${holding.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="mono">${holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className={`text-end mono fw-semibold ${holding.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                      <div>{holding.profitLoss >= 0 ? '+' : ''}${holding.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                        {holding.roi >= 0 ? '+' : ''}{holding.roi}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
