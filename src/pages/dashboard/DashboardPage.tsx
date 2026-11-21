import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { LoadingStatus, QueryView, Skeleton } from '@/components/ui/states'
import { dashboardApi, dashboardKeys } from '@/features/dashboard/api'
import { CashFlowCard } from '@/features/dashboard/CashFlowCard'
import { Hero } from '@/features/dashboard/Hero'
import { BalanceCard, MetricCards } from '@/features/dashboard/Metrics'
import { OnboardingBanner } from '@/features/dashboard/Onboarding'
import { PartitionCard } from '@/features/dashboard/PartitionCard'
import { RecentActivity } from '@/features/dashboard/RecentActivity'
import { WalletsCard } from '@/features/dashboard/WalletsCard'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'

function PanelSkeleton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5', className)}>
      {children}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <LoadingStatus label="Loading your dashboard" className="flex flex-col gap-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <div className="flex flex-col justify-end gap-3 py-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-12 w-56" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="flex min-h-[168px] flex-col justify-between rounded-[20px] bg-gradient-to-b from-[#eaf6ff] to-surface p-5 shadow-xs"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 rounded-[32px] border border-line bg-surface p-3 sm:p-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PanelSkeleton>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-72 w-full" />
        </PanelSkeleton>
        <PanelSkeleton className="items-center">
          <Skeleton className="h-5 w-40 self-start" />
          <Skeleton className="aspect-square w-full max-w-[220px] rounded-full" />
        </PanelSkeleton>
      </div>
    </LoadingStatus>
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
