import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DetailSkeleton, QueryView } from '@/components/ui/states'
import { useAccountCurrency } from '@/features/account/useAccountCurrency'
import { runKeys, runsApi } from '@/features/runs/api'
import { RunResult } from '@/features/runs/RunResult'
import { PageHeader } from '@/components/ui/PageHeader'

export function SplitRunPage() {
  const { runId = '' } = useParams()
  const currency = useAccountCurrency()
  const run = useQuery({ queryKey: runKeys.detail(runId), queryFn: () => runsApi.get(runId) })
  return (
    <>
      <Link to="/split-rules" className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm text-link hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to split rules
      </Link>
      <PageHeader title="Split details" description="What happened to each rule in this split." />
      <QueryView query={run} loading={<DetailSkeleton label="Loading this split" />} errorTitle="We could not load this split">
        {(data) => <RunResult run={data} currency={currency} />}
      </QueryView>
    </>
  )
}
