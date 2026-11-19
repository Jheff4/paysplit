import { AppShell } from './AppShell'
import { RequireAuth } from './guards'

export function ProtectedShell() {
  return (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  )
}
