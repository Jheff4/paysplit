import { useEffect, useRef, type ReactNode } from 'react'
import logoMarkDark from '@/assets/logo-mark-dark.svg'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'

export function AuthHeader({ title, description }: { title: string; description?: ReactNode }) {
  usePageTitle(title)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [title])

  return (
    <header className="flex flex-col items-center gap-4 px-6 pt-6 pb-5 text-center">
      <img src={logoMarkDark} alt="" width={48} height={48} className="size-12" />
      <div className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl leading-7 font-medium text-heading outline-none">
          {title}
        </h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
    </header>
  )
}

export function AuthBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-6', className)}>{children}</div>
}

export function AuthActions({ children }: { children: ReactNode }) {
  return <div className="-mx-6 mt-8 flex flex-col items-center gap-3 border-t border-line px-6 pt-6 pb-6">{children}</div>
}

export const authLinkClass = 'font-semibold text-link underline underline-offset-4'
