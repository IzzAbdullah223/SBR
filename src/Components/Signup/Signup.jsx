// src/Components/Signup/Signup.jsx
import React, { useState } from 'react';
import styles from './Signup.module.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // Prepare data for API call
      const signupData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      // TODO: Replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Signup successful:', signupData);
      alert('Account created successfully! Please log in.');
      
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ 
        submit: error.message || 'Failed to create account. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    console.log('Navigate to login page');
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        {/* Header with Logo */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="SBR Logo" className={styles.logoImage} />
            <div className={styles.logoText}>
              <h1>SBR</h1>
              <span>Smart Bus Route Planner</span>
            </div>
          </div>
          <h2>Sign Up</h2>
        </div>

        {/* Error message for form submission */}
        {errors.submit && (
          <div className={styles.errorMessage}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.signupForm}>
          {/* Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className={errors.email ? styles.errorInput : ''}
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
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

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? styles.errorInput : ''}
            />
            {errors.confirmPassword && (
              <span className={styles.errorText}>{errors.confirmPassword}</span>
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
                Signing Up...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          {/* Login Link */}
          <div className={styles.loginLink}>
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={handleLoginClick}
                className={styles.linkButton}
              >
                Login
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;