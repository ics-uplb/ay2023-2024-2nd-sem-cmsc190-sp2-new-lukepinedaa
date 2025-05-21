import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import jsPDF from 'jspdf';
import "./salarymanagement.css";

const SalaryManagement = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [latestSalary, setLatestSalary] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [selectedHistorySalary, setSelectedHistorySalary] = useState(null);
  const [showHistorySalaryDetailModal, setShowHistorySalaryDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [modificationAmount, setModificationAmount] = useState('');
  const [modificationDescription, setModificationDescription] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [newSalaryDate, setNewSalaryDate] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [modificationToDelete, setModificationToDelete] = useState(null);
  const [sortOption, setSortOption] = useState('alphabetical'); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  
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
  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setLoading(true);
    
    try {
      const salaryResponse = await fetch(`https://sp-eykc.onrender.com/latestSalary/${employee.email}`);
      if (salaryResponse.ok) {
        const salaryData = await salaryResponse.json();
        setLatestSalary(salaryData);
        
        if (salaryData.date) {
          const date = new Date(salaryData.date);
          const formattedDate = date.toISOString().split('T')[0];
          setNewSalaryDate(formattedDate);
        }
      } else {
        setLatestSalary(null);
      }
      
      const leavesResponse = await fetch(`https://sp-eykc.onrender.com/leaveRequests/${employee.email}`);
      if (leavesResponse.ok) {
        const leavesData = await leavesResponse.json();
        const approved = leavesData.filter(leave => leave.status === 'approved');
        setApprovedLeaves(approved);
      } else {
        setApprovedLeaves([]);
      }
      
      setShowSalaryModal(true);
    } catch (err) {
      console.error('Error fetching salary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSalaryHistory = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      const response = await fetch(`https://sp-eykc.onrender.com/salaryHistory/${selectedEmployee.email}`);
      if (!response.ok) throw new Error('Failed to fetch salary history');
      const data = await response.json();
      setSalaryHistory(data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching salary history:', error);
      alert('Failed to fetch salary history');
    } finally {
      setLoading(false);
    }
  };

  const handleDateEditToggle = () => {
    setEditingDate(!editingDate);
  };

  const handleSalaryDateUpdate = async () => {
    if (!newSalaryDate || !selectedEmployee || !latestSalary) {
      alert("Date is required");
      return;
    }

    try {
      const res = await fetch(`https://sp-eykc.onrender.com/salary/updateDate/${selectedEmployee.email}/${latestSalary._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: newSalaryDate })
      });

      if (res.ok) {
        const updatedSalary = await res.json();
        setLatestSalary(updatedSalary);
        setEditingDate(false);
        alert('Salary date updated successfully');
      } else {
        const errorData = await res.json();
        alert(`Failed to update date: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating salary date:', error);
      alert('Failed to update salary date: ' + error.message);
    }
  };

  const handleViewHistorySalaryDetail = (salary) => {
    setSelectedHistorySalary(salary);
    setShowHistorySalaryDetailModal(true);
  };

  const handleSalaryModification = async (type) => {
    if (!modificationAmount || !modificationDescription) {
      alert("Amount and reason are required");
      return;
    }
    
    const mod = {
      amount: type === 'deduct' ? -Math.abs(Number(modificationAmount)) : Math.abs(Number(modificationAmount)),
      description: modificationDescription
    };
  
    try {
      const res = await fetch(`https://sp-eykc.onrender.com/salary/modify/${selectedEmployee.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mod)
      });
  
      if (res.ok) {
        const { latestSalary: updatedSalary } = await res.json();
        setLatestSalary(updatedSalary);
        setModificationAmount('');
        setModificationDescription('');
        
        alert(`Successfully ${type === 'deduct' ? 'deducted from' : 'added to'} salary.`);
      } else {
        alert("Failed to modify salary");
      }
    } catch (error) {
      console.error('Error modifying salary:', error);
      alert('Failed to modify salary: ' + error.message);
    }
  };

  const generateEmployeeSalaryPDF = () => {
    if (!latestSalary || !selectedEmployee) {
      alert('Salary or employee data not available');
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
    doc.text(`Name: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 20, 60);
    doc.text(`Address: ${selectedEmployee.address || 'N/A'}`, 20, 70);
    doc.text(`Email: ${selectedEmployee.email}`, 20, 80);
    
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
    
    doc.save(`Salary_Computation_${selectedEmployee.firstName}_${selectedEmployee.lastName}_${salaryDate.toLocaleDateString().replace(/\//g, '-')}.pdf`);

    }
  };

 const generateHistorySalaryPDF = (salary) => {
   if (!salary || !selectedEmployee) {
     alert('Salary or employee data not available');
     return;
   }
 
   const doc = new jsPDF();
   const salaryDate = new Date(salary.date);
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
     doc.text(`Name: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 20, 60);
     doc.text(`Address: ${selectedEmployee.address || 'N/A'}`, 20, 70);
     doc.text(`Email: ${selectedEmployee.email}`, 20, 80);
   
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
   
     doc.save(`Salary_Computation_${selectedEmployee.firstName}_${selectedEmployee.lastName}_${salaryDate.toLocaleDateString().replace(/\//g, '-')}.pdf`);
   }
 };
 const generateAllHistorySalariesPDF = () => {
   if (salaryHistory.length === 0 || !selectedEmployee) {
     alert('No salary history or employee data available');
     return;
   }
   
   const doc = new jsPDF();
   let pageCount = 0;
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
     const logoDataUrl = canvas.toDataURL('image/png');
     
     salaryHistory.forEach((salary, index) => {
       if (index > 0) {
         doc.addPage();
       }
       pageCount++;
       
       const salaryDate = new Date(salary.date);
       
       doc.addImage(logoDataUrl, 'PNG', logoX, 15, imgWidth, imgHeight);
       
       doc.setFontSize(18);
       doc.setFont("helvetica", "bold");
       doc.text("Hana-net Philippines Co. Inc. Trucking Company", 105, 35, { align: "center" });
       
       doc.setFontSize(14);
       doc.text(`Salary Report - Page ${pageCount}`, 105, 45, { align: "center" });
       doc.setFont("helvetica", "normal");
       
       doc.setFontSize(12);
       doc.text(`Name: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 20, 60);
       doc.text(`Address: ${selectedEmployee.address || 'N/A'}`, 20, 70);
       doc.text(`Email: ${selectedEmployee.email}`, 20, 80);
       
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
       doc.text(`Page ${pageCount}`, 105, 280, { align: "center" });
     });
     
     doc.save(`Complete_Salary_History_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`);
   };
   
   img.onerror = function() {
     console.error('Could not load the logo. Continuing with PDF generation without logo.');
     
     salaryHistory.forEach((salary, index) => {
       if (index > 0) {
         doc.addPage();
       }
       pageCount++;
       
       const salaryDate = new Date(salary.date);
       
       doc.setFontSize(18);
       doc.setFont("helvetica", "bold");
       doc.text("Hana-net Philippines Co. Inc. Trucking Company", 105, 35, { align: "center" });
       
       doc.setFontSize(14);
       doc.text(`Salary Report - Page ${pageCount}`, 105, 45, { align: "center" });
       doc.setFont("helvetica", "normal");
       
       doc.setFontSize(12);
       doc.text(`Name: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 20, 60);
       doc.text(`Address: ${selectedEmployee.address || 'N/A'}`, 20, 70);
       doc.text(`Email: ${selectedEmployee.email}`, 20, 80);
       
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
       doc.text(`Page ${pageCount}`, 105, 280, { align: "center" });
     });
     
     doc.save(`Complete_Salary_History_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`);
   };
 };

 const generateMonthlyAllEmployeesPDF = async () => {
     setLoading(true);
     try {
       const doc = new jsPDF();
       let pageCount = 0;
       const currentDate = new Date();
       const currentMonth = currentDate.getMonth();
       const currentYear = currentDate.getFullYear();
       
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
       
       for (const employee of employees) {
         try {
           const salaryResponse = await fetch(`https://sp-eykc.onrender.com/latestSalary/${employee.email}`);
           if (!salaryResponse.ok) continue;
           
           const salaryData = await salaryResponse.json();
           const salaryDate = new Date(salaryData.date);
           
           if (salaryDate.getMonth() !== currentMonth || salaryDate.getFullYear() !== currentYear) {
             continue;
           }
           
           const leavesResponse = await fetch(`https://sp-eykc.onrender.com/leaveRequests/${employee.email}`);
           let relevantLeaves = [];
           
           if (leavesResponse.ok) {
             const leavesData = await leavesResponse.json();
             const approved = leavesData.filter(leave => leave.status === 'approved');
             
             relevantLeaves = approved.filter(leave => {
               const leaveDate = new Date(leave.startDate);
               return leaveDate.getMonth() === currentMonth && 
                      leaveDate.getFullYear() === currentYear;
             });
           }
           
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
           doc.text(`Monthly Salary Report - ${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}`, 105, 45, { align: "center" });
           doc.setFont("helvetica", "normal");
           
           doc.setFontSize(12);
           doc.text(`Name: ${employee.firstName} ${employee.lastName}`, 20, 60);
           doc.text(`Address: ${employee.address || 'N/A'}`, 20, 70);
           doc.text(`Email: ${employee.email}`, 20, 80);
   
           doc.setFontSize(14);
           doc.setFont("helvetica", "bold");
           doc.text("Salary Details", 20, 90);
           doc.setFontSize(12);
           doc.setFont("helvetica", "normal");
           
           doc.text(`Salary Period: ${new Date(salaryDate).toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 20, 100);
           doc.text(`Base Salary: ${salaryData.baseSalary}`, 20, 110);
           
           let yPosition = 120;
           
           if (salaryData.modifications && salaryData.modifications.length > 0) {
             doc.text("Modifications:", 20, yPosition);
             yPosition += 10;
             
             doc.setFont("helvetica", "bold");
             doc.text("Description", 25, yPosition);
             doc.text("Amount", 120, yPosition); 
             yPosition += 8;
           
             doc.line(25, yPosition, 180, yPosition); 
             yPosition += 5;
             doc.setFont("helvetica", "normal");
   
             salaryData.modifications.forEach((mod) => {
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
           doc.text(`Final Salary: ${salaryData.finalSalary}`, 20, yPosition + 5);
           yPosition += 20;
           
           doc.setFontSize(14);
           doc.text("Approved Leave Requests", 20, yPosition);
           yPosition += 10;
           doc.setFontSize(12);
           doc.setFont("helvetica", "normal");
           
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
           
           doc.setFontSize(10);
           doc.text(`Page ${pageCount} - Generated on ${currentDate.toLocaleDateString()}`, 105, 280, { align: "center" });
           
         } catch (error) {
           console.error(`Error processing employee ${employee.email}:`, error);
         }
       }
       
       if (pageCount === 0) {
         alert('No current month salary data available for any employee');
         return;
       }
       
       doc.save(`All_Employees_Salary_${currentDate.toLocaleString('default', { month: 'long' })}_${currentYear}.pdf`);
       
     } catch (error) {
       console.error('Error generating monthly report:', error);
       alert('Failed to generate monthly report');
     } finally {
       setLoading(false);
     }
   };
   const contentStyle = {
    transform: sideNavOpen ? 'translateX(250px)' : 'translateX(0)',
    width: `calc(100% - ${sideNavOpen ? '250px' : '0px'})`,
    transition: 'transform 0.5s, width 0.5s'
  };



  const handleDeleteModification = (modIndex) => {
    setModificationToDelete(modIndex);
    setShowDeleteConfirmModal(true);
  };
  
  const confirmDeleteModification = async () => {
    if (modificationToDelete === null || !selectedEmployee || !latestSalary) return;
    
    try {
      const res = await fetch(`https://sp-eykc.onrender.com/salary/deleteModification/${selectedEmployee.email}/${latestSalary._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modificationIndex: modificationToDelete })
      });
  
      if (res.ok) {
        const updatedSalary = await res.json();
        setLatestSalary(updatedSalary);
        alert('Modification deleted successfully');
      } else {
        const errorData = await res.json();
        alert(`Failed to delete modification: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting modification:', error);
      alert('Failed to delete modification: ' + error.message);
    } finally {
      setShowDeleteConfirmModal(false);
      setModificationToDelete(null);
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
      <div id="content-wrapper" style={contentStyle}>
      <div className="salary-management-container">
        <div className="employees-header">
          <h2>Salary Management</h2>
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
                  {emp.hasPendingRequest && (
                    <span className="pending-indicator" title="Pending Profile Update">⚠️</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="monthly-report-section">
              <button className="generate-monthly-button" onClick={generateMonthlyAllEmployeesPDF}>
                Generate This Month's Salary PDF for All Employees
              </button>
            </div>
          </>
        )}
      </div>
      </div>

      {showSalaryModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="salary-modal">
            <span className="close" onClick={() => setShowSalaryModal(false)}>&times;</span>
            <h3>{selectedEmployee.firstName} {selectedEmployee.lastName}'s Current Salary</h3>
            
            {loading ? (
              <p>Loading salary information...</p>
            ) : latestSalary ? (
              <div className="salary-details">
                <div className="salary-info">
                  {editingDate ? (
                    <div className="date-edit-container">
                      <label htmlFor="salaryDate" className="date-label">Salary Date:</label>
                      <div className="date-edit-controls">
                        <input 
                          type="date" 
                          id="salaryDate" 
                          value={newSalaryDate} 
                          onChange={(e) => setNewSalaryDate(e.target.value)}
                          className="date-input"
                        />
                        <div className="date-action-buttons">
                          <button onClick={handleSalaryDateUpdate} className="date-save-button">Save</button>
                          <button onClick={handleDateEditToggle} className="date-cancel-button">Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="date-display">
                      <strong>Date:</strong> {new Date(latestSalary.date).toLocaleDateString()}
                      <button onClick={handleDateEditToggle} className="date-edit-button">Edit Date</button>
                    </p>
                  )}
                  <p><strong>Base Salary:</strong> ₱{latestSalary.baseSalary}</p>
                  <p><strong>Final Salary:</strong> ₱{latestSalary.finalSalary}</p>
                  
                  <h4>Modifications</h4>
                  {latestSalary.modifications?.length > 0 ? (
                    <ul className="modifications-list">
                      {latestSalary.modifications.map((mod, index) => (
                        <li key={index}>
                          <strong>{mod.description}:</strong> ₱{mod.amount}
                          <button 
                            onClick={() => handleDeleteModification(index)} 
                            className="delete-mod-button">
                            🗑️
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No modifications for this salary period.</p>
                  )}
                </div>
                
                <div className="salary-actions">
                  <button onClick={generateEmployeeSalaryPDF} className="pdf-button">
                    Generate PDF
                  </button>
                  <button onClick={handleViewSalaryHistory} className="history-button">
                    View Salary History
                  </button>
                </div>
                
                <div className="modify-salary-form">
                <h4>Modify Salary</h4>
                <div className="form-group">
                    <label htmlFor="modificationAmount">Amount:</label>
                    <input
                    type="number"
                    id="modificationAmount"
                    value={modificationAmount}
                    onChange={(e) => setModificationAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="modificationDescription">Description: </label>
                    <input
                    type="text"
                    id="modificationDescription"
                    value={modificationDescription}
                    onChange={(e) => setModificationDescription(e.target.value)}
                    placeholder="E.g., Bonus, Deduction, Overtime"
                    required
                    />
                </div>
                <div className="button-group">
                    <button 
                    className="add-button" 
                    onClick={() => handleSalaryModification('add')}
                    disabled={!modificationAmount || !modificationDescription}
                    >
                    Add Salary
                    </button>
                    <button 
                    className="deduct-button" 
                    onClick={() => handleSalaryModification('deduct')}
                    disabled={!modificationAmount || !modificationDescription}
                    >
                    Deduct Salary
                    </button>
                </div>
                </div>
              </div>
            ) : (
              <p>Failed to fetch salary. </p>
            )}
          </div>
        </div>
      )}

      {showHistoryModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="history-modal">
            <span className="close" onClick={() => setShowHistoryModal(false)}>&times;</span>
            <h3>{selectedEmployee.firstName} {selectedEmployee.lastName}'s Salary History</h3>
            
            {loading ? (
              <p>Loading salary history...</p>
            ) : salaryHistory.length > 0 ? (
              <>
                <div className="salary-history-list">
                  {salaryHistory.map((salary, index) => (
                    <div key={index} className="salary-history-item">
                      <button className="salary-history-button" onClick={() => handleViewHistorySalaryDetail(salary)}>
                        Salary from {new Date(salary.date).toLocaleDateString()} - ₱{salary.finalSalary}
                      </button>
                    </div>
                  ))}
                </div>
                <button className="generate-all-pdf-button" onClick={generateAllHistorySalariesPDF}>
                  Generate Complete Salary History PDF
                </button>
              </>
            ) : (
              <p>No salary history available for this employee.</p>
            )}
          </div>
        </div>
      )}
              {showDeleteConfirmModal && (
          <div className="modal-overlay">
            <div className="delete-confirm-modal">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this salary modification?</p>
              <p>This action cannot be undone.</p>
              
              <div className="delete-modal-buttons">
                <button onClick={confirmDeleteModification} className="confirm-delete-button">
                  Delete
                </button>
                <button onClick={() => {setShowDeleteConfirmModal(false); setModificationToDelete(null);}} className="cancel-delete-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      {showHistorySalaryDetailModal && selectedHistorySalary && (
        <div className="modal-overlay">
          <div className="history-detail-modal">
            <span className="close" onClick={() => setShowHistorySalaryDetailModal(false)}>&times;</span>
            <h3>Salary Details</h3>
            <p><strong>Date:</strong> {new Date(selectedHistorySalary.date).toLocaleDateString()}</p>
            <p><strong>Base Salary:</strong> ₱{selectedHistorySalary.baseSalary}</p>
            <p><strong>Final Salary:</strong> ₱{selectedHistorySalary.finalSalary}</p>
            
            {selectedHistorySalary.modifications?.length > 0 ? (
              <>
                <h4>Modifications</h4>
                <ul>
                  {selectedHistorySalary.modifications.map((mod, i) => (
                    <li key={i}>
                      <strong>{mod.description}</strong>: ₱{mod.amount}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No modifications for this salary.</p>
            )}
            
            <button className="modal-pdf-button" onClick={() => generateHistorySalaryPDF(selectedHistorySalary)}>
              Generate PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;