import type { RouteObject } from 'react-router'
import { NotFoundPage, RouteErrorPage, StubPage } from '@/pages/system'
import { AppShell } from './AppShell'
import { PublicOnly, RequireAuth } from './guards'
import { PublicLayout } from './PublicLayout'

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: (
          <PublicOnly>
            <PublicLayout />
          </PublicOnly>
        ),
        children: [
          { path: 'sign-in', element: <StubPage title="Sign in" /> },
          { path: 'sign-up', element: <StubPage title="Create your account" /> },
          { path: 'forgot-password', element: <StubPage title="Reset your password" /> },
        ],
      },
      {
        element: (
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <StubPage title="Dashboard" /> },
          { path: 'verify-identity', element: <StubPage title="Verify your identity" /> },
          { path: 'wallets', element: <StubPage title="Wallets" /> },
          { path: 'wallets/:walletId', element: <StubPage title="Wallet" /> },
          { path: 'beneficiaries', element: <StubPage title="Beneficiaries" /> },
          { path: 'beneficiaries/:beneficiaryId', element: <StubPage title="Beneficiary" /> },
          { path: 'split-rules', element: <StubPage title="Split rules" /> },
          { path: 'split-runs/:runId', element: <StubPage title="Split run" /> },
          { path: 'transactions', element: <StubPage title="Transactions" /> },
          { path: 'transactions/:transactionId', element: <StubPage title="Transaction" /> },
          { path: 'notifications', element: <StubPage title="Notifications" /> },
          { path: 'settings', element: <StubPage title="Settings" /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
