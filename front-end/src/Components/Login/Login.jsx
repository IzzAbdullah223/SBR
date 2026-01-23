// src/Components/Login/Login.jsx
import React, { useState } from 'react';
import styles from './Login.module.css';
// comment me brouther

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Username/Email validation
    if (!formData.username.trim()) {
      newErrors.username = 'Email or username is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API endpoint
      const loginData = {
        username: formData.username.trim(),
        password: formData.password
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Login successful:', loginData);
      alert('Login successful!');
      
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        submit: error.message || 'Invalid credentials. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Navigate to forgot password page');
    // In a real app: navigate('/forgot-password');
  };

  const handleSignupClick = () => {
    console.log('Navigate to signup page');
    // In a real app: navigate('/signup');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Header with Logo */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="SBR Logo" className={styles.logoImage} />
            <div className={styles.logoText}>
              <h1>SBR</h1>
              <span>Smart Bus Route Planner</span>
            </div>
          </div>
          <h2>Login</h2>
        </div>

        {/* Error message for form submission */}
        {errors.submit && (
          <div className={styles.errorMessage}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {/* Username/Email */}
          <div className={styles.formGroup}>
            <label htmlFor="username">Email or Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your email or username"
              className={errors.username ? styles.errorInput : ''}
            />
            {errors.username && (
              <span className={styles.errorText}>{errors.username}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <div className={styles.passwordHeader}>
              <label htmlFor="password">Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className={styles.forgotButton}
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className={errors.password ? styles.errorInput : ''}
            />
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Logging in...
              </>
            ) : (
              'Continue'
            )}
          </button>

          {/* Signup Link */}
          <div className={styles.signupLink}>
            <p>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={handleSignupClick}
                className={styles.linkButton}
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;