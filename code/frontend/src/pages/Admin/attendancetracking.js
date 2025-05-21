import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAuth } from '../../AuthContext';
import "./attendancetracking.css";

const AttendanceTracking = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [sortOption, setSortOption] = useState('alphabetical');
  const [searchTerm, setSearchTerm] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setLoading(true);
    
    try {
      const response = await fetch(`https://sp-eykc.onrender.com/attendance/${employee.email}/${currentMonth}/${currentYear}`);
      
      if (response.ok) {
        const attendanceData = await response.json();
        setAttendanceRecords(attendanceData);
      } else {
        setAttendanceRecords([]);
      }
      
      setShowAttendanceModal(true);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setCurrentMonth(parseInt(e.target.value));
    if (selectedEmployee) {
      handleEmployeeClick(selectedEmployee);
    }
  };

  const handleYearChange = (e) => {
    setCurrentYear(parseInt(e.target.value));
    if (selectedEmployee) {
      handleEmployeeClick(selectedEmployee);
    }
  };

  const getAttendanceStats = () => {
    if (!attendanceRecords.length) return { present: 0, absent: 0, late: 0, halfDay: 0 };
    
    return attendanceRecords.reduce((stats, record) => {
      stats[record.status]++;
      return stats;
    }, { present: 0, absent: 0, late: 0, 'half-day': 0 });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const signOut = () => {
    setUser(null); 
    navigate('/');
  };
  const generateAttendancePDF = () => {
    if (!selectedEmployee || !attendanceRecords.length) {
      alert('No attendance data available');
      return;
    }

    const doc = new jsPDF();
    const stats = getAttendanceStats();
    const logoUrl = '/hananet_logo.png';
    const imgWidth = 40;
    const imgHeight = 15;

    const pageWidth = doc.internal.pageSize.getWidth();
    const logoX = (pageWidth - imgWidth) / 2;

    const img = new Image();
    img.src = logoUrl;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
        
      doc.addImage(dataUrl, 'PNG', logoX, 15, imgWidth, imgHeight);
        
      completePdfGeneration();
    };
    
    img.onerror = function() {
      console.error('Could not load the logo. Continuing without it.');
      completePdfGeneration();
    };
    
    function completePdfGeneration() {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Hana-net Philippines Co. Inc. Trucking Company", 105, 35, { align: "center" });
      
      doc.setFontSize(14);
      doc.text(`Attendance Report for ${months[currentMonth-1]} ${currentYear}`, 105, 45, { align: "center" });
      doc.setFont("helvetica", "normal");

      doc.setFontSize(12);
      doc.text(`Name: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 20, 60);
      doc.text(`Address: ${selectedEmployee.address || 'N/A'}`, 20, 70);
      doc.text(`Email: ${selectedEmployee.email}`, 20, 80);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Attendance Summary", 20, 100);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Present: ${stats.present || 0} days`, 20, 110);
      doc.text(`Absent: ${stats.absent || 0} days`, 20, 120);
      doc.text(`Late: ${stats.late || 0} days`, 20, 130);
      doc.text(`Half-day: ${stats['half-day'] || 0} days`, 20, 140);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Attendance Records", 20, 160);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      doc.text("Date", 20, 170);
      doc.text("Check In", 70, 170);
      doc.text("Check Out", 120, 170);
      doc.text("Status", 170, 170);
      
      doc.line(20, 172, 190, 172);
      
      let yPosition = 180;
      attendanceRecords.forEach((record) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 30;
          
          doc.text("Date", 20, yPosition);
          doc.text("Check In", 70, yPosition);
          doc.text("Check Out", 120, yPosition);
          doc.text("Status", 170, yPosition);
          
          doc.line(20, yPosition + 2, 190, yPosition + 2);
          yPosition += 10;
        }
        
        const dateStr = new Date(record.date).toLocaleDateString();
        const checkIn = record.checkIn ? formatTime(record.checkIn) : 'N/A';
        const checkOut = record.checkOut ? formatTime(record.checkOut) : 'N/A';
        
        doc.text(dateStr, 20, yPosition);
        doc.text(checkIn, 70, yPosition);
        doc.text(checkOut, 120, yPosition);
        doc.text(record.status.charAt(0).toUpperCase() + record.status.slice(1), 170, yPosition);
        
        yPosition += 8;
      });
      
      doc.setFontSize(10);
      doc.text("This is an automatically generated document.", 105, 280, { align: "center" });
      
      doc.save(`Attendance_Report_${selectedEmployee.firstName}_${selectedEmployee.lastName}_${months[currentMonth-1]}_${currentYear}.pdf`);
    }
  };

  const generateAllEmployeesAttendancePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      let pageCount = 0;
      
      const logoUrl = '/hananet_logo.png';
      const imgWidth = 40;
      const imgHeight = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoX = (pageWidth - imgWidth) / 2;
      
      let logoDataUrl = null;
      
      try {
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            logoDataUrl = canvas.toDataURL('image/png');
            resolve();
          };
          img.onerror = () => {
            console.error('Could not load the logo');
            resolve();
          };
        });
      } catch (error) {
        console.error('Error loading logo:', error);
      }
      
      for (const employee of filteredEmployees) {
        try {
          const attendanceResponse = await fetch(`https://sp-eykc.onrender.com/attendance/${employee.email}/${currentMonth}/${currentYear}`);
          if (!attendanceResponse.ok) continue;
          
          const attendanceData = await attendanceResponse.json();
          if (attendanceData.length === 0) continue;
          
          if (pageCount > 0) {
            doc.addPage();
          }
          pageCount++;
          
          if (logoDataUrl) {
            doc.addImage(logoDataUrl, 'PNG', logoX, 15, imgWidth, imgHeight);
          }
          
          doc.setFontSize(18);
          doc.setFont("helvetica", "bold");
          doc.text("Hana-Net Trucking Company", 105, 35, { align: "center" });
          
          doc.setFontSize(14);
          doc.text(`Attendance Report for ${months[currentMonth-1]} ${currentYear}`, 105, 45, { align: "center" });
          doc.setFont("helvetica", "normal");
          
          doc.setFontSize(12);
          doc.text(`Name: ${employee.firstName} ${employee.lastName}`, 20, 60);
          doc.text(`Address: ${employee.address || 'N/A'}`, 20, 70);
          doc.text(`Email: ${employee.email}`, 20, 80);
          
          const stats = attendanceData.reduce((acc, record) => {
            acc[record.status]++;
            return acc;
          }, { present: 0, absent: 0, late: 0, 'half-day': 0 });
          
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Attendance Summary", 20, 100);
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          
          doc.text(`Present: ${stats.present || 0} days`, 20, 110);
          doc.text(`Absent: ${stats.absent || 0} days`, 20, 120);
          doc.text(`Late: ${stats.late || 0} days`, 20, 130);
          doc.text(`Half-day: ${stats['half-day'] || 0} days`, 20, 140);
          
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Daily Attendance Records", 20, 160);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          
          doc.text("Date", 20, 170);
          doc.text("Check In", 70, 170);
          doc.text("Check Out", 120, 170);
          doc.text("Status", 170, 170);
          
          doc.line(20, 172, 190, 172);
          
          let yPosition = 180;
          attendanceData.forEach((record) => {
            if (yPosition > 270) {
              doc.addPage();
              pageCount++;
              yPosition = 30;
              
              doc.text("Date", 20, yPosition);
              doc.text("Check In", 70, yPosition);
              doc.text("Check Out", 120, yPosition);
              doc.text("Status", 170, yPosition);
              
              doc.line(20, yPosition + 2, 190, yPosition + 2);
              yPosition += 10;
            }
            
            const dateStr = new Date(record.date).toLocaleDateString();
            const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
            const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
            
            doc.text(dateStr, 20, yPosition);
            doc.text(checkIn, 70, yPosition);
            doc.text(checkOut, 120, yPosition);
            doc.text(record.status.charAt(0).toUpperCase() + record.status.slice(1), 170, yPosition);
            
            yPosition += 8;
          });
          
          doc.setFontSize(10);
          doc.text(`Page ${pageCount} - Generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: "center" });
          
        } catch (error) {
          console.error(`Error processing employee ${employee.email}:`, error);
        }
      }
      
      if (pageCount === 0) {
        alert('No attendance data available for any employee for this month');
        return;
      }
      
      doc.save(`All_Employees_Attendance_${months[currentMonth-1]}_${currentYear}.pdf`);
      
    } catch (error) {
      console.error('Error generating attendance report:', error);
      alert('Failed to generate attendance report');
    } finally {
      setLoading(false);
    }
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
    <div id ="content-wrapper" style = {contentStyle}>
      <div className="attendance-tracking-container">
        <h2>Attendance Tracking</h2>
        
        <div className="month-selector">
          <div className="selector-group">
            <label htmlFor="monthSelect">Month:</label>
            <select 
              id="monthSelect" 
              value={currentMonth} 
              onChange={handleMonthChange}
              className="month-select"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div className="selector-group">
            <label htmlFor="yearSelect">Year:</label>
            <select 
              id="yearSelect" 
              value={currentYear} 
              onChange={handleYearChange}
              className="year-select"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

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
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
          <h3>Select Employee</h3>
            <div className="employee-list">
              {filteredEmployees.map(emp => (
                <button key={emp._id} className="employee-button" onClick={() => handleEmployeeClick(emp)}>
                  <span className="employee-info">
                    {emp.firstName} {emp.lastName} — {emp.titleId?.name || 'Unknown Title'}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="monthly-report-section">
              <button className="generate-monthly-button" onClick={generateAllEmployeesAttendancePDF}>
                Generate Attendance Report for All Employees
              </button>
            </div>
          </>
        )}
      </div>
      </div>

      {showAttendanceModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="attendance-modal">
            <span className="close" onClick={() => setShowAttendanceModal(false)}>&times;</span>
            <h3>{selectedEmployee.firstName} {selectedEmployee.lastName}'s Attendance - {months[currentMonth-1]} {currentYear}</h3>
            
            {loading ? (
              <p>Loading attendance information...</p>
            ) : attendanceRecords.length > 0 ? (
              <div className="attendance-details">
                <div className="attendance-summary">
                  <h4>Summary</h4>
                  <div className="summary-stats">
                    {Object.entries(getAttendanceStats()).map(([status, count]) => (
                      <div key={status} className="stat-item">
                        <span className="stat-label">{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}:</span>
                        <span className="stat-value">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="attendance-records">
                  <h4>Daily Records</h4>
                  <div className="records-table">
                    <div className="table-header">
                      <div className="header-cell">Date</div>
                      <div className="header-cell">Check In</div>
                      <div className="header-cell">Check Out</div>
                      <div className="header-cell">Status</div>
                    </div>
                    
                    {attendanceRecords.map((record, index) => (
                      <div key={index} className="table-row">
                        <div className="row-cell">{new Date(record.date).toLocaleDateString()}</div>
                        <div className="row-cell">{record.checkIn ? formatTime(record.checkIn) : 'N/A'}</div>
                        <div className="row-cell">{record.checkOut ? formatTime(record.checkOut) : 'N/A'}</div>
                        <div className="row-cell status">
                          <span className={`status-badge ${record.status}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="attendance-actions">
                  <button onClick={generateAttendancePDF} className="pdf-button">
                    Generate PDF Report
                  </button>
                </div>
              </div>
            ) : (
              <p>No attendance records available for {selectedEmployee.firstName} {selectedEmployee.lastName} in {months[currentMonth-1]} {currentYear}.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;