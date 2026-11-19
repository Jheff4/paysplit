import { Split } from 'lucide-react'

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-bold text-ink">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
        <Split aria-hidden="true" className="size-5" />
      </span>
      PaySplit
    </span>
  )
}
