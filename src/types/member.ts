import { MultilingualContent } from './common'

// Team Member related types
export interface Member {
  id: string
  name: string
  username: string
  role: MultilingualContent
  avatar: string
  githubUsername: string
  bio: MultilingualContent
  skills: string[]
  contributions: MemberContributions
  socialLinks: SocialLinks
  joinDate: Date
  isActive: boolean
  featured: boolean
}

export interface MemberContributions {
  commits: number
  pullRequests: number
  issues: number
  reviews: number
  repositories: number
  totalContributions: number
  contributionCalendar: ContributionDay[]
  topLanguages: LanguageContribution[]
  streak: ContributionStreak
}

export interface ContributionDay {
  date: Date
  count: number
  level: 0 | 1 | 2 | 3 | 4 // GitHub contribution levels
}

export interface LanguageContribution {
  language: string
  commits: number
  percentage: number
  color: string
}

export interface ContributionStreak {
  current: number
  longest: number
  currentStart?: Date
  currentEnd?: Date
  longestStart?: Date
  longestEnd?: Date
}

export interface SocialLinks {
  github: string
  twitter?: string
  linkedin?: string
  blog?: string
  email?: string
  website?: string
  weibo?: string
  wechat?: string
}

// Organization related types
export interface Organization {
  id: string
  login: string
  name: string
  description?: string
  avatarUrl: string
  websiteUrl?: string
  location?: string
  email?: string
  twitterUsername?: string
  blog?: string
  company?: string
  createdAt: Date
  updatedAt: Date
  publicRepos: number
  publicGists: number
  followers: number
  following: number
  htmlUrl: string
}

export interface OrganizationMembership {
  user: Member
  role: 'admin' | 'member'
  state: 'active' | 'pending'
  visibility: 'public' | 'private'
}

// GitHub User Profile
export interface GitHubProfile {
  login: string
  id: number
  nodeId: string
  avatarUrl: string
  gravatarId?: string
  url: string
  htmlUrl: string
  followersUrl: string
  followingUrl: string
  gistsUrl: string
  starredUrl: string
  subscriptionsUrl: string
  organizationsUrl: string
  reposUrl: string
  eventsUrl: string
  receivedEventsUrl: string
  type: 'User' | 'Organization'
  siteAdmin: boolean
  name?: string
  company?: string
  blog?: string
  location?: string
  email?: string
  hireable?: boolean
  bio?: string
  twitterUsername?: string
  publicRepos: number
  publicGists: number
  followers: number
  following: number
  createdAt: Date
  updatedAt: Date
}