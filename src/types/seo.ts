import { Language } from './common'

// SEO related types
export interface SEOMetadata {
  title: string
  description: string
  keywords: string[]
  canonicalUrl?: string
  robots?: string
  author?: string
  publisher?: string
  language: Language
  alternateUrls?: Record<Language, string>
  openGraph: OpenGraphData
  twitter: TwitterCardData
  structuredData?: StructuredData[]
  customMeta?: MetaTag[]
}

export interface MetaTag {
  name?: string
  property?: string
  content: string
  httpEquiv?: string
}

export interface OpenGraphData {
  title: string
  description: string
  type: 'website' | 'article' | 'profile' | 'book' | 'music' | 'video'
  url: string
  image: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  siteName: string
  locale: string
  alternateLocales?: string[]
  article?: ArticleOpenGraph
  profile?: ProfileOpenGraph
}

export interface ArticleOpenGraph {
  publishedTime?: string
  modifiedTime?: string
  expirationTime?: string
  author?: string[]
  section?: string
  tag?: string[]
}

export interface ProfileOpenGraph {
  firstName?: string
  lastName?: string
  username?: string
  gender?: string
}

export interface TwitterCardData {
  card: 'summary' | 'summary_large_image' | 'app' | 'player'
  site?: string
  creator?: string
  title: string
  description: string
  image?: string
  imageAlt?: string
  app?: TwitterAppData
  player?: TwitterPlayerData
}

export interface TwitterAppData {
  name: {
    iphone?: string
    ipad?: string
    googleplay?: string
  }
  id: {
    iphone?: string
    ipad?: string
    googleplay?: string
  }
  url: {
    iphone?: string
    ipad?: string
    googleplay?: string
  }
}

export interface TwitterPlayerData {
  url: string
  width: number
  height: number
  stream?: string
}

// Structured Data (JSON-LD)
export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: unknown
}

export interface OrganizationStructuredData extends StructuredData {
  '@type': 'Organization'
  name: string
  url: string
  logo?: string
  description?: string
  foundingDate?: string
  founder?: PersonStructuredData[]
  address?: PostalAddressStructuredData
  contactPoint?: ContactPointStructuredData[]
  sameAs?: string[]
  employee?: PersonStructuredData[]
}

export interface PersonStructuredData extends StructuredData {
  '@type': 'Person'
  name: string
  url?: string
  image?: string
  jobTitle?: string
  worksFor?: OrganizationStructuredData
  sameAs?: string[]
  knowsAbout?: string[]
}

export interface PostalAddressStructuredData extends StructuredData {
  '@type': 'PostalAddress'
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string
}

export interface ContactPointStructuredData extends StructuredData {
  '@type': 'ContactPoint'
  contactType: string
  telephone?: string
  email?: string
  url?: string
  availableLanguage?: string[]
}

export interface WebSiteStructuredData extends StructuredData {
  '@type': 'WebSite'
  name: string
  url: string
  description?: string
  publisher?: OrganizationStructuredData
  potentialAction?: SearchActionStructuredData
  inLanguage?: string[]
}

export interface SearchActionStructuredData extends StructuredData {
  '@type': 'SearchAction'
  target: string
  'query-input': string
}

export interface SoftwareApplicationStructuredData extends StructuredData {
  '@type': 'SoftwareApplication'
  name: string
  description?: string
  url?: string
  applicationCategory?: string
  operatingSystem?: string[]
  programmingLanguage?: string[]
  codeRepository?: string
  downloadUrl?: string
  softwareVersion?: string
  datePublished?: string
  dateModified?: string
  author?: PersonStructuredData | OrganizationStructuredData
  license?: string
}

export interface BlogPostingStructuredData extends StructuredData {
  '@type': 'BlogPosting'
  headline: string
  description?: string
  image?: string[]
  datePublished: string
  dateModified?: string
  author: PersonStructuredData
  publisher: OrganizationStructuredData
  mainEntityOfPage?: string
  url?: string
  wordCount?: number
  articleSection?: string[]
  keywords?: string[]
}

// Sitemap types
export interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  alternates?: SitemapAlternate[]
  images?: SitemapImage[]
}

export interface SitemapAlternate {
  hreflang: string
  href: string
}

export interface SitemapImage {
  url: string
  caption?: string
  title?: string
  geoLocation?: string
  license?: string
}

export interface Sitemap {
  entries: SitemapEntry[]
  lastmod: string
  xmlns?: Record<string, string>
}

// Robots.txt
export interface RobotsConfig {
  userAgent: string
  allow?: string[]
  disallow?: string[]
  crawlDelay?: number
  sitemap?: string[]
}

// SEO Analysis
export interface SEOAnalysis {
  score: number // 0-100
  issues: SEOIssue[]
  recommendations: SEORecommendation[]
  metrics: SEOMetrics
  competitorAnalysis?: CompetitorAnalysis
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: 'technical' | 'content' | 'performance' | 'mobile' | 'social'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  fix?: string
  url?: string
}

export interface SEORecommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
  impact: 'high' | 'medium' | 'low'
  category: 'technical' | 'content' | 'performance' | 'mobile' | 'social'
}

export interface SEOMetrics {
  titleLength: number
  descriptionLength: number
  keywordDensity: Record<string, number>
  headingStructure: HeadingStructure
  imageOptimization: ImageOptimization
  internalLinks: number
  externalLinks: number
  pageSpeed: PageSpeedMetrics
  mobileUsability: MobileUsabilityMetrics
}

export interface HeadingStructure {
  h1: number
  h2: number
  h3: number
  h4: number
  h5: number
  h6: number
  structure: HeadingNode[]
}

export interface HeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
  children?: HeadingNode[]
}

export interface ImageOptimization {
  total: number
  withAlt: number
  withTitle: number
  optimized: number
  issues: string[]
}

export interface PageSpeedMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
  score: number
}

export interface MobileUsabilityMetrics {
  responsive: boolean
  viewportConfigured: boolean
  textReadable: boolean
  tapTargetsAppropriate: boolean
  contentSized: boolean
  score: number
}

export interface CompetitorAnalysis {
  competitors: Competitor[]
  comparison: CompetitorComparison
  opportunities: string[]
}

export interface Competitor {
  domain: string
  title: string
  description: string
  keywords: string[]
  backlinks: number
  organicTraffic: number
  seoScore: number
}

export interface CompetitorComparison {
  keywordOverlap: number
  contentGaps: string[]
  strengthsWeaknesses: {
    strengths: string[]
    weaknesses: string[]
  }
}