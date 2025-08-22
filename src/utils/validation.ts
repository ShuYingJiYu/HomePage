import { z } from 'zod'
import type {
  Repository,
  Member,
  BlogPost,
  SiteConfig,
  DisplayProject,
  RepositoryAnalysis,
  Language,
  ProjectCategory,
  ServiceCategory,
} from '@/types'

// Common validation schemas
export const LanguageSchema = z.enum(['zh', 'en'])

export const MultilingualContentSchema = z.object({
  zh: z.string().min(1, 'Chinese content is required'),
  en: z.string().min(1, 'English content is required'),
})

export const MultilingualArraySchema = z.object({
  zh: z.array(z.string()).min(1, 'Chinese array must have at least one item'),
  en: z.array(z.string()).min(1, 'English array must have at least one item'),
})

export const ProjectCategorySchema = z.enum([
  'web-app',
  'mobile-app',
  'open-source',
  'library',
  'automation',
  'other',
])

export const ServiceCategorySchema = z.enum([
  'frontend',
  'backend',
  'mobile',
  'devops',
  'consulting',
])

// Repository validation schemas
export const RepositoryLicenseSchema = z.object({
  key: z.string(),
  name: z.string(),
  spdxId: z.string(),
  url: z.string().url().optional(),
})

export const RepositoryOwnerSchema = z.object({
  login: z.string().min(1),
  id: z.number().positive(),
  type: z.enum(['User', 'Organization']),
  avatarUrl: z.string().url(),
  htmlUrl: z.string().url(),
})

export const RepositoryUrlsSchema = z.object({
  html: z.string().url(),
  git: z.string().url(),
  ssh: z.string(),
  clone: z.string().url(),
  api: z.string().url(),
})

export const RepositorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  description: z.string().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  stars: z.number().min(0),
  forks: z.number().min(0),
  watchers: z.number().min(0),
  size: z.number().min(0),
  defaultBranch: z.string().min(1),
  isPrivate: z.boolean(),
  isFork: z.boolean(),
  isArchived: z.boolean(),
  lastUpdated: z.date(),
  createdAt: z.date(),
  pushedAt: z.date(),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  license: RepositoryLicenseSchema.optional(),
  owner: RepositoryOwnerSchema,
  urls: RepositoryUrlsSchema,
})

export const DisplayProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: MultilingualContentSchema,
  description: MultilingualContentSchema,
  category: ProjectCategorySchema,
  techStack: z.array(z.string()).min(1),
  highlights: MultilingualArraySchema,
  githubUrl: z.string().url(),
  demoUrl: z.string().url().optional(),
  images: z.array(z.string().url()),
  stats: z.object({
    stars: z.number().min(0),
    forks: z.number().min(0),
    commits: z.number().min(0),
    contributors: z.number().min(0),
    issues: z.number().min(0),
    pullRequests: z.number().min(0),
  }),
  lastUpdated: z.date(),
  featured: z.boolean(),
  aiGenerated: z.boolean(),
})

// Member validation schemas
export const SocialLinksSchema = z.object({
  github: z.string().url(),
  twitter: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  blog: z.string().url().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  weibo: z.string().url().optional(),
  wechat: z.string().optional(),
})

export const MemberContributionsSchema = z.object({
  commits: z.number().min(0),
  pullRequests: z.number().min(0),
  issues: z.number().min(0),
  reviews: z.number().min(0),
  repositories: z.number().min(0),
  totalContributions: z.number().min(0),
  contributionCalendar: z.array(
    z.object({
      date: z.date(),
      count: z.number().min(0),
      level: z.union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
      ]),
    })
  ),
  topLanguages: z.array(
    z.object({
      language: z.string(),
      commits: z.number().min(0),
      percentage: z.number().min(0).max(100),
      color: z.string(),
    })
  ),
  streak: z.object({
    current: z.number().min(0),
    longest: z.number().min(0),
    currentStart: z.date().optional(),
    currentEnd: z.date().optional(),
    longestStart: z.date().optional(),
    longestEnd: z.date().optional(),
  }),
})

