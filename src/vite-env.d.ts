/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_TOKEN: string
  readonly VITE_GITHUB_ORG: string
  readonly VITE_GITHUB_USER: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_WORDPRESS_API_URL: string
  readonly VITE_BETTERSTACK_API_KEY?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_SITE_URL: string
  readonly VITE_DEFAULT_LANGUAGE: 'zh' | 'en'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}