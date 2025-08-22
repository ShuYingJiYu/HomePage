/**
 * Configuration loader and validator
 * Handles loading, validating, and managing application configuration
 */

import { z } from 'zod'
import type {
  SiteConfig,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigLoaderOptions,
} from '@/types/config'

/**
 * Zod schemas for configuration validation
 */
const LanguageSchema = z.enum(['zh', 'en'])
const ErrorRecoveryStrategySchema = z.enum([
  'use-cache',
  'skip-feature',
  'use-fallback',
  'retry-backoff',
  'fail-build',
])
const CacheStrategySchema = z.enum(['aggressive', 'moderate', 'minimal'])
const SocialPlatformSchema = z.enum(['twitter', 'linkedin', 'weibo', 'wechat'])

const SiteConfigSchema = z.object({
  site: z.object({
    name: z.object({
      zh: z.string().min(1, 'Chinese site name is required'),
      en: z.string().min(1, 'English site name is required'),
    }),
    description: z.object({
      zh: z
        .string()
        .min(10, 'Chinese description must be at least 10 characters'),
      en: z
        .string()
        .min(10, 'English description must be at least 10 characters'),
    }),
    url: z.string().url('Site URL must be a valid URL'),
    defaultLanguage: LanguageSchema,
    supportedLanguages: z
      .array(LanguageSchema)
      .min(1, 'At least one language must be supported'),
    logo: z.string().optional(),
    favicon: z.string().optional(),
  }),
  github: z.object({
    organization: z.string().min(1, 'GitHub organization is required'),
    personalAccount: z.string().min(1, 'GitHub personal account is required'),
    accessToken: z.string().min(1, 'GitHub access token is required'),
    excludeRepositories: z.array(z.string()),
    includeRepositories: z.array(z.string()).optional(),
  }),
  wordpress: z.object({
    apiUrl: z.string().url('WordPress API URL must be a valid URL'),
    categories: z.array(z.string()).optional(),
    multilingualSupport: z.boolean(),
  }),
  ai: z.object({
    geminiApiKey: z.string().min(1, 'Gemini API key is required'),
    analysisPrompts: z.object({
      projectEvaluation: z.string().min(1),
      descriptionGeneration: z.string().min(1),
      categoryClassification: z.string().min(1),
      multilingualGeneration: z.string().min(1),
    }),
    fallbackStrategy: ErrorRecoveryStrategySchema,
  }),
  analytics: z.object({
    googleAnalyticsId: z.string().optional(),
    enableCookieConsent: z.boolean(),
    trackingEvents: z.array(z.string()),
  }),
  social: z.object({
    github: z.string().url('GitHub URL must be valid'),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    weibo: z.string().url().optional(),
    wechat: z.string().optional(),
    email: z.string().email('Email must be valid'),
    shareButtons: z.array(SocialPlatformSchema),
  }),
  monitoring: z
    .object({
      betterStackApiKey: z.string().optional(),
      statusPageUrl: z.string().url().optional(),
      enableStatusPage: z.boolean(),
    })
    .optional(),
  seo: z.object({
    enableSitemap: z.boolean(),
    enableRobotsTxt: z.boolean(),
    enableStructuredData: z.boolean(),
    defaultKeywords: z.object({
      zh: z.array(z.string()),
      en: z.array(z.string()),
    }),
  }),
  performance: z.object({
    enableWebVitals: z.boolean(),
    enableImageOptimization: z.boolean(),
    enableCodeSplitting: z.boolean(),
    cacheStrategy: CacheStrategySchema,
  }),
})

const EnvironmentVariablesSchema = z.object({
  VITE_GITHUB_TOKEN: z.string().min(1, 'GitHub token is required'),
  VITE_GITHUB_ORG: z.string().min(1, 'GitHub organization is required'),
  VITE_GITHUB_USER: z.string().min(1, 'GitHub user is required'),
  VITE_GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  VITE_WORDPRESS_API_URL: z.string().url('WordPress API URL must be valid'),
  VITE_BETTERSTACK_API_KEY: z.string().optional(),
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_SITE_URL: z.string().url('Site URL must be valid'),
  VITE_DEFAULT_LANGUAGE: LanguageSchema,
})

