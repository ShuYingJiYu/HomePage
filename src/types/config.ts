/**
 * Configuration type definitions for the homepage system
 * Defines all configuration interfaces and types used throughout the application
 */

export type Language = 'zh' | 'en';
export type ProjectCategory = 'web-app' | 'mobile-app' | 'open-source' | 'library' | 'automation' | 'other';
export type ErrorRecoveryStrategy = 'use-cache' | 'skip-feature' | 'use-fallback' | 'retry-backoff' | 'fail-build';
export type CacheStrategy = 'aggressive' | 'moderate' | 'minimal';
export type SocialPlatform = 'twitter' | 'linkedin' | 'weibo' | 'wechat';

/**
 * Main site configuration interface
 */
export interface SiteConfig {
  site: {
    name: {
      zh: string;
      en: string;
    };
    description: {
      zh: string;
      en: string;
    };
    url: string;
    defaultLanguage: Language;
    supportedLanguages: Language[];
    logo?: string;
    favicon?: string;
  };
  
  github: {
    organization: string;
    personalAccount: string;
    excludeRepositories: string[];
    includeRepositories?: string[];
    accessToken: string;
  };
  
  wordpress: {
    apiUrl: string;
    categories?: string[];
    multilingualSupport: boolean;
  };
  
  ai: {
    geminiApiKey: string;
    analysisPrompts: {
      projectEvaluation: string;
      descriptionGeneration: string;
      categoryClassification: string;
      multilingualGeneration: string;
    };
    fallbackStrategy: ErrorRecoveryStrategy;
  };
  
  analytics: {
    googleAnalyticsId?: string;
    enableCookieConsent: boolean;
    trackingEvents: string[];
  };
  
  social: {
    github: string;
    twitter?: string;
    linkedin?: string;
    weibo?: string;
    wechat?: string;
    email: string;
    shareButtons: SocialPlatform[];
  };
  
  monitoring?: {
    betterStackApiKey?: string;
    statusPageUrl?: string;
    enableStatusPage: boolean;
  };
  
  seo: {
    enableSitemap: boolean;
    enableRobotsTxt: boolean;
    enableStructuredData: boolean;
    defaultKeywords: {
      zh: string[];
      en: string[];
    };
  };
  
  performance: {
    enableWebVitals: boolean;
    enableImageOptimization: boolean;
    enableCodeSplitting: boolean;
    cacheStrategy: CacheStrategy;
  };
}

/**
 * GitHub specific configuration
 */
export interface GitHubConfig {
  organization: string;
  personalAccount: string;
  accessToken: string;
  excludeRepositories: string[];
  includeRepositories?: string[];
  rateLimiting: {
    requestsPerHour: number;
    retryAfter: number;
  };
  errorHandling: {
    rateLimitStrategy: ErrorRecoveryStrategy;
    networkErrorStrategy: ErrorRecoveryStrategy;
    authErrorStrategy: ErrorRecoveryStrategy;
  };
}

/**
 * AI configuration for Gemini API
 */
export interface AIConfig {
  geminiApiKey: string;
  analysisPrompts: {
    projectEvaluation: string;
    descriptionGeneration: string;
    categoryClassification: string;
    multilingualGeneration: string;
  };
  fallbackStrategy: ErrorRecoveryStrategy;
  rateLimiting: {
    requestsPerMinute: number;
    quotaLimit: number;
  };
  errorHandling: {
    quotaExceededStrategy: ErrorRecoveryStrategy;
    networkErrorStrategy: ErrorRecoveryStrategy;
  };
}

/**
 * WordPress configuration
 */
export interface WordPressConfig {
  apiUrl: string;
  categories?: string[];
  multilingualSupport: boolean;
  errorHandling: {
    networkErrorStrategy: ErrorRecoveryStrategy;
    notFoundStrategy: ErrorRecoveryStrategy;
  };
}

/**
 * Environment variables interface
 */
export interface EnvironmentVariables {
  // GitHub
  VITE_GITHUB_TOKEN: string;
  VITE_GITHUB_ORG: string;
  VITE_GITHUB_USER: string;
  
  // AI
  VITE_GEMINI_API_KEY: string;
  
  // WordPress
  VITE_WORDPRESS_API_URL: string;
  
  // Monitoring (Optional)
  VITE_BETTERSTACK_API_KEY?: string;
  
  // Analytics
  VITE_GA_MEASUREMENT_ID?: string;
  
  // Site
  VITE_SITE_URL: string;
  VITE_DEFAULT_LANGUAGE: Language;
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationError[];
}

/**
 * Configuration loader options
 */
export interface ConfigLoaderOptions {
  validateOnLoad: boolean;
  throwOnValidationError: boolean;
  enableFallbacks: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}