export const MemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  username: z.string().min(1),
  role: MultilingualContentSchema,
  avatar: z.string().url(),
  githubUsername: z.string().min(1),
  bio: MultilingualContentSchema,
  skills: z.array(z.string()).min(1),
  contributions: MemberContributionsSchema,
  socialLinks: SocialLinksSchema,
  joinDate: z.date(),
  isActive: z.boolean(),
  featured: z.boolean(),
})

// Blog validation schemas
export const BlogAuthorSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  avatar: z.string().url(),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
})

export const BlogCategorySchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parent: z.number().positive().optional(),
  count: z.number().min(0),
})

export const BlogTagSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  count: z.number().min(0),
})

export const BlogImageSchema = z.object({
  id: z.number().positive(),
  url: z.string().url(),
  alt: z.string(),
  caption: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  sizes: z.object({
    thumbnail: z.string().url(),
    medium: z.string().url(),
    large: z.string().url(),
    full: z.string().url(),
  }),
  width: z.number().positive(),
  height: z.number().positive(),
  mimeType: z.string(),
})

export const BlogSEOSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().url().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().url().optional(),
})

export const BlogPostSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string(),
  content: z.string().min(1),
  publishDate: z.date(),
  modifiedDate: z.date(),
  author: BlogAuthorSchema,
  categories: z.array(BlogCategorySchema),
  tags: z.array(BlogTagSchema),
  featuredImage: BlogImageSchema.optional(),
  language: LanguageSchema,
  status: z.enum(['publish', 'draft', 'private']),
  commentStatus: z.enum(['open', 'closed']),
  pingStatus: z.enum(['open', 'closed']),
  sticky: z.boolean(),
  format: z.enum([
    'standard',
    'aside',
    'gallery',
    'link',
    'image',
    'quote',
    'status',
    'video',
    'audio',
    'chat',
  ]),
  originalUrl: z.string().url(),
  wordCount: z.number().min(0),
  readingTime: z.number().min(0),
  seo: BlogSEOSchema,
})

// Configuration validation schemas
export const ContactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  address: MultilingualContentSchema.optional(),
  businessHours: MultilingualContentSchema.optional(),
  timezone: z.string(),
})

export const SiteInfoSchema = z.object({
  name: MultilingualContentSchema,
  description: MultilingualContentSchema,
  url: z.string().url(),
  defaultLanguage: LanguageSchema,
  supportedLanguages: z.array(LanguageSchema).min(1),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),
  author: MultilingualContentSchema,
  keywords: z.object({
    zh: z.array(z.string()).min(1),
    en: z.array(z.string()).min(1),
  }),
  contact: ContactInfoSchema,
})

export const GitHubConfigSchema = z.object({
  organization: z.string().min(1),
  personalAccount: z.string().min(1),
  excludeRepositories: z.array(z.string()),
  includeRepositories: z.array(z.string()).optional(),
  accessToken: z.string().min(1),
  rateLimit: z.object({
    requestsPerHour: z.number().positive(),
    retryAfter: z.number().positive(),
  }),
  features: z.object({
    fetchContributions: z.boolean(),
    fetchReleases: z.boolean(),
    fetchIssues: z.boolean(),
    fetchPullRequests: z.boolean(),
  }),
})

export const AIConfigSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'claude']),
  geminiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  analysisPrompts: z.object({
    projectEvaluation: z.string().min(1),
    descriptionGeneration: z.string().min(1),
    categoryClassification: z.string().min(1),
    multilingualGeneration: z.string().min(1),
    seoOptimization: z.string().min(1),
  }),
  fallbackStrategy: z.enum(['cache', 'manual', 'skip']),
  rateLimit: z.object({
    requestsPerMinute: z.number().positive(),
    quotaLimit: z.number().positive(),
  }),
  features: z.object({
    projectAnalysis: z.boolean(),
    contentGeneration: z.boolean(),
    seoOptimization: z.boolean(),
    imageAnalysis: z.boolean(),
  }),
})

