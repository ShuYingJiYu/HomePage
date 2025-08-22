import { ProjectCategory, MultilingualContent, MultilingualArray, Language } from './common'
import { Repository, DisplayProject } from './repository'

// AI Analysis related types
export interface AIAnalyzer {
  analyzeRepository(repo: Repository): Promise<RepositoryAnalysis>
  generateProjectDescription(repo: Repository, language: Language): Promise<string>
  categorizeProjects(repos: Repository[]): Promise<ProjectCategory[]>
  evaluateProjectValue(repo: Repository): Promise<ProjectScore>
  generateMultilingualContent(repo: Repository): Promise<MultilingualContent>
  intelligentProjectFiltering(repos: Repository[]): Promise<Repository[]>
}

export interface RepositoryAnalysis {
  repositoryId: string
  score: number // 0-100
  category: ProjectCategory
  techStack: string[]
  highlights: MultilingualArray
  description: MultilingualContent
  shouldDisplay: boolean
  reasoning: string
  confidence: number // 0-1
  seoKeywords: MultilingualArray
  socialShareContent: {
    zh: SocialContent
    en: SocialContent
  }
  generatedAt: Date
  aiModel: string
  processingTime: number
}

export interface SocialContent {
  title: string
  description: string
  hashtags: string[]
  summary: string
}

export interface ProjectScore {
  completeness: number // 0-100
  technicalComplexity: number // 0-100
  documentationQuality: number // 0-100
  activityLevel: number // 0-100
  communityEngagement: number // 0-100
  overallScore: number // 0-100
  factors: ScoreFactor[]
}

export interface ScoreFactor {
  name: string
  weight: number
  score: number
  reasoning: string
}

// AI Content Generation
export interface ContentGenerator {
  generateTitle(repo: Repository, language: Language): Promise<string>
  generateDescription(repo: Repository, language: Language): Promise<string>
  generateHighlights(repo: Repository, language: Language): Promise<string[]>
  generateSEOContent(repo: Repository, language: Language): Promise<SEOContent>
  generateSocialContent(repo: Repository, language: Language): Promise<SocialContent>
  translateContent(content: string, fromLang: Language, toLang: Language): Promise<string>
}

export interface SEOContent {
  title: string
  description: string
  keywords: string[]
  canonicalUrl?: string
  ogTitle: string
  ogDescription: string
  twitterTitle: string
  twitterDescription: string
}

// AI Prompts and Configuration
export interface AIPromptConfig {
  projectEvaluation: PromptTemplate
  descriptionGeneration: PromptTemplate
  categoryClassification: PromptTemplate
  multilingualGeneration: PromptTemplate
  seoOptimization: PromptTemplate
  socialMediaOptimization: PromptTemplate
}

export interface PromptTemplate {
  system: string
  user: string
  examples?: PromptExample[]
  parameters?: PromptParameter[]
}

export interface PromptExample {
  input: string
  output: string
  explanation?: string
}

export interface PromptParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array'
  required: boolean
  description: string
  defaultValue?: unknown
}

// AI Response Types
export interface AIResponse<T> {
  data: T
  success: boolean
  error?: AIError
  metadata: AIResponseMetadata
}

export interface AIError {
  code: string
  message: string
  type: 'rate_limit' | 'quota_exceeded' | 'invalid_request' | 'server_error' | 'network_error'
  retryAfter?: number
  details?: Record<string, unknown>
}

export interface AIResponseMetadata {
  model: string
  tokensUsed: number
  processingTime: number
  requestId: string
  timestamp: Date
  cost?: number
}

// Content Review System
export interface ContentReviewSystem {
  generateReviewReport(analysis: RepositoryAnalysis[]): ReviewReport
  processReviewDecisions(decisions: ReviewDecision[]): ProcessedContent
  saveReviewHistory(review: ReviewRecord): void
  getReviewHistory(): ReviewRecord[]
}

export interface ReviewReport {
  suggestedProjects: ProjectSuggestion[]
  aiConfidenceScores: Record<string, number>
  contentQualityMetrics: QualityMetrics
  recommendedActions: ReviewAction[]
  generatedAt: Date
  totalProjects: number
  approvedProjects: number
  rejectedProjects: number
}

export interface ProjectSuggestion {
  project: DisplayProject
  aiReasoning: string
  confidenceScore: number
  suggestedCategory: ProjectCategory
  potentialIssues: string[]
  recommendedAction: 'include' | 'exclude' | 'review'
  alternativeDescriptions?: MultilingualContent[]
}

export interface QualityMetrics {
  averageScore: number
  scoreDistribution: ScoreDistribution
  categoryDistribution: CategoryDistribution
  languageQuality: LanguageQuality
  technicalAccuracy: number
  contentCompleteness: number
}

export interface ScoreDistribution {
  excellent: number // 90-100
  good: number // 70-89
  fair: number // 50-69
  poor: number // 0-49
}

export interface CategoryDistribution {
  [ProjectCategory.WEB_APPLICATION]: number
  [ProjectCategory.MOBILE_APPLICATION]: number
  [ProjectCategory.OPEN_SOURCE_TOOL]: number
  [ProjectCategory.LIBRARY_FRAMEWORK]: number
  [ProjectCategory.AUTOMATION_SCRIPT]: number
  [ProjectCategory.OTHER]: number
}

export interface LanguageQuality {
  zh: {
    grammar: number
    clarity: number
    completeness: number
  }
  en: {
    grammar: number
    clarity: number
    completeness: number
  }
}

export interface ReviewAction {
  type: 'approve' | 'reject' | 'modify' | 'review_manually'
  projectId: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime?: number
}

export interface ReviewDecision {
  projectId: string
  action: 'approve' | 'reject' | 'modify'
  modifications?: {
    title?: MultilingualContent
    description?: MultilingualContent
    category?: ProjectCategory
    highlights?: MultilingualArray
    shouldDisplay?: boolean
  }
  reviewerNotes?: string
  timestamp: Date
  reviewer: string
}

export interface ProcessedContent {
  approvedProjects: DisplayProject[]
  rejectedProjects: string[]
  modifiedProjects: DisplayProject[]
  statistics: {
    totalProcessed: number
    approved: number
    rejected: number
    modified: number
  }
  processingTime: number
}

export interface ReviewRecord {
  id: string
  timestamp: Date
  reviewer: string
  projectsReviewed: number
  decisionsCount: {
    approved: number
    rejected: number
    modified: number
  }
  aiAccuracyScore: number
  averageReviewTime: number
  notes: string
}

// Fallback Strategies
export interface FallbackStrategy {
  type: 'cache' | 'manual' | 'skip' | 'default'
  cacheMaxAge?: number
  manualContent?: ManualContent
  defaultContent?: DefaultContent
}

export interface ManualContent {
  [projectId: string]: {
    title: MultilingualContent
    description: MultilingualContent
    category: ProjectCategory
    shouldDisplay: boolean
    lastUpdated: Date
    reviewer: string
  }
}

export interface DefaultContent {
  title: MultilingualContent
  description: MultilingualContent
  category: ProjectCategory
  highlights: MultilingualArray
}