/**
 * WordPress configuration
 * Contains WordPress API settings and content management configuration
 */

import type { WordPressConfig } from '../src/types/config';

export const wordpressConfig: WordPressConfig = {
  apiUrl: import.meta.env.VITE_WORDPRESS_API_URL || '',
  
  // Categories to fetch from WordPress
  categories: [
    '技术分享',
    'Tech Insights',
    '项目案例',
    'Case Studies',
    '开发经验',
    'Development Experience',
    '行业动态',
    'Industry News'
  ],
  
  // Enable multilingual support
  multilingualSupport: true,
  
  // Error handling strategies
  errorHandling: {
    networkErrorStrategy: 'use-cache',
    notFoundStrategy: 'skip-feature'
  }
};

/**
 * WordPress API endpoints configuration
 */
export const wordpressEndpoints = {
  posts: '/posts',
  categories: '/categories',
  tags: '/tags',
  media: '/media',
  users: '/users'
};

/**
 * WordPress request configuration
 */
export const wordpressRequestConfig = {
  // Default parameters for posts endpoint
  defaultParams: {
    per_page: 20,
    status: 'publish',
    _embed: true, // Include embedded data (featured images, author info, etc.)
    orderby: 'date',
    order: 'desc'
  },
  
  // Request headers
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Shuying-Studio-Homepage/1.0'
  },
  
  // Timeout configuration
  timeout: 10000, // 10 seconds
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000 // 1 second
  }
};

/**
 * Content filtering and processing configuration
 */
export const contentFilters = {
  // Minimum content length (characters)
  minContentLength: 100,
  
  // Maximum excerpt length (characters)
  maxExcerptLength: 300,
  
  // Languages to support
  supportedLanguages: ['zh', 'en'],
  
  // Categories to exclude
  excludeCategories: [
    'private',
    '私人',
    'draft',
    '草稿',
    'test',
    '测试'
  ],
  
  // Tags to prioritize
  priorityTags: [
    'featured',
    '精选',
    'popular',
    '热门',
    'technical',
    '技术'
  ]
};

/**
 * Language detection patterns for multilingual content
 */
export const languageDetection = {
  // Patterns to detect Chinese content
  chinesePatterns: [
    /[\u4e00-\u9fff]/g, // Chinese characters
    /^zh/i, // Language code
    /chinese|中文|中国/i // Language indicators
  ],
  
  // Patterns to detect English content
  englishPatterns: [
    /^en/i, // Language code
    /english|英文|英语/i // Language indicators
  ],
  
  // Default language when detection fails
  defaultLanguage: 'zh' as const
};

/**
 * Content transformation rules
 */
export const contentTransformation = {
  // HTML tags to strip from excerpts
  stripTags: [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button'
  ],
  
  // HTML tags to preserve in content
  preserveTags: [
    'p',
    'br',
    'strong',
    'em',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'code',
    'pre'
  ],
  
  // Image processing rules
  imageProcessing: {
    // Resize images for better performance
    maxWidth: 1200,
    maxHeight: 800,
    quality: 80,
    
    // Generate responsive images
    generateResponsive: true,
    
    // Lazy loading
    enableLazyLoading: true
  }
};

export default wordpressConfig;