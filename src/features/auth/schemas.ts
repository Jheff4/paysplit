import { z } from 'zod'

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'upper', label: 'An uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'A lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { id: 'digit', label: 'A number', test: (v: string) => /\d/.test(v) },
  { id: 'special', label: 'A special character (for example ! @ # $)', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const

export const passwordSchema = z
  .string()
  .refine((v) => PASSWORD_RULES.every((rule) => rule.test(v)), 'Your password does not meet all the rules below.')

export const emailSchema = z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.')

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string().min(1, 'Confirm your password.') })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from your email.')

export const nameSchema = (label: string) =>
  z.string().trim().min(1, `Enter your ${label}.`).max(60, `Your ${label} is too long.`)
