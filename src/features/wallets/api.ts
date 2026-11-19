import { api } from '@/api/client'

export type Wallet = {
  id: string
  name: string
  accentColor: string
  balance: number
  currency?: string
  targetAmount?: number | null
  category?: { id: string; name: string; slug?: string } | null
}

export const walletKeys = {
  all: ['wallets'] as const,
}

export const walletsApi = {
  list: () => api<Wallet[]>('/wallets'),
}

export const ACCENT_CLASSES: Record<string, { soft: string; solid: string }> = {
  green: { soft: 'bg-[#eaf8ee]', solid: 'bg-[#1f8a3b]' },
  orange: { soft: 'bg-[#fff1e8]', solid: 'bg-[#c2410c]' },
  purple: { soft: 'bg-[#f3ecff]', solid: 'bg-[#7c3aed]' },
  blue: { soft: 'bg-[#ebf6fe]', solid: 'bg-[#1f6493]' },
  red: { soft: 'bg-[#fdeeee]', solid: 'bg-[#b42318]' },
  yellow: { soft: 'bg-[#fff8e1]', solid: 'bg-[#a16207]' },
  teal: { soft: 'bg-[#e6f7f6]', solid: 'bg-[#0f766e]' },
  pink: { soft: 'bg-[#fdecf4]', solid: 'bg-[#be185d]' },
}
