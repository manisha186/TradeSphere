import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { login, error, setError, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    setError(null);
  }, [user, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in all fields');
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="col-10 col-sm-8 col-md-6 col-lg-5 col-xl-4 glass-card p-4">
        <div className="text-center mb-4">
          <i className="bi bi-graph-up-arrow text-primary fs-1 mb-2"></i>
          <h2 className="fw-bold text-white mb-1">Welcome Back</h2>
          <p className="text-muted small">Sign in to your TradeSphere account</p>
        </div>

        {validationError && (
          <div className="alert alert-danger py-2 px-3 small border-0 bg-danger-glow text-danger rounded-3 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {validationError}
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 px-3 small border-0 bg-danger-glow text-danger rounded-3 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted small">Email Address</label>
            <input
              type="email"
              className="form-control form-control-custom"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small">Password</label>
            <input
              type="password"
              className="form-control form-control-custom"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary-custom w-100 py-3 mb-3">
            Sign In
          </button>
        </form>

        <div className="text-center mt-3 small">
          <span className="text-muted">Don't have an account? </span>
          <Link to="/register" className="text-primary fw-semibold decoration-none">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
