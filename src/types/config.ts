import { Language, MultilingualContent } from './common'

// Site Configuration types
export interface SiteConfig {
  site: SiteInfo
  github: GitHubConfig
  wordpress?: WordPressConfig
  ai: AIConfig
  analytics?: AnalyticsConfig
  social: SocialConfig
  monitoring?: MonitoringConfig
  seo: SEOConfig
  performance: SitePerformanceConfig
  deployment: DeploymentConfig
}

export interface SiteInfo {
  name: MultilingualContent
  description: MultilingualContent
  url: string
  defaultLanguage: Language
  supportedLanguages: Language[]
  logo?: string
  favicon?: string
  author: MultilingualContent
  keywords: {
    zh: string[]
    en: string[]
  }
  contact: ContactInfo
}

export interface ContactInfo {
  email: string
  phone?: string
  address?: MultilingualContent
  businessHours?: MultilingualContent
  timezone: string
}

export interface GitHubConfig {
  organization: string
  personalAccount: string
  excludeRepositories: string[]
  includeRepositories?: string[]
  accessToken: string
  rateLimit: {
    requestsPerHour: number
    retryAfter: number
  }
  features: {
    fetchContributions: boolean
    fetchReleases: boolean
    fetchIssues: boolean
    fetchPullRequests: boolean
  }
}

export interface WordPressConfig {
  apiUrl: string
  username?: string
  password?: string
  categories?: string[]
  tags?: string[]
  multilingualSupport: boolean
  postsPerPage: number
  features: {
    fetchMedia: boolean
    fetchComments: boolean
    fetchAuthors: boolean
  }
}

export interface AIConfig {
  provider: 'gemini' | 'openai' | 'claude'
  geminiApiKey?: string
  openaiApiKey?: string
  claudeApiKey?: string
  analysisPrompts: {
    projectEvaluation: string
    descriptionGeneration: string
    categoryClassification: string
    multilingualGeneration: string
    seoOptimization: string
  }
  fallbackStrategy: 'cache' | 'manual' | 'skip'
  rateLimit: {
    requestsPerMinute: number
    quotaLimit: number
  }
  features: {
    projectAnalysis: boolean
    contentGeneration: boolean
    seoOptimization: boolean
    imageAnalysis: boolean
  }
}

export interface AnalyticsConfig {
  googleAnalyticsId?: string
  baiduAnalyticsId?: string
  enableCookieConsent: boolean
  trackingEvents: string[]
  customDimensions?: CustomDimension[]
  goals?: AnalyticsGoal[]
  privacy: {
    anonymizeIp: boolean
    respectDoNotTrack: boolean
    cookieExpiry: number
  }
}

export interface CustomDimension {
  index: number
  name: string
  scope: 'hit' | 'session' | 'user' | 'product'
}

export interface AnalyticsGoal {
  id: number
  name: string
  type: 'destination' | 'duration' | 'pages' | 'event'
  value?: number
}

export interface SocialConfig {
  github: string
  twitter?: string
  linkedin?: string
  weibo?: string
  wechat?: string
  email: string
  shareButtons: SocialPlatform[]
  openGraph: {
    siteName: string
    type: string
    locale: string
    alternateLocales: string[]
  }
}

export type SocialPlatform = 'twitter' | 'linkedin' | 'weibo' | 'wechat' | 'facebook' | 'telegram'

export interface MonitoringConfig {
  betterStackApiKey?: string
  statusPageUrl?: string
  enableStatusPage: boolean
  services: MonitoredService[]
  notifications: {
    email?: string
    webhook?: string
    slack?: string
  }
}

export interface MonitoredService {
  name: MultilingualContent
  url: string
  type: 'http' | 'ping' | 'tcp' | 'dns'
  interval: number
  timeout: number
  expectedStatus?: number
  expectedContent?: string
}

export interface SEOConfig {
  enableSitemap: boolean
  enableRobotsTxt: boolean
  enableStructuredData: boolean
  defaultKeywords: {
    zh: string[]
    en: string[]
  }
  searchConsole: {
    google?: string
    baidu?: string
    bing?: string
  }
  features: {
    autoGenerateMeta: boolean
    optimizeImages: boolean
    generateAltText: boolean
  }
}

export interface SitePerformanceConfig {
  enableWebVitals: boolean
  enableImageOptimization: boolean
  enableCodeSplitting: boolean
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal'
  compression: {
    gzip: boolean
    brotli: boolean
  }
  cdn: {
    enabled: boolean
    provider?: 'cloudflare' | 'aws' | 'vercel'
    customDomain?: string
  }
  optimization: {
    minifyCSS: boolean
    minifyJS: boolean
    optimizeImages: boolean
    lazyLoading: boolean
  }
}

export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'github-pages' | 'aws-s3'
  domain?: string
  customDomain?: string
  environment: 'development' | 'staging' | 'production'
  buildCommand: string
  outputDirectory: string
  environmentVariables: Record<string, string>
  redirects?: Redirect[]
  headers?: Header[]
}

export interface Redirect {
  source: string
  destination: string
  permanent: boolean
  statusCode?: number
}

export interface Header {
  source: string
  headers: Record<string, string>
}

// Environment Variables
export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test'
  VITE_SITE_URL: string
  VITE_DEFAULT_LANGUAGE: Language
  GITHUB_TOKEN: string
  GITHUB_ORG: string
  GITHUB_USER: string
  WORDPRESS_API_URL?: string
  WORDPRESS_USERNAME?: string
  WORDPRESS_PASSWORD?: string
  GEMINI_API_KEY?: string
  OPENAI_API_KEY?: string
  CLAUDE_API_KEY?: string
  GOOGLE_ANALYTICS_ID?: string
  BAIDU_ANALYTICS_ID?: string
  BETTERSTACK_API_KEY?: string
  VERCEL_TOKEN?: string
  VERCEL_ORG_ID?: string
  VERCEL_PROJECT_ID?: string
}

// Build Configuration
export interface BuildConfig {
  input: string
  output: string
  publicPath: string
  assetsDir: string
  sourcemap: boolean
  minify: boolean
  target: string[]
  rollupOptions: {
    external?: string[]
    output?: {
      manualChunks?: Record<string, string[]>
    }
  }
}