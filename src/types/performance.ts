// Performance Monitoring and Analytics types

export interface PerformanceMonitor {
  trackWebVitals(): void
  trackCustomMetrics(name: string, value: number): void
  trackUserInteractions(): void
  trackResourceLoading(): void
  generatePerformanceReport(): PerformanceReport
  optimizeImageLoading(): void
}

export interface PerformanceReport {
  coreWebVitals: CoreWebVitals
  customMetrics: CustomMetrics
  resourceMetrics: ResourceMetrics
  userExperience: UserExperienceMetrics
  recommendations: PerformanceRecommendation[]
  performanceScore: number
  generatedAt: Date
  deviceType: 'desktop' | 'mobile' | 'tablet'
  connection: ConnectionType
}

export interface CoreWebVitals {
  lcp: number // Largest Contentful Paint (ms)
  fid: number // First Input Delay (ms)
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint (ms)
  ttfb: number // Time to First Byte (ms)
  inp?: number // Interaction to Next Paint (ms)
  scores: {
    lcp: 'good' | 'needs-improvement' | 'poor'
    fid: 'good' | 'needs-improvement' | 'poor'
    cls: 'good' | 'needs-improvement' | 'poor'
  }
}

export interface CustomMetrics {
  dataLoadTime: number
  aiAnalysisTime: number
  buildTime: number
  imageLoadTime: number
  bundleSize: number
  cacheHitRate: number
  apiResponseTime: number
  renderTime: number
  interactiveTime: number
}

export interface ResourceMetrics {
  totalSize: number
  compressedSize: number
  resources: ResourceDetail[]
  loadingWaterfall: WaterfallEntry[]
  criticalPath: CriticalPathEntry[]
}

export interface ResourceDetail {
  url: string
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'document' | 'other'
  size: number
  compressedSize: number
  loadTime: number
  cached: boolean
  critical: boolean
  lazy: boolean
}

export interface WaterfallEntry {
  url: string
  startTime: number
  endTime: number
  duration: number
  type: string
  blocked: boolean
  fromCache: boolean
}

export interface CriticalPathEntry {
  resource: string
  dependency: string[]
  priority: 'high' | 'medium' | 'low'
  blocking: boolean
}

export interface UserExperienceMetrics {
  bounceRate: number
  sessionDuration: number
  pageViews: number
  userSatisfaction: number
  errorRate: number
  conversionRate: number
  interactionMetrics: InteractionMetrics
  accessibilityScore: number
}

export interface InteractionMetrics {
  clickThroughRate: number
  scrollDepth: number
  timeOnPage: number
  formCompletionRate: number
  searchUsage: number
  navigationPatterns: NavigationPattern[]
}

export interface NavigationPattern {
  path: string[]
  frequency: number
  averageTime: number
  exitRate: number
}

export interface PerformanceRecommendation {
  category:
    | 'loading'
    | 'interactivity'
    | 'visual-stability'
    | 'accessibility'
    | 'seo'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
  priority: number
  implementation: string
  expectedImprovement: string
  resources?: string[]
}

export type ConnectionType =
  | 'slow-2g'
  | '2g'
  | '3g'
  | '4g'
  | '5g'
  | 'wifi'
  | 'ethernet'

// Image Optimization
export interface ImageOptimizer {
  generateResponsiveImages(src: string): ResponsiveImageSet
  convertToWebP(src: string): string
  convertToAVIF(src: string): string
  generatePlaceholder(src: string): string
  lazyLoadImages(): void
  optimizeImageDelivery(): void
}

export interface ResponsiveImageSet {
  webp: ResponsiveImageSizes
  avif: ResponsiveImageSizes
  jpeg: ResponsiveImageSizes
  fallback: string
  placeholder: string
  aspectRatio: number
}

export interface ResponsiveImageSizes {
  '320w': string
  '640w': string
  '1024w': string
  '1920w': string
  '2560w'?: string
}

export interface ImageOptimizationConfig {
  formats: ('webp' | 'avif' | 'jpeg' | 'png')[]
  quality: number
  progressive: boolean
  sizes: number[]
  placeholder: 'blur' | 'empty' | 'color'
  lazyLoading: boolean
  criticalImages: string[]
}

