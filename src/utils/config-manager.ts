/**
 * Configuration manager
 * Central manager for all configuration-related operations
 */

import type { SiteConfig, ConfigValidationResult } from '../types/config';
import { ConfigLoader } from './config-loader';
import { ConfigErrorHandler, createConfigError } from './config-error-handler';

/**
 * Configuration manager class
 * Provides a unified interface for configuration management
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private loader: ConfigLoader;
  private errorHandler: ConfigErrorHandler;
  private config: SiteConfig | null = null;
  private isInitialized = false;

  private constructor() {
    this.loader = ConfigLoader.getInstance({
      validateOnLoad: true,
      throwOnValidationError: false,
      enableFallbacks: true,
      logLevel: import.meta.env.DEV ? 'debug' : 'warn'
    });
    this.errorHandler = ConfigErrorHandler.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize configuration manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.info('[ConfigManager] Initializing configuration...');
      
      // Validate environment first
      const envValidation = this.loader.validateEnvironmentVariables();
      if (!envValidation.isValid) {
        console.warn('[ConfigManager] Environment validation issues:', envValidation.errors);
        
        // Handle environment errors
        for (const error of envValidation.errors) {
          const configError = createConfigError.environment(error.message, error.field);
          await this.errorHandler.handleError(configError);
        }
      }

      // Load configuration
      this.config = await this.loader.loadConfig();
      
      // Cache successful configuration
      this.errorHandler.saveToCache(this.config);
      
      this.isInitialized = true;
      console.info('[ConfigManager] Configuration initialized successfully');
      
    } catch (error) {
      console.error('[ConfigManager] Failed to initialize configuration:', error);
      
      const configError = createConfigError.loading(
        'Failed to initialize configuration',
        error instanceof Error ? error : undefined
      );
      
      const recovered = await this.errorHandler.handleError(configError);
      if (!recovered) {
        throw new Error('Configuration initialization failed and recovery was unsuccessful');
      }
      
      this.isInitialized = true;
    }
  }

  /**
   * Get configuration (initialize if needed)
   */
  async getConfig(): Promise<SiteConfig> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config) {
      throw new Error('Configuration not available');
    }

    return this.config;
  }

  /**
   * Get configuration synchronously (only if already initialized)
   */
  getConfigSync(): SiteConfig | null {
    return this.config;
  }

  /**
   * Reload configuration
   */
  async reloadConfig(): Promise<SiteConfig> {
    console.info('[ConfigManager] Reloading configuration...');
    
    try {
      this.config = await this.loader.reloadConfig();
      this.errorHandler.saveToCache(this.config);
      console.info('[ConfigManager] Configuration reloaded successfully');
      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Failed to reload configuration:', error);
      
      const configError = createConfigError.loading(
        'Failed to reload configuration',
        error instanceof Error ? error : undefined
      );
      
      await this.errorHandler.handleError(configError);
      
      // Return current config if reload fails
      if (this.config) {
        return this.config;
      }
      
      throw error;
    }
  }

  /**
   * Validate current configuration
   */
  validateConfig(): ConfigValidationResult {
    if (!this.config) {
      return {
        isValid: false,
        errors: [{ field: 'config', message: 'Configuration not loaded' }],
        warnings: []
      };
    }

    return this.loader.validateConfig(this.config);
  }

  /**
   * Check if configuration is valid
   */
  isValid(): boolean {
    return this.loader.isValid();
  }

  /**
   * Get configuration errors
   */
  getErrors(): Array<{ field: string; message: string; value?: unknown }> {
    return this.loader.getErrors();
  }

  /**
   * Get configuration warnings
   */
  getWarnings(): Array<{ field: string; message: string; value?: unknown }> {
    return this.loader.getWarnings();
  }

  /**
   * Get specific configuration section
   */
  async getSection<K extends keyof SiteConfig>(section: K): Promise<SiteConfig[K]> {
    const config = await this.getConfig();
    return config[section];
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(feature: string): Promise<boolean> {
    const config = await this.getConfig();
    
    switch (feature) {
      case 'analytics':
        return !!config.analytics.googleAnalyticsId;
      
      case 'monitoring':
        return config.monitoring?.enableStatusPage ?? false;
      
      case 'seo':
        return config.seo.enableSitemap && config.seo.enableRobotsTxt;
      
      case 'webVitals':
        return config.performance.enableWebVitals;
      
      case 'imageOptimization':
        return config.performance.enableImageOptimization;
      
      case 'codeSplitting':
        return config.performance.enableCodeSplitting;
      
      case 'cookieConsent':
        return config.analytics.enableCookieConsent;
      
      case 'multiLanguage':
        return config.site.supportedLanguages.length > 1;
      
      case 'wordpress':
        return !!config.wordpress.apiUrl;
      
      case 'ai':
        return !!config.ai.geminiApiKey;
      
      default:
        console.warn(`[ConfigManager] Unknown feature: ${feature}`);
        return false;
    }
  }

  /**
   * Get API configuration for external services
   */
  async getApiConfig(service: 'github' | 'gemini' | 'wordpress' | 'betterstack' | 'analytics') {
    const config = await this.getConfig();
    
    switch (service) {
      case 'github':
        return {
          token: config.github.accessToken,
          organization: config.github.organization,
          personalAccount: config.github.personalAccount,
          excludeRepositories: config.github.excludeRepositories,
          includeRepositories: config.github.includeRepositories
        };
      
      case 'gemini':
        return {
          apiKey: config.ai.geminiApiKey,
          prompts: config.ai.analysisPrompts,
          fallbackStrategy: config.ai.fallbackStrategy
        };
      
      case 'wordpress':
        return {
          apiUrl: config.wordpress.apiUrl,
          categories: config.wordpress.categories,
          multilingualSupport: config.wordpress.multilingualSupport
        };
      
      case 'betterstack':
        return {
          apiKey: config.monitoring?.betterStackApiKey,
          statusPageUrl: config.monitoring?.statusPageUrl,
          enabled: config.monitoring?.enableStatusPage ?? false
        };
      
      case 'analytics':
        return {
          googleAnalyticsId: config.analytics.googleAnalyticsId,
          enableCookieConsent: config.analytics.enableCookieConsent,
          trackingEvents: config.analytics.trackingEvents
        };
      
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    configValid: boolean;
    errorsCount: number;
    warningsCount: number;
    lastError?: string;
  } {
    const validation = this.validateConfig();
    const errorStats = this.errorHandler.getErrorStats();
    
    return {
      isHealthy: this.errorHandler.isSystemHealthy() && validation.isValid,
      configValid: validation.isValid,
      errorsCount: validation.errors.length,
      warningsCount: validation.warnings.length,
      lastError: errorStats.recent[0]?.message
    };
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigSummary(): {
    initialized: boolean;
    valid: boolean;
    features: Record<string, boolean>;
    errors: number;
    warnings: number;
  } {
    const validation = this.validateConfig();
    
    return {
      initialized: this.isInitialized,
      valid: validation.isValid,
      features: {
        analytics: !!this.config?.analytics.googleAnalyticsId,
        monitoring: this.config?.monitoring?.enableStatusPage ?? false,
        seo: this.config?.seo.enableSitemap ?? false,
        multiLanguage: (this.config?.site.supportedLanguages.length ?? 0) > 1,
        wordpress: !!this.config?.wordpress.apiUrl,
        ai: !!this.config?.ai.geminiApiKey
      },
      errors: validation.errors.length,
      warnings: validation.warnings.length
    };
  }

  /**
   * Reset configuration manager
   */
  reset(): void {
    this.config = null;
    this.isInitialized = false;
    this.errorHandler.clearErrorLog();
    console.info('[ConfigManager] Configuration manager reset');
  }
}

/**
 * Convenience functions for common operations
 */

// Global instance
let globalConfigManager: ConfigManager | null = null;

/**
 * Get global configuration manager instance
 */
export function getConfigManager(): ConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = ConfigManager.getInstance();
  }
  return globalConfigManager;
}

/**
 * Initialize configuration (convenience function)
 */
export async function initializeConfig(): Promise<void> {
  const manager = getConfigManager();
  await manager.initialize();
}

/**
 * Get configuration (convenience function)
 */
export async function getConfig(): Promise<SiteConfig> {
  const manager = getConfigManager();
  return manager.getConfig();
}

/**
 * Check if feature is enabled (convenience function)
 */
export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const manager = getConfigManager();
  return manager.isFeatureEnabled(feature);
}

/**
 * Get API configuration (convenience function)
 */
export async function getApiConfig(service: 'github' | 'gemini' | 'wordpress' | 'betterstack' | 'analytics') {
  const manager = getConfigManager();
  return manager.getApiConfig(service);
}

export default ConfigManager;