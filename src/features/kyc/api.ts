import { api } from '@/api/client'

export type StepStatus = 'not_started' | 'pending' | 'in_review' | 'passed' | 'failed' | (string & {})
export type KycStepName = 'profile' | 'identity' | 'liveness' | (string & {})

export type KycStatus = {
  kycStatus: string
  currentStep: KycStepName | null
  steps: {
    profile: { completed: boolean; countryCode: string | null; phoneNumber: string | null; currencyCode: string | null }
    identity: {
      status: StepStatus
      region: 'nigeria' | 'international' | null
      method: string | null
      maskedIdNumber: string | null
      failureReason: string | null
      attemptsRemaining: number
      retryAvailableAt: string | null
    }
    liveness: {
      status: StepStatus
      failureReason: string | null
      attemptsRemaining: number
      retryAvailableAt: string | null
    }
  }
}

export type Country = {
  code: string
  name: string
  dialCode: string
  currency: string
  region: 'nigeria' | 'international'
  methods: string[]
}

export const kycKeys = {
  status: ['kyc', 'status'] as const,
  countries: ['kyc', 'countries'] as const,
}

export const kycApi = {
  status: () => api<KycStatus>('/kyc/status'),
  countries: () => api<Country[]>('/kyc/countries'),
  saveProfile: (body: { countryCode: string; phoneNumber: string }) =>
    api<KycStatus>('/kyc/profile', { method: 'PUT', body }),
  verifyNigeria: (body: { method: 'bvn' | 'nin'; idNumber: string }) =>
    api('/kyc/identity/nigeria', { method: 'POST', body }),
  verifyInternational: (documentType: 'passport' | 'drivers_license', front: File, back?: File) => {
    const formData = new FormData()
    formData.append('documentType', documentType)
    formData.append('front', front)
    if (back) formData.append('back', back)
    return api('/kyc/identity/international', { method: 'POST', formData })
  },
  liveness: (selfie: Blob) => {
    const formData = new FormData()
    formData.append('selfie', selfie, 'selfie.jpg')
    return api('/kyc/liveness', { method: 'POST', formData })
  },
}

export const KYC_IMAGE_TYPES = ['image/png', 'image/jpeg']
export const KYC_MAX_BYTES = 2 * 1024 * 1024

export function imageFileProblem(file: File | undefined, required: boolean): string | null {
  if (!file) return required ? 'Choose a file.' : null
  if (!KYC_IMAGE_TYPES.includes(file.type)) return 'Use a PNG or JPG image.'
  if (file.size > KYC_MAX_BYTES) return 'The image must be 2 MB or smaller.'
  return null
}