// Bundle Analysis
export interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  brotliSize: number
  chunks: BundleChunk[]
  dependencies: DependencyAnalysis[]
  duplicates: DuplicateModule[]
  unusedCode: UnusedCodeEntry[]
  recommendations: BundleRecommendation[]
}

export interface BundleChunk {
  name: string
  size: number
  gzippedSize: number
  modules: string[]
  isEntry: boolean
  isAsync: boolean
  parents: string[]
  children: string[]
}

export interface DependencyAnalysis {
  name: string
  version: string
  size: number
  usage: 'direct' | 'transitive'
  treeshakeable: boolean
  alternatives?: string[]
  impact: 'high' | 'medium' | 'low'
}

export interface DuplicateModule {
  name: string
  versions: string[]
  totalSize: number
  chunks: string[]
  resolution: string
}

export interface UnusedCodeEntry {
  file: string
  unusedBytes: number
  totalBytes: number
  percentage: number
  functions: string[]
}

export interface BundleRecommendation {
  type:
    | 'code-splitting'
    | 'tree-shaking'
    | 'dependency-optimization'
    | 'compression'
  description: string
  potentialSavings: number
  implementation: string
  priority: 'high' | 'medium' | 'low'
}

// Cache Management
export interface CacheStrategy {
  browser: BrowserCacheConfig
  cdn: CDNCacheConfig
  application: ApplicationCacheConfig
  serviceWorker?: ServiceWorkerConfig
}

export interface BrowserCacheConfig {
  staticAssets: string // e.g., '1 year'
  dataFiles: string // e.g., '1 hour'
  htmlFiles: string // e.g., '5 minutes'
  apiResponses: string // e.g., '10 minutes'
}

export interface CDNCacheConfig {
  staticAssets: string
  dataFiles: string
  htmlFiles: string
  purgeStrategy: 'manual' | 'automatic' | 'webhook'
  edgeLocations: string[]
}

export interface ApplicationCacheConfig {
  githubData: string // e.g., '6 hours'
  blogPosts: string // e.g., '1 hour'
  aiAnalysis: string // e.g., '24 hours'
  images: string // e.g., '7 days'
  maxSize: number // in MB
  strategy: 'lru' | 'lfu' | 'ttl'
}

export interface ServiceWorkerConfig {
  enabled: boolean
  cacheFirst: string[]
  networkFirst: string[]
  staleWhileRevalidate: string[]
  cacheOnly: string[]
  networkOnly: string[]
  precache: string[]
}

// Performance Budget
export interface PerformanceBudget {
  metrics: BudgetMetrics
  resources: ResourceBudget
  timing: TimingBudget
  alerts: BudgetAlert[]
}

export interface BudgetMetrics {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
  performanceScore: number
}

export interface ResourceBudget {
  totalSize: number
  javascript: number
  css: number
  images: number
  fonts: number
  other: number
  requests: number
}

export interface TimingBudget {
  domContentLoaded: number
  loadComplete: number
  firstInteractive: number
  timeToInteractive: number
}

export interface BudgetAlert {
  metric: string
  threshold: number
  current: number
  severity: 'warning' | 'error'
  message: string
  suggestions: string[]
}

// A/B Testing for Performance
export interface PerformanceExperiment {
  id: string
  name: string
  description: string
  variants: ExperimentVariant[]
  metrics: string[]
  startDate: Date
  endDate?: Date
  status: 'draft' | 'running' | 'completed' | 'paused'
  results?: ExperimentResults
}

export interface ExperimentVariant {
  id: string
  name: string
  description: string
  traffic: number // percentage
  config: PerformanceConfig
}

export interface PerformanceConfig {
  imageOptimization: boolean
  codeSplitting: boolean
  preloading: string[]
  lazyLoading: boolean
  compression: 'gzip' | 'brotli' | 'none'
  caching: CacheStrategy
}

export interface ExperimentResults {
  winner?: string
  confidence: number
  improvement: Record<string, number>
  significance: boolean
  sampleSize: number
  duration: number
  metrics: Record<string, VariantMetrics[]>
}

export interface VariantMetrics {
  variant: string
  value: number
  standardError: number
  sampleSize: number
}
