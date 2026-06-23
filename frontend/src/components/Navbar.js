import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiShield } from 'react-icons/fi';
import '../styles/Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'customer':
        return '/customer/dashboard';
      case 'checker':
        return '/checker/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <FiShield className="brand-icon" />
          <span>Turnscan</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {!user ? (
            <>
              <li><Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link></li>
              <li><Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link></li>
              <li><Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link></li>
              <li><Link to="/login" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Login</Link></li>
            </>
          ) : (
            <>
              <li><Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link></li>
              <li className="notification-icon">
                <Link to="/notifications" style={{ color: 'inherit', display: 'flex', alignItems: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                  <FiBell size={20} />
                </Link>
              </li>
              <li className="user-menu">
                <span className="user-name">{user.name}</span>
                <span className="user-role badge">{user.role}</span>
              </li>
              <li><button onClick={handleLogout} className="btn btn-danger">Logout</button></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
