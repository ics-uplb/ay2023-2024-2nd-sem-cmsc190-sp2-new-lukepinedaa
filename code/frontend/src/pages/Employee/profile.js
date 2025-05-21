import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import "./profile.css";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [userRequests, setUserRequests] = useState([]);

  const navigate = useNavigate();
  const toggleNav = () => setSideNavOpen(!sideNavOpen);

  useEffect(() => {
    if (user?.email) {
      fetch('https://sp-eykc.onrender.com/retrieveUserData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
        .then(res => res.json())
        .then(data => {
          setUserData(data);
          setEditableData({
            firstName: data.firstName,
            lastName: data.lastName,
            address: data.address,
            birthday: data.birthday,
          });
        })
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, [user]);

  const handleInputChange = e => {
    setEditableData({ ...editableData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async () => {
    try {
      const res = await fetch('https://sp-eykc.onrender.com/requestProfileUpdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, updates: editableData })
      });
      const result = await res.json();
      if (res.ok) {
        setStatusMessage("Update request submitted for admin approval.");
        setIsEditing(false);
      } else {
        setStatusMessage(result.message || "Failed to submit update request.");
      }
    } catch (err) {
      console.error('Error submitting update request:', err);
      setStatusMessage("An error occurred while submitting the request.");
    }
  };

  const openRequestsModal = async () => {
    try {
      const res = await fetch(`https://sp-eykc.onrender.com/emprofileUpdateRequests/${user.email}`);
      if (!res.ok) throw new Error('Could not fetch requests');
      const requests = await res.json();
      setUserRequests(requests);
      setShowRequestsModal(true);
    } catch (err) {
      console.error('Error fetching your requests:', err);
    }
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

      <div id="profile-container">
        <h2>Personal Information</h2>
        {userData ? (
          <div className="profile-info">
            {isEditing ? (
              <>
                <label>First Name:</label>
                <input name="firstName" value={editableData.firstName} onChange={handleInputChange} />

                <label>Last Name:</label>
                <input name="lastName" value={editableData.lastName} onChange={handleInputChange} />

                <label>Address:</label>
                <input name="address" value={editableData.address} onChange={handleInputChange} />

                <label>Birthday:</label>
                <input
                  type="date"
                  name="birthday"
                  value={new Date(editableData.birthday).toISOString().split("T")[0]}
                  onChange={handleInputChange}
                />

                <button className="submit-btn" onClick={handleSubmit}>Submit for Approval</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </>
            ) : (
              <>
                <p><strong>Full Name:</strong> {userData.firstName} {userData.lastName}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Birthday:</strong> {new Date(userData.birthday).toLocaleDateString()}</p>
                <p><strong>Address:</strong> {userData.address}</p>
                <p><strong>Employment Date:</strong> {new Date(userData.employmentDate).toLocaleDateString()}</p>
                <p><strong>Job Title:</strong> {userData.titleId.name}</p>

                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Info</button>
              </>
            )}

            <button className="requests-btn" onClick={openRequestsModal}>
              User Information Edit Requests
            </button>

            {statusMessage && <p className="status-msg">{statusMessage}</p>}
          </div>
        ) : (
          <p>Loading user information...</p>
        )}
      </div>

      {showRequestsModal && (
        <div className="modal-overlay" onClick={() => setShowRequestsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Your Profile Update Requests</h3>
            <button className="close-button" onClick={() => setShowRequestsModal(false)}>
              &times;
            </button>
            {userRequests.length > 0 ? (
              userRequests.map((req, idx) => (
                <div key={idx} className="request-item">
                  <p><strong>Date:</strong> {new Date(req.requestedAt).toLocaleString()}</p>
                  <p><strong>Status:</strong> {req.status}</p>
                  <div>
                    <strong>Proposed Changes:</strong>
                    <ul>
                      {Object.entries(req.updates).map(([field, value]) => (
                        <li key={field}>
                          <em>{field}</em>: {String(value)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <hr />
                </div>
              ))
            ) : (
              <p>No edit requests found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
