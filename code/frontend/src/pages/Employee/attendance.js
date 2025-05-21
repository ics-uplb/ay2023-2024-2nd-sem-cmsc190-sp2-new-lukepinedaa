import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './attendance.css';

const Attendance = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [today] = useState(new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [attendanceData, setAttendanceData] = useState([]);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [checkOutStatus, setCheckOutStatus] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (user?.email) {
      fetchAttendanceData();
    }
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, [user, month, year]);

  useEffect(() => {
    checkTodayStatus();
  }, [attendanceData]);

  useEffect(() => {
    if (sideNavOpen) {
      document.body.classList.add('sidenav-open');
    } else {
      document.body.classList.remove('sidenav-open');
    }
  }, [sideNavOpen]);

  const isWithinWorkingHours = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    const currentTimeInMinutes = hours * 60 + minutes;
    const startTimeInMinutes = 7 * 60 + 30; 
    const endTimeInMinutes = 17 * 60 + 30;  
    
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  };

  const toggleNav = () => {
    setSideNavOpen(!sideNavOpen);
  };

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://sp-eykc.onrender.com/attendance/${user.email}/${month}/${year}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTodayStatus = () => {
    try {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      const todayRecord = attendanceData.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === todayDate.getTime();
      });
      
      if (todayRecord) {
        setCheckInStatus(todayRecord.checkIn ? new Date(todayRecord.checkIn) : null);
        setCheckOutStatus(todayRecord.checkOut ? new Date(todayRecord.checkOut) : null);
        setAttendanceStatus(todayRecord.status || 'present');
      } else {
        setCheckInStatus(null);
        setCheckOutStatus(null);
        setAttendanceStatus(null);
      }
    } catch (error) {
      console.error('Error checking today status:', error);
    }
  };

  const determineAttendanceStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    const currentTimeInMinutes = hours * 60 + minutes;
    const lateThresholdInMinutes = 8 * 60 + 30; 
    const halfDayStartInMinutes = 12 * 60; 
    const halfDayEndInMinutes = 17 * 60; 
    
    if (currentTimeInMinutes >= lateThresholdInMinutes && currentTimeInMinutes < halfDayStartInMinutes) {
      return 'late';
    } else if (currentTimeInMinutes >= halfDayStartInMinutes && currentTimeInMinutes <= halfDayEndInMinutes) {
      return 'half-day';
    }
    
    return 'present';
  };

  const handleCheckIn = async () => {
    try {
      const status = determineAttendanceStatus();
      
      const response = await fetch(`https://sp-eykc.onrender.com/attendance/checkIn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          date: new Date(),
          status: status
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      fetchAttendanceData();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await fetch(`https://sp-eykc.onrender.com/attendance/checkOut`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          date: new Date()
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      fetchAttendanceData();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const todayDate = new Date();
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="day empty"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      
      const dayAttendance = attendanceData.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === date.getTime();
      });
      
      const isToday = date.getTime() === new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
      
      let dayClass = "day";
      if (isToday) dayClass += " today";
      if (dayAttendance) {
        dayClass += " attended";
        if (dayAttendance.status === 'late') dayClass += " late";
        if (dayAttendance.status === 'half-day') dayClass += " half-day";
        if (dayAttendance.status === 'absent') dayClass += " absent";
      }
      
      days.push(
        <div key={`day-${day}`} className={dayClass}>
          <span className="day-number">{day}</span>
          {dayAttendance && (
            <div className="attendance-info">
              {dayAttendance.status && (
                <div className={`status-badge ${dayAttendance.status}`}>
                  {dayAttendance.status.charAt(0).toUpperCase() + dayAttendance.status.slice(1)}
                </div>
              )}
              {dayAttendance.checkIn && (
                <div className="check-time">
                  In: {new Date(dayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {dayAttendance.checkOut && (
                <div className="check-time">
                  Out: {new Date(dayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

      <div id="main" style={{ marginLeft: sideNavOpen ? "250px" : "0" }}>
        <div className="welcome-container">
          <h2>Attendance Tracking</h2>
          <p>{today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <p className="current-time">Current Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div className="attendance-actions">
          <div className="time-display">
            <div className="time-card">
              <h3>Check-in Time</h3>
              <p className="time">{checkInStatus ? formatTime(checkInStatus) : '--:--'}</p>
            </div>
            <div className="time-card">
              <h3>Check-out Time</h3>
              <p className="time">{checkOutStatus ? formatTime(checkOutStatus) : '--:--'}</p>
            </div>
            {attendanceStatus && (
              <div className="time-card">
                <h3>Status</h3>
                <p className={`status ${attendanceStatus}`}>
                  {attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1)}
                </p>
              </div>
            )}
          </div>
          <div className="attendance-buttons">
            <button 
              className="check-button check-in" 
              onClick={handleCheckIn}
              disabled={isLoading || checkInStatus !== null || !isWithinWorkingHours()}
            >
              Check In
            </button>
            <button 
              className="check-button check-out" 
              onClick={handleCheckOut}
              disabled={isLoading || checkInStatus === null || checkOutStatus !== null}
            >
              Check Out
            </button>
          </div>
          {!isWithinWorkingHours() && checkInStatus === null && (
            <div className="working-hours-message">
              Check-in is only available during working hours (7:30 AM - 5:30 PM)
            </div>
          )}
        </div>

        <div className="calendar-container">
          <div className="calendar-header">
            <button className="month-nav" onClick={handlePrevMonth}>&lt;</button>
            <h3>{MONTHS[month - 1]} {year}</h3>
            <button className="month-nav" onClick={handleNextMonth}>&gt;</button>
          </div>
          <div className="calendar-weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          <div className="calendar-days">
            {renderCalendar()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;