import { Star } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import welcomeCheck from '@/assets/welcome-check.svg'
import { Button } from '@/components/ui/Button'
import { pendingSignup } from './pendingSignup'

const STEPS = [
  { step: 'Step 1', title: 'Profile & Identity Verification', detail: 'Biometric liveness' },
  { step: 'Step 2', title: 'Setup Checklist', detail: 'Income, wallets & rules' },
]

export function WelcomeDialog() {
  const [open, setOpen] = useState(pendingSignup.shouldWelcome)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) pendingSignup.clearWelcome()
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[803px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] bg-surface shadow-modal">
          <div
            aria-hidden="true"
            className="relative grid h-56 place-items-center overflow-hidden bg-[repeating-conic-gradient(from_0deg,#f5f5f5_0deg_9deg,#fff_9deg_26deg)] [mask-image:radial-gradient(circle,#000_30%,transparent_70%)] sm:h-[269px]"
          >
            <span className="grid size-36 place-items-center rounded-full bg-gradient-to-b from-black to-brand">
              <img src={welcomeCheck} alt="" width={60} height={40} className="h-10 w-[60px]" />
            </span>
          </div>
          <div className="flex flex-col gap-4 px-6 pt-6 pb-5 text-center">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-2xl leading-7 font-medium text-heading">Welcome to PaySplit</Dialog.Title>
              <Dialog.Description className="mx-auto max-w-[511px] text-sm text-muted">
                Your account is ready. Let's verify your identity and set up your salary partitions in under 3 minutes.
              </Dialog.Description>
            </div>
            <ol className="grid gap-4 text-left sm:grid-cols-2">
              {STEPS.map((item) => (
                <li key={item.step} className="flex flex-col gap-3 rounded-[20px] border border-line p-6">
                  <span className="inline-flex w-fit items-center gap-2.5 rounded-full bg-chip px-3 py-1 text-xs tracking-[0.3px] text-muted">
                    <Star aria-hidden="true" className="size-3.5 fill-current" />
                    {item.step}
                  </span>
                  <span className="text-lg leading-5 font-semibold tracking-[0.3px] text-ink">{item.title}</span>
                  <span className="text-sm text-muted">{item.detail}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-line p-6 sm:flex-row">
            <Dialog.Close asChild>
              <Button variant="secondary" size="lg" className="flex-1 font-normal">
                Go to Dashboard
              </Button>
            </Dialog.Close>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                setOpen(false)
                navigate('/verify-identity')
              }}
            >
              Continue to KYC
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
