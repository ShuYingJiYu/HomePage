import { ProjectCategory, MultilingualContent, MultilingualArray } from './common'

// GitHub Repository related types
export interface Repository {
  id: string
  name: string
  fullName: string
  description: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  watchers: number
  size: number
  defaultBranch: string
  isPrivate: boolean
  isFork: boolean
  isArchived: boolean
  lastUpdated: Date
  createdAt: Date
  pushedAt: Date
  readme?: string
  homepage?: string
  license?: RepositoryLicense
  owner: RepositoryOwner
  urls: RepositoryUrls
}

export interface RepositoryLicense {
  key: string
  name: string
  spdxId: string
  url?: string
}

export interface RepositoryOwner {
  login: string
  id: number
  type: 'User' | 'Organization'
  avatarUrl: string
  htmlUrl: string
}

export interface RepositoryUrls {
  html: string
  git: string
  ssh: string
  clone: string
  api: string
}

export interface RepositoryDetails extends Repository {
  contributors: Contributor[]
  languages: LanguageStats
  commits: CommitStats
  releases: Release[]
  issues: IssueStats
  pullRequests: PullRequestStats
}

export interface Contributor {
  login: string
  id: number
  avatarUrl: string
  htmlUrl: string
  contributions: number
  type: 'User' | 'Bot'
}

export interface LanguageStats {
  [language: string]: {
    bytes: number
    percentage: number
  }
}

export interface CommitStats {
  total: number
  lastWeek: number
  lastMonth: number
  lastYear: number
}

export interface Release {
  id: number
  tagName: string
  name: string
  body: string
  publishedAt: Date
  isPrerelease: boolean
  isDraft: boolean
  author: RepositoryOwner
}

export interface IssueStats {
  open: number
  closed: number
  total: number
}

export interface PullRequestStats {
  open: number
  closed: number
  merged: number
  total: number
}

// Display Project (processed for frontend)
export interface DisplayProject {
  id: string
  name: string
  title: MultilingualContent
  description: MultilingualContent
  category: ProjectCategory
  techStack: string[]
  highlights: MultilingualArray
  githubUrl: string
  demoUrl?: string
  images: string[]
  stats: ProjectStats
  lastUpdated: Date
  featured: boolean
  aiGenerated: boolean
}

export interface ProjectStats {
  stars: number
  forks: number
  commits: number
  contributors: number
  issues: number
  pullRequests: number
}

// Tech Stack Statistics
export interface TechStackStats {
  languages: LanguageStat[]
  frameworks: FrameworkStat[]
  tools: ToolStat[]
  services: ServiceOffering[]
  totalProjects: number
  lastUpdated: Date
}

export interface LanguageStat {
  name: string
  percentage: number
  projectCount: number
  linesOfCode: number
  color: string
  category: 'programming' | 'markup' | 'stylesheet' | 'data' | 'other'
}

export interface FrameworkStat {
  name: string
  category: 'frontend' | 'backend' | 'mobile' | 'desktop' | 'testing' | 'other'
  projectCount: number
  percentage: number
  description: MultilingualContent
}

export interface ToolStat {
  name: string
  category: 'development' | 'deployment' | 'monitoring' | 'design' | 'other'
  projectCount: number
  description: MultilingualContent
}

export interface ServiceOffering {
  name: MultilingualContent
  description: MultilingualContent
  techStack: string[]
  category: 'frontend' | 'backend' | 'mobile' | 'devops' | 'consulting'
  featured: boolean
  pricing?: {
    type: 'fixed' | 'hourly' | 'project'
    range: MultilingualContent
  }
}