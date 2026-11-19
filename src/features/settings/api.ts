import { api } from '@/api/client'
import type { Income, Onboarding, SalaryAccount } from '@/api/types'
import type { SessionResponse } from '@/features/auth/api'

export type Channel = 'push' | 'sms' | 'email'
export type Topic = 'salaryReceived' | 'splitCompleted' | 'transferUpdates' | 'accountUpdates'
export type ChannelPrefs = Record<Topic, boolean>

export type NotificationPreferences = {
  preferences: Record<Channel, ChannelPrefs>
  topics: Record<Topic, string>
  deliveredChannels: Channel[]
}

export type Profile = {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber: string | null
    countryCode: string | null
    profileImageUrl: string | null
    kycStatus: string
  }
  accountId: string
  memberSince: string
  tier: number
  namesLocked: boolean
  salaryAccount: SalaryAccount
  income: Income | null
  security: { passwordLastUpdated: string | null }
  notificationPreferences: NotificationPreferences
  onboarding: Onboarding
}

export const settingsKeys = {
  profile: ['profile'] as const,
}

export const settingsApi = {
  profile: () => api<Profile>('/users/me/profile'),
  updateProfile: (body: { firstName?: string; lastName?: string; phoneNumber?: string }) =>
    api('/users/me', { method: 'PATCH', body }),
  updatePreferences: (body: Partial<Record<Channel, Partial<ChannelPrefs>>>) =>
    api<NotificationPreferences>('/users/me/notification-preferences', { method: 'PUT', body }),
  uploadPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api<{ profileImageUrl: string }>('/users/me/profile-image', { method: 'PUT', formData })
  },
  removePhoto: () => api('/users/me/profile-image', { method: 'DELETE' }),
  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api<SessionResponse>('/auth/password/change', { method: 'POST', body }),
}

export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
