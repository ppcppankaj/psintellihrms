/// <reference types="vite/client" />

declare global {
    interface ImportMetaEnv {
        readonly VITE_RBAC_ENABLED?: string
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv
    }
}

export {}
