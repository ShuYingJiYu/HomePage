/**
 * Configuration error handling utilities
 * Provides error handling, recovery strategies, and logging for configuration issues
 */

import type {
  ErrorRecoveryStrategy
} from '../types/config';

/**
 * Configuration error types
 */
export enum ConfigErrorType {
  VALIDATION_ERROR = 'validation_error',
  ENVIRONMENT_ERROR = 'environment_error',
  LOADING_ERROR = 'loading_error',
  API_KEY_ERROR = 'api_key_error',
  NETWORK_ERROR = 'network_error',
  PERMISSION_ERROR = 'permission_error'
}

/**
 * Configuration error class
 */
export class ConfigError extends Error {
  public readonly type: ConfigErrorType;
  public readonly field?: string;
  public readonly recoveryStrategy: ErrorRecoveryStrategy;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ConfigErrorType,
    recoveryStrategy: ErrorRecoveryStrategy = 'fail-build',
    field?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ConfigError';
    this.type = type;
    this.field = field;
    this.recoveryStrategy = recoveryStrategy;
    this.originalError = originalError;
  }
}

/**
 * Error recovery handler
 */
export class ConfigErrorHandler {
  private static instance: ConfigErrorHandler;
  private errorLog: ConfigError[] = [];
  private recoveryAttempts: Map<string, number> = new Map();

  static getInstance(): ConfigErrorHandler {
    if (!ConfigErrorHandler.instance) {
      ConfigErrorHandler.instance = new ConfigErrorHandler();
    }
    return ConfigErrorHandler.instance;
  }

  /**
   * Handle configuration error with appropriate recovery strategy
   */
  async handleError(error: ConfigError): Promise<boolean> {
    this.logError(error);

    const attemptKey = `${error.type}-${error.field || 'global'}`;
    const attempts = this.recoveryAttempts.get(attemptKey) || 0;
    
    // Prevent infinite retry loops
    if (attempts >= 3) {
      console.error(`[ConfigErrorHandler] Max retry attempts reached for ${attemptKey}`);
      return false;
    }

    this.recoveryAttempts.set(attemptKey, attempts + 1);

    switch (error.recoveryStrategy) {
      case 'use-cache':
        return this.useCacheStrategy(error);
      
      case 'skip-feature':
        return this.skipFeatureStrategy(error);
      
      case 'use-fallback':
        return this.useFallbackStrategy(error);
      
      case 'retry-backoff':
        return this.retryWithBackoffStrategy(error, attempts);
      
      case 'fail-build':
        return this.failBuildStrategy(error);
      
      default:
        console.warn(`[ConfigErrorHandler] Unknown recovery strategy: ${error.recoveryStrategy}`);
        return false;
    }
  }

  /**
   * Use cached configuration strategy
   */
  private async useCacheStrategy(error: ConfigError): Promise<boolean> {
    console.warn(`[ConfigErrorHandler] Using cache strategy for ${error.type}: ${error.message}`);
    
    try {
      // Try to load from localStorage or sessionStorage
      const cachedConfig = this.loadFromCache();
      if (cachedConfig) {
        console.info('[ConfigErrorHandler] Successfully loaded configuration from cache');
        return true;
      }
    } catch (cacheError) {
      console.error('[ConfigErrorHandler] Failed to load from cache:', cacheError);
    }

    // If cache fails, try fallback
    return this.useFallbackStrategy(error);
  }

  /**
   * Skip feature strategy
   */
  private async skipFeatureStrategy(error: ConfigError): Promise<boolean> {
    console.warn(`[ConfigErrorHandler] Skipping feature due to ${error.type}: ${error.message}`);
    
    // Log the skipped feature for monitoring
    this.logSkippedFeature(error);
    
    return true; // Continue without the feature
  }

  /**
   * Use fallback configuration strategy
   */
  private async useFallbackStrategy(error: ConfigError): Promise<boolean> {
    console.warn(`[ConfigErrorHandler] Using fallback strategy for ${error.type}: ${error.message}`);
    
    try {
      const fallbackConfig = this.getFallbackForField(error.field);
      if (fallbackConfig !== null) {
        console.info(`[ConfigErrorHandler] Applied fallback for field: ${error.field}`);
        return true;
      }
    } catch (fallbackError) {
      console.error('[ConfigErrorHandler] Fallback strategy failed:', fallbackError);
    }

    return false;
  }

  /**
   * Retry with exponential backoff strategy
   */
  private async retryWithBackoffStrategy(error: ConfigError, attempts: number): Promise<boolean> {
    const delay = Math.min(1000 * Math.pow(2, attempts), 10000); // Max 10 seconds
    
    console.warn(`[ConfigErrorHandler] Retrying in ${delay}ms (attempt ${attempts + 1}) for ${error.type}: ${error.message}`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // The actual retry logic should be implemented by the caller
    // This just indicates that a retry should be attempted
    return true;
  }

  /**
   * Fail build strategy
   */
  private async failBuildStrategy(error: ConfigError): Promise<boolean> {
    console.error(`[ConfigErrorHandler] Build failed due to ${error.type}: ${error.message}`);
    
    // Log critical error for monitoring
    this.logCriticalError(error);
    
    // In development, we might want to continue with warnings
    if (import.meta.env.DEV) {
      console.warn('[ConfigErrorHandler] Development mode: continuing with errors');
      return this.useFallbackStrategy(error);
    }
    
    return false;
  }

  /**
   * Load configuration from cache
   */
  private loadFromCache(): any | null {
    try {
      const cached = localStorage.getItem('shuying-config-cache');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid (24 hours)
        if (data.timestamp && (now - data.timestamp) < 24 * 60 * 60 * 1000) {
          return data.config;
        }
      }
    } catch (error) {
      console.error('[ConfigErrorHandler] Cache loading error:', error);
    }
    
    return null;
  }