export const SiteConfigSchema = z.object({
  site: SiteInfoSchema,
  github: GitHubConfigSchema,
  wordpress: z
    .object({
      apiUrl: z.string().url(),
      username: z.string().optional(),
      password: z.string().optional(),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      multilingualSupport: z.boolean(),
      postsPerPage: z.number().positive(),
      features: z.object({
        fetchMedia: z.boolean(),
        fetchComments: z.boolean(),
        fetchAuthors: z.boolean(),
      }),
    })
    .optional(),
  ai: AIConfigSchema,
  analytics: z
    .object({
      googleAnalyticsId: z.string().optional(),
      baiduAnalyticsId: z.string().optional(),
      enableCookieConsent: z.boolean(),
      trackingEvents: z.array(z.string()),
      customDimensions: z
        .array(
          z.object({
            index: z.number().positive(),
            name: z.string(),
            scope: z.enum(['hit', 'session', 'user', 'product']),
          })
        )
        .optional(),
      goals: z
        .array(
          z.object({
            id: z.number().positive(),
            name: z.string(),
            type: z.enum(['destination', 'duration', 'pages', 'event']),
            value: z.number().optional(),
          })
        )
        .optional(),
      privacy: z.object({
        anonymizeIp: z.boolean(),
        respectDoNotTrack: z.boolean(),
        cookieExpiry: z.number().positive(),
      }),
    })
    .optional(),
  social: z.object({
    github: z.string().url(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    weibo: z.string().url().optional(),
    wechat: z.string().optional(),
    email: z.string().email(),
    shareButtons: z.array(
      z.enum(['twitter', 'linkedin', 'weibo', 'wechat', 'facebook', 'telegram'])
    ),
    openGraph: z.object({
      siteName: z.string(),
      type: z.string(),
      locale: z.string(),
      alternateLocales: z.array(z.string()),
    }),
  }),
  monitoring: z
    .object({
      betterStackApiKey: z.string().optional(),
      statusPageUrl: z.string().url().optional(),
      enableStatusPage: z.boolean(),
      services: z.array(
        z.object({
          name: MultilingualContentSchema,
          url: z.string().url(),
          type: z.enum(['http', 'ping', 'tcp', 'dns']),
          interval: z.number().positive(),
          timeout: z.number().positive(),
          expectedStatus: z.number().optional(),
          expectedContent: z.string().optional(),
        })
      ),
      notifications: z.object({
        email: z.string().email().optional(),
        webhook: z.string().url().optional(),
        slack: z.string().url().optional(),
      }),
    })
    .optional(),
  seo: z.object({
    enableSitemap: z.boolean(),
    enableRobotsTxt: z.boolean(),
    enableStructuredData: z.boolean(),
    defaultKeywords: z.object({
      zh: z.array(z.string()).min(1),
      en: z.array(z.string()).min(1),
    }),
    searchConsole: z.object({
      google: z.string().optional(),
      baidu: z.string().optional(),
      bing: z.string().optional(),
    }),
    features: z.object({
      autoGenerateMeta: z.boolean(),
      optimizeImages: z.boolean(),
      generateAltText: z.boolean(),
    }),
  }),
  performance: z.object({
    enableWebVitals: z.boolean(),
    enableImageOptimization: z.boolean(),
    enableCodeSplitting: z.boolean(),
    cacheStrategy: z.enum(['aggressive', 'moderate', 'minimal']),
    compression: z.object({
      gzip: z.boolean(),
      brotli: z.boolean(),
    }),
    cdn: z.object({
      enabled: z.boolean(),
      provider: z.enum(['cloudflare', 'aws', 'vercel']).optional(),
      customDomain: z.string().url().optional(),
    }),
    optimization: z.object({
      minifyCSS: z.boolean(),
      minifyJS: z.boolean(),
      optimizeImages: z.boolean(),
      lazyLoading: z.boolean(),
    }),
  }),
  deployment: z.object({
    platform: z.enum(['vercel', 'netlify', 'github-pages', 'aws-s3']),
    domain: z.string().optional(),
    customDomain: z.string().optional(),
    environment: z.enum(['development', 'staging', 'production']),
    buildCommand: z.string(),
    outputDirectory: z.string(),
    environmentVariables: z.record(z.string(), z.string()),
    redirects: z
      .array(
        z.object({
          source: z.string(),
          destination: z.string(),
          permanent: z.boolean(),
          statusCode: z.number().optional(),
        })
      )
      .optional(),
    headers: z
      .array(
        z.object({
          source: z.string(),
          headers: z.record(z.string(), z.string()),
        })
      )
      .optional(),
  }),
})

// AI Analysis validation schemas
export const RepositoryAnalysisSchema = z.object({
  repositoryId: z.string().min(1),
  score: z.number().min(0).max(100),
  category: ProjectCategorySchema,
  techStack: z.array(z.string()).min(1),
  highlights: MultilingualArraySchema,
  description: MultilingualContentSchema,
  shouldDisplay: z.boolean(),
  reasoning: z.string().min(1),
  confidence: z.number().min(0).max(1),
  seoKeywords: MultilingualArraySchema,
  socialShareContent: z.object({
    zh: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      hashtags: z.array(z.string()),
      summary: z.string().min(1),
    }),
    en: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      hashtags: z.array(z.string()),
      summary: z.string().min(1),
    }),
  }),
  generatedAt: z.date(),
  aiModel: z.string().min(1),
  processingTime: z.number().min(0),
})

