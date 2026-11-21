import { queryClient } from '@/api/queryClient'
import { dashboardApi, dashboardKeys } from '@/features/dashboard/api'
import { ruleKeys, rulesApi } from '@/features/rules/api'
import { transactionKeys, transactionsApi } from '@/features/transactions/api'
import { EMPTY_FILTERS } from '@/features/transactions/filters'
import { walletKeys, walletsApi } from '@/features/wallets/api'

const warmers: Record<string, () => unknown[]> = {
  '/': () => [
    import('@/pages/dashboard/DashboardPage'),
    queryClient.prefetchQuery({ queryKey: dashboardKeys.summary, queryFn: dashboardApi.summary }),
  ],
  '/transactions': () => [
    import('@/pages/transactions/TransactionsPage'),
    queryClient.prefetchQuery({
      queryKey: transactionKeys.list(1, EMPTY_FILTERS),
      queryFn: () => transactionsApi.list(1, EMPTY_FILTERS),
    }),
  ],
  '/destinations': () => [
    import('@/pages/destinations/DestinationsPage'),
    queryClient.prefetchQuery({ queryKey: walletKeys.all, queryFn: walletsApi.list }),
  ],
  '/split-rules': () => [
    import('@/pages/rules/SplitRulesPage'),
    queryClient.prefetchQuery({ queryKey: ruleKeys.summary, queryFn: rulesApi.summary }),
    queryClient.prefetchQuery({
      queryKey: ruleKeys.list(1, 'all', ''),
      queryFn: () => rulesApi.list(1, 'all', ''),
    }),
  ],
}

export function warmRoute(to: string) {
  warmers[to]?.()
}
