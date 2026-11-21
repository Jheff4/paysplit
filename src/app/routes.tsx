import type { RouteObject } from 'react-router'
import { InitialLoading } from '@/components/NavigationProgress'
import { NotFoundPage, RouteErrorPage } from '@/pages/system'
import { PublicOnly } from './guards'
import { PublicLayout } from './PublicLayout'

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <InitialLoading />,
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
        lazy: () => import('./ProtectedShell').then((m) => ({ Component: m.ProtectedShell })),
        children: [
          {
            index: true,
            lazy: () => import('@/pages/dashboard/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
          },
          {
            path: 'setup',
            lazy: () => import('@/pages/setup/SetupPage').then((m) => ({ Component: m.SetupPage })),
          },
          {
            path: 'verify-identity',
            lazy: () => import('@/pages/kyc/KycPage').then((m) => ({ Component: m.KycPage })),
          },
          {
            path: 'destinations',
            lazy: () => import('@/pages/destinations/DestinationsPage').then((m) => ({ Component: m.DestinationsPage })),
          },
          {
            path: 'destinations/wallets/:walletId',
            lazy: () => import('@/pages/destinations/WalletDetailPage').then((m) => ({ Component: m.WalletDetailPage })),
          },
          {
            path: 'destinations/beneficiaries/:beneficiaryId',
            lazy: () =>
              import('@/pages/destinations/BeneficiaryDetailPage').then((m) => ({ Component: m.BeneficiaryDetailPage })),
          },
          {
            path: 'split-rules',
            lazy: () => import('@/pages/rules/SplitRulesPage').then((m) => ({ Component: m.SplitRulesPage })),
          },
          {
            path: 'split-runs/:runId',
            lazy: () => import('@/pages/rules/SplitRunPage').then((m) => ({ Component: m.SplitRunPage })),
          },
          {
            path: 'transactions',
            lazy: () => import('@/pages/transactions/TransactionsPage').then((m) => ({ Component: m.TransactionsPage })),
          },
          {
            path: 'transactions/:transactionId',
            lazy: () => import('@/pages/transactions/TransactionsPage').then((m) => ({ Component: m.TransactionsPage })),
          },
          {
            path: 'notifications',
            lazy: () => import('@/pages/notifications/NotificationsPage').then((m) => ({ Component: m.NotificationsPage })),
          },
          {
            path: 'settings',
            lazy: () => import('@/pages/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
