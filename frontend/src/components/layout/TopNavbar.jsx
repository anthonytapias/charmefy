import { Link } from 'react-router-dom';
import './TopNavbar.css';

const TopNavbar = () => {
  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <a href="/" className="logo">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M8 12l2 2 4-4"/>
          </svg>
          <span className="logo-text">Charmefy</span>
        </a>
      </div>

      <div className="navbar-right">
        <Link to="/signin" className="btn btn-outline">Login</Link>
        <Link to="/signup" className="btn btn-primary">Sign up</Link>
      </div>
    </nav>
  );
};

export default TopNavbar;
