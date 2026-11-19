const KEY = 'paysplit.session'

export type SignOutReason = 'expired' | 'signed_out'

type Listener = () => void
const listeners = new Set<Listener>()

function readStored(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function removeStored() {
  try {
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(KEY)
  } catch {
    // Storage can be unavailable (private mode); memory is still cleared.
  }
}

let token: string | null = readStored()
let lastReason: SignOutReason | null = null

function emit() {
  for (const listener of listeners) listener()
}

export const tokenStore = {
  get: (): string | null => token,

  set(next: string, remember: boolean) {
    token = next
    lastReason = null
    removeStored()
    try {
      ;(remember ? localStorage : sessionStorage).setItem(KEY, next)
    } catch {
      // Falls back to memory only.
    }
    emit()
  },

  clear(reason: SignOutReason = 'signed_out') {
    if (token === null) return
    token = null
    lastReason = reason
    removeStored()
    emit()
  },

  lastSignOutReason: (): SignOutReason | null => lastReason,

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === KEY && event.newValue === null && token !== null) {
      token = null
      lastReason = 'signed_out'
      emit()
    }
  })
}
