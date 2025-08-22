/**
 * WordPress Data Manager
 * Orchestrates WordPress blog data fetching, caching, and processing
 */

import type {
  BlogPost,
  BlogAuthor,
  BlogCategory,
  BlogTag,
  BlogStats,
} from '@/types/blog'
import type { Language } from '@/types/common'
import { WordPressFetcher, WordPressApiError } from './wordpress-fetcher'
import { wordpressConfig } from '../../config/wordpress.config'

/**
 * WordPress data processing result
 */
export interface WordPressDataResult {
  posts: BlogPost[]
  authors: BlogAuthor[]
  categories: BlogCategory[]
  tags: BlogTag[]
  stats: BlogStats
  lastUpdated: Date
  errors: string[]
  warnings: string[]
}

/**
 * Data fetching options
 */
export interface FetchOptions {
  includeStats?: boolean
  includeAuthors?: boolean
  includeCategories?: boolean
  includeTags?: boolean
  maxPosts?: number
  categoryFilter?: string[]
  languageFilter?: Language[]
  skipCache?: boolean
  timeout?: number
}

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T
  timestamp: Date
  expiry: Date
}

/**
 * WordPress Data Manager Class
 */
export class WordPressDataManager {
  private fetcher: WordPressFetcher
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly cacheExpiry = {
    posts: 1 * 60 * 60 * 1000, // 1 hour
    authors: 24 * 60 * 60 * 1000, // 24 hours
    categories: 24 * 60 * 60 * 1000, // 24 hours
    tags: 24 * 60 * 60 * 1000, // 24 hours
    stats: 6 * 60 * 60 * 1000, // 6 hours
  }

  constructor(fetcher?: WordPressFetcher) {
    this.fetcher = fetcher || new WordPressFetcher()
  }

