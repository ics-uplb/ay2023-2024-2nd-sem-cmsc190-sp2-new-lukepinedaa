import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import jsPDF from 'jspdf';
import "./history.css";

const History = () => {
  const { user, setUser } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const navigate = useNavigate();

  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
  };


  useEffect(() => {
    const fetchSalaryHistory = async () => {
      try {
        const response = await fetch(`https://sp-eykc.onrender.com/salaryHistory/${user.email}`);
        if (!response.ok) throw new Error('Failed to fetch salary history');
        const data = await response.json();
        setSalaries(data);
      } catch (error) {
        console.error('Error fetching salary history:', error);
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await fetch('https://sp-eykc.onrender.com/retrieveUserData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchApprovedLeaves = async () => {
      try {
        const response = await fetch(`https://sp-eykc.onrender.com/leaveRequests/${user.email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch leave requests');
        }
        const data = await response.json();
        const approved = data.filter(leave => leave.status === 'approved');
        setApprovedLeaves(approved);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      }
    };

    if (user?.email) {
      fetchSalaryHistory();
      fetchUserData();
      fetchApprovedLeaves();
    }
  }, [user]);

  const generatePDF = (salary) => {
    if (!salary || !userData) {
      alert('Salary or user data not available');
      return;
    }

    const doc = new jsPDF();
    const salaryDate = new Date(salary.date);
    const logoUrl = '/hananet_logo.png';
    const imgWidth = 40; 
    const imgHeight = 15; 
    
    const img = new Image();
    img.src = logoUrl;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      
      doc.addImage(dataUrl, 'PNG', 20, 15, imgWidth, imgHeight);
      
      completePdfGeneration();
    };
    
    img.onerror = function() {
      console.error('Could not load the logo. Continuing without it.');
      completePdfGeneration();
    };
    function completePdfGeneration(){
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Hana-Net Trucking Company", 105, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.text("Salary Report", 105, 30, { align: "center" });
      doc.setFont("helvetica", "normal");
      
      doc.setFontSize(12);
      doc.text(`Name: ${userData.firstName} ${userData.lastName}`, 20, 45);
      doc.text(`Address: ${userData.address}`, 20, 55);
      doc.text(`Email: ${userData.email}`, 20, 65);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Salary Details", 20, 80);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Salary Period: ${new Date(salaryDate).toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 20, 90);
      doc.text(`Base Salary: ${salary.baseSalary}`, 20, 100);
      
      let yPosition = 110;
      
      if (salary.modifications && salary.modifications.length > 0) {
        doc.text("Modifications:", 20, yPosition);
        yPosition += 10;
        
        doc.setFont("helvetica", "bold");
        doc.text("Description", 25, yPosition);
        doc.text("Amount", 120, yPosition); 
        yPosition += 8;
      
        doc.line(25, yPosition, 180, yPosition); 
        yPosition += 5;
        doc.setFont("helvetica", "normal");
  
        salary.modifications.forEach((mod) => {
          const sign = mod.amount > 0 ? "+" : "";
          const amount = `${sign}${mod.amount}`;
          doc.text(mod.description, 25, yPosition);
          doc.text(amount, 120, yPosition);
          yPosition += 10;
        });
      } else {
        doc.text("Modifications: None", 20, yPosition);
        yPosition += 10;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text(`Final Salary: ${salary.finalSalary}`, 20, yPosition + 5);
      yPosition += 20;
      
      doc.setFontSize(14);
      doc.text("Approved Leave Requests", 20, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      if (approvedLeaves.length > 0) {
        const relevantLeaves = approvedLeaves.filter(leave => {
          const leaveDate = new Date(leave.startDate);
          return leaveDate.getMonth() === salaryDate.getMonth() && 
                 leaveDate.getFullYear() === salaryDate.getFullYear();
        });
        
        if (relevantLeaves.length > 0) {
          relevantLeaves.forEach(leave => {
            const startDate = new Date(leave.startDate).toLocaleDateString();
            const endDate = new Date(leave.endDate).toLocaleDateString();
            
            doc.text(`- Type: ${leave.leaveType}`, 25, yPosition);
            yPosition += 10;
            doc.text(`  Duration: ${startDate} to ${endDate} (${leave.daysRequested} days)`, 25, yPosition);
            yPosition += 15;
          });
        } else {
          doc.text("No approved leave requests during this salary period.", 20, yPosition);
        }
      } else {
        doc.text("No approved leave requests found.", 20, yPosition);
      }
      
      doc.setFontSize(10);
      doc.text("This is an automatically generated document.", 105, 280, { align: "center" });
      
      doc.save(`Salary_Report_${userData.firstName}_${userData.lastName}_${salaryDate.toLocaleDateString().replace(/\//g, '-')}.pdf`);
    }
   };

   const generateAllPDFs = async () => {
    if (salaries.length === 0 || !userData) {
      alert('No salary history or user data available');
      return;
    }
    
    const doc = new jsPDF();
    
    const logoUrl = '/hananet_logo.png';
    const imgWidth = 40;
    const imgHeight = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoX = (pageWidth - imgWidth) / 2;
    
    const loadLogoPromise = new Promise((resolve) => {
      const img = new Image();
      img.src = logoUrl;
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = function() {
        console.error('Could not load the logo.');
        resolve(null); 
      };
    });
    
    const logoDataUrl = await loadLogoPromise;
    
    salaries.forEach((salary, index) => {
      if (index > 0) {
        doc.addPage();
      }
      
      const pageCount = index + 1;
      const salaryDate = new Date(salary.date);
      
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', logoX, 15, imgWidth, imgHeight);
      }
      
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Hana-net Philippines Co. Inc. Trucking Company", 105, 35, { align: "center" });
      
      doc.setFontSize(14);
      doc.text(`Salary Report - Page ${pageCount}`, 105, 45, { align: "center" });
      doc.setFont("helvetica", "normal");
      
      doc.setFontSize(12);
      doc.text(`Name: ${userData.firstName} ${userData.lastName}`, 20, 60);
      doc.text(`Address: ${userData.address}`, 20, 70);
      doc.text(`Email: ${userData.email}`, 20, 80);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Salary Details", 20, 90);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Salary Period: ${new Date(salaryDate).toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 20, 100);
      doc.text(`Base Salary: ${salary.baseSalary}`, 20, 110);
      
      let yPosition = 120;
      
      if (salary.modifications && salary.modifications.length > 0) {
        doc.text("Modifications:", 20, yPosition);
        yPosition += 10;
        
        doc.setFont("helvetica", "bold");
        doc.text("Description", 25, yPosition);
        doc.text("Amount", 120, yPosition); 
        yPosition += 8;
    
        doc.line(25, yPosition, 180, yPosition); 
        yPosition += 5;
        doc.setFont("helvetica", "normal");
  
        salary.modifications.forEach((mod) => {
          const sign = mod.amount >= 0 ? "+" : ""; 
          const amount = `${sign}${mod.amount}`;
          doc.text(mod.description, 25, yPosition);
          doc.text(amount, 120, yPosition);
          yPosition += 10;
        });
      } else {
        doc.text("Modifications: None", 20, yPosition);
        yPosition += 10;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text(`Final Salary: ${salary.finalSalary}`, 20, yPosition + 5);
      yPosition += 20;
      
      doc.setFontSize(14);
      doc.text("Approved Leave Requests", 20, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      if (approvedLeaves && approvedLeaves.length > 0) {
        const relevantLeaves = approvedLeaves.filter(leave => {
          const leaveDate = new Date(leave.startDate);
          return leaveDate.getMonth() === salaryDate.getMonth() && 
                 leaveDate.getFullYear() === salaryDate.getFullYear();
        });
        
        if (relevantLeaves.length > 0) {
          relevantLeaves.forEach(leave => {
            const startDate = new Date(leave.startDate).toLocaleDateString();
            const endDate = new Date(leave.endDate).toLocaleDateString();
            
            doc.text(`- Type: ${leave.leaveType}`, 25, yPosition);
            yPosition += 10;
            doc.text(`  Duration: ${startDate} to ${endDate} (${leave.daysRequested} days)`, 25, yPosition);
            yPosition += 15;
          });
        } else {
          doc.text("No approved leave requests during this salary period.", 20, yPosition);
        }
      } else {
        doc.text("No approved leave requests found.", 20, yPosition);
      }
      
      doc.setFontSize(10);
      doc.text(`Page ${pageCount}`, 105, 280, { align: "center" });
    });
    
    doc.save(`Complete_Salary_History_${userData.firstName}_${userData.lastName}.pdf`);
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

      <div className="history-container">
        <h2>Salary History</h2>
        {salaries.length > 0 ? (
          <>
            <div className="salary-buttons-container">
              {salaries.map((salary, index) => (
                <div key={index} className="salary-item">
                  <button className="salary-button"
                      onClick={() => {
                      setSelectedSalary(salary);
                      setShowModal(true);
                    }}>
                    View Salary from {new Date(salary.date).toLocaleDateString()}
                  </button>
                </div>
              ))}
            </div>
            <button className="generate-all-pdf-button" onClick={generateAllPDFs}>
              Generate Complete Salary History PDF
            </button>
          </>
        ) : (
          <p>No salary history available.</p>
        )}
      </div>

      {showModal && selectedSalary && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h3>Salary Details</h3>
            <p><strong>Date:</strong> {new Date(selectedSalary.date).toLocaleDateString()}</p>
            <p><strong>Base Salary:</strong>₱{selectedSalary.baseSalary}</p>
            <p><strong>Final Salary:</strong> ₱{selectedSalary.finalSalary}</p>
            {selectedSalary.modifications?.length > 0 ? (
              <>
                <h4>Modifications</h4>
                <ul>
                  {selectedSalary.modifications.map((mod, i) => (
                    <li key={i}>
                      <strong>{mod.description}</strong>: ₱{mod.amount}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No modifications for this salary.</p>
            )}
            <button className="modal-pdf-button"
              onClick={() => {
                generatePDF(selectedSalary);
              }}
            >
              Generate PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;