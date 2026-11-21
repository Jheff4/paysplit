import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { LoadingStatus, QueryView, Skeleton } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { WalletsCard } from '@/features/dashboard/WalletsCard'
import { settingsApi, settingsKeys } from '@/features/settings/api'
import { AccountDetails, NotificationSettings, Panel, PersonalDetails, ProfileCard, SecuritySettings } from '@/features/settings/sections'
import { IncomeForm } from '@/features/setup/IncomeForm'
import { usePageTitle } from '@/lib/usePageTitle'

function PanelSkeleton({ lines }: { lines: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <LoadingStatus
      label="Loading your profile"
      className="grid gap-4 rounded-[32px] border border-line bg-surface p-3 sm:p-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-surface p-5">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-48" />
        </div>
        <PanelSkeleton lines={2} />
      </div>
      <div className="flex flex-col gap-4">
        <PanelSkeleton lines={4} />
        <PanelSkeleton lines={2} />
      </div>
    </LoadingStatus>
  )
}

export function SettingsPage() {
  usePageTitle('Profile & Setting')
  const currency = useAccountCurrency()
  const profile = useQuery({ queryKey: settingsKeys.profile, queryFn: settingsApi.profile })

  return (
    <>
      <header className="mb-5 flex flex-col gap-2">
        <h1 tabIndex={-1} className="text-2xl leading-8 text-black outline-none">
          Profile & Setting
        </h1>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link to="/" className="font-medium text-link hover:underline">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted">/</li>
            <li aria-current="page" className="text-muted">
              Profile & Setting
            </li>
          </ol>
        </nav>
      </header>
      <QueryView query={profile} loading={<SettingsSkeleton />} errorTitle="We could not load your profile">
        {(data) => (
          <div className="grid gap-4 rounded-[32px] border border-line bg-surface p-3 sm:p-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <ProfileCard profile={data} />
              <AccountDetails profile={data} />
              <WalletsCard currency={currency} />
            </div>
            <div className="flex flex-col gap-4">
              <PersonalDetails profile={data} />
              <Panel title="Salary Income Source">
                <IncomeForm currency={data.salaryAccount.currency ?? currency} income={data.income} submitLabel="Save income" />
              </Panel>
              <NotificationSettings profile={data} />
              <SecuritySettings profile={data} />
            </div>
          </div>
        )}
      </QueryView>
    </>
  )
}
