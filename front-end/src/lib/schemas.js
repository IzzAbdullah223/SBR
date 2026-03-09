import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().trim().min(1, 'Please confirm your password'),
  phone: z.string().trim()
    .regex(/^(\+971|00971|0)?[0-9]{9}$/, 'Accepted formats: 05XXXXXXXX, +97150XXXXXXX, or 9 digits')
    .optional()
    .or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().trim().min(1, 'Password is required'),
});