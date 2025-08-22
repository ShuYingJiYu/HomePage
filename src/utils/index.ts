// Core utilities exports
export * from './validation'
export * from './data-tools'
export * from './type-guards'
export * from './constants'

// Configuration management exports
export { ConfigLoader, validateEnvironment } from './config-loader'
export {
  ConfigErrorHandler,
  ConfigError,
  createConfigError,
} from './config-error-handler'
export {
  ConfigManager,
  getConfigManager,
  initializeConfig,
  isFeatureEnabled,
  getApiConfig,
} from './config-manager'

// Re-export commonly used utilities
export {
  DataTransformer,
  DataValidator,
  DataProcessor,
  CacheManager,
  ErrorHandler,
  utils,
} from './data-tools'

export {
  validateRepository,
  validateMember,
  validateBlogPost,
  validateSiteConfig,
  validateDisplayProject,
  validateRepositoryAnalysis,
  safeValidateRepository,
  safeValidateMember,
  safeValidateBlogPost,
  safeValidateSiteConfig,
  safeValidateDisplayProject,
  safeValidateRepositoryAnalysis,
  isValidLanguage,
  isValidProjectCategory,
  isValidServiceCategory,
} from './validation'

export {
  isLanguage,
  isProjectCategory,
  isServiceCategory,
  isSocialPlatform,
  isMultilingualContent,
  isMultilingualArray,
  isRepository,
  isMember,
  isBlogPost,
  isDisplayProject,
  isRepositoryAnalysis,
  isErrorInfo,
  isCacheMetadata,
  isValidUrl,
  isValidEmail,
  isValidGitHubUsername,
  isValidSlug,
  isValidHexColor,
  isValidISODateString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidPercentage,
  isValidConfidenceScore,
} from './type-guards'

export {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  PROJECT_CATEGORIES,
  SERVICE_CATEGORIES,
  SOCIAL_PLATFORMS,
  LANGUAGE_COLORS,
  TECH_STACK_CATEGORIES,
  TECH_STACK_MAPPING,
  API_ENDPOINTS,
  CACHE_CONFIG,
  PERFORMANCE_THRESHOLDS,
  SEO_LIMITS,
  ERROR_CODES,
  RETRY_CONFIG,
  FILE_PATHS,
  IMAGE_CONFIG,
  ANALYTICS_EVENTS,
  DEFAULTS,
} from './constants'
