import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ transactionsCount: 0, positionsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [txs, port] = await Promise.all([
          api.get('/transactions'),
          api.get('/portfolio')
        ]);
        setStats({
          transactionsCount: txs.data.count || 0,
          positionsCount: port.data.data.holdings.length || 0
        });
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h2 text-white fw-bold">My Profile</h1>
        <p className="text-muted">Manage your TradeSphere simulator account details.</p>
      </div>

      <div className="row g-4">
        {/* User Card */}
        <div className="col-12 col-md-5">
          <div className="glass-card text-center p-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle text-white mb-3" style={{ width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)' }}>
              <i className="bi bi-person-circle fs-1 text-primary"></i>
            </div>
            <h3 className="h4 text-white fw-bold mb-1">{user?.name}</h3>
            <span className="badge bg-secondary mb-3">{user?.role} ACCOUNT</span>

            <div className="border-top border-secondary pt-3 mt-3 text-start">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Email Address:</span>
                <span className="text-white small">{user?.email}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Simulator Capital:</span>
                <strong className="text-success small mono">${user?.virtualBalance.toLocaleString()}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Registered:</span>
                <span className="text-white small">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="col-12 col-md-7">
          <div className="glass-card h-100 p-4">
            <h3 className="h5 text-white fw-bold mb-4">Trading Summary Stats</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-dark rounded border border-secondary text-center">
                    <span className="text-muted small block">Total Orders</span>
                    <h4 className="text-white mono fw-bold mt-2 fs-3">{stats.transactionsCount}</h4>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-dark rounded border border-secondary text-center">
                    <span className="text-muted small block">Active Holdings</span>
                    <h4 className="text-white mono fw-bold mt-2 fs-3">{stats.positionsCount}</h4>
                  </div>
                </div>
                <div className="col-12">
                  <div className="alert alert-info bg-info bg-opacity-10 border-0 text-info small p-3 rounded-3 mt-2">
                    <h5 className="alert-heading fw-bold mb-2" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-info-circle-fill me-2"></i>Virtual Trading System
                    </h5>
                    TradeSphere is designed for paper-trading simulation purposes. Prices fluctuate mockingly every 15 seconds. Trades do not execute on real financial markets, and no real capital is involved.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
