import type {
  Repository,
  BlogPost,
  DisplayProject,
  RepositoryAnalysis,
  Language,
  MultilingualContent,
  MultilingualArray,
  ProjectCategory,
  CacheMetadata,
  ErrorInfo,
} from '@/types'

// Data transformation utilities
export class DataTransformer {
  /**
   * Transform GitHub repository data to internal Repository format
   */
  static transformGitHubRepository(githubRepo: any): Repository {
    return {
      id: githubRepo.id.toString(),
      name: githubRepo.name,
      fullName: githubRepo.full_name,
      description: githubRepo.description,
      language: githubRepo.language,
      topics: githubRepo.topics || [],
      stars: githubRepo.stargazers_count || 0,
      forks: githubRepo.forks_count || 0,
      watchers: githubRepo.watchers_count || 0,
      size: githubRepo.size || 0,
      defaultBranch: githubRepo.default_branch || 'main',
      isPrivate: githubRepo.private || false,
      isFork: githubRepo.fork || false,
      isArchived: githubRepo.archived || false,
      lastUpdated: new Date(githubRepo.updated_at),
      createdAt: new Date(githubRepo.created_at),
      pushedAt: new Date(githubRepo.pushed_at),
      homepage: githubRepo.homepage || undefined,
      license: githubRepo.license
        ? {
            key: githubRepo.license.key,
            name: githubRepo.license.name,
            spdxId: githubRepo.license.spdx_id,
            url: githubRepo.license.url,
          }
        : undefined,
      owner: {
        login: githubRepo.owner.login,
        id: githubRepo.owner.id,
        type: githubRepo.owner.type,
        avatarUrl: githubRepo.owner.avatar_url,
        htmlUrl: githubRepo.owner.html_url,
      },
      urls: {
        html: githubRepo.html_url,
        git: githubRepo.git_url,
        ssh: githubRepo.ssh_url,
        clone: githubRepo.clone_url,
        api: githubRepo.url,
      },
    }
  }

  /**
   * Transform WordPress post data to internal BlogPost format
   */
  static transformWordPressPost(
    wpPost: any,
    author: any,
    categories: any[],
    tags: any[]
  ): BlogPost {
    return {
      id: wpPost.id.toString(),
      title: wpPost.title.rendered,
      slug: wpPost.slug,
      excerpt: wpPost.excerpt.rendered.replace(/<[^>]*>/g, ''), // Strip HTML
      content: wpPost.content.rendered,
      publishDate: new Date(wpPost.date),
      modifiedDate: new Date(wpPost.modified),
      author: {
        id: author.id,
        name: author.name,
        slug: author.slug,
        description: author.description,
        avatar: author.avatar_urls['96'],
        url: author.url,
        socialLinks: {
          website: author.url,
        },
      },
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parent: cat.parent,
        count: cat.count,
      })),
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        count: tag.count,
      })),
      language: this.detectLanguage(
        `${wpPost.title.rendered} ${wpPost.content.rendered}`
      ),
      status: wpPost.status as 'publish' | 'draft' | 'private',
      commentStatus: wpPost.comment_status as 'open' | 'closed',
      pingStatus: wpPost.ping_status as 'open' | 'closed',
      sticky: wpPost.sticky,
      format: wpPost.format as any,
      originalUrl: wpPost.link,
      wordCount: this.countWords(wpPost.content.rendered),
      readingTime: this.calculateReadingTime(wpPost.content.rendered),
      seo: {
        title: wpPost.title.rendered,
        description: wpPost.excerpt.rendered
          .replace(/<[^>]*>/g, '')
          .substring(0, 160),
      },
    }
  }

  /**
   * Detect language of text content
   */
  static detectLanguage(text: string): Language {
    // Simple language detection based on character patterns
    const chinesePattern = /[\u4e00-\u9fff]/
    const hasChineseChars = chinesePattern.test(text)

    if (hasChineseChars) {
      return 'zh'
    }
    return 'en'
  }

  /**
   * Count words in HTML content
   */
  static countWords(htmlContent: string): number {
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ')
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
    return words.length
  }

  /**
   * Calculate reading time in minutes
   */
  static calculateReadingTime(htmlContent: string): number {
    const wordCount = this.countWords(htmlContent)
    const wordsPerMinute = 200 // Average reading speed
    return Math.ceil(wordCount / wordsPerMinute)
  }

  /**
   * Transform Repository and RepositoryAnalysis to DisplayProject
   */
  static transformToDisplayProject(
    repo: Repository,
    analysis: RepositoryAnalysis
  ): DisplayProject {
    return {
      id: repo.id,
      name: repo.name,
      title: analysis.description,
      description: analysis.description,
      category: analysis.category,
      techStack: analysis.techStack,
      highlights: analysis.highlights,
      githubUrl: repo.urls.html,
      demoUrl: repo.homepage,
      images: [], // Will be populated by image processing
      stats: {
        stars: repo.stars,
        forks: repo.forks,
        commits: 0, // Will be populated by GitHub API
        contributors: 0, // Will be populated by GitHub API
        issues: 0, // Will be populated by GitHub API
        pullRequests: 0, // Will be populated by GitHub API
      },
      lastUpdated: repo.lastUpdated,
      featured: analysis.score >= 80,
      aiGenerated: true,
    }
  }
}

