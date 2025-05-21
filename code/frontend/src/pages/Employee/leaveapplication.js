import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import "./leaveapplication.css";

const LeaveApplication = () => {
  const { user, setUser } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [leaveData, setLeaveData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    leaveType: '',
    otherReason: '',
    startDate: '',
    endDate: '',
    daysRequested: '',
    comments: '',
    status: 'pending'
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const navigate = useNavigate();

  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setLeaveData({
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      leaveType: '',
      otherReason: '',
      startDate: '',
      endDate: '',
      daysRequested: '',
      comments: '',
      status: 'pending'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveData({
      ...leaveData,
      [name]: value
    });
  };

  const handleRadioChange = (value) => {
    setLeaveData({
      ...leaveData,
      leaveType: value
    });
  };

  const calculateDays = () => {
    if (leaveData.startDate && leaveData.endDate) {
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      
      setLeaveData({
        ...leaveData,
        daysRequested: diffDays
      });
    }
  };

  useEffect(() => {
    calculateDays();
  }, [leaveData.startDate, leaveData.endDate]);

  useEffect(() => {
    if (user?.email) {
      fetchLeaveRequests();
    }
  }, [user]);

  const fetchLeaveRequests = () => {
    fetch(`https://sp-eykc.onrender.com/leaveRequests/${user.email}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setLeaveRequests(data);
      })
      .catch(error => {
        console.error('Error fetching leave requests:', error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    fetch('https://sp-eykc.onrender.com/applyLeave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leaveData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        alert('Leave application submitted successfully!');
        closeModal();
        fetchLeaveRequests(); 
      })
      .catch(error => {
        console.error('Error submitting leave request:', error);
        alert('Failed to submit leave request. Please try again.');
      });
  };
  const signOut = () => {
    setUser(null); 
    navigate('/');
  };

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
            <button className="dashboard" onClick={() => navigate('/home')}>Home</button>
            <button className="sign-out-button" onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>


      <div id="mySidenav" className="sidenav" style={{ width: sideNavOpen ? "250px" : "0" }}>
        <span onClick={() => navigate('/home')}>Dashboard</span>
        <span onClick={() => navigate('/profile')}>View Personal Information</span>
        <span onClick={() => navigate('/computation')}>View Salary Computation</span>
        <span onClick={() => navigate('/history')}>View Salary History</span>
        <span onClick={() => navigate('/leaveapplication')}>Apply for Leave</span>
        <span onClick={() => navigate('/attendance')}>Attendance Tracking</span>

      </div>

      <div className="content" style={{ marginLeft: sideNavOpen ? "250px" : "0" }}>
        <div className="leave-container">
          <h2>Leave Application</h2>
          <button className="apply-leave-btn" onClick={openModal}>Apply for Leave</button>

          <div className="leave-history">
            <h3>Leave Request History</h3>
            {leaveRequests.length === 0 ? (
              <p>No leave requests found.</p>
            ) : (
              <table className="leave-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request, index) => (
                    <tr key={index}>
                      <td>{request.leaveType}</td>
                      <td>{new Date(request.startDate).toLocaleDateString()}</td>
                      <td>{new Date(request.endDate).toLocaleDateString()}</td>
                      <td>{request.daysRequested}</td>
                      <td className={`status-${request.status.toLowerCase()}`}>{request.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-btn" onClick={closeModal}>&times;</span>
            <h2>Leave Application Form</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <h3>Reason for Leave</h3>
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={leaveData.leaveType === 'Emergency Leave'} 
                    onChange={() => handleRadioChange('Emergency Leave')} 
                  />
                  Emergency Leave
                </label>
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={leaveData.leaveType === 'Annual Leave'} 
                    onChange={() => handleRadioChange('Annual Leave')} 
                  />
                  Annual Leave
                </label>
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={leaveData.leaveType === 'Other'} 
                    onChange={() => handleRadioChange('Other')} 
                  />
                  Other:
                  {leaveData.leaveType === 'Other' && (
                    <input 
                      type="text" 
                      name="otherReason" 
                      value={leaveData.otherReason} 
                      onChange={handleInputChange} 
                      className="other-input"
                    />
                  )}
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First day of absence</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={leaveData.startDate} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Last day of absence</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={leaveData.endDate} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>No. of days requested</label>
                <input 
                  type="number" 
                  name="daysRequested" 
                  value={leaveData.daysRequested} 
                  readOnly 
                  className="filled-automatically"
                />
                <small>Filled automatically</small>
              </div>

              <div className="form-group">
                <label>Comments (optional):</label>
                <textarea 
                  name="comments" 
                  value={leaveData.comments} 
                  onChange={handleInputChange}
                  rows="4"
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">SEND REQUEST</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApplication;