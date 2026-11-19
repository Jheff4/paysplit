const DEFAULT_API_BASE_URL = 'https://paysplit-be-dev-14573850302.europe-west1.run.app/api/v1'

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