  /**
   * Save configuration to cache
   */
  saveToCache(config: any): void {
    try {
      const cacheData = {
        config,
        timestamp: Date.now()
      };
      localStorage.setItem('shuying-config-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('[ConfigErrorHandler] Cache saving error:', error);
    }
  }

  /**
   * Get fallback value for specific field
   */
  private getFallbackForField(field?: string): any {
    const fallbacks: Record<string, any> = {
      'github.accessToken': '',
      'ai.geminiApiKey': '',
      'wordpress.apiUrl': '',
      'analytics.googleAnalyticsId': undefined,
      'monitoring.betterStackApiKey': undefined,
      'site.url': 'https://localhost:3000',
      'site.defaultLanguage': 'zh',
      'site.supportedLanguages': ['zh', 'en']
    };

    return field ? fallbacks[field] ?? null : null;
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: ConfigError): void {
    this.errorLog.push(error);
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console with appropriate level
    const logLevel = this.getLogLevel(error.type);
    console[logLevel](`[ConfigError] ${error.type}: ${error.message}`, {
      field: error.field,
      recoveryStrategy: error.recoveryStrategy,
      originalError: error.originalError?.message
    });
  }

  /**
   * Log skipped feature for monitoring
   */
  private logSkippedFeature(error: ConfigError): void {
    console.info(`[ConfigErrorHandler] Feature skipped: ${error.field || error.type}`, {
      reason: error.message,
      type: error.type
    });
  }

  /**
   * Log critical error for monitoring
   */
  private logCriticalError(error: ConfigError): void {
    console.error(`[ConfigErrorHandler] CRITICAL: ${error.message}`, {
      type: error.type,
      field: error.field,
      stack: error.stack,
      originalError: error.originalError
    });

    // In production, you might want to send this to an error tracking service
    if (import.meta.env.PROD) {
      this.sendToErrorTracking(error);
    }
  }

  /**
   * Send error to external error tracking service
   */
  private sendToErrorTracking(_error: ConfigError): void {
    // Placeholder for error tracking integration
    // You could integrate with services like Sentry, LogRocket, etc.
    console.info('[ConfigErrorHandler] Error tracking not configured');
  }

  /**
   * Get appropriate log level for error type
   */
  private getLogLevel(errorType: ConfigErrorType): 'error' | 'warn' | 'info' {
    switch (errorType) {
      case ConfigErrorType.API_KEY_ERROR:
      case ConfigErrorType.PERMISSION_ERROR:
        return 'error';
      
      case ConfigErrorType.VALIDATION_ERROR:
      case ConfigErrorType.ENVIRONMENT_ERROR:
        return 'warn';
      
      case ConfigErrorType.NETWORK_ERROR:
      case ConfigErrorType.LOADING_ERROR:
        return 'info';
      
      default:
        return 'warn';
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<ConfigErrorType, number>;
    recent: ConfigError[];
  } {
    const byType = {} as Record<ConfigErrorType, number>;
    
    // Initialize counters
    Object.values(ConfigErrorType).forEach(type => {
      byType[type] = 0;
    });

    // Count errors by type
    this.errorLog.forEach(error => {
      byType[error.type]++;
    });

    // Get recent errors (last 10)
    const recent = this.errorLog.slice(-10);

    return {
      total: this.errorLog.length,
      byType,
      recent
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.recoveryAttempts.clear();
  }

  /**
   * Check if system is healthy (no critical errors in last hour)
   */
  isSystemHealthy(): boolean {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const recentCriticalErrors = this.errorLog.filter(error => {
      return error.recoveryStrategy === 'fail-build' && 
             (error as any).timestamp > oneHourAgo;
    });

    return recentCriticalErrors.length === 0;
  }
}

/**
 * Utility functions for creating specific error types
 */
export const createConfigError = {
  validation: (message: string, field?: string): ConfigError =>
    new ConfigError(message, ConfigErrorType.VALIDATION_ERROR, 'use-fallback', field),
  
  environment: (message: string, field?: string): ConfigError =>
    new ConfigError(message, ConfigErrorType.ENVIRONMENT_ERROR, 'use-fallback', field),
  
  apiKey: (message: string, field?: string): ConfigError =>
    new ConfigError(message, ConfigErrorType.API_KEY_ERROR, 'fail-build', field),
  
  network: (message: string, originalError?: Error): ConfigError =>
    new ConfigError(message, ConfigErrorType.NETWORK_ERROR, 'retry-backoff', undefined, originalError),
  
  loading: (message: string, originalError?: Error): ConfigError =>
    new ConfigError(message, ConfigErrorType.LOADING_ERROR, 'use-cache', undefined, originalError)
};

export default ConfigErrorHandler;