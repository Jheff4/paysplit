const EMAIL_KEY = 'paysplit.pendingEmail'
const WELCOME_KEY = 'paysplit.showWelcome'

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const pendingSignup = {
  setEmail: (email: string) => safe(() => sessionStorage.setItem(EMAIL_KEY, email), undefined),
  email: (): string => safe(() => sessionStorage.getItem(EMAIL_KEY) ?? '', ''),
  clear: () => safe(() => sessionStorage.removeItem(EMAIL_KEY), undefined),

  markWelcome: () => safe(() => sessionStorage.setItem(WELCOME_KEY, '1'), undefined),
  shouldWelcome: (): boolean => safe(() => sessionStorage.getItem(WELCOME_KEY) === '1', false),
  clearWelcome: () => safe(() => sessionStorage.removeItem(WELCOME_KEY), undefined),
}
