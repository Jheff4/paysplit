import { Search } from 'lucide-react'

export function SearchField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-xl border border-field bg-surface px-3">
      <Search aria-hidden="true" className="size-4 text-muted" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="w-36 bg-transparent text-sm outline-none placeholder:text-placeholder"
      />
    </label>
  )
}
