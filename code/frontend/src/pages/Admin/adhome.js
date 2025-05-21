import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './adhome.css';

const AdHome = () => {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaveRequests: 0,
    pendingProfileUpdates: 0
  });
  const navigate = useNavigate();

  const signOut = () => {
    setUser(null); 
    navigate('/');
  };
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/home');
    }

    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = () => {
    fetch('https://sp-eykc.onrender.com/admin/stats')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setStats(data);
      })
      .catch(error => {
        console.error('Error fetching dashboard stats:', error);
      });
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

      <div className="content">
        <div className="admin-dashboard-container">
          <h2>Admin Dashboard</h2>
          <p>Welcome back, {user?.firstName}!</p>

          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Employees</h3>
              <p className="stat-number">{stats.totalEmployees}</p>
            </div>
            
            <div className="stat-card">
              <h3>Pending Leave Requests</h3>
              <p className="stat-number">{stats.pendingLeaveRequests}</p>
              {stats.pendingLeaveRequests > 0 && (
                <button className="action-button"onClick={() => navigate('/leavemanagement')}>
                  View Requests
                </button>
              )}
            </div>
            
            <div className="stat-card">
              <h3>Profile Update Requests</h3>
              <p className="stat-number">{stats.pendingProfileUpdates}</p>
              {stats.pendingProfileUpdates > 0 && (
                <button className="action-button"onClick={() => navigate('/employees')}>
                  View Requests
                </button>
              )}
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={() => navigate('/employees')}>
                Manage Users
              </button>
              <button onClick={() => navigate('/leavemanagement')}>
                Leave Management
              </button>
              <button onClick={() => navigate('/jobpositions')}>
                Job Titles
              </button>
              <button onClick={() => navigate('/salarymanagement')}>
                Salary Management
              </button>
              <button onClick={() => navigate('/attendancetracking')}>
                Attendance Tracking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdHome;