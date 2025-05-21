import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import jsPDF from 'jspdf';
import './computation.css';

const Computation = () => {
  const { user, setUser } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [latestSalary, setLatestSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const navigate = useNavigate();

  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
  };

 
  useEffect(() => {
    const fetchLatestSalary = async () => {
      console.log("user:", user);

      try {
        console.log(`Fetching salary for user: ${user.email}`);
        const response = await fetch(`https://sp-eykc.onrender.com/latestSalary/${user.email}`);
        const contentType = response.headers.get("content-type");
        
        if (!response.ok || !contentType.includes("application/json")) {
          throw new Error('Failed to fetch salary data or invalid JSON response');
        }

        const data = await response.json();
        console.log("Fetched salary data:", data);
        setLatestSalary(data);
      } catch (error) {
        console.error('Error fetching latest salary:', error);
      } finally {
        setLoading(false);
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

    fetchLatestSalary();
    fetchUserData();
    fetchApprovedLeaves();
  }, [user]);

  const generatePDF = () => {
    if (!latestSalary || !userData) {
      alert('Salary or user data not available');
      return;
    }

    const doc = new jsPDF();
    const salaryDate = new Date(latestSalary.date);


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
      doc.text("Salary Computation", 105, 45, { align: "center" });
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
      doc.text(`Base Salary: ${latestSalary.baseSalary}`, 20, 110);
      
      let yPosition = 120;
      
      if (latestSalary.modifications && latestSalary.modifications.length > 0) {
        doc.text("Modifications:", 20, yPosition);
        yPosition += 10;
       
        doc.setFont("helvetica", "bold");
        doc.text("Description", 25, yPosition);
        doc.text("Amount", 120, yPosition); 
        yPosition += 8;
      
        doc.line(25, yPosition, 180, yPosition); 
        yPosition += 5;
        doc.setFont("helvetica", "normal");

        latestSalary.modifications.forEach((mod) => {
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
      doc.text(`Final Salary: ${latestSalary.finalSalary}`, 20, yPosition + 5);
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
      
      doc.save(`Salary_Computation_${userData.firstName}_${userData.lastName}_${salaryDate.toLocaleDateString().replace(/\//g, '-')}.pdf`);
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



      <div id="mySidenav" className="sidenav" style={{ width: sideNavOpen ? '250px' : '0' }}>
        <span onClick={() => navigate('/home')}>Dashboard</span>
        <span onClick={() => navigate('/profile')}>View Personal Information</span>
        <span onClick={() => navigate('/computation')}>View Salary Computation</span>
        <span onClick={() => navigate('/history')}>View Salary History</span>
        <span onClick={() => navigate('/leaveapplication')}>Apply for Leave</span>
        <span onClick={() => navigate('/attendance')}>Attendance Tracking</span>

      </div>

      <div className="computation-container">
        <h2>Salary Computation</h2>
        {loading ? (
          <p>Loading salary computation...</p>
        ) : latestSalary ? (
          <div>
            <p><strong>Base Salary:</strong> ₱{latestSalary.baseSalary}</p>
            <p><strong>Final Salary:</strong> ₱{latestSalary.finalSalary}</p>
            {latestSalary.modifications?.length > 0 ? (
              <div>
                <h3>Modifications:</h3>
                <ul>
                  {latestSalary.modifications.map((mod, index) => (
                    <li key={index}>
                      <strong>{mod.description}:</strong> ₱{mod.amount}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No salary modifications for this month.</p>
            )}
            <button className="pdf-button" onClick={generatePDF}>Generate PDF</button>
          </div>
        ) : (
          <p>Failed to fetch salary.</p>
        )}
      </div>
    </div>
  );
};

export default Computation;