  /**
   * Fetch all WordPress data
   */
  async fetchAllData(options: FetchOptions = {}): Promise<WordPressDataResult> {
    const startTime = Date.now()
    console.log('🚀 Starting WordPress blog data fetch process...')

    const result: WordPressDataResult = {
      posts: [],
      authors: [],
      categories: [],
      tags: [],
      stats: {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        categories: 0,
        tags: 0,
        authors: 0,
        averageWordsPerPost: 0,
        totalWords: 0,
        postsPerMonth: [],
        topCategories: [],
        topTags: [],
        lastUpdated: new Date(),
      },
      lastUpdated: new Date(),
      errors: [],
      warnings: [],
    }

    try {
      // Test connection first
      const isConnected = await this.fetcher.testConnection()
      if (!isConnected) {
        const message = 'Failed to connect to WordPress API'
        console.warn(`⚠️  ${message}`)
        result.warnings.push(message)
        
        // Try to use cached data
        const cachedResult = this.getCachedResult()
        if (cachedResult) {
          console.log('🔄 Using cached WordPress data')
          return cachedResult
        }
        
        return result
      }

      // Fetch blog posts
      console.log('📝 Fetching blog posts...')
      result.posts = await this.fetchPostsWithRetry(options)

      if (options.maxPosts) {
        result.posts = result.posts.slice(0, options.maxPosts)
      }

      // Apply filters
      if (options.categoryFilter && options.categoryFilter.length > 0) {
        result.posts = result.posts.filter(post =>
          post.categories.some(cat =>
            options.categoryFilter!.includes(cat.slug)
          )
        )
      }

      if (options.languageFilter && options.languageFilter.length > 0) {
        result.posts = result.posts.filter(post =>
          options.languageFilter!.includes(post.language)
        )
      }

      console.log(`✅ Fetched ${result.posts.length} blog posts`)

      // Fetch authors if requested
      if (options.includeAuthors) {
        console.log('👤 Fetching blog authors...')
        result.authors = await this.fetchAuthorsWithRetry()
        console.log(`✅ Fetched ${result.authors.length} authors`)
      }

      // Fetch categories if requested
      if (options.includeCategories) {
        console.log('📂 Fetching blog categories...')
        result.categories = await this.fetchCategoriesWithRetry()
        console.log(`✅ Fetched ${result.categories.length} categories`)
      }

      // Fetch tags if requested
      if (options.includeTags) {
        console.log('🏷️  Fetching blog tags...')
        result.tags = await this.fetchTagsWithRetry()
        console.log(`✅ Fetched ${result.tags.length} tags`)
      }

      // Generate statistics if requested
      if (options.includeStats) {
        console.log('📊 Generating blog statistics...')
        result.stats = await this.generateStatsWithRetry()
        console.log('✅ Generated blog statistics')
      }

      // Cache the result
      this.cacheResult(result)

      const duration = (Date.now() - startTime) / 1000
      console.log(`🎉 WordPress data fetch completed in ${duration.toFixed(2)}s`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ WordPress data fetch failed:', error)
      result.errors.push(errorMessage)

      if (error instanceof WordPressApiError) {
        result.warnings.push(
          `WordPress API error (${error.status}): ${error.message}`
        )
      }

      // Try to use cached data on error
      if (wordpressConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cachedResult = this.getCachedResult()
        if (cachedResult) {
          console.log('🔄 Using cached WordPress data due to error')
          return cachedResult
        }
      }
    }

    return result
  }

  /**
   * Fetch posts with retry logic
   */
  private async fetchPostsWithRetry(options: FetchOptions): Promise<BlogPost[]> {
    const cacheKey = 'posts'
    
    // Check cache first
    if (!options.skipCache) {
      const cached = this.getFromCache<BlogPost[]>(cacheKey)
      if (cached) {
        console.log('🔄 Using cached blog posts')
        return cached
      }
    }

    try {
      let posts: BlogPost[]

      if (wordpressConfig.multilingualSupport) {
        posts = await this.fetcher.fetchMultilingualPosts()
      } else {
        posts = await this.fetcher.fetchPosts(options.maxPosts)
      }

      // Cache the result
      this.setCache(cacheKey, posts, this.cacheExpiry.posts)
      return posts
    } catch (error) {
      console.warn('⚠️  Blog posts fetch failed, attempting fallback strategies...')

      if (wordpressConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache<BlogPost[]>(cacheKey)
        if (cached) {
          console.log('🔄 Using cached blog posts as fallback')
          return cached
        }
      }

      throw error
    }
  }

  /**
   * Fetch authors with retry logic
   */
  private async fetchAuthorsWithRetry(): Promise<BlogAuthor[]> {
    const cacheKey = 'authors'
    
    // Check cache first
    const cached = this.getFromCache<BlogAuthor[]>(cacheKey)
    if (cached) {
      console.log('🔄 Using cached authors')
      return cached
    }

    try {
      const authors = await this.fetcher.fetchAuthors()
      this.setCache(cacheKey, authors, this.cacheExpiry.authors)
      return authors
    } catch (error) {
      console.warn('⚠️  Authors fetch failed:', error)

      if (wordpressConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache<BlogAuthor[]>(cacheKey)
        if (cached) {
          console.log('🔄 Using cached authors as fallback')
          return cached
        }
      }

      return []
    }
  }

  /**
   * Fetch categories with retry logic
   */
  private async fetchCategoriesWithRetry(): Promise<BlogCategory[]> {
    const cacheKey = 'categories'
    
    // Check cache first
    const cached = this.getFromCache<BlogCategory[]>(cacheKey)
    if (cached) {
      console.log('🔄 Using cached categories')
      return cached
    }

    try {
      const categories = await this.fetcher.fetchCategories()
      this.setCache(cacheKey, categories, this.cacheExpiry.categories)
      return categories
    } catch (error) {
      console.warn('⚠️  Categories fetch failed:', error)

      if (wordpressConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache<BlogCategory[]>(cacheKey)
        if (cached) {
          console.log('🔄 Using cached categories as fallback')
          return cached
        }
      }

      return []
    }
  }

  /**
   * Fetch tags with retry logic
   */
  private async fetchTagsWithRetry(): Promise<BlogTag[]> {
    const cacheKey = 'tags'
    
    // Check cache first
    const cached = this.getFromCache<BlogTag[]>(cacheKey)
    if (cached) {
      console.log('🔄 Using cached tags')
      return cached
    }

    try {
      const tags = await this.fetcher.fetchTags()
      this.setCache(cacheKey, tags, this.cacheExpiry.tags)
      return tags
    } catch (error) {
      console.warn('⚠️  Tags fetch failed:', error)

      if (wordpressConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache<BlogTag[]>(cacheKey)
        if (cached) {
          console.log('🔄 Using cached tags as fallback')
          return cached
        }
      }

      return []
    }
  }

  /**
   * Generate statistics with retry logic
   */
  private async generateStatsWithRetry(): Promise<BlogStats> {
    const cacheKey = 'stats'
    
    // Check cache first
    const cached = this.getFromCache<BlogStats>(cacheKey)
    if (cached) {
      console.log('🔄 Using cached blog statistics')
      return cached
    }

    try {
      const stats = await this.fetcher.generateBlogStats()
      this.setCache(cacheKey, stats, this.cacheExpiry.stats)
      return stats
    } catch (error) {
      console.warn('⚠️  Statistics generation failed:', error)

      if (wordpressConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache<BlogStats>(cacheKey)
        if (cached) {
          console.log('🔄 Using cached statistics as fallback')
          return cached
        }
      }

      // Return empty stats as fallback
      return {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        categories: 0,
        tags: 0,
        authors: 0,
        averageWordsPerPost: 0,
        totalWords: 0,
        postsPerMonth: [],
        topCategories: [],
        topTags: [],
        lastUpdated: new Date(),
      }
    }
  }

  /**
   * Fetch posts by specific categories
   */
  async fetchPostsByCategories(categoryNames: string[]): Promise<BlogPost[]> {
    console.log(`📂 Fetching posts for categories: ${categoryNames.join(', ')}`)

    try {
      const allPosts: BlogPost[] = []

      for (const categoryName of categoryNames) {
        const posts = await this.fetcher.fetchPostsByCategory(categoryName)
        allPosts.push(...posts)
      }

      // Remove duplicates based on post ID
      const uniquePosts = allPosts.filter(
        (post, index, self) => index === self.findIndex(p => p.id === post.id)
      )

      console.log(`✅ Found ${uniquePosts.length} unique posts across categories`)
      return uniquePosts
    } catch (error) {
      console.error('❌ Failed to fetch posts by categories:', error)
      return []
    }
  }

  /**
   * Get posts grouped by language
   */
  getPostsByLanguage(posts: BlogPost[]): Record<Language, BlogPost[]> {
    return posts.reduce((acc, post) => {
      if (!acc[post.language]) {
        acc[post.language] = []
      }
      acc[post.language].push(post)
      return acc
    }, {} as Record<Language, BlogPost[]>)
  }

  /**
   * Get featured posts (based on priority tags or sticky status)
   */
  getFeaturedPosts(posts: BlogPost[], limit: number = 5): BlogPost[] {
    const priorityTags = ['featured', '精选', 'popular', '热门']
    
    // First, get sticky posts
    const stickyPosts = posts.filter(post => post.sticky)
    
    // Then, get posts with priority tags
    const priorityPosts = posts.filter(post =>
      post.tags.some(tag =>
        priorityTags.some(priority =>
          tag.name.toLowerCase().includes(priority.toLowerCase())
        )
      )
    )

    // Combine and deduplicate
    const featuredPosts = [...stickyPosts, ...priorityPosts].filter(
      (post, index, self) => index === self.findIndex(p => p.id === post.id)
    )

    // Sort by publish date (newest first) and limit
    return featuredPosts
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
      .slice(0, limit)
  }

  /**
   * Search posts by title, content, or tags
   */
  searchPosts(posts: BlogPost[], query: string): BlogPost[] {
    const searchTerm = query.toLowerCase()
    
    return posts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(searchTerm)
      const contentMatch = post.content.toLowerCase().includes(searchTerm)
      const excerptMatch = post.excerpt.toLowerCase().includes(searchTerm)
      const tagMatch = post.tags.some(tag =>
        tag.name.toLowerCase().includes(searchTerm)
      )
      const categoryMatch = post.categories.some(cat =>
        cat.name.toLowerCase().includes(searchTerm)
      )

      return titleMatch || contentMatch || excerptMatch || tagMatch || categoryMatch
    })
  }

  /**
   * Cache management methods
   */
  private setCache<T>(key: string, data: T, expiryMs: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      expiry: new Date(Date.now() + expiryMs),
    }
    this.cache.set(key, entry)
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (new Date() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private cacheResult(result: WordPressDataResult): void {
    this.setCache('full-result', result, this.cacheExpiry.posts)
  }

  private getCachedResult(): WordPressDataResult | null {
    return this.getFromCache<WordPressDataResult>('full-result')
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️  WordPress data cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; totalSize: number; oldestEntry?: Date } {
    const entries = this.cache.size
    let totalSize = 0
    let oldestEntry: Date | undefined

    for (const [, entry] of this.cache) {
      totalSize += JSON.stringify(entry.data).length
      if (!oldestEntry || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp
      }
    }

    return { entries, totalSize, oldestEntry }
  }
}

/**
 * Default WordPress data manager instance
 */
export const wordpressDataManager = new WordPressDataManager()

/**
 * Utility function to create a configured WordPress data manager
 */
export function createWordPressDataManager(
  fetcher?: WordPressFetcher
): WordPressDataManager {
  return new WordPressDataManager(fetcher)
}