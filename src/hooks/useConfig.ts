/**
 * React hook for configuration management
 * Provides easy access to configuration in React components
 */

import { useState, useEffect, useCallback } from 'react'
import type { SiteConfig, ConfigValidationResult } from '@/types/config'
import { getConfigManager } from '@/utils/config-manager'

/**
 * Configuration hook state
 */
interface ConfigState {
  config: SiteConfig | null
  isLoading: boolean
  isInitialized: boolean
  error: Error | null
  validation: ConfigValidationResult | null
}

/**
 * Configuration hook return type
 */
interface UseConfigReturn extends ConfigState {
  reloadConfig: () => Promise<void>
  isFeatureEnabled: (feature: string) => boolean
  getApiConfig: (
    service: 'github' | 'gemini' | 'wordpress' | 'betterstack' | 'analytics'
  ) => Promise<any>
  getHealthStatus: () => {
    isHealthy: boolean
    configValid: boolean
    errorsCount: number
    warningsCount: number
    lastError?: string
  }
}

/**
 * React hook for configuration management
 */
export function useConfig(): UseConfigReturn {
  const [state, setState] = useState<ConfigState>({
    config: null,
    isLoading: true,
    isInitialized: false,
    error: null,
    validation: null,
  })

  const configManager = getConfigManager()

  /**
   * Initialize configuration
   */
  const initializeConfig = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      await configManager.initialize()
      const config = await configManager.getConfig()
      const validation = configManager.validateConfig()

      setState({
        config,
        isLoading: false,
        isInitialized: true,
        error: null,
        validation,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error('Configuration initialization failed'),
      }))
    }
  }, [configManager])

  /**
   * Reload configuration
   */
  const reloadConfig = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const config = await configManager.reloadConfig()
      const validation = configManager.validateConfig()

      setState(prev => ({
        ...prev,
        config,
        isLoading: false,
        error: null,
        validation,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error('Configuration reload failed'),
      }))
    }
  }, [configManager])

  /**
   * Check if feature is enabled
   */
  const isFeatureEnabled = useCallback(
    (feature: string): boolean => {
      if (!state.config) return false

      switch (feature) {
        case 'analytics':
          return !!state.config.analytics.googleAnalyticsId

        case 'monitoring':
          return state.config.monitoring?.enableStatusPage ?? false

        case 'seo':
          return (
            state.config.seo.enableSitemap && state.config.seo.enableRobotsTxt
          )

        case 'webVitals':
          return state.config.performance.enableWebVitals

        case 'imageOptimization':
          return state.config.performance.enableImageOptimization

        case 'codeSplitting':
          return state.config.performance.enableCodeSplitting

        case 'cookieConsent':
          return state.config.analytics.enableCookieConsent

        case 'multiLanguage':
          return state.config.site.supportedLanguages.length > 1

        case 'wordpress':
          return !!state.config.wordpress.apiUrl

        case 'ai':
          return !!state.config.ai.geminiApiKey

        default:
          return false
      }
    },
    [state.config]
  )

  /**
   * Get API configuration
   */
  const getApiConfig = useCallback(
    async (
      service: 'github' | 'gemini' | 'wordpress' | 'betterstack' | 'analytics'
    ) => {
      return configManager.getApiConfig(service)
    },
    [configManager]
  )

  /**
   * Get health status
   */
  const getHealthStatus = useCallback(() => {
    return configManager.getHealthStatus()
  }, [configManager])

  // Initialize on mount
  useEffect(() => {
    initializeConfig()
  }, [initializeConfig])

  return {
    ...state,
    reloadConfig,
    isFeatureEnabled,
    getApiConfig,
    getHealthStatus,
  }
}

/**
 * Hook for specific configuration section
 */
export function useConfigSection<K extends keyof SiteConfig>(
  section: K
): {
  data: SiteConfig[K] | null
  isLoading: boolean
  error: Error | null
} {
  const { config, isLoading, error } = useConfig()

  return {
    data: config ? config[section] : null,
    isLoading,
    error,
  }
}

/**
 * Hook for feature availability
 */
export function useFeature(feature: string): {
  isEnabled: boolean
  isLoading: boolean
  error: Error | null
} {
  const { isFeatureEnabled, isLoading, error } = useConfig()

  return {
    isEnabled: isFeatureEnabled(feature),
    isLoading,
    error,
  }
}

/**
 * Hook for API configuration
 */
export function useApiConfig(
  service: 'github' | 'gemini' | 'wordpress' | 'betterstack' | 'analytics'
) {
  const [apiConfig, setApiConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { getApiConfig, isInitialized } = useConfig()

  useEffect(() => {
    if (!isInitialized) return

    const loadApiConfig = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const config = await getApiConfig(service)
        setApiConfig(config)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to load API config')
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadApiConfig()
  }, [service, getApiConfig, isInitialized])

  return { apiConfig, isLoading, error }
}

export default useConfig
