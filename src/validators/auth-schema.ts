import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().email(),
  password: z.string().trim().min(1, {
    message: 'Password is required',
  }),
});

export const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1, {
    message: 'Password is required',
  }),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().trim().min(1, {
      message: 'Password is required',
    }),
    confirmPassword: z.string().trim().min(1, {
      message: 'Password is required',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export const EmailSchema = z.object({
  email: z.string().trim().email({
    message: 'Invalid email address',
  }),
});
