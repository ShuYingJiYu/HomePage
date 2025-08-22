/**
 * GitHub Error Handler Utility
 * Provides centralized error handling for GitHub API operations
 */

import type { ErrorRecoveryStrategy } from '@/types/config'
import { GitHubApiError, GitHubRateLimitError } from '@/services/github-fetcher'

/**
 * Error context information
 */
export interface ErrorContext {
  operation: string
  repository?: string
  user?: string
  endpoint?: string
  attempt?: number
  maxAttempts?: number
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult {
  shouldRetry: boolean
  retryAfter?: number
  fallbackData?: any
  strategy: ErrorRecoveryStrategy
  message: string
}

/**
 * Logger interface
 */
export interface Logger {
  info(message: string, context?: object): void
  warn(message: string, context?: object): void
  error(message: string, error: Error, context?: object): void
  debug(message: string, context?: object): void
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error'

  constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private formatMessage(
    level: string,
    message: string,
    context?: object
  ): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  info(message: string, context?: object): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: object): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error: Error, context?: object): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  debug(message: string, context?: object): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }
}

/**
 * GitHub Error Handler Class
 */
export class GitHubErrorHandler {
  private logger: Logger
  private cache: Map<string, any> = new Map()

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger()
  }

  /**
   * Handle GitHub API errors with appropriate recovery strategies
   */
  handleError(
    error: Error,
    context: ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): ErrorHandlingResult {
    this.logger.error(
      `GitHub API error in ${context.operation}`,
      error,
      context
    )

    if (error instanceof GitHubRateLimitError) {
      return this.handleRateLimitError(error, context, strategy)
    }

    if (error instanceof GitHubApiError) {
      return this.handleApiError(error, context, strategy)
    }

    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return this.handleTimeoutError(error, context, strategy)
    }

    if (
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ECONNREFUSED')
    ) {
      return this.handleNetworkError(error, context, strategy)
    }

    return this.handleGenericError(error, context, strategy)
  }

  /**
   * Handle rate limit errors
   */
  private handleRateLimitError(
    error: GitHubRateLimitError,
    context: ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): ErrorHandlingResult {
    const resetTime = error.resetTime.getTime() - Date.now()

    switch (strategy) {
      case 'retry-backoff':
        return {
          shouldRetry: true,
          retryAfter: Math.min(resetTime, 300000), // Max 5 minutes
          strategy,
          message: `Rate limit exceeded. Retrying after ${Math.ceil(resetTime / 1000)}s`,
        }

      case 'use-cache': {
        const cachedData = this.getCachedData(context)
        return {
          shouldRetry: false,
          fallbackData: cachedData,
          strategy,
          message: 'Rate limit exceeded. Using cached data',
        }
      }

      case 'skip-feature':
        return {
          shouldRetry: false,
          strategy,
          message: 'Rate limit exceeded. Skipping feature',
        }

      default:
        return {
          shouldRetry: false,
          strategy,
          message: 'Rate limit exceeded. Operation failed',
        }
    }
  }

  /**
   * Handle GitHub API errors
   */
  private handleApiError(
    error: GitHubApiError,
    context: ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): ErrorHandlingResult {
    // Handle specific HTTP status codes
    switch (error.status) {
      case 401:
      case 403:
        return {
          shouldRetry: false,
          strategy: 'fail-build',
          message: `Authentication failed: ${error.message}`,
        }

      case 404:
        if (strategy === 'skip-feature') {
          return {
            shouldRetry: false,
            strategy,
            message: `Resource not found: ${error.message}. Skipping.`,
          }
        }
        break

      case 422:
        return {
          shouldRetry: false,
          strategy: 'skip-feature',
          message: `Validation error: ${error.message}`,
        }

      case 500:
      case 502:
      case 503:
      case 504:
        if (
          strategy === 'retry-backoff' &&
          (context.attempt || 0) < (context.maxAttempts || 3)
        ) {
          const backoffTime = 1000 * Math.pow(2, context.attempt || 0)
          return {
            shouldRetry: true,
            retryAfter: backoffTime,
            strategy,
            message: `Server error (${error.status}). Retrying in ${backoffTime / 1000}s`,
          }
        }
        break
    }

    // Default handling based on strategy
    return this.handleWithStrategy(error, context, strategy)
  }

  /**
   * Handle timeout errors
   */
  private handleTimeoutError(
    error: Error,
    context: ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): ErrorHandlingResult {
    if (
      strategy === 'retry-backoff' &&
      (context.attempt || 0) < (context.maxAttempts || 3)
    ) {
      const backoffTime = 2000 * Math.pow(2, context.attempt || 0)
      return {
        shouldRetry: true,
        retryAfter: backoffTime,
        strategy,
        message: `Request timeout. Retrying in ${backoffTime / 1000}s`,
      }
    }

    return this.handleWithStrategy(error, context, strategy)
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(
    error: Error,
    context: ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): ErrorHandlingResult {
    if (
      strategy === 'retry-backoff' &&
      (context.attempt || 0) < (context.maxAttempts || 3)
    ) {
      const backoffTime = 5000 * Math.pow(2, context.attempt || 0)
      return {
        shouldRetry: true,
        retryAfter: backoffTime,
        strategy,
        message: `Network error. Retrying in ${backoffTime / 1000}s`,
      }
    }

    return this.handleWithStrategy(error, context, strategy)
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(
    error: Error,
    context: ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): ErrorHandlingResult {
    return this.handleWithStrategy(error, context, strategy)
  }

  /**
   * Apply error handling strategy
   */
  private handleWithStrategy(
    error: Error,
    context: ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): ErrorHandlingResult {
    switch (strategy) {
      case 'use-cache': {
        const cachedData = this.getCachedData(context)
        return {
          shouldRetry: false,
          fallbackData: cachedData,
          strategy,
          message: `Error occurred. Using cached data: ${error.message}`,
        }
      }

      case 'skip-feature':
        return {
          shouldRetry: false,
          strategy,
          message: `Error occurred. Skipping feature: ${error.message}`,
        }

      case 'use-fallback':
        return {
          shouldRetry: false,
          fallbackData: this.getFallbackData(context),
          strategy,
          message: `Error occurred. Using fallback data: ${error.message}`,
        }

      case 'fail-build':
        throw error

      default:
        return {
          shouldRetry: false,
          strategy,
          message: `Error occurred: ${error.message}`,
        }
    }
  }

  /**
   * Get cached data for the given context
   */
  private getCachedData(context: ErrorContext): any {
    const cacheKey = this.getCacheKey(context)
    return this.cache.get(cacheKey)
  }

  /**
   * Set cached data for the given context
   */
  setCachedData(context: ErrorContext, data: any): void {
    const cacheKey = this.getCacheKey(context)
    this.cache.set(cacheKey, data)
  }

  /**
   * Get fallback data for the given context
   */
  private getFallbackData(context: ErrorContext): any {
    // Return empty/default data structures based on operation
    switch (context.operation) {
      case 'fetchRepositories':
        return []
      case 'fetchMembers':
        return []
      case 'fetchOrganization':
        return null
      case 'fetchContributions':
        return {
          commits: 0,
          pullRequests: 0,
          issues: 0,
          reviews: 0,
          repositories: 0,
          totalContributions: 0,
          contributionCalendar: [],
          topLanguages: [],
          streak: { current: 0, longest: 0 },
        }
      default:
        return null
    }
  }

  /**
   * Generate cache key from context
   */
  private getCacheKey(context: ErrorContext): string {
    const parts = [context.operation]

    if (context.repository) parts.push(context.repository)
    if (context.user) parts.push(context.user)

    return parts.join(':')
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

/**
 * Default error handler instance
 */
export const githubErrorHandler = new GitHubErrorHandler()

/**
 * Utility function to create a configured error handler
 */
export function createGitHubErrorHandler(logger?: Logger): GitHubErrorHandler {
  return new GitHubErrorHandler(logger)
}
