import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// User Registration/LogIn Pages
import LogIn from './pages/LogIn/logIn';
import VerifyEmail from './pages/LogIn/verifyemail';
import ResetPassword from './pages/LogIn/resetpassword'
// Employee Pages
import Home from './pages/Employee/home';
import Profile from './pages/Employee/profile';
import History from './pages/Employee/history';
import Computation from './pages/Employee/computation';
import LeaveApplication from './pages/Employee/leaveapplication';
import Attendance from './pages/Employee/attendance';

//Admin Pages
import AdHome from './pages/Admin/adhome';
import Employees from './pages/Admin/employees';
import JobPositions from './pages/Admin/jobpositions';
import EmployeeDetails from './pages/Admin/employeedetails';
import LeaveManagement from './pages/Admin/leavemanagement';
import SalaryManagement from './pages/Admin/salarymanagement';
import AttendanceTracking from './pages/Admin/attendancetracking';




const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user && user.role === "Admin" ? children : <Navigate to="/" />;
};

function App() {
  return (
    <div>
      <Routes>

        <Route path="/" element={<LogIn />} />
        <Route path="/verify-email/:token" element ={<VerifyEmail/>}/>
        <Route path="/reset-password/:token" element ={<ResetPassword/>}/>

        {/* Employee Pages */}
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/computation" element={<Computation />} />
        <Route path="/leaveapplication" element={<LeaveApplication />} />
        <Route path="/attendance" element={<Attendance />} />

        {/* Admin Pages */}
        <Route path="/adhome" element={<AdminRoute><AdHome /></AdminRoute>} />
        <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
        <Route path="/jobpositions" element={<AdminRoute><JobPositions /></AdminRoute>} />
        <Route path="/employee/:email" element={<AdminRoute><EmployeeDetails /></AdminRoute>} /> 
        <Route path="/leavemanagement" element={<AdminRoute><LeaveManagement /></AdminRoute>} />
        <Route path="/salarymanagement" element={<AdminRoute><SalaryManagement /></AdminRoute>} />
        <Route path="/attendancetracking" element={<AdminRoute><AttendanceTracking /></AdminRoute>} />

      </Routes>
    </div>
  );
}

export default App;
