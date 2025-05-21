import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

import './jobpositions.css';

const JobPositions = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [titles, setTitles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [usersForTitle, setUsersForTitle] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [titleToDelete, setTitleToDelete] = useState(null);

  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
  };

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/home');
    }
    fetchTitles();
  }, []);

  const fetchTitles = async () => {
    const res = await fetch('https://sp-eykc.onrender.com/gettitles');
    const data = await res.json();
    setTitles(data);
  };
  const signOut = () => {
    setUser(null); 
    navigate('/');
  };

  const handleCreateTitle = async () => {
    if (!newTitle || !baseSalary) return alert("Fill in all fields.");

    const res = await fetch('https://sp-eykc.onrender.com/createtitle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTitle, baseSalary: Number(baseSalary) }),
    });

    if (res.ok) {
      setNewTitle('');
      setBaseSalary('');
      setCreateModalOpen(false); 
      fetchTitles();
    } else {
      alert("Failed to create title.");
    }
  };

  const handleTitleClick = async (title) => {
    const res = await fetch(`https://sp-eykc.onrender.com/getusersbytitle?title=${title.name}`);
    const data = await res.json();
    setSelectedTitle(title);
    setUsersForTitle(data);
    setModalOpen(true);
  };

  const closeUserModal = () => {
    setModalOpen(false);
    setUsersForTitle([]);
    setSelectedTitle(null);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setNewTitle('');
    setBaseSalary('');
  };

  const handleDeleteClick = (e, title) => {
    e.stopPropagation();
    setTitleToDelete(title);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!titleToDelete) return;
    
    try {
      const res = await fetch(`https://sp-eykc.onrender.com/getusersbytitle?title=${titleToDelete.name}`);
      const usersWithTitle = await res.json();
      
      if (usersWithTitle.length > 0) {
        alert(`Cannot delete title "${titleToDelete.name}" because ${usersWithTitle.length} employee(s) are assigned to it. Please reassign these employees first.`);
        setShowConfirmModal(false);
        setTitleToDelete(null);
        return;
      }
      
      const deleteRes = await fetch(`https://sp-eykc.onrender.com/deletetitle/${titleToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (deleteRes.ok) {
        setTitles(titles.filter(title => title._id !== titleToDelete._id));
        setShowConfirmModal(false);
        setTitleToDelete(null);
        alert('Job title deleted successfully');
      } else {
        const errorData = await deleteRes.json();
        alert(`Error: ${errorData.message || 'Failed to delete title'}`);
      }
    } catch (err) {
      console.error('Error deleting job title:', err);
      alert('Failed to delete job title. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setTitleToDelete(null);
  };

  const updateUserTitle = async (userId, newTitleId) => {
    try {
      const res = await fetch('https://sp-eykc.onrender.com/updateUserTitle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newTitleId }),
      });
  
      if (res.ok) {
        alert("User title updated!");
        handleTitleClick(selectedTitle); 
      } else {
        alert("Failed to update user title.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating title.");
    }
  };

  const handleUpdateTitle = async (id) => {
    const duplicate = titles.find(
      (title) =>
        title.name.toLowerCase() === selectedTitle.name.toLowerCase() &&
        title._id !== id
    );
  
    if (duplicate) {
      return alert("A title with that name already exists.");
    }
  
    try {
      const res = await fetch(`https://sp-eykc.onrender.com/updatetitle/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTitle.name,
          baseSalary: selectedTitle.baseSalary,
        }),
      });
  
      if (res.ok) {
        alert("Title updated successfully!");
        fetchTitles(); 
        closeUserModal(); 
      } else {
        alert("Failed to update title.");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating title.");
    }
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

      <main className="job-main">
        <button className="open-create-btn" onClick={() => setCreateModalOpen(true)}>
          Create New Position
        </button>

        <div className="position-list">
          <h3>Existing Positions</h3>
          {titles.map((title) => (
            <button key={title._id} onClick={() => handleTitleClick(title)}>
              <div className="position-button-content">
                <span>{title.name}</span>
                {title.name !== "Employee Default" && (
                <span className="delete-button" title="Delete Position" onClick={(e) => handleDeleteClick(e, title)}>
                  🗑️
                </span>
               )}
              </div>
            </button>
          ))}
        </div>
      </main>
      {modalOpen && (
  <div className="modal-overlay" onClick={closeUserModal}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>Users with title: {selectedTitle.name}</h3>

      <div>
        <label>Title Name:</label>
        <input
          type="text"
          value={selectedTitle.name}
          onChange={(e) =>
            setSelectedTitle({ ...selectedTitle, name: e.target.value })
          }
          disabled={selectedTitle.name === "Employee Default"}
        />
        <label>Base Salary:</label>
        <input
          type="number"
          value={selectedTitle.baseSalary}
          onChange={(e) =>
            setSelectedTitle({
              ...selectedTitle,
              baseSalary: Number(e.target.value),
            })
          }
          disabled={selectedTitle.name === "Employee Default"}
        />
        {selectedTitle.name !== "Employee Default" && (
          <button onClick={() => handleUpdateTitle(selectedTitle._id)}>
            Save Changes
          </button>
        )}
      </div>

      <ul>
        <p>REMINDER: When changing the base salary, re-assign job position to generate new salary of employee(s) under this position by clicking "Change" Button</p>

        {usersForTitle.map((user) => (
          <li key={user._id}>
            <span>{user.firstName} {user.lastName}</span>
            <div>
              <select
                value={user.titleId?._id || selectedTitle._id}
                onChange={(e) => {
                  const updatedUsers = usersForTitle.map(u =>
                    u._id === user._id ? { ...u, titleId: { _id: e.target.value } } : u
                  );
                  setUsersForTitle(updatedUsers);
                }}
              >
                {titles.map(title => (
                  <option key={title._id} value={title._id}>
                    {title.name}
                  </option>
                ))}
              </select>
              <button onClick={() => updateUserTitle(user._id, user.titleId._id)}>
                Change
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button onClick={closeUserModal}>Close</button>
    </div>
  </div>
)}

      {createModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Position</h3>
            <input
              type="text"
              placeholder="Title name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              type="number"
              placeholder="Base Salary"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            />
            <button onClick={handleCreateTitle}>Create</button>
            <button onClick={closeCreateModal}>Cancel</button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete the "{titleToDelete?.name}" position?</p>
            <p>This action cannot be undone. Please ensure no employees are assigned to this title before deleting.</p>
            
            <div className="modal-buttons">
              <button className="cancel-button" onClick={cancelDelete}>Cancel</button>
              <button className="delete-confirm-button" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPositions;