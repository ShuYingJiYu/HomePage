/**
 * WordPress Blog Data Fetcher Service
 * Handles all WordPress REST API interactions for blog posts and content
 */

import type {
  BlogPost,
  BlogAuthor,
  BlogCategory,
  BlogTag,
  BlogImage,
  BlogStats,
  WordPressPost,
  WordPressCategory,
  WordPressTag,
  WordPressAuthor,
  WordPressMedia,
} from '@/types/blog'
import type { Language } from '@/types/common'
import type { WordPressConfig } from '@/types/config'
import {
  wordpressConfig,
  wordpressEndpoints,
  wordpressRequestConfig,
  contentFilters,
  languageDetection,
  contentTransformation,
} from '@/config/wordpress.config'

/**
 * WordPress API Error types
 */
export class WordPressApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'WordPressApiError'
  }
}

export class WordPressConnectionError extends WordPressApiError {
  constructor(message: string) {
    super(message, 0)
    this.name = 'WordPressConnectionError'
  }
}

/**
 * Request options for WordPress API calls
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  timeout?: number
  retries?: number
  params?: Record<string, string | number | boolean>
}

/**
 * WordPress Data Fetcher Class
 */
export class WordPressFetcher {
  private config: WordPressConfig
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(config?: Partial<WordPressConfig>) {
    this.config = { ...wordpressConfig, ...config }
    this.baseUrl = this.config.apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.defaultHeaders = {
      ...wordpressRequestConfig.headers,
    }

    if (!this.config.apiUrl) {
      console.warn(
        '⚠️  WordPress API URL not provided. Blog data fetching will be skipped.'
      )
    }
  }

  /**
   * Test connection to WordPress API
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.apiUrl) {
      return false
    }

    try {
      const response = await this.makeRequest('/posts', {
        params: { per_page: 1 },
        timeout: 5000,
        retries: 1,
      })
      return Array.isArray(response)
    } catch (error) {
      console.warn('⚠️  WordPress API connection test failed:', error)
      return false
    }
  }

  /**
   * Make authenticated request to WordPress API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    if (!this.config.apiUrl) {
      throw new WordPressConnectionError('WordPress API URL not configured')
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const maxRetries = options.retries ?? wordpressRequestConfig.retry.attempts
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController()
        const timeoutId = options.timeout 
          ? setTimeout(() => controller.abort(), options.timeout)
          : setTimeout(() => controller.abort(), wordpressRequestConfig.timeout)

        const response = await fetch(url.toString(), {
          method: options.method || 'GET',
          headers: {
            ...this.defaultHeaders,
            ...options.headers,
          },
          body: options.body,
          signal: controller.signal,
        })

        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        if (!response.ok) {
          // Handle different types of errors
          if (response.status === 404) {
            throw new WordPressApiError(
              `Resource not found: ${endpoint}`,
              response.status
            )
          }

          if (response.status >= 500) {
            throw new WordPressApiError(
              `WordPress API server error: ${response.status}`,
              response.status
            )
          }

          const errorData = await response.json().catch(() => ({}))
          throw new WordPressApiError(
            errorData.message || `WordPress API error: ${response.status}`,
            response.status,
            errorData
          )
        }

        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          return await response.json()
        } else {
          return await response.text() as T
        }
      } catch (error) {
        attempt++

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.warn(`🌐 Network error on attempt ${attempt}/${maxRetries}:`, error.message)
        }

        // Handle timeout errors
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`⏱️  Request timeout on attempt ${attempt}/${maxRetries}`)
        }

        if (attempt > maxRetries) {
          console.error(
            `❌ WordPress API request failed after ${maxRetries} retries:`,
            error
          )
          throw error
        }

        // Exponential backoff with jitter
        const baseBackoff = wordpressRequestConfig.retry.delay * Math.pow(2, attempt)
        const jitter = Math.random() * 1000
        const backoffTime = Math.min(baseBackoff + jitter, 30000) // Max 30 seconds
        
        console.warn(
          `⏳ Request failed, retrying in ${Math.ceil(backoffTime / 1000)}s (attempt ${attempt}/${maxRetries})`
        )
        await this.sleep(backoffTime)
      }
    }

    throw new Error('Max retries exceeded')
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Detect language of content
   */
  private detectLanguage(title: string, content: string, excerpt: string): Language {
    const text = `${title} ${content} ${excerpt}`.toLowerCase()

    // Check for Chinese characters
    const chineseMatches = languageDetection.chinesePatterns.some(pattern => 
      pattern.test(text)
    )

    if (chineseMatches) {
      return 'zh'
    }

    // Check for English indicators
    const englishMatches = languageDetection.englishPatterns.some(pattern => 
      pattern.test(text)
    )

    if (englishMatches) {
      return 'en'
    }

    return languageDetection.defaultLanguage
  }