// Data validation and sanitization utilities
export class DataValidator {
  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate GitHub username format
   */
  static isValidGitHubUsername(username: string): boolean {
    const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
    return githubUsernameRegex.test(username)
  }

  /**
   * Validate project category
   */
  static isValidProjectCategory(category: string): category is ProjectCategory {
    const validCategories = [
      'web-app',
      'mobile-app',
      'open-source',
      'library',
      'automation',
      'other',
    ]
    return validCategories.includes(category)
  }

  /**
   * Validate multilingual content
   */
  static validateMultilingualContent(
    content: any
  ): content is MultilingualContent {
    return (
      typeof content === 'object' &&
      content !== null &&
      typeof content.zh === 'string' &&
      typeof content.en === 'string' &&
      content.zh.length > 0 &&
      content.en.length > 0
    )
  }

  /**
   * Validate multilingual array
   */
  static validateMultilingualArray(content: any): content is MultilingualArray {
    return (
      typeof content === 'object' &&
      content !== null &&
      Array.isArray(content.zh) &&
      Array.isArray(content.en) &&
      content.zh.length > 0 &&
      content.en.length > 0 &&
      content.zh.every((item: any) => typeof item === 'string') &&
      content.en.every((item: any) => typeof item === 'string')
    )
  }
}

// Data processing utilities
export class DataProcessor {
  /**
   * Merge multilingual content
   */
  static mergeMultilingualContent(
    base: MultilingualContent,
    override: Partial<MultilingualContent>
  ): MultilingualContent {
    return {
      zh: override.zh || base.zh,
      en: override.en || base.en,
    }
  }

  /**
   * Extract tech stack from repository data
   */
  static extractTechStack(repo: Repository): string[] {
    const techStack = new Set<string>()

    // Add primary language
    if (repo.language) {
      techStack.add(repo.language)
    }

    // Add topics as potential tech stack items
    repo.topics.forEach(topic => {
      // Filter out non-technical topics
      const technicalTopics = [
        'javascript',
        'typescript',
        'python',
        'java',
        'go',
        'rust',
        'cpp',
        'react',
        'vue',
        'angular',
        'svelte',
        'nextjs',
        'nuxtjs',
        'nodejs',
        'express',
        'fastapi',
        'django',
        'spring',
        'docker',
        'kubernetes',
        'aws',
        'gcp',
        'azure',
        'mongodb',
        'postgresql',
        'mysql',
        'redis',
        'graphql',
        'rest-api',
        'grpc',
      ]

      if (technicalTopics.includes(topic.toLowerCase())) {
        techStack.add(topic)
      }
    })

    return Array.from(techStack)
  }

  /**
   * Calculate project complexity score
   */
  static calculateComplexityScore(repo: Repository): number {
    let score = 0

    // Size factor (0-30 points)
    score += Math.min(repo.size / 1000, 30)

    // Language factor (0-20 points)
    const complexLanguages = ['rust', 'cpp', 'c', 'assembly', 'haskell']
    if (
      repo.language &&
      complexLanguages.includes(repo.language.toLowerCase())
    ) {
      score += 20
    } else if (repo.language) {
      score += 10
    }

    // Topics factor (0-20 points)
    const complexTopics = [
      'machine-learning',
      'ai',
      'blockchain',
      'cryptography',
      'compiler',
    ]
    const hasComplexTopics = repo.topics.some(topic =>
      complexTopics.some(complex => topic.toLowerCase().includes(complex))
    )
    if (hasComplexTopics) {
      score += 20
    }

    // Activity factor (0-30 points)
    const daysSinceUpdate =
      (Date.now() - repo.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate < 30) {
      score += 30
    } else if (daysSinceUpdate < 90) {
      score += 20
    } else if (daysSinceUpdate < 365) {
      score += 10
    }

    return Math.min(score, 100)
  }

