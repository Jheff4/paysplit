export type Paged<T> = {
  data: T[]
  pagination: { total: number; page: number; limit: number; pages: number }
}

export type Onboarding = {
  emailVerified: boolean
  passwordSet: boolean
  profileCompleted: boolean
  kycStatus: string
  kyc: { identityStatus: string; livenessStatus: string }
  setupChecklist: {
    salaryDateSet: boolean
    hasWallet: boolean
    hasBeneficiary: boolean
    hasSplitRule: boolean
    completed: boolean
  }
  progress: { signupCompleted: boolean; kycCompleted: boolean; setupCompleted: boolean; percent: number }
  nextStep: string | null
}

export type SalaryAccountStatus = 'not_issued' | 'pending' | 'active' | 'failed' | 'closed'

export type SalaryAccount = {
  status: SalaryAccountStatus
  accountNumber: string | null
  maskedAccountNumber: string | null
  bankName: string | null
  accounts: Array<{ accountNumber: string; bankName: string; accountName?: string }>
  actionRequired: string | null
  balance: number
  currency: string
  accountName: string
}

export type Income = {
  employerName: string
  monthlyAmount: number
  paydayDay: number
  currency?: string
  nextPayday?: string
}

export type DashboardSummary = {
  firstName: string
  tier: number
  salaryAccount: SalaryAccount
  income: Income | null
  splitAllocation: { amount: number; activeRules: number; percentOfSalary: number }
  wallets: { total: number; activeCount: number; withTargetCount: number }
  nextSplitRun: { date: string | null; fundStatus: string }
  partition: {
    baselineSalary: number | null
    toWallets: number
    toBeneficiaries: number
    remaining: number
    remainingPercent: number
  }
  unreadNotifications: number
  onboarding: Onboarding
}

export type CashFlow = {
  from: string
  to: string
  granularity: 'month' | 'day'
  buckets: Array<{ period: string; inflow: number; toWallets: number; toBeneficiaries: number; movedBack: number }>
  totals: { inflow: number; toWallets: number; toBeneficiaries: number; movedBack: number }
  monthOverMonth: { current: number; previous: number; changePercent: number | null }
}

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'reversed' | 'processing' | 'retrying' | (string & {})

export type Transaction = {
  id: string
  reference: string
  type: string
  direction: 'in' | 'out'
  status: TransactionStatus
  amount: number
  signedAmount: number
  currency?: string
  description?: string | null
  narration?: string | null
  destinationName?: string | null
  category?: string | null
  createdAt: string
}

export type NotificationItem = {
  id: string
  title: string
  body?: string | null
  message?: string | null
  type?: string
  readAt?: string | null
  isRead?: boolean
  createdAt: string
}

export type NotificationFeed = Paged<NotificationItem> & { unreadCount: number }
