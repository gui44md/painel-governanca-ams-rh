/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Quando "true", a logo não é exibida (útil para publicações abertas). */
  readonly VITE_OCULTAR_LOGO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
