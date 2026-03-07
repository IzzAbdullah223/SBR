import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '../../../lib/schemas';
import { authAPI } from '../../../services/Api';
import styles from './SignUp.module.css';

// onLoginSuccess is passed from Home.jsx — same prop as Login
// after signup the user is automatically logged in, no need to login again
export function SignUp({ onLoginSuccess }) {

  // useForm manages all form state
  // zodResolver connects signUpSchema validation rules to the form
  const {
    register,      // connects each input to the form
    handleSubmit,  // runs validation before calling onSubmit
    formState: {
      errors,      // contains error messages for each field
      isSubmitting // true while onSubmit is running — disables the button
    },
    setError,      // lets us manually set an error on a specific field
    reset,         // clears all inputs after successful submit
  } = useForm({
    resolver: zodResolver(signUpSchema), // use rules from schemas.js
  });

  // only runs if zod validation passes
  // data = { name, email, password, confirmPassword, phone }
  const onSubmit = async (data) => {
    try {
      // call real backend — POST /api/auth/signup
      // User model hashes the password automatically before saving to MongoDB
      // returns { token, user }
      const result = await authAPI.signup(data.name, data.email, data.password, data.phone);

      // save token in localStorage so user stays logged in on page refresh
      localStorage.setItem('token', result.token);

      // pass user info up to Home.jsx — sets user state and closes the modal
      // user is now logged in automatically, no need to go to login
      onLoginSuccess(result.user);

      // clear the form inputs
      reset();
    } catch (err) {
      // backend returned an error — most likely email already in use
      // show error on email field so user knows what went wrong
      setError('email', { type: 'server', message: err.message || 'Signup failed' });
    }
  };

  return (
    <div className={styles.container}>
      <h1>Create Account</h1>

      {/* handleSubmit runs zod validation first — only calls onSubmit if everything passes */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

        {/* Name field — required, min 1 character */}
        <div className={styles.field}>
          <label>Name</label>
          {/* register('name') connects this input to the form */}
          <input {...register('name')} type="text" placeholder="Your full name" />
          {errors.name && <p className={styles.error}>{errors.name.message}</p>}
        </div>

        {/* Email field — must be valid email format */}
        <div className={styles.field}>
          <label>Email</label>
          <input {...register('email')} type="email" placeholder="your@email.com" />
          {/* also shows server errors like "email already in use" */}
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>

        {/* Phone field — optional, must be valid UAE number if provided */}
        <div className={styles.field}>
          <label>Phone (optional)</label>
          <input {...register('phone')} type="text" placeholder="+971XXXXXXXXX" />
          {errors.phone && <p className={styles.error}>{errors.phone.message}</p>}
        </div>

        {/* Password field — min 6 characters */}
        <div className={styles.field}>
          <label>Password</label>
          {/* type="password" makes browser hide characters with dots */}
          <input {...register('password')} type="password" placeholder="••••••••" />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>

        {/* Confirm password — zod refine() checks this matches password */}
        <div className={styles.field}>
          <label>Confirm Password</label>
          <input {...register('confirmPassword')} type="password" placeholder="••••••••" />
          {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword.message}</p>}
        </div>

        {/* disabled while submitting to prevent double clicks */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </button>

      </form>
    </div>
  );
}