  /**
   * Generate SEO-friendly slug
   */
  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) {
      return text
    }

    const truncated = text.substring(0, maxLength - suffix.length)
    const lastSpace = truncated.lastIndexOf(' ')

    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + suffix
    }

    return truncated + suffix
  }

  /**
   * Sort projects by relevance score
   */
  static sortProjectsByRelevance(projects: DisplayProject[]): DisplayProject[] {
    return projects.sort((a, b) => {
      // Featured projects first
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1

      // Then by stars
      if (a.stats.stars !== b.stats.stars) {
        return b.stats.stars - a.stats.stars
      }

      // Then by last updated
      return b.lastUpdated.getTime() - a.lastUpdated.getTime()
    })
  }

  /**
   * Group projects by category
   */
  static groupProjectsByCategory(
    projects: DisplayProject[]
  ): Record<ProjectCategory, DisplayProject[]> {
    const grouped = {} as Record<ProjectCategory, DisplayProject[]>

    // Initialize all categories
    const categories: ProjectCategory[] = [
      'web-app',
      'mobile-app',
      'open-source',
      'library',
      'automation',
      'other',
    ]

    categories.forEach(category => {
      grouped[category] = []
    })

    // Group projects
    projects.forEach(project => {
      grouped[project.category].push(project)
    })

    return grouped
  }
}

// Cache management utilities
export class CacheManager {
  /**
   * Generate cache key
   */
  static generateCacheKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`
  }

  /**
   * Check if cache is stale
   */
  static isCacheStale(metadata: CacheMetadata): boolean {
    const now = new Date()
    return now.getTime() > metadata.expiresAt.getTime()
  }

  /**
   * Create cache metadata
   */
  static createCacheMetadata(source: string, ttl: number): CacheMetadata {
    const now = new Date()
    return {
      lastUpdated: now,
      expiresAt: new Date(now.getTime() + ttl),
      version: '1.0.0',
      source,
    }
  }

  /**
   * Validate cache data integrity
   */
  static validateCacheData<T>(
    data: unknown,
    validator: (data: unknown) => T
  ): { valid: boolean; data?: T; error?: string } {
    try {
      const validatedData = validator(data)
      return { valid: true, data: validatedData }
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error ? error.message : 'Unknown validation error',
      }
    }
  }
}

// Error handling utilities
export class ErrorHandler {
  /**
   * Create standardized error info
   */
  static createErrorInfo(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ErrorInfo {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    }
  }

  /**
   * Handle API errors
   */
  static handleApiError(error: any): ErrorInfo {
    if (error.response) {
      // HTTP error response
      return this.createErrorInfo(
        `HTTP_${error.response.status}`,
        error.response.data?.message || error.message,
        {
          status: error.response.status,
          url: error.config?.url,
          method: error.config?.method,
        }
      )
    } else if (error.request) {
      // Network error
      return this.createErrorInfo('NETWORK_ERROR', 'Network request failed', {
        originalError: error.message,
      })
    } else {
      // Other error
      return this.createErrorInfo(
        'UNKNOWN_ERROR',
        error.message || 'An unknown error occurred',
        { originalError: error }
      )
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: ErrorInfo): boolean {
    const retryableCodes = [
      'HTTP_429', // Rate limit
      'HTTP_502', // Bad gateway
      'HTTP_503', // Service unavailable
      'HTTP_504', // Gateway timeout
      'NETWORK_ERROR',
    ]

    return retryableCodes.includes(error.code)
  }
}

// Utility functions for common operations
export const utils = {
  /**
   * Deep clone an object
   */
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  },

  /**
   * Debounce function
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  /**
   * Throttle function
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  /**
   * Retry function with exponential backoff
   */
  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxAttempts) {
          throw lastError
        }

        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  },

  /**
   * Format file size
   */
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  },

  /**
   * Format relative time
   */
  formatRelativeTime: (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return `${diffMinutes} minutes ago`
      }
      return `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return 'yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7)
      return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30)
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
    } else {
      const diffYears = Math.floor(diffDays / 365)
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
    }
  },
}
