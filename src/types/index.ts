// Core types
export * from './common'
export * from './repository'
export * from './member'
export * from './blog'
export * from './ai'
export * from './seo'

// Config types (with renamed exports to avoid conflicts)
export type { 
  SiteConfig,
  SiteInfo,
  ContactInfo,
  GitHubConfig,
  WordPressConfig,
  AIConfig,
  AnalyticsConfig,
  SocialConfig,
  MonitoringConfig,
  SEOConfig,
  SitePerformanceConfig as ConfigPerformanceConfig,
  DeploymentConfig,
  EnvironmentVariables,
  BuildConfig
} from './config'

// Social types (with renamed exports to avoid conflicts)
export type {
  SocialShareManager,
  ShareableContent,
  SocialShareContent,
  SocialPlatform,
  SocialPlatformConfig,
  SocialShareParameter,
  PlatformCustomization,
  ImageRequirements,
  SocialAnalytics,
  SocialMetrics,
  SocialPost,
  PostMetrics,
  SocialMedia,
  EngagementMetrics,
  TimeSeriesData,
  HashtagMetrics,
  AudienceMetrics,
  Demographics,
  AgeGroup,
  GenderDistribution,
  EducationLevel,
  IncomeLevel,
  Interest,
  Location,
  DeviceMetrics,
  LanguageMetrics,
  TrendMetrics,
  SeasonalityData,
  PredictionData,
  BenchmarkData,
  CompetitorMetrics,
  SocialMediaManager,
  ScheduledPost,
  PostSettings,
  PlatformSpecificSettings,
  PostResult,
  CrossPostContent,
  CrossPostResult,
  SocialDateRange
} from './social'

// Performance types (with renamed exports to avoid conflicts)
export type {
  PerformanceMonitor,
  PerformanceReport,
  CoreWebVitals,
  CustomMetrics,
  ResourceMetrics,
  ResourceDetail,
  WaterfallEntry,
  CriticalPathEntry,
  UserExperienceMetrics,
  InteractionMetrics,
  NavigationPattern,
  PerformanceRecommendation,
  ConnectionType,
  ImageOptimizer,
  ResponsiveImageSet,
  ResponsiveImageSizes,
  ImageOptimizationConfig,
  BundleAnalysis,
  BundleChunk,
  DependencyAnalysis,
  DuplicateModule,
  UnusedCodeEntry,
  BundleRecommendation,
  CacheStrategy,
  BrowserCacheConfig,
  CDNCacheConfig,
  ApplicationCacheConfig,
  ServiceWorkerConfig,
  PerformanceBudget,
  BudgetMetrics,
  ResourceBudget,
  TimingBudget,
  BudgetAlert,
  PerformanceExperiment,
  ExperimentVariant,
  PerformanceConfig,
  ExperimentResults,
  VariantMetrics
} from './performance'