import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../AuthContext';
import "./home.css";

const Home = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const signOut = () => {
    setUser(null); 
    navigate('/');
  };

  return (
    <div>
      <header id="header">
      <div className="logo-container">
          <img src="/hananet_logo.png" alt="HNPCI Logo" className="company-logo" />
          <span className="company-name">Hana-Net Trucking Company</span>
        </div>
        <button className="sign-out-button" onClick={signOut}>Sign Out</button>
      </header>


      <div id="main">
        <div className="welcome-container">
          <h2>Welcome, {user?.firstName} {user?.lastName}!</h2>
          <p>{today}</p>
        </div>

        <div className ="button-container">
          <button className='nav-button' onClick={() => navigate('/profile')}>View Personal Information</button>
          <button className="nav-button" onClick={() => navigate('/computation')}>View Salary Computation</button>
          <button className="nav-button" onClick={() => navigate('/history')}>View Salary History</button>
          <button className="nav-button" onClick={() => navigate('/leaveapplication')}>Apply for Leave</button>
          <button className="nav-button" onClick={() => navigate('/attendance')}>Attendance Tracking</button>

        </div>
      </div>
    </div>
  );
};

export default Home;
