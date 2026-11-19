import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertDialog } from 'radix-ui'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { beneficiariesApi, type Beneficiary } from './api'

export function DeleteBeneficiaryDialog({
  beneficiary,
  onClose,
  onDeleted,
}: {
  beneficiary: Pick<Beneficiary, 'id' | 'accountName'> | null
  onClose: () => void
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: (id: string) => beneficiariesApi.remove(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['beneficiaries'] }),
        queryClient.invalidateQueries({ queryKey: ['split-rules'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      onClose()
      onDeleted?.()
    },
  })

  return (
    <AlertDialog.Root open={!!beneficiary} onOpenChange={(open) => !open && (remove.reset(), onClose())}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface p-6 shadow-modal">
          <AlertDialog.Title className="text-lg font-semibold text-heading">Delete {beneficiary?.accountName}?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">
            Their split rule is deleted too, so no more money goes to them. Past transfers stay in your history.
          </AlertDialog.Description>
          {remove.isError && (
            <Alert tone="error" live className="mt-4">
              {errorMessage(remove.error)}
            </Alert>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" className="flex-1">
                Keep
              </Button>
            </AlertDialog.Cancel>
            <Button variant="danger" className="flex-1" loading={remove.isPending} onClick={() => beneficiary && remove.mutate(beneficiary.id)}>
              Delete
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
