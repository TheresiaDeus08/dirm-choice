import React from 'react';
import './Header.css';
import { signOut } from 'firebase/auth';
import dirmLogo from '../../assets/dirm_group.jpg'; // adjust path if needed

import { auth } from '../../firebase/config';

function Header({ userName }) {

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getFirstName = (name) => {
    if (!name) return 'User';
    if (name.includes('@')) {
      const cleanName = name.split('@')[0].split('.')[0].replace(/\d+/g, '');
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    return name.split(' ')[0];
  };

  const getInitials = (name) => {
    const firstName = getFirstName(name);
    return firstName[0].toUpperCase();
  };

  return (
    <header className="dashboard-header">
<<<<<<< HEAD
      <div className="logo-section">
  <img src={dirmLogo} alt="Dirm Choice Logo" className="logo-img" />
  <span className="logo-text">Dirm Choice</span>
</div>

      <div className="user-info">
        <span>Welcome, {getFirstName(userName)}</span>
        <div className="avatar-placeholder">
          {getInitials(userName)}
        </div>
        {auth.currentUser?.email === 'admin@dirmchoice.com' && (
  <button className="admin-btn" onClick={() => window.location.href = '/admin'}>
    Admin Panel
  </button>
)}
=======
      <div className="logo">Dirm Choice</div>
>>>>>>> fbb90bf78bb71244df89859f36d823297793da8a

      <div className="user-info">
        <div className="user-greeting">
          <span>Welcome, {getFirstName(userName)}</span>
          <div className="avatar">{getInitials(userName)}</div>
        </div>

        <div className="header-actions">
          {auth.currentUser?.email === 'admin@dirmchoice.com' && (
            <button className="admin-btn" onClick={() => window.location.href = '/admin'}>
              Admin Panel
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
