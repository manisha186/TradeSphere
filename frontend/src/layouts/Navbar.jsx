import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active font-weight-bold text-primary' : 'text-light';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark py-3" style={{ background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4" to="/">
          <i className="bi bi-graph-up-arrow text-primary"></i>
          <span>TradeSphere</span>
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-2">
            {user && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/market')}`} to="/market">
                    Market
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/portfolio')}`} to="/portfolio">
                    Portfolio
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/transactions')}`} to="/transactions">
                    History
                  </Link>
                </li>
                {user.role === 'ADMIN' && (
                  <li className="nav-item">
                    <Link className={`nav-link text-warning fw-bold ${location.pathname === '/admin' ? 'active' : ''}`} to="/admin">
                      <i className="bi bi-shield-lock-fill me-1"></i>Admin Console
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <>
                <div className="d-none d-md-flex flex-column align-items-end me-2">
                  <span className="text-muted small">Virtual Balance</span>
                  <span className="fw-bold text-success mono" style={{ fontSize: '1.05rem' }}>
                    ${user.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-light dropdown-toggle d-flex align-items-center gap-2"
                    type="button"
                    id="profileDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle"></i>
                    <span>{user.name}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark p-2 border-secondary" aria-labelledby="profileDropdown" style={{ backgroundColor: '#0d1322' }}>
                    <li>
                      <Link className="dropdown-item rounded py-2" to="/profile">
                        <i className="bi bi-person me-2"></i>My Profile
                      </Link>
                    </li>
                    {user.role === 'ADMIN' && (
                      <li>
                        <Link className="dropdown-item rounded py-2 text-warning" to="/admin">
                          <i className="bi bi-shield-lock me-2"></i>Admin Dashboard
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider border-secondary" /></li>
                    <li>
                      <button className="dropdown-item rounded py-2 text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="gap-2 d-flex">
                <Link className="btn btn-outline-light px-4" to="/login">
                  Login
                </Link>
                <Link className="btn btn-primary-custom px-4" to="/register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
