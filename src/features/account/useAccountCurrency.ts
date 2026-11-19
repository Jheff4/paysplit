import { useQuery } from '@tanstack/react-query'
import { dashboardApi, dashboardKeys } from '@/features/dashboard/api'

const API_CURRENCY = 'NGN'

export function useAccountCurrency(): string {
  const summary = useQuery({ queryKey: dashboardKeys.summary, queryFn: dashboardApi.summary })
  return summary.data?.salaryAccount.currency ?? API_CURRENCY
}
