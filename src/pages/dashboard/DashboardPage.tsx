import { useQuery } from '@tanstack/react-query'
import { QueryView, Skeleton } from '@/components/ui/states'
import { dashboardApi, dashboardKeys } from '@/features/dashboard/api'
import { CashFlowCard } from '@/features/dashboard/CashFlowCard'
import { Hero } from '@/features/dashboard/Hero'
import { BalanceCard, MetricCards } from '@/features/dashboard/Metrics'
import { OnboardingBanner } from '@/features/dashboard/Onboarding'
import { PartitionCard } from '@/features/dashboard/PartitionCard'
import { RecentActivity } from '@/features/dashboard/RecentActivity'
import { WalletsCard } from '@/features/dashboard/WalletsCard'
import { usePageTitle } from '@/lib/usePageTitle'

function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading your dashboard</span>
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  )
}

export function DashboardPage() {
  usePageTitle('Dashboard')
  const summary = useQuery({ queryKey: dashboardKeys.summary, queryFn: dashboardApi.summary })
  const onboarding = summary.data?.onboarding
  const onboardingIncomplete = !!onboarding && !(onboarding.progress.kycCompleted && onboarding.progress.setupCompleted)

  return (
    <div className="flex flex-col gap-6">
      <Hero firstName={summary.data?.firstName} onboardingIncomplete={onboardingIncomplete} />
      <QueryView query={summary} loading={<DashboardSkeleton />} errorTitle="We could not load your dashboard">
        {(data) => {
          const currency = data.salaryAccount.currency
          return (
            <div className="flex flex-col gap-6">
              {onboardingIncomplete && <OnboardingBanner onboarding={data.onboarding} />}
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
                <BalanceCard account={data.salaryAccount} />
                <MetricCards summary={data} />
              </div>
              <div className="grid gap-4 rounded-[32px] border border-line bg-surface p-3 sm:p-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <CashFlowCard currency={currency} />
                <PartitionCard summary={data} />
                <RecentActivity currency={currency} />
                <WalletsCard currency={currency} />
              </div>
            </div>
          )
        }}
      </QueryView>
    </div>
  )
}
