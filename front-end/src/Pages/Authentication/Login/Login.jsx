import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../../lib/schemas';
import { authAPI } from '../../../services/Api';
import styles from './Login.module.css';

// onLoginSuccess — called on successful login, closes modal and sets user in Home
// onSwitchToSignUp — called when user clicks "Don't have an account?" link
export function Login({ onLoginSuccess, onSwitchToSignUp }) {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const result = await authAPI.login(data.email, data.password);

      // ✅ FIX #3: guard before using result — if token or user is missing
      // for any reason, show an error instead of calling onLoginSuccess(undefined)
      // which would silently break the navbar and user state in Home.jsx
      if (!result.token || !result.user) {
        setError('root', { message: 'Login failed. Please try again.' });
        return;
      }

      localStorage.setItem('token', result.token);
      onLoginSuccess(result.user);
      reset();

    } catch (err) {
      // ✅ FIX #1: catch now actually fires because fetchAPI throws on non-ok responses
      // ✅ FIX #7: split errors by type — auth errors (wrong password) go on the
      // password field where they make sense. Server/unknown errors go on root
      // (a general form-level error) so the email field doesn't look broken
      // when the database is down or JWT secret is missing.
      const message = err.message || 'Invalid email or password';
      const isAuthError = message.toLowerCase().includes('email') ||
                          message.toLowerCase().includes('password') ||
                          message.toLowerCase().includes('incorrect') ||
                          message.toLowerCase().includes('invalid');

      if (isAuthError) {
        setError('password', { type: 'server', message });
      } else {
        setError('root', { type: 'server', message });
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1>Welcome Back</h1>
      <p className={styles.subtitle}>Login to your account</p>

      {/* ✅ FIX #7: root error shown at top of form for server/unknown errors */}
      {errors.root && (
        <div className={styles.formError}>{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

        <div className={styles.field}>
          <label>Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="your@email.com"
            // ✅ FIX #5: red border on input when that field has an error
            className={errors.email ? styles.inputError : ''}
          />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className={errors.password ? styles.inputError : ''}
          />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

      </form>

      {/* ✅ FIX #9: switch link so user doesn't have to close modal and reopen */}
      {onSwitchToSignUp && (
        <p className={styles.switchText}>
          Don't have an account?{' '}
          <button className={styles.switchBtn} onClick={onSwitchToSignUp} type="button">
            Sign Up
          </button>
        </p>
      )}
    </div>
  );
}