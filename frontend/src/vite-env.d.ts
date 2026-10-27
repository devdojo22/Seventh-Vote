/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TERMS_OF_SERVICE_URL?: string;
  readonly VITE_PRIVACY_POLICY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
