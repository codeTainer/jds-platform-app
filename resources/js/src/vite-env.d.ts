/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_JDS_IDLE_TIMEOUT_MINUTES?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
