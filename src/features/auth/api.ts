import { api } from '@/api/client'

export type SessionResponse = {
  accessToken?: string
  token?: string
  onboarding?: unknown
}

export function accessTokenFrom(response: SessionResponse): string {
  const token = response.accessToken ?? response.token
  if (!token) throw new Error('The sign-in response did not include an access token')
  return token
}

export type ResendResponse = { resendAvailableInSeconds?: number }
export type VerifyEmailResponse = { setupToken: string }

export const authApi = {
  signup: (body: { firstName: string; lastName: string; email: string }) =>
    api<ResendResponse>('/auth/signup', { method: 'POST', body, token: '' }),

  verifyEmail: (body: { email: string; code: string }) =>
    api<VerifyEmailResponse>('/auth/email/verify', { method: 'POST', body, token: '' }),

  resendCode: (email: string) => api<ResendResponse>('/auth/email/resend', { method: 'POST', body: { email }, token: '' }),

  setPassword: (setupToken: string, body: { password: string; confirmPassword: string }) =>
    api<SessionResponse>('/auth/password/set', { method: 'POST', body, token: setupToken }),

  login: (body: { email: string; password: string; rememberMe: boolean }) =>
    api<SessionResponse>('/auth/login', { method: 'POST', body, token: '' }),

  forgotPassword: (email: string) => api('/auth/password/forgot', { method: 'POST', body: { email }, token: '' }),

  verifyResetCode: (body: { email: string; code: string }) =>
    api('/auth/password/verify-code', { method: 'POST', body, token: '' }),

  resetPassword: (body: { email: string; newPassword: string }) =>
    api('/auth/password/reset', { method: 'POST', body, token: '' }),
}
