import { Language, MultilingualContent } from './common'

// Social Media and Sharing types
export interface SocialShareManager {
  generateShareContent(item: ShareableContent): SocialShareContent
  shareToWeChat(content: SocialShareContent): void
  shareToWeibo(content: SocialShareContent): void
  shareToTwitter(content: SocialShareContent): void
  shareToLinkedIn(content: SocialShareContent): void
  copyShareLink(url: string): void
}

export interface ShareableContent {
  id: string
  type: 'project' | 'blog' | 'page'
  title: MultilingualContent
  description: MultilingualContent
  url: string
  image?: string
  tags?: string[]
  category?: string
  publishDate?: Date
}

export interface SocialShareContent {
  title: string
  description: string
  url: string
  image: string
  hashtags: string[]
  via?: string
  language: Language
  platform?: SocialPlatform
}

export type SocialPlatform = 
  | 'twitter' 
  | 'linkedin' 
  | 'weibo' 
  | 'wechat' 
  | 'facebook' 
  | 'telegram'

export interface SocialPlatformConfig {
  platform: SocialPlatform
  enabled: boolean
  apiKey?: string
  appId?: string
  shareUrl: string
  parameters: SocialShareParameter[]
  customization?: PlatformCustomization
}

export interface SocialShareParameter {
  name: string
  value: string | ((content: SocialShareContent) => string)
  required: boolean
}

export interface PlatformCustomization {
  maxTitleLength?: number
  maxDescriptionLength?: number
  hashtagLimit?: number
  imageRequirements?: ImageRequirements
  urlShortening?: boolean
}

export interface ImageRequirements {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  aspectRatio?: number
  formats: string[]
  maxSize: number // in bytes
}

// Social Media Analytics
export interface SocialAnalytics {
  platform: SocialPlatform
  metrics: SocialMetrics
  posts: SocialPost[]
  engagement: EngagementMetrics
  audience: AudienceMetrics
  trends: TrendMetrics
  lastUpdated: Date
}

export interface SocialMetrics {
  followers: number
  following: number
  posts: number
  likes: number
  shares: number
  comments: number
  impressions: number
  reach: number
  engagementRate: number
}

export interface SocialPost {
  id: string
  platform: SocialPlatform
  content: string
  url: string
  publishDate: Date
  metrics: PostMetrics
  media?: SocialMedia[]
  hashtags: string[]
  mentions: string[]
}

export interface PostMetrics {
  likes: number
  shares: number
  comments: number
  clicks: number
  impressions: number
  reach: number
  engagementRate: number
  saves?: number
  retweets?: number
}

export interface SocialMedia {
  type: 'image' | 'video' | 'gif' | 'document'
  url: string
  thumbnail?: string
  alt?: string
  caption?: string
  duration?: number // for videos
  size?: number
}

export interface EngagementMetrics {
  averageEngagementRate: number
  bestPerformingPosts: SocialPost[]
  worstPerformingPosts: SocialPost[]
  engagementByTime: TimeSeriesData[]
  engagementByType: Record<string, number>
  topHashtags: HashtagMetrics[]
}

export interface TimeSeriesData {
  timestamp: Date
  value: number
  label?: string
}

export interface HashtagMetrics {
  hashtag: string
  usage: number
  engagement: number
  reach: number
  trending: boolean
}

export interface AudienceMetrics {
  demographics: Demographics
  interests: Interest[]
  locations: Location[]
  devices: DeviceMetrics
  languages: LanguageMetrics[]
}

export interface Demographics {
  ageGroups: AgeGroup[]
  gender: GenderDistribution
  education: EducationLevel[]
  income: IncomeLevel[]
}

export interface AgeGroup {
  range: string
  percentage: number
  count: number
}

export interface GenderDistribution {
  male: number
  female: number
  other: number
  unknown: number
}

export interface EducationLevel {
  level: string
  percentage: number
}

export interface IncomeLevel {
  range: string
  percentage: number
}

export interface Interest {
  category: string
  subcategories: string[]
  affinity: number // 0-1
}

export interface Location {
  country: string
  region?: string
  city?: string
  percentage: number
  count: number
}

export interface DeviceMetrics {
  desktop: number
  mobile: number
  tablet: number
  other: number
}

export interface LanguageMetrics {
  language: string
  percentage: number
  count: number
}

export interface TrendMetrics {
  growthRate: number
  seasonality: SeasonalityData[]
  predictions: PredictionData[]
  benchmarks: BenchmarkData
}

export interface SeasonalityData {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  pattern: TimeSeriesData[]
  strength: number
}

export interface PredictionData {
  metric: string
  predictions: TimeSeriesData[]
  confidence: number
  accuracy?: number
}

export interface BenchmarkData {
  industry: string
  averageEngagementRate: number
  averageFollowerGrowth: number
  averagePostFrequency: number
  topPerformers: CompetitorMetrics[]
}

export interface CompetitorMetrics {
  name: string
  platform: SocialPlatform
  followers: number
  engagementRate: number
  postFrequency: number
  topContent: string[]
}

// Social Media Management
export interface SocialMediaManager {
  schedulePost(post: ScheduledPost): Promise<void>
  publishPost(post: SocialPost): Promise<PostResult>
  deletePost(postId: string, platform: SocialPlatform): Promise<void>
  updatePost(postId: string, updates: Partial<SocialPost>): Promise<PostResult>
  getAnalytics(platform: SocialPlatform, dateRange: SocialDateRange): Promise<SocialAnalytics>
  crossPost(content: CrossPostContent): Promise<CrossPostResult[]>
}

export interface ScheduledPost {
  content: string
  platforms: SocialPlatform[]
  scheduledTime: Date
  media?: SocialMedia[]
  hashtags?: string[]
  mentions?: string[]
  settings?: PostSettings
}

export interface PostSettings {
  autoHashtags: boolean
  crossPost: boolean
  trackEngagement: boolean
  notifyOnPublish: boolean
  customization?: Record<SocialPlatform, PlatformSpecificSettings>
}

export interface PlatformSpecificSettings {
  content?: string
  hashtags?: string[]
  mentions?: string[]
  media?: SocialMedia[]
}

export interface PostResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
  platform: SocialPlatform
  publishedAt: Date
}

export interface CrossPostContent {
  baseContent: string
  media?: SocialMedia[]
  hashtags?: string[]
  platforms: SocialPlatform[]
  customizations?: Record<SocialPlatform, PlatformSpecificSettings>
}

export interface CrossPostResult {
  platform: SocialPlatform
  result: PostResult
}

export interface SocialDateRange {
  start: Date
  end: Date
}