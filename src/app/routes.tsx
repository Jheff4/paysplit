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
          {
            path: 'sign-in',
            lazy: () => import('@/pages/auth/SignInPage').then((m) => ({ Component: m.SignInPage })),
          },
          {
            path: 'sign-up',
            lazy: () => import('@/pages/auth/SignUpPage').then((m) => ({ Component: m.SignUpPage })),
          },
          {
            path: 'verify-email',
            lazy: () => import('@/pages/auth/VerifyEmailPage').then((m) => ({ Component: m.VerifyEmailPage })),
          },
          {
            path: 'create-password',
            lazy: () => import('@/pages/auth/CreatePasswordPage').then((m) => ({ Component: m.CreatePasswordPage })),
          },
          {
            path: 'forgot-password',
            lazy: () => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })),
          },
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
          {
            path: 'verify-identity',
            lazy: () => import('@/pages/kyc/KycPage').then((m) => ({ Component: m.KycPage })),
          },
          { path: 'destinations', element: <StubPage title="Destinations" /> },
          { path: 'destinations/wallets/:walletId', element: <StubPage title="Wallet" /> },
          { path: 'destinations/beneficiaries/:beneficiaryId', element: <StubPage title="Beneficiary" /> },
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
