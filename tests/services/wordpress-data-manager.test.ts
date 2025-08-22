/**
 * WordPress Data Manager Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { WordPressDataManager, type WordPressDataResult, type FetchOptions } from '@/services/wordpress-data-manager'
import { WordPressFetcher, WordPressApiError } from '@/services/wordpress-fetcher'
import type { BlogPost, BlogAuthor, BlogCategory, BlogTag, BlogStats } from '@/types/blog'

// Mock WordPress fetcher
const mockFetcher = {
  testConnection: vi.fn(),
  fetchPosts: vi.fn(),
  fetchMultilingualPosts: vi.fn(),
  fetchAuthors: vi.fn(),
  fetchCategories: vi.fn(),
  fetchTags: vi.fn(),
  fetchPostsByCategory: vi.fn(),
  generateBlogStats: vi.fn(),
} as unknown as WordPressFetcher

// Mock WordPress config
vi.mock('../../config/wordpress.config', () => ({
  wordpressConfig: {
    apiUrl: 'https://example.com/wp-json/wp/v2',
    multilingualSupport: true,
    errorHandling: {
      networkErrorStrategy: 'use-cache',
      notFoundStrategy: 'skip-feature'
    }
  },
  wordpressEndpoints: {
    posts: '/posts',
    categories: '/categories',
    tags: '/tags',
    media: '/media',
    users: '/users'
  },
  wordpressRequestConfig: {
    defaultParams: {
      per_page: 20,
      status: 'publish',
      _embed: true,
      orderby: 'date',
      order: 'desc'
    },
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Shuying-Studio-Homepage/1.0'
    },
    timeout: 10000,
    retry: {
      attempts: 3,
      delay: 1000
    }
  },
  contentFilters: {
    minContentLength: 100,
    maxExcerptLength: 300,
    supportedLanguages: ['zh', 'en'],
    excludeCategories: ['private', '私人', 'draft', '草稿'],
    priorityTags: ['featured', '精选', 'popular', '热门']
  },
  languageDetection: {
    chinesePatterns: [/[\u4e00-\u9fff]/g, /^zh/i, /chinese|中文|中国/i],
    englishPatterns: [/^en/i, /english|英文|英语/i],
    defaultLanguage: 'zh' as const
  },
  contentTransformation: {
    stripTags: ['script', 'style', 'iframe'],
    preserveTags: ['p', 'br', 'strong', 'em', 'a'],
    imageProcessing: {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 80,
      generateResponsive: true,
      enableLazyLoading: true
    }
  }
}))

describe('WordPressDataManager', () => {
  let dataManager: WordPressDataManager

  const mockBlogPost: BlogPost = {
    id: '1',
    title: 'Test Post',
    slug: 'test-post',
    excerpt: 'Test excerpt',
    content: 'Test content',
    publishDate: new Date('2024-01-01'),
    modifiedDate: new Date('2024-01-01'),
    author: {
      id: 1,
      name: 'Test Author',
      slug: 'test-author',
      description: 'Test description',
      avatar: 'https://example.com/avatar.jpg'
    },
    categories: [{
      id: 1,
      name: 'Test Category',
      slug: 'test-category',
      count: 1
    }],
    tags: [{
      id: 1,
      name: 'Test Tag',
      slug: 'test-tag',
      count: 1
    }],
    language: 'zh',
    status: 'publish',
    commentStatus: 'open',
    pingStatus: 'open',
    sticky: false,
    format: 'standard',
    originalUrl: 'https://example.com/test-post',
    wordCount: 100,
    readingTime: 1,
    seo: {
      title: 'Test Post',
      description: 'Test excerpt'
    }
  }

  const mockAuthor: BlogAuthor = {
    id: 1,
    name: 'Test Author',
    slug: 'test-author',
    description: 'Test description',
    avatar: 'https://example.com/avatar.jpg'
  }

  const mockCategory: BlogCategory = {
    id: 1,
    name: 'Test Category',
    slug: 'test-category',
    count: 1
  }

  const mockTag: BlogTag = {
    id: 1,
    name: 'Test Tag',
    slug: 'test-tag',
    count: 1
  }

  const mockStats: BlogStats = {
    totalPosts: 1,
    publishedPosts: 1,
    draftPosts: 0,
    categories: 1,
    tags: 1,
    authors: 1,
    averageWordsPerPost: 100,
    totalWords: 100,
    postsPerMonth: [],
    topCategories: [],
    topTags: [],
    lastUpdated: new Date()
  }

  beforeEach(() => {
    dataManager = new WordPressDataManager(mockFetcher)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with provided fetcher', () => {
      expect(dataManager).toBeInstanceOf(WordPressDataManager)
    })

    it('should initialize with default fetcher when none provided', () => {
      const defaultManager = new WordPressDataManager()
      expect(defaultManager).toBeInstanceOf(WordPressDataManager)
    })
  })

  describe('fetchAllData', () => {
    beforeEach(() => {
      mockFetcher.testConnection.mockResolvedValue(true)
      mockFetcher.fetchMultilingualPosts.mockResolvedValue([mockBlogPost])
      mockFetcher.fetchAuthors.mockResolvedValue([mockAuthor])
      mockFetcher.fetchCategories.mockResolvedValue([mockCategory])
      mockFetcher.fetchTags.mockResolvedValue([mockTag])
      mockFetcher.generateBlogStats.mockResolvedValue(mockStats)
    })

    it('should fetch all data successfully', async () => {
      const options: FetchOptions = {
        includeStats: true,
        includeAuthors: true,
        includeCategories: true,
        includeTags: true
      }

      const result = await dataManager.fetchAllData(options)

      expect(result.posts).toHaveLength(1)
      expect(result.authors).toHaveLength(1)
      expect(result.categories).toHaveLength(1)
      expect(result.tags).toHaveLength(1)
      expect(result.stats).toBeDefined()
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle connection failure gracefully', async () => {
      mockFetcher.testConnection.mockResolvedValue(false)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await dataManager.fetchAllData()

      expect(result.posts).toHaveLength(0)
      expect(result.warnings).toContain('Failed to connect to WordPress API')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should apply maxPosts limit', async () => {
      const multiplePosts = [mockBlogPost, { ...mockBlogPost, id: '2' }]
      mockFetcher.fetchMultilingualPosts.mockResolvedValue(multiplePosts)

      const result = await dataManager.fetchAllData({ maxPosts: 1 })

      expect(result.posts).toHaveLength(1)
    })

    it('should apply category filter', async () => {
      const postWithDifferentCategory = {
        ...mockBlogPost,
        id: '2',
        categories: [{
          id: 2,
          name: 'Other Category',
          slug: 'other-category',
          count: 1
        }]
      }
      mockFetcher.fetchMultilingualPosts.mockResolvedValue([mockBlogPost, postWithDifferentCategory])

      const result = await dataManager.fetchAllData({
        categoryFilter: ['test-category']
      })

      expect(result.posts).toHaveLength(1)
      expect(result.posts[0].id).toBe('1')
    })

    it('should apply language filter', async () => {
      const englishPost = { ...mockBlogPost, id: '2', language: 'en' as const }
      mockFetcher.fetchMultilingualPosts.mockResolvedValue([mockBlogPost, englishPost])

      const result = await dataManager.fetchAllData({
        languageFilter: ['zh']
      })

      expect(result.posts).toHaveLength(1)
      expect(result.posts[0].language).toBe('zh')
    })

    it('should handle API errors and use fallback strategies', async () => {
      mockFetcher.testConnection.mockResolvedValue(true)
      mockFetcher.fetchMultilingualPosts.mockRejectedValue(
        new WordPressApiError('API Error', 500)
      )

      const result = await dataManager.fetchAllData()

      expect(result.errors).toContain('API Error')
      expect(result.warnings).toContain('WordPress API error (500): API Error')
    })
  })

  describe('fetchPostsByCategories', () => {
    it('should fetch posts from multiple categories', async () => {
      mockFetcher.fetchPostsByCategory
        .mockResolvedValueOnce([mockBlogPost])
        .mockResolvedValueOnce([{ ...mockBlogPost, id: '2' }])

      const result = await dataManager.fetchPostsByCategories(['category1', 'category2'])

      expect(result).toHaveLength(2)
      expect(mockFetcher.fetchPostsByCategory).toHaveBeenCalledTimes(2)
    })

    it('should remove duplicate posts', async () => {
      mockFetcher.fetchPostsByCategory
        .mockResolvedValueOnce([mockBlogPost])
        .mockResolvedValueOnce([mockBlogPost]) // Same post

      const result = await dataManager.fetchPostsByCategories(['category1', 'category2'])

      expect(result).toHaveLength(1)
    })

    it('should handle errors gracefully', async () => {
      mockFetcher.fetchPostsByCategory.mockRejectedValue(new Error('Fetch error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await dataManager.fetchPostsByCategories(['category1'])

      expect(result).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('getPostsByLanguage', () => {
    it('should group posts by language', () => {
      const posts = [
        mockBlogPost,
        { ...mockBlogPost, id: '2', language: 'en' as const },
        { ...mockBlogPost, id: '3', language: 'zh' as const }
      ]

      const result = dataManager.getPostsByLanguage(posts)

      expect(result.zh).toHaveLength(2)
      expect(result.en).toHaveLength(1)
    })
  })

  describe('getFeaturedPosts', () => {
    it('should return sticky posts first', () => {
      const stickyPost = { ...mockBlogPost, id: '2', sticky: true }
      const regularPost = { ...mockBlogPost, id: '3', sticky: false }
      const posts = [regularPost, stickyPost]

      const result = dataManager.getFeaturedPosts(posts, 5)

      expect(result[0].id).toBe('2') // Sticky post should be first
    })

    it('should include posts with priority tags', () => {
      const featuredPost = {
        ...mockBlogPost,
        id: '2',
        tags: [{
          id: 2,
          name: 'featured',
          slug: 'featured',
          count: 1
        }]
      }
      const posts = [mockBlogPost, featuredPost]

      const result = dataManager.getFeaturedPosts(posts, 5)

      expect(result).toContain(featuredPost)
    })

    it('should limit results to specified count', () => {
      const posts = Array.from({ length: 10 }, (_, i) => ({
        ...mockBlogPost,
        id: String(i + 1),
        sticky: true
      }))

      const result = dataManager.getFeaturedPosts(posts, 3)

      expect(result).toHaveLength(3)
    })
  })

  describe('searchPosts', () => {
    const searchablePosts = [
      mockBlogPost,
      {
        ...mockBlogPost,
        id: '2',
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript programming',
        tags: [{
          id: 2,
          name: 'javascript',
          slug: 'javascript',
          count: 1
        }]
      }
    ]

    it('should search by title', () => {
      const result = dataManager.searchPosts(searchablePosts, 'JavaScript')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should search by content', () => {
      const result = dataManager.searchPosts(searchablePosts, 'programming')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should search by tags', () => {
      const result = dataManager.searchPosts(searchablePosts, 'javascript')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should be case insensitive', () => {
      const result = dataManager.searchPosts(searchablePosts, 'JAVASCRIPT')
      expect(result).toHaveLength(1)
    })

    it('should return empty array for no matches', () => {
      const result = dataManager.searchPosts(searchablePosts, 'nonexistent')
      expect(result).toHaveLength(0)
    })
  })

  describe('cache management', () => {
    it('should clear cache', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      dataManager.clearCache()
      
      expect(consoleSpy).toHaveBeenCalledWith('🗑️  WordPress data cache cleared')
      consoleSpy.mockRestore()
    })

    it('should return cache statistics', () => {
      const stats = dataManager.getCacheStats()
      
      expect(stats).toHaveProperty('entries')
      expect(stats).toHaveProperty('totalSize')
      expect(typeof stats.entries).toBe('number')
      expect(typeof stats.totalSize).toBe('number')
    })
  })

  describe('error handling with different strategies', () => {
    it('should handle network errors with use-cache strategy', async () => {
      mockFetcher.testConnection.mockResolvedValue(true)
      mockFetcher.fetchMultilingualPosts.mockRejectedValue(new Error('Network error'))

      const result = await dataManager.fetchAllData()

      expect(result.errors).toContain('Network error')
    })

    it('should handle timeout errors', async () => {
      mockFetcher.testConnection.mockResolvedValue(true)
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'
      mockFetcher.fetchMultilingualPosts.mockRejectedValue(timeoutError)

      const result = await dataManager.fetchAllData()

      expect(result.errors).toContain('Request timeout')
    })
  })

  describe('multilingual support', () => {
    it('should handle multilingual posts correctly', async () => {
      const multilingualPosts = [
        { ...mockBlogPost, language: 'zh' as const },
        { ...mockBlogPost, id: '2', language: 'en' as const }
      ]
      
      mockFetcher.testConnection.mockResolvedValue(true)
      mockFetcher.fetchMultilingualPosts.mockResolvedValue(multilingualPosts)

      const result = await dataManager.fetchAllData()

      expect(result.posts).toHaveLength(2)
      
      const postsByLang = dataManager.getPostsByLanguage(result.posts)
      expect(postsByLang.zh).toHaveLength(1)
      expect(postsByLang.en).toHaveLength(1)
    })
  })
})