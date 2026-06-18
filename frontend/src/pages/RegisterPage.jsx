import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { register, error, setError, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    setError(null);
  }, [user, navigate, setError]);

  // Dynamic Password Strength Assessment
  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Too Short', color: 'text-danger', width: '30%', bg: 'bg-danger' };
    
    // Check complexity
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    if (hasLetter && hasNumber && hasSpecial && password.length >= 8) {
      return { label: 'Strong', color: 'text-success', width: '100%', bg: 'bg-success' };
    } else if (hasLetter && hasNumber) {
      return { label: 'Medium', color: 'text-warning', width: '70%', bg: 'bg-warning' };
    }
    return { label: 'Weak', color: 'text-danger', width: '45%', bg: 'bg-danger' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name || !email || !password || !confirmPassword) {
      setValidationError('All fields are required');
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const res = await register(name, email, password);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="col-10 col-sm-8 col-md-6 col-lg-5 col-xl-4 glass-card p-4">
        <div className="text-center mb-4">
          <i className="bi bi-person-plus text-primary fs-1 mb-2"></i>
          <h2 className="fw-bold text-white mb-1">Create Account</h2>
          <p className="text-muted small">Register to start virtual stock trading</p>
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
            <label className="form-label text-muted small">Full Name</label>
            <input
              type="text"
              className="form-control form-control-custom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small">Email Address</label>
            <input
              type="email"
              className="form-control form-control-custom"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small">Password</label>
            <input
              type="password"
              className="form-control form-control-custom"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {strength && (
              <div className="mt-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Strength:</span>
                  <span className={`fw-semibold small ${strength.color}`} style={{ fontSize: '0.75rem' }}>{strength.label}</span>
                </div>
                <div className="progress" style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className={`progress-bar ${strength.bg}`}
                    role="progressbar"
                    style={{ width: strength.width }}
                    aria-valuenow="10"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small">Confirm Password</label>
            <input
              type="password"
              className="form-control form-control-custom"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary-custom w-100 py-3 mb-3">
            Create Account
          </button>
        </form>

        <div className="text-center mt-3 small">
          <span className="text-muted">Already have an account? </span>
          <Link to="/login" className="text-primary fw-semibold decoration-none">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
