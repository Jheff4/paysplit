import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'max-w-[420px]', md: 'max-w-[540px]', lg: 'max-w-[678px]' }

export function Modal({ open, onOpenChange, title, description, children, size = 'lg' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] bg-surface shadow-modal',
            widths[size],
          )}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="relative px-6 pt-6 pb-2 text-center">
            <Dialog.Title className="text-xl font-medium text-heading sm:text-2xl">{title}</Dialog.Title>
            {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
            <Dialog.Close
              aria-label="Close"
              className="absolute top-4 right-4 grid size-10 place-items-center rounded-lg text-muted hover:bg-canvas"
            >
              <X aria-hidden="true" className="size-6" />
            </Dialog.Close>
          </div>
          <div className="p-6 pt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
