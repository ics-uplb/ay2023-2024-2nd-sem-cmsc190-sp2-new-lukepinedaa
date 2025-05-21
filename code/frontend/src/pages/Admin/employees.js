import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

import "./employees.css";

const Employees = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [sortOption, setSortOption] = useState('alphabetical'); 
  const [searchTerm, setSearchTerm] = useState(''); 

  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
  };

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/home');
    }
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('https://sp-eykc.onrender.com/users');
      const data = await res.json();
      const employeeUsers = data.filter(user => user.role === 'Employee');
      
      for (const emp of employeeUsers) {
        try {
          const pendingRequestRes = await fetch(`https://sp-eykc.onrender.com/adprofileUpdateRequests/${emp.email}`);
          const pendingRequests = await pendingRequestRes.json();
          emp.hasPendingRequest = pendingRequests && pendingRequests.length > 0;
        } catch (err) {
          console.error(`Error checking pending requests for ${emp.email}:`, err);
          emp.hasPendingRequest = false;
        }
      }
      

      const sortedEmployees = sortEmployees(employeeUsers, 'alphabetical');
      setEmployees(sortedEmployees);
      setFilteredEmployees(sortedEmployees);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const sortEmployees = (employeesList, option) => {
    if (option === 'alphabetical') {
      return [...employeesList].sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (option === 'jobTitle') {
      return [...employeesList].sort((a, b) => {
        const titleA = (a.titleId?.name || 'Unknown Title').toLowerCase();
        const titleB = (b.titleId?.name || 'Unknown Title').toLowerCase();
        return titleA.localeCompare(titleB);
      });
    }
    return employeesList;
  };


  const handleSortChange = (e) => {
    const option = e.target.value;
    setSortOption(option);
    const sorted = sortEmployees(employees, option);
    setEmployees(sorted);
    
    if (searchTerm) {
      applySearch(sorted, searchTerm);
    } else {
      setFilteredEmployees(sorted);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const applySearch = (employeeList, term) => {
    const lowerTerm = term.toLowerCase();
    const filtered = employeeList.filter(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const jobTitle = (emp.titleId?.name || '').toLowerCase();
      
      return fullName.includes(lowerTerm) || jobTitle.includes(lowerTerm);
    });
    
    setFilteredEmployees(filtered);
  };
  

  const handleSearch = () => {
    applySearch(employees, searchTerm);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const signOut = () => {
    setUser(null); 
    navigate('/');
  };
  
  const handleEmployeeClick = (employee) => {
    const employeeTab = window.open(`/employee/${employee.email}`, '_blank');
    employeeTab.focus();
  };

  const handleDeleteClick = (e, employee) => {
    e.stopPropagation(); 
    setEmployeeToDelete(employee);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      const response = await fetch(`https://sp-eykc.onrender.com/deleteEmployee/${employeeToDelete.email}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const updatedEmployees = employees.filter(emp => emp.email !== employeeToDelete.email);
        const sortedEmployees = sortEmployees(updatedEmployees, sortOption);
        setEmployees(sortedEmployees);
        
        if (searchTerm) {
          applySearch(sortedEmployees, searchTerm);
        } else {
          setFilteredEmployees(sortedEmployees);
        }
        
        setShowConfirmModal(false);
        setEmployeeToDelete(null);
        alert('Employee deleted successfully');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setEmployeeToDelete(null);
  };
  
  const contentStyle = {
    transform: sideNavOpen ? 'translateX(250px)' : 'translateX(0)',
    width: `calc(100% - ${sideNavOpen ? '250px' : '0px'})`,
    transition: 'transform 0.5s, width 0.5s'
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
      <div id="content-wrapper" style={contentStyle}>
        <div className="employees-container">
          <div className="employees-header">
            <h2>All Employees</h2>
            <div className="controls-container">
              <div className="search-controls">
                <input
                  type="text"
                  placeholder="Search by name or job title"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                  className="search-input"
                />
                <button onClick={handleSearch} className="search-button">
                  Search
                </button>
              </div>
              <div className="sort-controls">
                <label htmlFor="sortSelect">Sort by: </label>
                <select 
                  id="sortSelect" 
                  value={sortOption}
                  onChange={handleSortChange}
                  className="sort-select"
                >
                  <option value="alphabetical">Name (A-Z)</option>
                  <option value="jobTitle">Job Title</option>
                </select>
              </div>
            </div>
          </div>
          <div className="employee-list">
          {filteredEmployees.map(emp => (
            <button key={emp._id} className="employee-button" onClick={() => handleEmployeeClick(emp)}>
              <span className="employee-info">
                {emp.firstName} {emp.lastName} — {emp.titleId?.name || 'Unknown Title'}
              </span>
              <div className="button-actions">
                {emp.hasPendingRequest && (
                  <span className="pending-indicator" title="Pending Profile Update">⚠️</span>
                )}
                <span className="delete-button" title="Delete Employee" onClick={(e) => handleDeleteClick(e, emp)}>
                  🗑️
                </span>
              </div>
            </button>
          ))}
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete {employeeToDelete?.firstName} {employeeToDelete?.lastName}?</p>
            <p>This action cannot be undone and will remove all data associated with this employee.</p>
            
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

export default Employees;