/**
 * Configuration loader class
 */
export class ConfigLoader {
  private static instance: ConfigLoader
  private config: SiteConfig | null = null
  private validationResult: ConfigValidationResult | null = null
  private options: ConfigLoaderOptions

  constructor(options: Partial<ConfigLoaderOptions> = {}) {
    this.options = {
      validateOnLoad: true,
      throwOnValidationError: false,
      enableFallbacks: true,
      logLevel: 'warn',
      ...options,
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: Partial<ConfigLoaderOptions>): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader(options)
    }
    return ConfigLoader.instance
  }

  /**
   * Load and validate configuration
   */
  async loadConfig(): Promise<SiteConfig> {
    try {
      // Load environment variables first
      const envValidation = this.validateEnvironmentVariables()

      if (!envValidation.isValid && this.options.throwOnValidationError) {
        throw new Error(
          `Environment validation failed: ${envValidation.errors.map(e => e.message).join(', ')}`
        )
      }

      // Import configuration modules
      const { siteConfig } = await import('../../config/site.config')

      // Validate configuration if enabled
      if (this.options.validateOnLoad) {
        this.validationResult = this.validateConfig(siteConfig)

        if (!this.validationResult.isValid) {
          this.log(
            'error',
            'Configuration validation failed',
            this.validationResult.errors
          )

          if (this.options.throwOnValidationError) {
            throw new Error(
              `Configuration validation failed: ${this.validationResult.errors.map(e => e.message).join(', ')}`
            )
          }
        }

        if (this.validationResult.warnings.length > 0) {
          this.log(
            'warn',
            'Configuration warnings',
            this.validationResult.warnings
          )
        }
      }

      this.config = siteConfig
      this.log('info', 'Configuration loaded successfully')

      return siteConfig
    } catch (error) {
      this.log('error', 'Failed to load configuration', error)

      if (this.options.enableFallbacks) {
        return this.getFallbackConfig()
      }

      throw error
    }
  }

  /**
   * Validate environment variables
   */
  validateEnvironmentVariables(): ConfigValidationResult {
    const errors: ConfigValidationError[] = []
    const warnings: ConfigValidationError[] = []

    try {
      const env = {
        VITE_GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN,
        VITE_GITHUB_ORG: import.meta.env.VITE_GITHUB_ORG,
        VITE_GITHUB_USER: import.meta.env.VITE_GITHUB_USER,
        VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
        VITE_WORDPRESS_API_URL: import.meta.env.VITE_WORDPRESS_API_URL,
        VITE_BETTERSTACK_API_KEY: import.meta.env.VITE_BETTERSTACK_API_KEY,
        VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
        VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
        VITE_DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE,
      }

      EnvironmentVariablesSchema.parse(env)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(err => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            value: (err as any).input,
          })
        })
      }
    }

    // Check for optional but recommended environment variables
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      warnings.push({
        field: 'VITE_GA_MEASUREMENT_ID',
        message:
          'Google Analytics ID not configured - analytics will be disabled',
      })
    }

    if (!import.meta.env.VITE_BETTERSTACK_API_KEY) {
      warnings.push({
        field: 'VITE_BETTERSTACK_API_KEY',
        message:
          'BetterStack API key not configured - status monitoring will be disabled',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate configuration object
   */
  validateConfig(config: SiteConfig): ConfigValidationResult {
    const errors: ConfigValidationError[] = []
    const warnings: ConfigValidationError[] = []

    try {
      SiteConfigSchema.parse(config)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(err => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            value: (err as any).input,
          })
        })
      }
    }

    // Additional custom validations
    this.performCustomValidations(config, errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Perform custom validation logic
   */
  private performCustomValidations(
    config: SiteConfig,
    errors: ConfigValidationError[],
    warnings: ConfigValidationError[]
  ): void {
    // Check if default language is in supported languages
    if (!config.site.supportedLanguages.includes(config.site.defaultLanguage)) {
      errors.push({
        field: 'site.defaultLanguage',
        message: 'Default language must be included in supported languages',
        value: config.site.defaultLanguage,
      })
    }

    // Check GitHub configuration
    if (!config.github.accessToken) {
      errors.push({
        field: 'github.accessToken',
        message: 'GitHub access token is required for API access',
      })
    }

    // Check AI configuration
    if (!config.ai.geminiApiKey) {
      errors.push({
        field: 'ai.geminiApiKey',
        message: 'Gemini API key is required for AI analysis',
      })
    }

    // Warnings for optional features
    if (!config.analytics.googleAnalyticsId) {
      warnings.push({
        field: 'analytics.googleAnalyticsId',
        message:
          'Google Analytics not configured - user tracking will be disabled',
      })
    }

    if (
      !config.monitoring?.betterStackApiKey &&
      config.monitoring?.enableStatusPage
    ) {
      warnings.push({
        field: 'monitoring.betterStackApiKey',
        message: 'Status page enabled but BetterStack API key not configured',
      })
    }
  }

  /**
   * Get fallback configuration when main config fails
   */
  private getFallbackConfig(): SiteConfig {
    this.log('warn', 'Using fallback configuration')

    return {
      site: {
        name: {
          zh: '书樱寄语网络工作室',
          en: 'Shuying Studio',
        },
        description: {
          zh: '专业的网络开发工作室',
          en: 'Professional web development studio',
        },
        url: 'https://localhost:3000',
        defaultLanguage: 'zh',
        supportedLanguages: ['zh', 'en'],
      },
      github: {
        organization: '',
        personalAccount: '',
        accessToken: '',
        excludeRepositories: [],
        includeRepositories: undefined,
      },
      wordpress: {
        apiUrl: '',
        categories: [],
        multilingualSupport: false,
      },
      ai: {
        geminiApiKey: '',
        analysisPrompts: {
          projectEvaluation: '',
          descriptionGeneration: '',
          categoryClassification: '',
          multilingualGeneration: '',
        },
        fallbackStrategy: 'use-cache',
      },
      analytics: {
        enableCookieConsent: true,
        trackingEvents: [],
      },
      social: {
        github: '',
        email: 'contact@example.com',
        shareButtons: [],
      },
      seo: {
        enableSitemap: true,
        enableRobotsTxt: true,
        enableStructuredData: true,
        defaultKeywords: {
          zh: [],
          en: [],
        },
      },
      performance: {
        enableWebVitals: true,
        enableImageOptimization: true,
        enableCodeSplitting: true,
        cacheStrategy: 'moderate',
      },
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SiteConfig | null {
    return this.config
  }

  /**
   * Get validation result
   */
  getValidationResult(): ConfigValidationResult | null {
    return this.validationResult
  }

  /**
   * Check if configuration is valid
   */
  isValid(): boolean {
    return this.validationResult?.isValid ?? false
  }

  /**
   * Get configuration errors
   */
  getErrors(): ConfigValidationError[] {
    return this.validationResult?.errors ?? []
  }

  /**
   * Get configuration warnings
   */
  getWarnings(): ConfigValidationError[] {
    return this.validationResult?.warnings ?? []
  }

  /**
   * Reload configuration
   */
  async reloadConfig(): Promise<SiteConfig> {
    this.config = null
    this.validationResult = null
    return this.loadConfig()
  }

  /**
   * Log messages based on log level
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: unknown
  ): void {
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 }
    const currentLevel = logLevels[this.options.logLevel]
    const messageLevel = logLevels[level]

    if (messageLevel >= currentLevel) {
      const logMethod = level === 'debug' ? console.log : console[level]
      logMethod(`[ConfigLoader] ${message}`, data || '')
    }
  }
}

/**
 * Convenience function to get configuration
 */
export async function getConfig(
  options?: Partial<ConfigLoaderOptions>
): Promise<SiteConfig> {
  const loader = ConfigLoader.getInstance(options)
  return loader.loadConfig()
}

/**
 * Convenience function to validate environment
 */
export function validateEnvironment(): ConfigValidationResult {
  const loader = ConfigLoader.getInstance()
  return loader.validateEnvironmentVariables()
}

export default ConfigLoader
