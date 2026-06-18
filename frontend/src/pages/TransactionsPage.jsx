import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/transactions');
        if (response.data.success) {
          setTransactions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching transaction logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading audit logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h2 text-white fw-bold">Transaction History</h1>
        <p className="text-muted">Audit trail of all simulated trade operations processed on your account.</p>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <div className="p-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
          <h3 className="h5 text-white fw-bold mb-0">Trade Logs</h3>
          <span className="badge bg-secondary mono">{transactions.length} Logs</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-journal-text text-muted fs-1 mb-3"></i>
            <h4 className="text-white">No Transactions Logged</h4>
            <p className="text-muted mb-0">When you buy or sell stocks, the order logs will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Symbol</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>Execution Price</th>
                  <th className="text-end">Total Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td className="text-muted small">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <strong className="text-white mono">{tx.symbol}</strong>
                    </td>
                    <td>
                      <span className={`badge mono fw-bold ${tx.type === 'BUY' ? 'bg-success text-success bg-opacity-15' : 'bg-danger text-danger bg-opacity-15'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="mono">{tx.quantity}</td>
                    <td className="mono">${tx.price.toFixed(2)}</td>
                    <td className={`text-end mono fw-semibold ${tx.type === 'BUY' ? 'text-danger' : 'text-success'}`}>
                      {tx.type === 'BUY' ? '-' : '+'}${tx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

export default TransactionsPage;
