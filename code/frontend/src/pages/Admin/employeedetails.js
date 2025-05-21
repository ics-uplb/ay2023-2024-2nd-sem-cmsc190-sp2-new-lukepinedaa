import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';


import "./employeedetails.css";

const EmployeeDetails = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [updateRequests, setUpdateRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [newEmploymentDate, setNewEmploymentDate] = useState('');
  const [sideNavOpen, setSideNavOpen] = useState(false);
  
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/home');
    }
    const fetchEmployee = async () => {
      const res = await fetch('https://sp-eykc.onrender.com/retrieveUserData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setEmployee(data);
    };

    fetchEmployee();
  }, [email]);

  const fetchRequests = async () => {
    const res = await fetch(`https://sp-eykc.onrender.com/adprofileUpdateRequests/${email}`);
    const data = await res.json();
    setUpdateRequests(data);
  };
  const signOut = () => {
    setUser(null); 
    navigate('/');
  };

  const handleRequestStatusChange = async (id, status) => {
    try {
      const res = await fetch(`https://sp-eykc.onrender.com/profileUpdateRequests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
  
      if (res.ok) {
        alert(`Request successfully ${status}.`);
        fetchRequests();
      } else {
        alert(`Failed to ${status} the request.`);
      }
    } catch (error) {
      console.error(`Error during ${status}:`, error);
      alert("Server error");
    }
  };

  const handleEditEmploymentDate = () => {
    setNewEmploymentDate(employee.employmentDate.split('T')[0]);
    setShowDateModal(true);
  };

  const handleSaveEmploymentDate = async () => {
    try {
      const res = await fetch(`https://sp-eykc.onrender.com/updateEmploymentDate/${email}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: newEmploymentDate }),
      });

      if (res.ok) {
        const updatedEmployee = {...employee, employmentDate: newEmploymentDate};
        setEmployee(updatedEmployee);
        setShowDateModal(false);
        alert("Employment date updated successfully.");
      } else {
        alert("Failed to update employment date.");
      }
    } catch (error) {
      console.error("Error updating employment date:", error);
      alert("Server error");
    }
  };
  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
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
            <button className="dashboard" onClick={() => navigate('/adhome')}>Home</button>
            <button className="sign-out-button" onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>
      <div id="mySidenav" className="sidenav" style={{ width: sideNavOpen ? '250px' : '0' }}>
        <span onClick={() => navigate('/adhome')}>Dashboard</span>
        <span onClick={() => navigate('/employees')}>Manage Users</span>
        <span onClick={() => navigate('/salarymanagement')}>Salary Management</span>
        <span onClick={() => navigate('/attendancetracking')}>Attendance Tracking</span>
        <span onClick={() => navigate('/leavemanagement')}>Leave Management</span>
        <span onClick={() => navigate('/jobpositions')}>Job Titles</span>
      </div>

    <div className="employee-details">
      {employee && (
        <div>
          <h2>{employee.firstName} {employee.lastName}</h2>
          <p><strong>Email:</strong> {employee.email}</p>
          <p><strong>Title:</strong> {employee.titleId?.name}</p>
          <p><strong>Address:</strong> {employee.address}</p>
          <p><strong>Birthday:</strong> {new Date(employee.birthday).toLocaleDateString()}</p>
          <p>
            <strong>Employment Date:</strong> {new Date(employee.employmentDate).toLocaleDateString()}
            <button className="edit-btn" onClick={handleEditEmploymentDate} style={{marginLeft: '10px'}}>Edit</button>
          </p>

          <button onClick={() => { fetchRequests(); setShowRequestModal(true); }}>User Information Edit Requests</button>
          
          {showRequestModal && (
            <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h4>User Information Edit Requests</h4>
                {updateRequests.map((req, idx) => (
                  <div key={idx} className="update-request">
                    <p><strong>Status:</strong> {req.status}</p>
                    <p><strong>Requested At:</strong> {new Date(req.requestedAt).toLocaleString()}</p>
                    <ul>
                      {Object.entries(req.updates).map(([field, value]) => (
                        <li key={field}><strong>{field}:</strong> {value}</li>
                      ))}
                    </ul>
                    {req.status === 'pending' && (
                      <div className="button-group">
                        <button className="approve-btn" onClick={() => handleRequestStatusChange(req._id, 'approved')}>
                          Approve
                        </button>
                        <button className="decline-btn" onClick={() => handleRequestStatusChange(req._id, 'declined')}>
                          Decline
                        </button>
                      </div>
                    )}
                    <hr />
                  </div>
                ))}
              </div>
            </div>
          )}

          {showDateModal && (
            <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h4>Edit Employment Date</h4>
                <input 
                  type="date" 
                  value={newEmploymentDate} 
                  onChange={(e) => setNewEmploymentDate(e.target.value)}
                />
                <div>
                  <button onClick={handleSaveEmploymentDate}>Save</button>
                  <button onClick={() => setShowDateModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
};

export default EmployeeDetails;