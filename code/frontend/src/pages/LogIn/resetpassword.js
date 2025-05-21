import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './resetpassword.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    passwordError: '',
    serverError: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ passwordError: '', serverError: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ ...errors, passwordError: 'Passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrors({ ...errors, passwordError: 'Password must be at least 6 characters long' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`https://sp-eykc.onrender.com/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: formData.newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setErrors({ ...errors, serverError: data.message });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrors({ 
        ...errors, 
        serverError: 'An error occurred while resetting your password. Please try again later.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Your Password</h2>
      
      {resetSuccess ? (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <p>Your password has been reset successfully!</p>
          <p>Redirecting to login page...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter new password"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm new password"
              required
            />
          </div>
          
          {errors.passwordError && <p className="error-message">{errors.passwordError}</p>}
          {errors.serverError && <p className="error-message">{errors.serverError}</p>}
          
          <button 
            type="submit" 
            className="reset-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;