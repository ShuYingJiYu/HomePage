import type {
  Repository,
  Member,
  BlogPost,
  DisplayProject,
  RepositoryAnalysis,
  Language,
  ProjectCategory,
  ServiceCategory,
  MultilingualContent,
  MultilingualArray,
  SocialPlatform,
  ErrorInfo,
  CacheMetadata
} from '@/types'

// Language type guards
export const isLanguage = (value: unknown): value is Language => {
  return typeof value === 'string' && (value === 'zh' || value === 'en')
}

// Project category type guards
export const isProjectCategory = (value: unknown): value is ProjectCategory => {
  const validCategories = [
    'web-app',
    'mobile-app', 
    'open-source',
    'library',
    'automation',
    'other'
  ] as const
  return typeof value === 'string' && (validCategories as readonly string[]).includes(value)
}

// Service category type guards
export const isServiceCategory = (value: unknown): value is ServiceCategory => {
  const validCategories = [
    'frontend',
    'backend',
    'mobile',
    'devops',
    'consulting'
  ] as const
  return typeof value === 'string' && (validCategories as readonly string[]).includes(value)
}

// Social platform type guards
export const isSocialPlatform = (value: unknown): value is SocialPlatform => {
  const validPlatforms = [
    'twitter',
    'linkedin',
    'weibo',
    'wechat',
    'facebook',
    'telegram'
  ] as const
  return typeof value === 'string' && (validPlatforms as readonly string[]).includes(value)
}

// Multilingual content type guards
export const isMultilingualContent = (value: unknown): value is MultilingualContent => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'zh' in value &&
    'en' in value &&
    typeof (value as any).zh === 'string' &&
    typeof (value as any).en === 'string' &&
    (value as any).zh.length > 0 &&
    (value as any).en.length > 0
  )
}

export const isMultilingualArray = (value: unknown): value is MultilingualArray => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'zh' in value &&
    'en' in value &&
    Array.isArray((value as any).zh) &&
    Array.isArray((value as any).en) &&
    (value as any).zh.length > 0 &&
    (value as any).en.length > 0 &&
    (value as any).zh.every((item: unknown) => typeof item === 'string') &&
    (value as any).en.every((item: unknown) => typeof item === 'string')
  )
}

// Repository type guards
export const isRepository = (value: unknown): value is Repository => {
  if (typeof value !== 'object' || value === null) return false
  
  const repo = value as any
  return (
    typeof repo.id === 'string' &&
    typeof repo.name === 'string' &&
    typeof repo.fullName === 'string' &&
    (typeof repo.description === 'string' || repo.description === null) &&
    (typeof repo.language === 'string' || repo.language === null) &&
    Array.isArray(repo.topics) &&
    typeof repo.stars === 'number' &&
    typeof repo.forks === 'number' &&
    typeof repo.watchers === 'number' &&
    typeof repo.size === 'number' &&
    typeof repo.defaultBranch === 'string' &&
    typeof repo.isPrivate === 'boolean' &&
    typeof repo.isFork === 'boolean' &&
    typeof repo.isArchived === 'boolean' &&
    repo.lastUpdated instanceof Date &&
    repo.createdAt instanceof Date &&
    repo.pushedAt instanceof Date &&
    typeof repo.owner === 'object' &&
    typeof repo.urls === 'object'
  )
}

// Member type guards
export const isMember = (value: unknown): value is Member => {
  if (typeof value !== 'object' || value === null) return false
  
  const member = value as any
  return (
    typeof member.id === 'string' &&
    typeof member.name === 'string' &&
    typeof member.username === 'string' &&
    isMultilingualContent(member.role) &&
    typeof member.avatar === 'string' &&
    typeof member.githubUsername === 'string' &&
    isMultilingualContent(member.bio) &&
    Array.isArray(member.skills) &&
    typeof member.contributions === 'object' &&
    typeof member.socialLinks === 'object' &&
    member.joinDate instanceof Date &&
    typeof member.isActive === 'boolean' &&
    typeof member.featured === 'boolean'
  )
}

// Blog post type guards
export const isBlogPost = (value: unknown): value is BlogPost => {
  if (typeof value !== 'object' || value === null) return false
  
  const post = value as any
  return (
    typeof post.id === 'string' &&
    typeof post.title === 'string' &&
    typeof post.slug === 'string' &&
    typeof post.excerpt === 'string' &&
    typeof post.content === 'string' &&
    post.publishDate instanceof Date &&
    post.modifiedDate instanceof Date &&
    typeof post.author === 'object' &&
    Array.isArray(post.categories) &&
    Array.isArray(post.tags) &&
    isLanguage(post.language) &&
    typeof post.status === 'string' &&
    typeof post.originalUrl === 'string' &&
    typeof post.wordCount === 'number' &&
    typeof post.readingTime === 'number'
  )
}

