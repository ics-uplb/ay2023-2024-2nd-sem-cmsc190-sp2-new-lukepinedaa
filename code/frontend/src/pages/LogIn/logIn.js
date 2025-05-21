import {React, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './login.css';
const LogIn = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [ signUpModal, setSignUpModal ] = useState(false);
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [verificationModal, setVerificationModal] = useState(false);
  const [ loginForm, setLoginForm ] = useState({
    loginemail: '',
    loginpassword: '',
  });

  const [ formData, setFormData ] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    address: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resetPasswordData, setResetPasswordData] = useState({
    token: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({
    emailMatchError: false,
    passwordMatchError: false,
    loginError: '',
    forgotPasswordError: '',
    resetPasswordError: '',
    verificationError: '',
  }); 

  const toggleModal = () => {
    setSignUpModal(!signUpModal);
    if (signUpModal) {
      setFormData({
        firstName: '',
        lastName: '',
        birthday: '',
        address: '',
        email: '',
        confirmEmail: '',
        password: '',
        confirmPassword: ''
      });
  
      setErrors({ emailMatchError: false, passwordMatchError: false });
    }
  };

  const toggleForgotPasswordModal = () => {
    setForgotPasswordModal(!forgotPasswordModal);
    if (!forgotPasswordModal) {
      setForgotPasswordEmail('');
      setErrors({ ...errors, forgotPasswordError: '' });
    }
  };

  const toggleVerificationModal = (email = '') => {
    setVerificationModal(!verificationModal);
    if (!verificationModal && email) {
      setVerificationEmail(email);
    } else if (verificationModal) {
      setVerificationEmail('');
      setErrors({ ...errors, verificationError: '' });
    }
  };
  const openResetPasswordModal = (token) => {
    setResetPasswordData({ ...resetPasswordData, token });
    setResetPasswordModal(true);
  };

  const closeResetPasswordModal = () => {
    setResetPasswordModal(false);
    setResetPasswordData({
      token: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setErrors({ ...errors, resetPasswordError: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'loginemail' || name === 'loginpassword') {
      setLoginForm({ ...loginForm, [name]: value });
    } else if (name === 'forgotPasswordEmail') {
      setForgotPasswordEmail(value);
    } else if (name === 'verificationEmail') {
      setVerificationEmail(value);
    } else if (name === 'newPassword' || name === 'confirmNewPassword') {
      setResetPasswordData({ ...resetPasswordData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmitSignUp = async (e) => {
    e.preventDefault();

    const isEmailMatch = formData.email === formData.confirmEmail;
    const isPasswordMatch = formData.password === formData.confirmPassword;

    if (isEmailMatch && isPasswordMatch) {
      try {
        const response = await fetch('https://sp-eykc.onrender.com/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthday: formData.birthday,
            address: formData.address,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          alert(result.message);
          toggleModal();
        } else {
          const errorData = await response.json();
          alert(`Error in user registration: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error in user registration');
      }
    } else {
      setErrors({
        emailMatchError: !isEmailMatch,
        passwordMatchError: !isPasswordMatch,
      });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setErrors({ ...errors, forgotPasswordError: 'Please enter your email address' });
      return;
    }
    
    try {
      const response = await fetch('https://sp-eykc.onrender.com/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(result.message);
        toggleForgotPasswordModal();
      } else {
        setErrors({ ...errors, forgotPasswordError: result.message });
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ ...errors, forgotPasswordError: 'An error occurred. Please try again.' });
    }
  };
  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!verificationEmail) {
      setErrors({ ...errors, verificationError: 'Please enter your email address' });
      return;
    }
    
    try {
      const response = await fetch('https://sp-eykc.onrender.com/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(result.message);
        toggleVerificationModal();
      } else {
        setErrors({ ...errors, verificationError: result.message });
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ ...errors, verificationError: 'An error occurred. Please try again.' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (resetPasswordData.newPassword !== resetPasswordData.confirmNewPassword) {
      setErrors({ ...errors, resetPasswordError: 'Passwords do not match' });
      return;
    }
    
    try {
      const response = await fetch(`https://sp-eykc.onrender.com/reset-password/${resetPasswordData.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: resetPasswordData.newPassword }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(result.message);
        closeResetPasswordModal();
      } else {
        setErrors({ ...errors, resetPasswordError: result.message });
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ ...errors, resetPasswordError: 'An error occurred. Please try again.' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://sp-eykc.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.loginemail,
          password: loginForm.loginpassword,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(result.message);
        setUser({
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          role: result.role
        });
        if (result.role === "Admin"){
          navigate('/adhome');
        } else {
          navigate('/home');
        }
      } else {
        if (result.needsVerification) {
          toggleVerificationModal(result.email);
        } else {
          setErrors({ ...errors, loginError: result.message });
        }
      }
    } catch (error) {
      setErrors({ ...errors, loginError: 'An error occurred. Please try again.' });
    }
  };
  return (
    <div>
      <div className="signin-container">
      <div className="logo-container">
          <img src="/hananet_logo.png" alt="HNPCI Logo" className="company-logo" />
        </div>        
          <h2 className="company-name">Hana-net Philippines Co. Inc. Trucking Company</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            id="loginemail"
            name="loginemail"
            placeholder="Enter your email address"
            value={loginForm.loginemail}
            onChange={handleInputChange}
            required
          />
          <br />
          <input
            type="password"
            id="loginpassword"
            name="loginpassword"
            placeholder="Enter your password"
            value={loginForm.loginpassword}
            onChange={handleInputChange}
            required
          />
          <br />
          <span className="forgotten-password" onClick={toggleForgotPasswordModal}>Forgot Password?</span>
          {errors.loginError && <p className="error-message">{errors.loginError}</p>}
          <div className="button-container">
            <button className="sign-up-button" type="button" onClick={toggleModal}>
              Sign Up
            </button>
            <button className="signin-button" type="submit">
              Sign In
            </button>
          </div>
        </form>
      </div>

      {signUpModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={toggleModal}>&times;</span>
            <h3>Sign Up</h3>
            <form onSubmit={handleSubmitSignUp}>
            <label> First Name </label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <label> Last Name </label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <label> Birthday</label>
              <input
                type="date"
                name="birthday"
                placeholder="Birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                required
              />
              <label> Address </label>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
              <label> Email Address </label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <label> Confirm Email Address </label>
              <input
                type="email"
                name="confirmEmail"
                placeholder="Confirm Email Address"
                value={formData.confirmEmail}
                onChange={handleInputChange}
                required
              />
              {errors.emailMatchError && <p className="error-message">Email addresses do not match</p>}
              <label> Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <label> Confirm Password </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              {errors.passwordMatchError && <p className="error-message">Passwords do not match</p>}
              <div className="modal-button-container">
                <button type="submit">Submit</button>
                <button type="button" onClick={toggleModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {forgotPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={toggleForgotPasswordModal}>&times;</span>
            <h3>Forgot Password</h3>
            <p>Enter your email address to receive a password reset link.</p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                name="forgotPasswordEmail"
                placeholder="Email Address"
                value={forgotPasswordEmail}
                onChange={handleInputChange}
                required
              />
              {errors.forgotPasswordError && <p className="error-message">{errors.forgotPasswordError}</p>}
              <div className="modal-button-container">
                <button type="submit">Send Reset Link</button>
                <button type="button" onClick={toggleForgotPasswordModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {verificationModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => toggleVerificationModal()}>&times;</span>
            <h3>Email Verification Required</h3>
            <p>Your email has not been verified. Please check your inbox for the verification link or request a new one.</p>
            <form onSubmit={handleResendVerification}>
              <input
                type="email"
                name="verificationEmail"
                placeholder="Confirm Email Address"
                value={verificationEmail}
                onChange={handleInputChange}
                required
              />
              {errors.verificationError && <p className="error-message">{errors.verificationError}</p>}
              <div className="modal-button-container">
                <button type="submit">Resend Verification</button>
                <button type="button" onClick={() => toggleVerificationModal()}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={closeResetPasswordModal}>&times;</span>
            <h3>Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={resetPasswordData.newPassword}
                onChange={handleInputChange}
                required
              />
              <input
                type="password"
                name="confirmNewPassword"
                placeholder="Confirm New Password"
                value={resetPasswordData.confirmNewPassword}
                onChange={handleInputChange}
                required
              />
              {errors.resetPasswordError && <p className="error-message">{errors.resetPasswordError}</p>}
              <div className="modal-button-container">
                <button type="submit">Reset Password</button>
                <button type="button" onClick={closeResetPasswordModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogIn;