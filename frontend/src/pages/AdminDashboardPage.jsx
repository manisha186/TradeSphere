import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks', 'users', 'transactions'
  const [stocks, setStocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStockSymbol, setEditingStockSymbol] = useState(null);
  const [stockForm, setStockForm] = useState({
    symbol: '',
    companyName: '',
    currentPrice: '',
    description: '',
    marketCap: '',
    volume: ''
  });

  const [feedback, setFeedback] = useState(null); // { success: boolean, message: string }

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stocks') {
        const res = await api.get('/stocks');
        if (res.data.success) setStocks(res.data.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        if (res.data.success) setUsers(res.data.data);
      } else if (activeTab === 'transactions') {
        const res = await api.get('/admin/transactions');
        if (res.data.success) setTransactions(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setFeedback({ success: false, message: 'Failed to load details. Access restricted.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setFeedback(null);
  }, [activeTab]);

  const handleInputChange = (e) => {
    setStockForm({ ...stockForm, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setStockForm({
      symbol: '',
      companyName: '',
      currentPrice: '',
      description: '',
      marketCap: '',
      volume: ''
    });
    setShowAddForm(false);
    setEditingStockSymbol(null);
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const response = await api.post('/admin/stocks', stockForm);
      if (response.data.success) {
        setFeedback({ success: true, message: `Stock ${stockForm.symbol.toUpperCase()} added successfully!` });
        resetForm();
        fetchData();
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Failed to add stock' });
    }
  };

  const handleEditClick = (stock) => {
    setEditingStockSymbol(stock.symbol);
    setStockForm({
      symbol: stock.symbol,
      companyName: stock.companyName,
      currentPrice: stock.currentPrice,
      description: stock.description || '',
      marketCap: stock.marketCap || '',
      volume: stock.volume || ''
    });
    setShowAddForm(true); // Re-use the form container for editing
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const response = await api.put(`/admin/stocks/${editingStockSymbol}`, stockForm);
      if (response.data.success) {
        setFeedback({ success: true, message: `Stock ${editingStockSymbol} updated successfully!` });
        resetForm();
        fetchData();
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Failed to update stock' });
    }
  };

  const handleDeleteStock = async (symbol) => {
    if (!window.confirm(`Are you sure you want to delete ${symbol}? This action is permanent.`)) return;
    setFeedback(null);
    try {
      const response = await api.delete(`/admin/stocks/${symbol}`);
      if (response.data.success) {
        setFeedback({ success: true, message: `Stock ${symbol} deleted successfully.` });
        fetchData();
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Failed to delete stock' });
    }
  };

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h2 text-white fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill text-warning"></i>
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-muted">Manage stock tickers, view user database accounts, and audit system transactions.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <ul className="nav nav-tabs border-secondary mb-4">
        <li className="nav-item">
          <button
            className={`nav-link text-white py-2 px-4 ${activeTab === 'stocks' ? 'active bg-primary border-primary fw-bold' : ''}`}
            onClick={() => setActiveTab('stocks')}
          >
            <i className="bi bi-graph-up me-2"></i>Manage Stocks
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link text-white py-2 px-4 ${activeTab === 'users' ? 'active bg-primary border-primary fw-bold' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people me-2"></i>User Database
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link text-white py-2 px-4 ${activeTab === 'transactions' ? 'active bg-primary border-primary fw-bold' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <i className="bi bi-journal-text me-2"></i>Audit Logs
          </button>
        </li>
      </ul>

      {feedback && (
        <div className={`alert ${feedback.success ? 'alert-success bg-success-glow text-success' : 'alert-danger bg-danger-glow text-danger'} border-0 py-3 px-4 rounded-3 mb-4`}>
          {feedback.success ? <i className="bi bi-check-circle-fill me-2"></i> : <i className="bi bi-exclamation-triangle-fill me-2"></i>}
          {feedback.message}
        </div>
      )}

      {/* STOCKS TAB PANEL */}
      {activeTab === 'stocks' && (
        <div>
          {/* Add / Edit Form Toggle */}
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <h3 className="h5 text-white mb-0">Market Securities</h3>
            {!showAddForm ? (
              <button className="btn btn-primary-custom" onClick={() => setShowAddForm(true)}>
                <i className="bi bi-plus-circle me-1"></i> Add New Stock
              </button>
            ) : (
              <button className="btn btn-outline-light" onClick={resetForm}>
                Cancel Form
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="glass-card mb-4 p-4">
              <h4 className="h5 text-white fw-bold mb-3">
                {editingStockSymbol ? `Edit Stock Position: ${editingStockSymbol}` : 'Add New Securities Ticker'}
              </h4>
              <form onSubmit={editingStockSymbol ? handleUpdateStock : handleAddStock}>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label text-muted small">Symbol (e.g. MSFT)</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      name="symbol"
                      value={stockForm.symbol}
                      onChange={handleInputChange}
                      disabled={!!editingStockSymbol}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label text-muted small">Company Name</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      name="companyName"
                      value={stockForm.companyName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small">Current Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-custom"
                      name="currentPrice"
                      value={stockForm.currentPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-muted small">Market Cap ($)</label>
                    <input
                      type="number"
                      className="form-control form-control-custom"
                      name="marketCap"
                      value={stockForm.marketCap}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Trading Volume</label>
                    <input
                      type="number"
                      className="form-control form-control-custom"
                      name="volume"
                      value={stockForm.volume}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small">Corporate Description</label>
                    <textarea
                      rows="3"
                      className="form-control form-control-custom"
                      name="description"
                      value={stockForm.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>

                <div className="mt-4 gap-2 d-flex justify-content-end">
                  <button type="button" className="btn btn-outline-light px-4" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom px-4">
                    {editingStockSymbol ? 'Save Updates' : 'Add Stock'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stocks Table Listing */}
          <div className="glass-card p-0 overflow-hidden">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company Name</th>
                      <th>Current Price</th>
                      <th>Day High/Low</th>
                      <th>Volume</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => (
                      <tr key={stock.symbol}>
                        <td><strong className="mono text-white">{stock.symbol}</strong></td>
                        <td>{stock.companyName}</td>
                        <td className="mono font-weight-bold text-success">${stock.currentPrice.toFixed(2)}</td>
                        <td className="mono small text-muted">
                          ${stock.dayHigh.toFixed(2)} / ${stock.dayLow.toFixed(2)}
                        </td>
                        <td className="mono">{stock.volume.toLocaleString()}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-light me-2 rounded-3"
                            onClick={() => handleEditClick(stock)}
                          >
                            <i className="bi bi-pencil-square"></i> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger rounded-3"
                            onClick={() => handleDeleteStock(stock.symbol)}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER DATABASE TAB PANEL */}
      {activeTab === 'users' && (
        <div className="glass-card p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Registration Date</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="text-end">Virtual Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item._id}>
                      <td className="text-muted small">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td><strong className="text-white">{item.name}</strong></td>
                      <td>{item.email}</td>
                      <td>
                        <span className={`badge ${item.role === 'ADMIN' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="text-end mono text-success font-weight-bold">
                        ${item.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TRANSACTION AUDIT LOGS TAB PANEL */}
      {activeTab === 'transactions' && (
        <div className="glass-card p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Trader</th>
                    <th>Stock</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Execution Price</th>
                    <th className="text-end">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="text-muted small">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td>
                        <div className="text-white fw-bold">{tx.userId?.name || 'Deleted User'}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{tx.userId?.email}</div>
                      </td>
                      <td><strong className="mono text-white">{tx.symbol}</strong></td>
                      <td>
                        <span className={`badge mono fw-bold ${tx.type === 'BUY' ? 'bg-success text-success bg-opacity-15' : 'bg-danger text-danger bg-opacity-15'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="mono">{tx.quantity}</td>
                      <td className="mono">${tx.price.toFixed(2)}</td>
                      <td className={`text-end mono font-weight-bold ${tx.type === 'BUY' ? 'text-danger' : 'text-success'}`}>
                        {tx.type === 'BUY' ? '-' : '+'}${tx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
