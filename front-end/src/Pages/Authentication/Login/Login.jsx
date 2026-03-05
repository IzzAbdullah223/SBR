import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../../lib/schemas';
import styles from './Login.module.css';

export function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    console.log(data);
    reset();
  };

  return (
    <div className={styles.container}>
      <h1>Welcome Back</h1>
      <p className={styles.subtitle}>Login to your account</p>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

        <div className={styles.field}>
          <label>Email</label>
          <input {...register('email')} type="email" placeholder="your@email.com" />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <input {...register('password')} type="password" placeholder="••••••••" />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

      </form>
    </div>
  );
}