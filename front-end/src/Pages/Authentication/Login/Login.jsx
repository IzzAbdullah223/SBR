import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../../lib/schemas';
import { authAPI } from '../../../services/Api';
import styles from './Login.module.css';

// onLoginSuccess is passed from Home.jsx
// it sets the user state in Home and closes the modal
export function Login({ onLoginSuccess }) {

  // useForm manages all form state
  // zodResolver connects loginSchema validation rules to the form
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
    resolver: zodResolver(loginSchema), // use rules from schemas.js
  });

  // only runs if zod validation passes
  // data = { email, password } — the values the user typed
  const onSubmit = async (data) => {
    try {
      // call real backend — POST /api/auth/login
      // passport checks email + password on the backend
      // returns { token, user }
      const result = await authAPI.login(data.email, data.password);

      // save token in localStorage so user stays logged in on page refresh
      localStorage.setItem('token', result.token);

      // pass user info up to Home.jsx — sets user state and closes the modal
      onLoginSuccess(result.user);

      // clear the form inputs
      reset();
    } catch (err) {
      // backend returned an error — wrong email or password
      // show it on the email field so user knows what went wrong
      setError('email', { type: 'server', message: err.message || 'Invalid email or password' });
    }
  };

  return (
    <div className={styles.container}>
      <h1>Welcome Back</h1>
      <p className={styles.subtitle}>Login to your account</p>

      {/* handleSubmit runs zod validation first — only calls onSubmit if everything passes */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

        {/* Email field — must be valid email format */}
        <div className={styles.field}>
          <label>Email</label>
          {/* register('email') connects this input to the form */}
          <input {...register('email')} type="email" placeholder="your@email.com" />
          {/* also shows server errors like "invalid email or password" */}
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>

        {/* Password field — just needs to exist, backend handles the real check */}
        <div className={styles.field}>
          <label>Password</label>
          {/* type="password" makes browser hide characters with dots */}
          <input {...register('password')} type="password" placeholder="••••••••" />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>

        {/* disabled while submitting to prevent double clicks */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

      </form>
    </div>
  );
}
