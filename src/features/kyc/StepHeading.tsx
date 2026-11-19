import { useEffect, useRef } from 'react'

export function StepHeading({ title, description }: { title: string; description: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [title])

  return (
    <div className="flex flex-col gap-1">
      <h2 ref={ref} tabIndex={-1} className="text-2xl font-medium text-ink outline-none sm:text-[28px]">
        {title}
      </h2>
      <p className="text-base text-muted sm:text-lg">{description}</p>
    </div>
  )
}
