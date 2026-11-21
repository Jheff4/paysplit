import { useNavigation } from 'react-router'

function ProgressBar() {
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-brand-soft">
      <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-brand motion-reduce:w-full motion-reduce:animate-none" />
    </div>
  )
}

export function NavigationProgress() {
  const navigation = useNavigation()
  if (navigation.state === 'idle') return null
  return <ProgressBar />
}

export function InitialLoading() {
  return (
    <div role="status" className="min-h-dvh bg-canvas">
      <span className="sr-only">Loading PaySplit</span>
      <ProgressBar />
    </div>
  )
}
