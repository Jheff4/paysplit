import logoMark from '@/assets/logo-mark.svg'
import { cn } from '@/lib/cn'

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('inline-flex items-center gap-[9px] text-base font-medium', tone === 'light' ? 'text-white' : 'text-ink')}>
      <img src={logoMark} alt="" width={30} height={30} className="size-[30px]" />
      Paysplit
    </span>
  )
}
