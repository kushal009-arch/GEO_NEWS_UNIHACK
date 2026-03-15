/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OLLAMA_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
