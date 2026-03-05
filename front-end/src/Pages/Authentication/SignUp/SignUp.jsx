import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '../../../lib/schemas';
import styles from './SignUp.module.css';

export function SignUp() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data) => {
    console.log(data);
    reset();
  };

  return (
    <div className={styles.container}>
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.field}>
          <label>Name</label>
          <input {...register('name')} type="text" placeholder="Your full name" />
          {errors.name && <p className={styles.error}>{errors.name.message}</p>}
        </div>

        <div className={styles.field}>
          <label>Email</label>
          <input {...register('email')} type="email" placeholder="your@email.com" />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>

        <div className={styles.field}>
          <label>Phone (optional)</label>
          <input {...register('phone')} type="text" placeholder="+971XXXXXXXXX" />
          {errors.phone && <p className={styles.error}>{errors.phone.message}</p>}
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <input {...register('password')} type="password" />
          {errors.password && (
            <p className={styles.error}>{errors.password.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <label>Confirm Password</label>
          <input {...register('confirmPassword')} type="password" />
          {errors.confirmPassword && (
            <p className={styles.error}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}