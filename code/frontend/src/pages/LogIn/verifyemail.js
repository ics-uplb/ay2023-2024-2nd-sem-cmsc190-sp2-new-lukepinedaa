import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './verifyemail.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const [verificationStatus, setVerificationStatus] = useState({
    loading: true,
    success: false,
    message: ''
  });

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`https://sp-eykc.onrender.com/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setVerificationStatus({
            loading: false,
            success: true,
            message: data.message
          });
        } else {
          setVerificationStatus({
            loading: false,
            success: false,
            message: data.message || 'Verification failed'
          });
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setVerificationStatus({
          loading: false,
          success: false,
          message: 'An error occurred while verifying your email. Please try again later.'
        });
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setVerificationStatus({
        loading: false,
        success: false,
        message: 'Invalid verification link'
      });
    }
  }, [token]);

  return (
    <div className="verification-container">
      <h2>Email Verification</h2>
      {verificationStatus.loading ? (
        <div className="loading">
          <p>Verifying your email...</p>
        </div>
      ) : (
        <div className={`verification-result ${verificationStatus.success ? 'success' : 'error'}`}>
          <p>{verificationStatus.message}</p>
          {verificationStatus.success ? (
            <div className="success-icon">✓</div>
          ) : (
            <div className="error-icon">✗</div>
          )}
          <div className="action-buttons">
            <Link to="/" className="login-button">
              Go to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;