  /**
   * Clean and process HTML content
   */
  private processContent(content: string, isExcerpt: boolean = false): string {
    if (!content) return ''

    let processed = content

    // Remove unwanted HTML tags
    contentTransformation.stripTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis')
      processed = processed.replace(regex, '')
    })

    // Clean up whitespace and line breaks
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()

    // Truncate excerpt if needed
    if (isExcerpt && processed.length > contentFilters.maxExcerptLength) {
      processed = processed.substring(0, contentFilters.maxExcerptLength) + '...'
    }

    return processed
  }

  /**
   * Calculate reading time based on word count
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200 // Average reading speed
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  /**
   * Transform WordPress post response to internal BlogPost type
   */
  private async transformPost(
    post: WordPressPost,
    authors: Map<number, BlogAuthor>,
    categories: Map<number, BlogCategory>,
    tags: Map<number, BlogTag>,
    media: Map<number, BlogImage>
  ): Promise<BlogPost> {
    const title = this.processContent(post.title.rendered)
    const content = this.processContent(post.content.rendered)
    const excerpt = this.processContent(post.excerpt.rendered, true)
    
    const language = this.detectLanguage(title, content, excerpt)
    const wordCount = content.split(/\s+/).length
    const readingTime = this.calculateReadingTime(content)

    // Get author
    const author = authors.get(post.author) || {
      id: post.author,
      name: 'Unknown Author',
      slug: 'unknown',
      description: '',
      avatar: '',
    }

    // Get categories
    const postCategories = post.categories
      .map(catId => categories.get(catId))
      .filter((cat): cat is BlogCategory => cat !== undefined)

    // Get tags
    const postTags = post.tags
      .map(tagId => tags.get(tagId))
      .filter((tag): tag is BlogTag => tag !== undefined)

    // Get featured image
    const featuredImage = post.featured_media ? media.get(post.featured_media) : undefined

    return {
      id: post.id.toString(),
      title,
      slug: post.slug,
      excerpt,
      content,
      publishDate: new Date(post.date),
      modifiedDate: new Date(post.modified),
      author,
      categories: postCategories,
      tags: postTags,
      featuredImage,
      language,
      status: post.status as BlogPost['status'],
      commentStatus: post.comment_status as BlogPost['commentStatus'],
      pingStatus: post.ping_status as BlogPost['pingStatus'],
      sticky: post.sticky,
      format: post.format as BlogPost['format'],
      originalUrl: post.link,
      wordCount,
      readingTime,
      seo: {
        title,
        description: excerpt,
        keywords: postTags.map(tag => tag.name),
        canonicalUrl: post.link,
      },
    }
  }

  /**
   * Transform WordPress author response to internal BlogAuthor type
   */
  private transformAuthor(author: WordPressAuthor): BlogAuthor {
    return {
      id: author.id,
      name: author.name,
      slug: author.slug,
      description: author.description,
      avatar: author.avatar_urls['96'] || author.avatar_urls['48'] || '',
      url: author.url || undefined,
      socialLinks: {
        website: author.url || undefined,
      },
    }
  }

  /**
   * Transform WordPress category response to internal BlogCategory type
   */
  private transformCategory(category: WordPressCategory): BlogCategory {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      parent: category.parent || undefined,
      count: category.count,
    }
  }

  /**
   * Transform WordPress tag response to internal BlogTag type
   */
  private transformTag(tag: WordPressTag): BlogTag {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description || undefined,
      count: tag.count,
    }
  }

  /**
   * Transform WordPress media response to internal BlogImage type
   */
  private transformMedia(media: WordPressMedia): BlogImage {
    const sizes = media.media_details?.sizes || {}
    
    return {
      id: media.id,
      url: media.source_url,
      alt: media.alt_text,
      caption: media.caption?.rendered || undefined,
      title: media.title?.rendered || undefined,
      description: media.description?.rendered || undefined,
      sizes: {
        thumbnail: sizes.thumbnail?.source_url || media.source_url,
        medium: sizes.medium?.source_url || media.source_url,
        large: sizes.large?.source_url || media.source_url,
        full: media.source_url,
      },
      width: media.media_details?.width || 0,
      height: media.media_details?.height || 0,
      mimeType: media.mime_type,
    }
  }

  /**
   * Fetch blog posts from WordPress API
   */
  async fetchPosts(limit?: number): Promise<BlogPost[]> {
    console.log('📝 Fetching blog posts from WordPress...')

    if (!this.config.apiUrl) {
      console.warn('⚠️  WordPress API URL not configured, skipping blog posts')
      return []
    }

    try {
      const params = {
        ...wordpressRequestConfig.defaultParams,
        per_page: limit || wordpressRequestConfig.defaultParams.per_page,
      }

      // Fetch posts
      const posts: WordPressPost[] = await this.makeRequest(
        wordpressEndpoints.posts,
        { params }
      )

      if (!Array.isArray(posts) || posts.length === 0) {
        console.log('ℹ️  No blog posts found')
        return []
      }

      // Filter posts by content length and status
      const validPosts = posts.filter(post => {
        const content = post.content?.rendered || ''
        return (
          post.status === 'publish' &&
          content.length >= contentFilters.minContentLength
          // Note: Category filtering by name would require fetching categories first
          // This is simplified for now to avoid circular dependencies
        )
      })

      console.log(`✅ Found ${validPosts.length} valid posts (${posts.length} total)`)

      // Fetch related data
      const [authors, categories, tags, media] = await Promise.allSettled([
        this.fetchAuthors(),
        this.fetchCategories(),
        this.fetchTags(),
        this.fetchMediaForPosts(validPosts),
      ])

      const authorsMap = new Map<number, BlogAuthor>()
      const categoriesMap = new Map<number, BlogCategory>()
      const tagsMap = new Map<number, BlogTag>()
      const mediaMap = new Map<number, BlogImage>()

      // Process authors
      if (authors.status === 'fulfilled') {
        authors.value.forEach(author => authorsMap.set(author.id, author))
      }

      // Process categories
      if (categories.status === 'fulfilled') {
        categories.value.forEach(category => categoriesMap.set(category.id, category))
      }

      // Process tags
      if (tags.status === 'fulfilled') {
        tags.value.forEach(tag => tagsMap.set(tag.id, tag))
      }

      // Process media
      if (media.status === 'fulfilled') {
        media.value.forEach(image => mediaMap.set(image.id, image))
      }

      // Transform posts
      const transformedPosts = await Promise.all(
        validPosts.map(post =>
          this.transformPost(post, authorsMap, categoriesMap, tagsMap, mediaMap)
        )
      )

      console.log(`✅ Successfully processed ${transformedPosts.length} blog posts`)
      return transformedPosts
    } catch (error) {
      console.error('❌ Failed to fetch blog posts:', error)

      if (this.config.errorHandling.networkErrorStrategy === 'use-cache') {
        console.warn('🔄 Falling back to cached data (if available)')
        return []
      }

      throw error
    }
  }

  /**
   * Fetch posts by category
   */
  async fetchPostsByCategory(categorySlug: string): Promise<BlogPost[]> {
    console.log(`📝 Fetching posts for category: ${categorySlug}`)

    try {
      // First, find the category ID
      const categories = await this.fetchCategories()
      const category = categories.find(cat => cat.slug === categorySlug)

      if (!category) {
        console.warn(`⚠️  Category not found: ${categorySlug}`)
        return []
      }

      const params = {
        ...wordpressRequestConfig.defaultParams,
        categories: category.id,
      }

      const posts: WordPressPost[] = await this.makeRequest(
        wordpressEndpoints.posts,
        { params }
      )

      // Use the same transformation logic as fetchPosts
      const [authors, categoriesMap, tags, media] = await Promise.allSettled([
        this.fetchAuthors(),
        this.fetchCategories(),
        this.fetchTags(),
        this.fetchMediaForPosts(posts),
      ])

      const authorsMap = new Map<number, BlogAuthor>()
      const categoriesMapData = new Map<number, BlogCategory>()
      const tagsMap = new Map<number, BlogTag>()
      const mediaMap = new Map<number, BlogImage>()

      if (authors.status === 'fulfilled') {
        authors.value.forEach(author => authorsMap.set(author.id, author))
      }
      if (categoriesMap.status === 'fulfilled') {
        categoriesMap.value.forEach(cat => categoriesMapData.set(cat.id, cat))
      }
      if (tags.status === 'fulfilled') {
        tags.value.forEach(tag => tagsMap.set(tag.id, tag))
      }
      if (media.status === 'fulfilled') {
        media.value.forEach(image => mediaMap.set(image.id, image))
      }

      const transformedPosts = await Promise.all(
        posts.map(post =>
          this.transformPost(post, authorsMap, categoriesMapData, tagsMap, mediaMap)
        )
      )

      console.log(`✅ Found ${transformedPosts.length} posts in category: ${categorySlug}`)
      return transformedPosts
    } catch (error) {
      console.error(`❌ Failed to fetch posts for category ${categorySlug}:`, error)
      return []
    }
  }

  /**
   * Fetch multilingual posts (if supported)
   */
  async fetchMultilingualPosts(): Promise<BlogPost[]> {
    if (!this.config.multilingualSupport) {
      console.log('ℹ️  Multilingual support not enabled, fetching all posts')
      return this.fetchPosts()
    }

    console.log('🌐 Fetching multilingual blog posts...')

    try {
      const allPosts = await this.fetchPosts()
      
      // Group posts by language
      const postsByLanguage = allPosts.reduce((acc, post) => {
        if (!acc[post.language]) {
          acc[post.language] = []
        }
        acc[post.language].push(post)
        return acc
      }, {} as Record<Language, BlogPost[]>)

      console.log('📊 Posts by language:')
      Object.entries(postsByLanguage).forEach(([lang, posts]) => {
        console.log(`  ${lang}: ${posts.length} posts`)
      })

      return allPosts
    } catch (error) {
      console.error('❌ Failed to fetch multilingual posts:', error)
      return []
    }
  }

  /**
   * Fetch blog authors
   */
  async fetchAuthors(): Promise<BlogAuthor[]> {
    try {
      const authors: WordPressAuthor[] = await this.makeRequest(
        wordpressEndpoints.users,
        {
          params: { per_page: 100 },
        }
      )

      return authors.map(author => this.transformAuthor(author))
    } catch (error) {
      console.warn('⚠️  Failed to fetch authors:', error)
      return []
    }
  }

  /**
   * Fetch blog categories
   */
  async fetchCategories(): Promise<BlogCategory[]> {
    try {
      const categories: WordPressCategory[] = await this.makeRequest(
        wordpressEndpoints.categories,
        {
          params: { per_page: 100 },
        }
      )

      return categories.map(category => this.transformCategory(category))
    } catch (error) {
      console.warn('⚠️  Failed to fetch categories:', error)
      return []
    }
  }

  /**
   * Fetch blog tags
   */
  async fetchTags(): Promise<BlogTag[]> {
    try {
      const tags: WordPressTag[] = await this.makeRequest(
        wordpressEndpoints.tags,
        {
          params: { per_page: 100 },
        }
      )

      return tags.map(tag => this.transformTag(tag))
    } catch (error) {
      console.warn('⚠️  Failed to fetch tags:', error)
      return []
    }
  }

  /**
   * Fetch media for posts
   */
  async fetchMediaForPosts(posts: WordPressPost[]): Promise<BlogImage[]> {
    const mediaIds = posts
      .map(post => post.featured_media)
      .filter(id => id && id > 0)

    if (mediaIds.length === 0) {
      return []
    }

    try {
      const mediaPromises = mediaIds.map(id =>
        this.makeRequest<WordPressMedia>(`${wordpressEndpoints.media}/${id}`)
          .catch(error => {
            console.warn(`⚠️  Failed to fetch media ${id}:`, error)
            return null
          })
      )

      const mediaResults = await Promise.all(mediaPromises)
      const validMedia = mediaResults.filter((media): media is WordPressMedia => media !== null)

      return validMedia.map(media => this.transformMedia(media))
    } catch (error) {
      console.warn('⚠️  Failed to fetch media:', error)
      return []
    }
  }

  /**
   * Generate blog statistics
   */
  async generateBlogStats(): Promise<BlogStats> {
    console.log('📊 Generating blog statistics...')

    try {
      const [posts, categories, tags, authors] = await Promise.allSettled([
        this.fetchPosts(1000), // Fetch more posts for accurate stats
        this.fetchCategories(),
        this.fetchTags(),
        this.fetchAuthors(),
      ])

      const postsData = posts.status === 'fulfilled' ? posts.value : []
      const categoriesData = categories.status === 'fulfilled' ? categories.value : []
      const tagsData = tags.status === 'fulfilled' ? tags.value : []
      const authorsData = authors.status === 'fulfilled' ? authors.value : []

      const publishedPosts = postsData.filter(post => post.status === 'publish')
      const draftPosts = postsData.filter(post => post.status === 'draft')

      const totalWords = postsData.reduce((sum, post) => sum + post.wordCount, 0)
      const averageWords = postsData.length > 0 ? Math.round(totalWords / postsData.length) : 0

      // Generate monthly statistics
      const postsPerMonth = this.generateMonthlyStats(postsData)

      // Generate category statistics
      const topCategories = this.generateCategoryStats(postsData, categoriesData)

      // Generate tag statistics
      const topTags = this.generateTagStats(postsData, tagsData)

      const stats: BlogStats = {
        totalPosts: postsData.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        categories: categoriesData.length,
        tags: tagsData.length,
        authors: authorsData.length,
        averageWordsPerPost: averageWords,
        totalWords,
        postsPerMonth,
        topCategories,
        topTags,
        lastUpdated: new Date(),
      }

      console.log('✅ Blog statistics generated successfully')
      return stats
    } catch (error) {
      console.error('❌ Failed to generate blog statistics:', error)
      throw error
    }
  }

  /**
   * Generate monthly post statistics
   */
  private generateMonthlyStats(posts: BlogPost[]): BlogStats['postsPerMonth'] {
    const monthlyMap = new Map<string, { count: number; words: number }>()

    posts.forEach(post => {
      const date = post.publishDate
      const key = `${date.getFullYear()}-${date.getMonth()}`
      
      const existing = monthlyMap.get(key) || { count: 0, words: 0 }
      existing.count++
      existing.words += post.wordCount
      monthlyMap.set(key, existing)
    })

    return Array.from(monthlyMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-').map(Number)
        return {
          year,
          month: month + 1, // Convert from 0-based to 1-based
          count: data.count,
          words: data.words,
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  }

  /**
   * Generate category statistics
   */
  private generateCategoryStats(posts: BlogPost[], categories: BlogCategory[]): BlogStats['topCategories'] {
    const categoryMap = new Map<number, number>()

    posts.forEach(post => {
      post.categories.forEach(category => {
        const count = categoryMap.get(category.id) || 0
        categoryMap.set(category.id, count + 1)
      })
    })

    const totalPosts = posts.length

    return Array.from(categoryMap.entries())
      .map(([categoryId, postCount]) => {
        const category = categories.find(cat => cat.id === categoryId)
        if (!category) return null

        return {
          category,
          postCount,
          percentage: totalPosts > 0 ? (postCount / totalPosts) * 100 : 0,
        }
      })
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 10) // Top 10 categories
  }

  /**
   * Generate tag statistics
   */
  private generateTagStats(posts: BlogPost[], tags: BlogTag[]): BlogStats['topTags'] {
    const tagMap = new Map<number, number>()

    posts.forEach(post => {
      post.tags.forEach(tag => {
        const count = tagMap.get(tag.id) || 0
        tagMap.set(tag.id, count + 1)
      })
    })

    const totalPosts = posts.length

    return Array.from(tagMap.entries())
      .map(([tagId, postCount]) => {
        const tag = tags.find(t => t.id === tagId)
        if (!tag) return null

        return {
          tag,
          postCount,
          percentage: totalPosts > 0 ? (postCount / totalPosts) * 100 : 0,
        }
      })
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 20) // Top 20 tags
  }
}

/**
 * Default WordPress fetcher instance
 */
export const wordpressFetcher = new WordPressFetcher()

/**
 * Utility function to create a configured WordPress fetcher
 */
export function createWordPressFetcher(
  config?: Partial<WordPressConfig>
): WordPressFetcher {
  return new WordPressFetcher(config)
}