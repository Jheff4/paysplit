import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronRight, Plus, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { formatLongDate, greetingFor } from '@/lib/dates'
import { dashboardApi } from './api'

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

function NotificationCard({ fallback }: { fallback: string }) {
  const latest = useQuery({ queryKey: ['notifications', 'latest'], queryFn: dashboardApi.latestNotifications })
  const item = latest.data?.data?.[0]
  const text = item ? (item.body ?? item.message ?? item.title) : fallback

  return (
    <section
      aria-label="Latest notification"
      className="w-full max-w-[327px] rounded-[20px] border border-white/10 bg-gradient-to-b from-white/5 to-[#0f324a]/40 p-5 text-white"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2">
          <Bell aria-hidden="true" className="size-4" />
          Notification
        </span>
        <Link to="/notifications" className="inline-flex min-h-8 items-center gap-1 text-brand hover:underline">
          View <span className="sr-only">all notifications</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {latest.isPending ? (
        <div role="status" className="mt-6 flex flex-col gap-2.5 py-1">
          <span className="sr-only">Loading your latest update</span>
          <div aria-hidden="true" className="h-4 w-full animate-pulse rounded-md bg-white/15 motion-reduce:animate-none" />
          <div aria-hidden="true" className="h-4 w-2/3 animate-pulse rounded-md bg-white/15 motion-reduce:animate-none" />
        </div>
      ) : (
        <p className="mt-6 line-clamp-3 text-lg leading-7">{text}</p>
      )}
    </section>
  )
}

export function Hero({ firstName, onboardingIncomplete }: { firstName?: string; onboardingIncomplete: boolean }) {
  const now = useNow()
  const { weekday, rest } = formatLongDate(now)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="-mx-4 -mt-6 bg-[radial-gradient(90%_140%_at_35%_10%,#0f324a_0%,#000_55%,#0a0a0a_100%)] px-4 py-8 text-white sm:-mx-9 sm:px-9 lg:min-h-[341px]">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col gap-8 lg:min-h-[277px] lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 lg:order-1">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl leading-tight outline-none sm:text-[40px]">
            {greetingFor(now)}
            {firstName ? `, ${firstName}!` : '!'}
          </h1>
          <p className="text-base text-white/80 sm:text-lg">
            <span className="font-semibold text-white">{weekday},</span> {rest}
          </p>
        </div>
        <div className="lg:order-2 lg:self-center">
          <NotificationCard
            fallback={
              onboardingIncomplete
                ? 'Welcome to PaySplit. Your next step is to complete onboarding.'
                : 'You are all caught up.'
            }
          />
        </div>
        <div className="flex gap-3 lg:order-3">
          <Link
            to="/transactions"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 px-5 text-sm hover:bg-white/10 lg:min-h-[60px]"
          >
            Export
            <Upload aria-hidden="true" className="size-4" />
          </Link>
          <Link
            to="/destinations?create=wallet"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-medium text-on-brand hover:bg-brand-hover lg:min-h-[60px]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Create Wallet
          </Link>
        </div>
      </div>
    </div>
  )
}
