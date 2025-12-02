/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYHERO_BASE_URL: string
  readonly VITE_PAYHERO_ACCOUNT_ID: string
  readonly VITE_PAYHERO_CHANNEL_ID: string
  readonly VITE_PAYHERO_AUTH_TOKEN: string
  readonly VITE_PAYHERO_CALLBACK_URL: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}