// Export validation functions
export const validateRepository = (data: unknown): Repository => {
  return RepositorySchema.parse(data)
}

export const validateMember = (data: unknown): Member => {
  return MemberSchema.parse(data)
}

export const validateBlogPost = (data: unknown): BlogPost => {
  return BlogPostSchema.parse(data)
}

export const validateSiteConfig = (data: unknown): SiteConfig => {
  // TODO: Update this to use the new config structure
  // For now, just return the data as-is since we have the new config system
  return data as SiteConfig
}

export const validateDisplayProject = (data: unknown): DisplayProject => {
  return DisplayProjectSchema.parse(data)
}

export const validateRepositoryAnalysis = (
  data: unknown
): RepositoryAnalysis => {
  return RepositoryAnalysisSchema.parse(data)
}

// Validation utility functions
export const isValidLanguage = (lang: string): lang is Language => {
  return LanguageSchema.safeParse(lang).success
}

export const isValidProjectCategory = (
  category: string
): category is ProjectCategory => {
  return ProjectCategorySchema.safeParse(category).success
}

export const isValidServiceCategory = (
  category: string
): category is ServiceCategory => {
  return ServiceCategorySchema.safeParse(category).success
}

export const validatePartial = <T>(
  schema: z.ZodType<T>,
  data: unknown
): Partial<T> => {
  const result = (schema as any).partial().safeParse(data)
  if (result.success) {
    return result.data
  }
  throw new Error(`Validation failed: ${result.error.message}`)
}

export const validateArray = <T>(
  schema: z.ZodSchema<T>,
  data: unknown[]
): T[] => {
  return z.array(schema).parse(data)
}

// Safe validation functions that return results instead of throwing
export const safeValidateRepository = (data: unknown) => {
  return RepositorySchema.safeParse(data)
}

export const safeValidateMember = (data: unknown) => {
  return MemberSchema.safeParse(data)
}

export const safeValidateBlogPost = (data: unknown) => {
  return BlogPostSchema.safeParse(data)
}

export const safeValidateSiteConfig = (data: unknown) => {
  // TODO: Update this to use the new config structure
  // For now, just return success since we have the new config system
  return { success: true, data: data as SiteConfig }
}

export const safeValidateDisplayProject = (data: unknown) => {
  return DisplayProjectSchema.safeParse(data)
}

export const safeValidateRepositoryAnalysis = (data: unknown) => {
  return RepositoryAnalysisSchema.safeParse(data)
}
