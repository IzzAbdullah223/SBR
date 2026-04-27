import { z } from 'zod';

const BLOCKED_DOMAINS = [
  'gmial.com', 'gmai.com', 'gmil.com', 'gmaill.com', 'gmail.co',
  'yahooo.com', 'yaho.com', 'yahho.com', 'yahoo.co',
  'hotmial.com', 'hotmai.com', 'hotmall.com', 'hotmail.co',
  'outlok.com', 'outloo.com', 'outlookk.com',
  'test.com', 'example.com', 'fake.com', 'temp.com',
];

const emailSchema = z.string().trim()
  .email('Please enter a valid email')
  .refine(
    (val) => {
      const domain = val.split('@')[1]?.toLowerCase();
      return !BLOCKED_DOMAINS.includes(domain);
    },
    { message: 'Please enter a valid email address' }
  );

export const signUpSchema = z.object({
  name: z.string().trim()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters'),
  email: emailSchema,
  password: z.string().trim()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
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
  email: emailSchema,
  password: z.string().trim().min(1, 'Password is required'),
});