// Display project type guards
export const isDisplayProject = (value: unknown): value is DisplayProject => {
  if (typeof value !== 'object' || value === null) return false
  
  const project = value as any
  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    isMultilingualContent(project.title) &&
    isMultilingualContent(project.description) &&
    isProjectCategory(project.category) &&
    Array.isArray(project.techStack) &&
    isMultilingualArray(project.highlights) &&
    typeof project.githubUrl === 'string' &&
    Array.isArray(project.images) &&
    typeof project.stats === 'object' &&
    project.lastUpdated instanceof Date &&
    typeof project.featured === 'boolean' &&
    typeof project.aiGenerated === 'boolean'
  )
}

// Repository analysis type guards
export const isRepositoryAnalysis = (value: unknown): value is RepositoryAnalysis => {
  if (typeof value !== 'object' || value === null) return false
  
  const analysis = value as any
  return (
    typeof analysis.repositoryId === 'string' &&
    typeof analysis.score === 'number' &&
    analysis.score >= 0 &&
    analysis.score <= 100 &&
    isProjectCategory(analysis.category) &&
    Array.isArray(analysis.techStack) &&
    isMultilingualArray(analysis.highlights) &&
    isMultilingualContent(analysis.description) &&
    typeof analysis.shouldDisplay === 'boolean' &&
    typeof analysis.reasoning === 'string' &&
    typeof analysis.confidence === 'number' &&
    analysis.confidence >= 0 &&
    analysis.confidence <= 1 &&
    isMultilingualArray(analysis.seoKeywords) &&
    typeof analysis.socialShareContent === 'object' &&
    analysis.generatedAt instanceof Date &&
    typeof analysis.aiModel === 'string' &&
    typeof analysis.processingTime === 'number'
  )
}

// Error info type guards
export const isErrorInfo = (value: unknown): value is ErrorInfo => {
  if (typeof value !== 'object' || value === null) return false
  
  const error = value as any
  return (
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    error.timestamp instanceof Date
  )
}

// Cache metadata type guards
export const isCacheMetadata = (value: unknown): value is CacheMetadata => {
  if (typeof value !== 'object' || value === null) return false
  
  const metadata = value as any
  return (
    metadata.lastUpdated instanceof Date &&
    metadata.expiresAt instanceof Date &&
    typeof metadata.version === 'string' &&
    typeof metadata.source === 'string'
  )
}

// Array type guards
export const isRepositoryArray = (value: unknown): value is Repository[] => {
  return Array.isArray(value) && value.every(isRepository)
}

export const isMemberArray = (value: unknown): value is Member[] => {
  return Array.isArray(value) && value.every(isMember)
}

export const isBlogPostArray = (value: unknown): value is BlogPost[] => {
  return Array.isArray(value) && value.every(isBlogPost)
}

export const isDisplayProjectArray = (value: unknown): value is DisplayProject[] => {
  return Array.isArray(value) && value.every(isDisplayProject)
}

export const isRepositoryAnalysisArray = (value: unknown): value is RepositoryAnalysis[] => {
  return Array.isArray(value) && value.every(isRepositoryAnalysis)
}

// Utility type guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value)
}

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime())
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value)
}

export const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(isString)
}

export const isNumberArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every(isNumber)
}

// URL validation
export const isValidUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// Email validation
export const isValidEmail = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

// GitHub username validation
export const isValidGitHubUsername = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  
  const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
  return githubUsernameRegex.test(value)
}

// Slug validation
export const isValidSlug = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(value)
}

// Color validation (hex color)
export const isValidHexColor = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexColorRegex.test(value)
}

// ISO date string validation
export const isValidISODateString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  
  const date = new Date(value)
  return !isNaN(date.getTime()) && value === date.toISOString()
}

// Positive number validation
export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value > 0
}

// Non-negative number validation
export const isNonNegativeNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}

// Percentage validation (0-100)
export const isValidPercentage = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100
}

// Confidence score validation (0-1)
export const isValidConfidenceScore = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 1
}

// Generic type guard creator
export const createArrayTypeGuard = <T>(
  itemGuard: (value: unknown) => value is T
) => {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(itemGuard)
  }
}

// Optional type guard creator
export const createOptionalTypeGuard = <T>(
  guard: (value: unknown) => value is T
) => {
  return (value: unknown): value is T | undefined => {
    return value === undefined || guard(value)
  }
}

// Nullable type guard creator
export const createNullableTypeGuard = <T>(
  guard: (value: unknown) => value is T
) => {
  return (value: unknown): value is T | null => {
    return value === null || guard(value)
  }
}