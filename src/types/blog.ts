import { Language } from './common'

// Blog Post related types
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  publishDate: Date
  modifiedDate: Date
  author: BlogAuthor
  categories: BlogCategory[]
  tags: BlogTag[]
  featuredImage?: BlogImage
  language: Language
  status: 'publish' | 'draft' | 'private'
  commentStatus: 'open' | 'closed'
  pingStatus: 'open' | 'closed'
  sticky: boolean
  format: 'standard' | 'aside' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio' | 'chat'
  originalUrl: string
  wordCount: number
  readingTime: number
  seo: BlogSEO
}

export interface BlogAuthor {
  id: number
  name: string
  slug: string
  description: string
  avatar: string
  url?: string
  email?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    website?: string
  }
}

export interface BlogCategory {
  id: number
  name: string
  slug: string
  description?: string
  parent?: number
  count: number
}

export interface BlogTag {
  id: number
  name: string
  slug: string
  description?: string
  count: number
}

export interface BlogImage {
  id: number
  url: string
  alt: string
  caption?: string
  title?: string
  description?: string
  sizes: {
    thumbnail: string
    medium: string
    large: string
    full: string
  }
  width: number
  height: number
  mimeType: string
}

export interface BlogSEO {
  title?: string
  description?: string
  keywords?: string[]
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

// WordPress API Response types
export interface WordPressPost {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  ping_status: string
  sticky: boolean
  template: string
  format: string
  meta: Record<string, unknown>
  categories: number[]
  tags: number[]
  _links: Record<string, unknown>
}

export interface WordPressCategory {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  parent: number
  meta: Record<string, unknown>
  _links: Record<string, unknown>
}

export interface WordPressTag {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  meta: Record<string, unknown>
  _links: Record<string, unknown>
}

export interface WordPressAuthor {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
  avatar_urls: {
    '24': string
    '48': string
    '96': string
  }
  meta: Record<string, unknown>
  _links: Record<string, unknown>
}

export interface WordPressMedia {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  author: number
  comment_status: string
  ping_status: string
  template: string
  meta: Record<string, unknown>
  description: {
    rendered: string
  }
  caption: {
    rendered: string
  }
  alt_text: string
  media_type: string
  mime_type: string
  media_details: {
    width: number
    height: number
    file: string
    sizes: Record<string, {
      file: string
      width: number
      height: number
      mime_type: string
      source_url: string
    }>
    image_meta: Record<string, unknown>
  }
  source_url: string
  _links: Record<string, unknown>
}

// Blog Statistics
export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  categories: number
  tags: number
  authors: number
  averageWordsPerPost: number
  totalWords: number
  postsPerMonth: MonthlyPostStats[]
  topCategories: CategoryStats[]
  topTags: TagStats[]
  lastUpdated: Date
}

export interface MonthlyPostStats {
  year: number
  month: number
  count: number
  words: number
}

export interface CategoryStats {
  category: BlogCategory
  postCount: number
  percentage: number
}

export interface TagStats {
  tag: BlogTag
  postCount: number
  percentage: number
}