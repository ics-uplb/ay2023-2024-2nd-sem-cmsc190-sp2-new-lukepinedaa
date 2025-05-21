import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

import './leavemanagement.css';

const LeaveManagement = () => {
  const { user, setUser } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); 
  const [detailsModal, setDetailsModal] = useState(null);
  const navigate = useNavigate();

  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
  };

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/home');
    }
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = () => {
    setLoading(true);
    fetch('https://sp-eykc.onrender.com/admin/leaveRequests')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setLeaveRequests(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching leave requests:', error);
        setError('Failed to load leave requests. Please try again later.');
        setLoading(false);
      });
  };
  const signOut = () => {
    setUser(null); 
    navigate('/');
  };
  const handleStatusChange = (id, status) => {
    fetch(`https://sp-eykc.onrender.com/admin/leaveRequests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setLeaveRequests(leaveRequests.map(request => 
          request._id === id ? { ...request, status } : request
        ));
        
        if (detailsModal && detailsModal._id === id) {
          setDetailsModal({ ...detailsModal, status });
        }
      })
      .catch(error => {
        console.error('Error updating leave request:', error);
        alert('Failed to update request status. Please try again.');
      });
  };

  const showDetailsModal = (request) => {
    setDetailsModal(request);
  };

  const closeDetailsModal = () => {
    setDetailsModal(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/home');
    }
  }, [user, navigate]);

  return (
    <div>
      <header
        id="header"
        style={{
          backgroundColor: sideNavOpen ? 'rgba(0,0,0,0.5)' : '#F2F2F2',
          transform: sideNavOpen ? 'translateX(250px)' : 'translateX(0)',
          width: 'calc(100% - ' + (sideNavOpen ? '250px' : '0px') + ')',
        }}
      >
        <div className="header-content">
          <div className="header-left">
            <span className="menu-icon" onClick={toggleNav}>☰</span>
            <div className="logo-container">
              <img src="/hananet_logo.png" alt="HNPCI Logo" className="company-logo" />
              <span className="company-name">Hana-Net Trucking Company</span>
            </div>
          </div>
          <div className="header-right">
            <button className="dashboard" onClick={() => navigate('/adhome')}>Home</button>
            <button className="sign-out-button" onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>

      <div id="mySidenav" className="sidenav" style={{ width: sideNavOpen ? "250px" : "0" }}>
        <span onClick={() => navigate('/adhome')}>Dashboard</span>
        <span onClick={() => navigate('/employees')}>Manage Users</span>
        <span onClick={() => navigate('/salarymanagement')}>Salary Management</span>
        <span onClick={() => navigate('/attendancetracking')}>Attendance Tracking</span>
        <span onClick={() => navigate('/leavemanagement')}>Leave Management</span>
        <span onClick={() => navigate('/jobpositions')}>Job Titles</span>
      </div>

      <div className="content" style={{ marginLeft: sideNavOpen ? "250px" : "0" }}>
        <div className="admin-leave-container">
          <h2>Leave Request Management</h2>

          <div className="filter-container">
            <span>Filter by status: </span>
            <div className="filter-buttons">
              <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                All
              </button>
              <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
                Pending
              </button>
              <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}
              >
                Approved
              </button>
              <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>
                Rejected
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading leave requests...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="no-requests">No leave requests found.</div>
          ) : (
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.email}</td>
                    <td>{request.firstName}</td>
                    <td>{request.lastName}</td>
                    <td>{request.leaveType}</td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>{formatDate(request.endDate)}</td>
                    <td>{request.daysRequested}</td>
                    <td className={`status-${request.status}`}>{request.status}</td>
                    <td>
                      <button className="details-btn" onClick={() => showDetailsModal(request)}>
                        Details
                      </button>
                      {request.status === 'pending' && (
                        <div className="action-buttons">
                          <button className="approve-btn" onClick={() => handleStatusChange(request._id, 'approved')}>
                            Approve
                          </button>
                          <button className="reject-btn" onClick={() => handleStatusChange(request._id, 'rejected')}>
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

            {detailsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-btn" onClick={closeDetailsModal}>&times;</span>
            <h2>Leave Request Details</h2>
            
            <div className="request-details">
              <div className="employee-details-grid">
                
                <div className="detail-item">
                  <span className="label">Leave Type:</span>
                  <span className="value">{detailsModal.leaveType}</span>
                </div>
              </div>
              
              {detailsModal.leaveType === 'Other' && detailsModal.otherReason && (
                <div className="detail-item">
                  <span className="label">Other Reason:</span>
                  <span className="value">{detailsModal.otherReason}</span>
                </div>
              )}
              
              {detailsModal.comments && (
                <div className="detail-item comments">
                  <span className="label">Comments:</span>
                  <p className="value">{detailsModal.comments}</p>
                </div>
              )}
            </div>
            
            {detailsModal.status === 'pending' && (
              <div className="modal-actions">
                <button className="approve-btn" onClick={() => handleStatusChange(detailsModal._id, 'approved')}>
                  Approve Request
                </button>
                <button className="reject-btn" onClick={() => handleStatusChange(detailsModal._id, 'rejected')}>
                  Reject Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;