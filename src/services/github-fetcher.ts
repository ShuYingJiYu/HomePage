/**
 * GitHub Data Fetcher Service
 * Handles all GitHub API interactions including repositories, members, and contributions
 */

import type {
  Repository,
  RepositoryDetails,
  Contributor,
  LanguageStats,
  Release,
  CommitStats,
  IssueStats,
  PullRequestStats,
} from '@/types/repository'
import type {
  MemberContributions,
  ContributionDay,
  LanguageContribution,
  ContributionStreak,
  Organization,
  GitHubProfile,
} from '@/types/member'
import type { GitHubConfig } from '@/types/config'
import {
  githubConfig,
  githubEndpoints,
  githubHeaders,
} from '@/config/github.config'

/**
 * GitHub API Error types
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'GitHubApiError'
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(
    message: string,
    public resetTime: Date,
    public remaining: number
  ) {
    super(message, 403)
    this.name = 'GitHubRateLimitError'
  }
}

/**
 * GitHub API Response interfaces
 */
interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  topics: string[]
  stargazers_count: number
  forks_count: number
  watchers_count: number
  size: number
  default_branch: string
  private: boolean
  fork: boolean
  archived: boolean
  updated_at: string
  created_at: string
  pushed_at: string
  homepage: string | null
  license: {
    key: string
    name: string
    spdx_id: string
    url?: string
  } | null
  owner: {
    login: string
    id: number
    type: 'User' | 'Organization'
    avatar_url: string
    html_url: string
  }
  html_url: string
  git_url: string
  ssh_url: string
  clone_url: string
  url: string
}

interface GitHubUser {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id?: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: 'User' | 'Organization'
  site_admin: boolean
  name?: string
  company?: string
  blog?: string
  location?: string
  email?: string
  hireable?: boolean
  bio?: string
  twitter_username?: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

/**
 * Request options for GitHub API calls
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  timeout?: number
  retries?: number
}

/**
 * GitHub Data Fetcher Class
 */
export class GitHubFetcher {
  private config: GitHubConfig
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private rateLimitRemaining: number = 5000
  private rateLimitReset: Date = new Date()

  constructor(config?: Partial<GitHubConfig>) {
    this.config = { ...githubConfig, ...config }
    this.baseUrl = githubEndpoints.baseUrl
    this.defaultHeaders = {
      ...githubHeaders,
      Authorization: `token ${this.config.accessToken}`,
    }

    if (!this.config.accessToken) {
      console.warn(
        '⚠️  GitHub access token not provided. API requests may be rate limited.'
      )
    }
  }

  /**
   * Make authenticated request to GitHub API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const maxRetries = options.retries || 3
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        // Check rate limit before making request
        await this.checkRateLimit()

        const controller = new AbortController()
        const timeoutId = options.timeout 
          ? setTimeout(() => controller.abort(), options.timeout)
          : null

        const response = await fetch(url, {
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

        // Update rate limit info from response headers
        this.updateRateLimitInfo(response)

        if (!response.ok) {
          // Handle different types of errors
          if (response.status === 403) {
            const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
            if (rateLimitRemaining === '0') {
              const resetTime = new Date(
                parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000
              )
              throw new GitHubRateLimitError(
                'GitHub API rate limit exceeded',
                resetTime,
                0
              )
            }
          }

          // Handle authentication errors
          if (response.status === 401) {
            throw new GitHubApiError(
              'GitHub API authentication failed. Check your access token.',
              response.status
            )
          }

          // Handle not found errors
          if (response.status === 404) {
            throw new GitHubApiError(
              `Resource not found: ${endpoint}`,
              response.status
            )
          }

          // Handle server errors
          if (response.status >= 500) {
            throw new GitHubApiError(
              `GitHub API server error: ${response.status}`,
              response.status
            )
          }

          const errorData = await response.json().catch(() => ({}))
          throw new GitHubApiError(
            errorData.message || `GitHub API error: ${response.status}`,
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

        // Handle rate limit errors with intelligent backoff
        if (error instanceof GitHubRateLimitError) {
          if (this.config.errorHandling.rateLimitStrategy === 'retry-backoff') {
            const resetTime = error.resetTime.getTime()
            const now = Date.now()
            const waitTime = Math.min(resetTime - now + 1000, 300000) // Max 5 minutes
            
            if (waitTime > 0) {
              console.warn(
                `⏳ Rate limit hit, waiting ${Math.ceil(waitTime / 1000)}s before retry ${attempt}/${maxRetries}`
              )
              await this.sleep(waitTime)
              continue
            }
          } else {
            throw error
          }
        }

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
            `❌ GitHub API request failed after ${maxRetries} retries:`,
            error
          )
          throw error
        }

        // Exponential backoff with jitter for other errors
        const baseBackoff = 1000 * Math.pow(2, attempt)
        const jitter = Math.random() * 1000 // Add randomness to avoid thundering herd
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
   * Check if we're approaching rate limit and wait if necessary
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining < 100 && new Date() < this.rateLimitReset) {
      const waitTime = this.rateLimitReset.getTime() - Date.now()
      if (waitTime > 0) {
        console.warn(`⏳ Approaching rate limit, waiting ${waitTime / 1000}s`)
        await this.sleep(waitTime)
      }
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(response: Response): void {
    if (!response || !response.headers) {
      return
    }

    const remaining = response.headers.get('x-ratelimit-remaining')
    const reset = response.headers.get('x-ratelimit-reset')

    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining)
    }

    if (reset) {
      this.rateLimitReset = new Date(parseInt(reset) * 1000)
    }
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Transform GitHub repository response to internal Repository type
   */
  private transformRepository(repo: GitHubRepository): Repository {
    return {
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics || [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      size: repo.size,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      isFork: repo.fork,
      isArchived: repo.archived,
      lastUpdated: new Date(repo.updated_at),
      createdAt: new Date(repo.created_at),
      pushedAt: new Date(repo.pushed_at),
      homepage: repo.homepage || undefined,
      license: repo.license
        ? {
            key: repo.license.key,
            name: repo.license.name,
            spdxId: repo.license.spdx_id,
            url: repo.license.url,
          }
        : undefined,
      owner: {
        login: repo.owner.login,
        id: repo.owner.id,
        type: repo.owner.type,
        avatarUrl: repo.owner.avatar_url,
        htmlUrl: repo.owner.html_url,
      },
      urls: {
        html: repo.html_url,
        git: repo.git_url,
        ssh: repo.ssh_url,
        clone: repo.clone_url,
        api: repo.url,
      },
    }
  }

  /**
   * Transform GitHub user response to internal GitHubProfile type
   */
  private transformUser(user: GitHubUser): GitHubProfile {
    return {
      login: user.login,
      id: user.id,
      nodeId: user.node_id,
      avatarUrl: user.avatar_url,
      gravatarId: user.gravatar_id,
      url: user.url,
      htmlUrl: user.html_url,
      followersUrl: user.followers_url,
      followingUrl: user.following_url,
      gistsUrl: user.gists_url,
      starredUrl: user.starred_url,
      subscriptionsUrl: user.subscriptions_url,
      organizationsUrl: user.organizations_url,
      reposUrl: user.repos_url,
      eventsUrl: user.events_url,
      receivedEventsUrl: user.received_events_url,
      type: user.type,
      siteAdmin: user.site_admin,
      name: user.name,
      company: user.company,
      blog: user.blog,
      location: user.location,
      email: user.email,
      hireable: user.hireable,
      bio: user.bio,
      twitterUsername: user.twitter_username,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      followers: user.followers,
      following: user.following,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }
  }

  /**
   * Fetch repositories from organization
   */
  async fetchOrganizationRepositories(): Promise<Repository[]> {
    if (!this.config.organization) {
      console.warn(
        '⚠️  No organization configured, skipping organization repositories'
      )
      return []
    }

    console.log(
      `🏢 Fetching repositories for organization: ${this.config.organization}`
    )

    try {
      const repos: GitHubRepository[] = await this.makeRequest(
        `${githubEndpoints.orgRepos(
          this.config.organization
        )}?per_page=100&sort=updated`
      )

      const filteredRepos = repos.filter(repo =>
        this.shouldIncludeRepository(repo)
      )
      console.log(
        `✅ Found ${filteredRepos.length} repositories (${repos.length} total, ${repos.length - filteredRepos.length} filtered out)`
      )

      return filteredRepos.map(repo => this.transformRepository(repo))
    } catch (error) {
      console.error(`❌ Failed to fetch organization repositories:`, error)

      if (this.config.errorHandling.networkErrorStrategy === 'use-cache') {
        console.warn('🔄 Falling back to cached data (if available)')
        return []
      }

      throw error
    }
  }

  /**
   * Fetch repositories from personal account
   */
  async fetchUserRepositories(): Promise<Repository[]> {
    if (!this.config.personalAccount) {
      console.warn(
        '⚠️  No personal account configured, skipping user repositories'
      )
      return []
    }

    console.log(
      `👤 Fetching repositories for user: ${this.config.personalAccount}`
    )

    try {
      const repos: GitHubRepository[] = await this.makeRequest(
        `${githubEndpoints.userRepos(
          this.config.personalAccount
        )}?per_page=100&sort=updated&type=owner`
      )

      const filteredRepos = repos.filter(repo =>
        this.shouldIncludeRepository(repo)
      )
      console.log(
        `✅ Found ${filteredRepos.length} repositories (${repos.length} total, ${repos.length - filteredRepos.length} filtered out)`
      )

      return filteredRepos.map(repo => this.transformRepository(repo))
    } catch (error) {
      console.error(`❌ Failed to fetch user repositories:`, error)

      if (this.config.errorHandling.networkErrorStrategy === 'use-cache') {
        console.warn('🔄 Falling back to cached data (if available)')
        return []
      }

      throw error
    }
  }

  /**
   * Fetch all repositories (organization + personal)
   */
  async fetchRepositories(): Promise<Repository[]> {
    console.log('📦 Starting repository data fetch...')

    const [orgRepos, userRepos] = await Promise.allSettled([
      this.fetchOrganizationRepositories(),
      this.fetchUserRepositories(),
    ])

    const repositories: Repository[] = []

    if (orgRepos.status === 'fulfilled') {
      repositories.push(...orgRepos.value)
    } else {
      console.error(
        '❌ Organization repositories fetch failed:',
        orgRepos.reason
      )
    }

    if (userRepos.status === 'fulfilled') {
      repositories.push(...userRepos.value)
    } else {
      console.error('❌ User repositories fetch failed:', userRepos.reason)
    }

    // Remove duplicates based on full name
    const uniqueRepos = repositories.filter(
      (repo, index, self) =>
        index === self.findIndex(r => r.fullName === repo.fullName)
    )

    console.log(`✅ Total repositories fetched: ${uniqueRepos.length}`)
    return uniqueRepos
  }

  /**
   * Check if repository should be included based on filters
   */
  private shouldIncludeRepository(repo: GitHubRepository): boolean {
    // Check exclude list
    if (this.config.excludeRepositories.includes(repo.name)) {
      return false
    }

    // Check include list (if specified)
    if (
      this.config.includeRepositories &&
      !this.config.includeRepositories.includes(repo.name)
    ) {
      return false
    }

    // Skip private repositories
    if (repo.private) {
      return false
    }

    // Skip archived repositories
    if (repo.archived) {
      return false
    }

    return true
  }

  /**
   * Fetch organization members
   */
  async fetchOrganizationMembers(): Promise<GitHubProfile[]> {
    if (!this.config.organization) {
      console.warn(
        '⚠️  No organization configured, skipping organization members'
      )
      return []
    }

    console.log(
      `👥 Fetching members for organization: ${this.config.organization}`
    )

    try {
      const members: GitHubUser[] = await this.makeRequest(
        `${githubEndpoints.orgMembers(this.config.organization)}?per_page=100`
      )

      console.log(`✅ Found ${members.length} organization members`)
      return members.map(member => this.transformUser(member))
    } catch (error) {
      console.error(`❌ Failed to fetch organization members:`, error)

      if (this.config.errorHandling.networkErrorStrategy === 'use-cache') {
        console.warn('🔄 Falling back to cached data (if available)')
        return []
      }

      throw error
    }
  }

  /**
   * Fetch detailed user profile
   */
  async fetchUserProfile(username: string): Promise<GitHubProfile> {
    console.log(`👤 Fetching profile for user: ${username}`)

    try {
      const user: GitHubUser = await this.makeRequest(
        githubEndpoints.userDetails(username)
      )

      return this.transformUser(user)
    } catch (error) {
      console.error(`❌ Failed to fetch user profile for ${username}:`, error)
      throw error
    }
  }

  /**
   * Fetch repository details including contributors, languages, etc.
   */
  async fetchRepositoryDetails(
    owner: string,
    repo: string
  ): Promise<RepositoryDetails> {
    console.log(`📊 Fetching detailed data for repository: ${owner}/${repo}`)

    try {
      // Fetch basic repository info
      const repoData: GitHubRepository = await this.makeRequest(
        githubEndpoints.repoDetails(owner, repo)
      )

      // Fetch additional data in parallel
      const [contributors, languages, readme, releases, commitStats, issueStats, prStats] =
        await Promise.allSettled([
          this.fetchRepositoryContributors(owner, repo),
          this.fetchRepositoryLanguages(owner, repo),
          this.fetchRepositoryReadme(owner, repo),
          this.fetchRepositoryReleases(owner, repo),
          this.fetchRepositoryCommitStats(owner, repo),
          this.fetchRepositoryIssueStats(owner, repo),
          this.fetchRepositoryPullRequestStats(owner, repo),
        ])

      const repository = this.transformRepository(repoData)

      const details: RepositoryDetails = {
        ...repository,
        contributors:
          contributors.status === 'fulfilled' ? contributors.value : [],
        languages: languages.status === 'fulfilled' ? languages.value : {},
        commits: commitStats.status === 'fulfilled' ? commitStats.value : { total: 0, lastWeek: 0, lastMonth: 0, lastYear: 0 },
        releases: releases.status === 'fulfilled' ? releases.value : [],
        issues: issueStats.status === 'fulfilled' ? issueStats.value : { open: 0, closed: 0, total: 0 },
        pullRequests: prStats.status === 'fulfilled' ? prStats.value : { open: 0, closed: 0, merged: 0, total: 0 },
      }

      if (readme.status === 'fulfilled') {
        details.readme = readme.value
      }

      return details
    } catch (error) {
      console.error(
        `❌ Failed to fetch repository details for ${owner}/${repo}:`,
        error
      )
      throw error
    }
  }

  /**
   * Fetch repository commit statistics
   */
  async fetchRepositoryCommitStats(
    owner: string,
    repo: string
  ): Promise<CommitStats> {
    try {
      // Fetch recent commits to calculate statistics
      const commits: any[] = await this.makeRequest(
        `/repos/${owner}/${repo}/commits?per_page=100&since=${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()}`
      )

      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

      const stats = {
        total: commits.length,
        lastWeek: 0,
        lastMonth: 0,
        lastYear: 0,
      }

      commits.forEach(commit => {
        const commitDate = new Date(commit.commit.author.date)
        
        if (commitDate >= oneWeekAgo) {
          stats.lastWeek++
        }
        if (commitDate >= oneMonthAgo) {
          stats.lastMonth++
        }
        if (commitDate >= oneYearAgo) {
          stats.lastYear++
        }
      })

      return stats
    } catch (error) {
      console.warn(`⚠️  Failed to fetch commit stats for ${owner}/${repo}:`, error)
      return { total: 0, lastWeek: 0, lastMonth: 0, lastYear: 0 }
    }
  }

  /**
   * Fetch repository issue statistics
   */
  async fetchRepositoryIssueStats(
    owner: string,
    repo: string
  ): Promise<IssueStats> {
    try {
      const [openIssues, closedIssues] = await Promise.allSettled([
        this.makeRequest(`/repos/${owner}/${repo}/issues?state=open&per_page=100`),
        this.makeRequest(`/repos/${owner}/${repo}/issues?state=closed&per_page=100`),
      ])

      const open = openIssues.status === 'fulfilled' ? (openIssues.value as any[]).length : 0
      const closed = closedIssues.status === 'fulfilled' ? (closedIssues.value as any[]).length : 0

      return {
        open,
        closed,
        total: open + closed,
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch issue stats for ${owner}/${repo}:`, error)
      return { open: 0, closed: 0, total: 0 }
    }
  }

  /**
   * Fetch repository pull request statistics
   */
  async fetchRepositoryPullRequestStats(
    owner: string,
    repo: string
  ): Promise<PullRequestStats> {
    try {
      const [openPRs, closedPRs] = await Promise.allSettled([
        this.makeRequest(`/repos/${owner}/${repo}/pulls?state=open&per_page=100`),
        this.makeRequest(`/repos/${owner}/${repo}/pulls?state=closed&per_page=100`),
      ])

      const open = openPRs.status === 'fulfilled' ? (openPRs.value as any[]).length : 0
      const closedData = closedPRs.status === 'fulfilled' ? (closedPRs.value as any[]) : []
      
      // Count merged vs closed PRs
      const merged = (closedData as any[]).filter((pr: any) => pr.merged_at !== null).length
      const closed = (closedData as any[]).length - merged

      return {
        open,
        closed,
        merged,
        total: open + closed + merged,
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch PR stats for ${owner}/${repo}:`, error)
      return { open: 0, closed: 0, merged: 0, total: 0 }
    }
  }

  /**
   * Fetch repository contributors
   */
  async fetchRepositoryContributors(
    owner: string,
    repo: string
  ): Promise<Contributor[]> {
    try {
      const contributors: any[] = await this.makeRequest(
        `/repos/${owner}/${repo}/contributors?per_page=100`
      )

      return contributors.map(contributor => ({
        login: contributor.login,
        id: contributor.id,
        avatarUrl: contributor.avatar_url,
        htmlUrl: contributor.html_url,
        contributions: contributor.contributions,
        type: contributor.type === 'Bot' ? 'Bot' : 'User',
      }))
    } catch (error) {
      console.warn(
        `⚠️  Failed to fetch contributors for ${owner}/${repo}:`,
        error
      )
      return []
    }
  }

  /**
   * Fetch repository languages
   */
  async fetchRepositoryLanguages(
    owner: string,
    repo: string
  ): Promise<LanguageStats> {
    try {
      const languages: Record<string, number> = await this.makeRequest(
        githubEndpoints.repoLanguages(owner, repo)
      )

      const totalBytes = Object.values(languages).reduce(
        (sum, bytes) => sum + bytes,
        0
      )
      const languageStats: LanguageStats = {}

      for (const [language, bytes] of Object.entries(languages)) {
        languageStats[language] = {
          bytes,
          percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
        }
      }

      return languageStats
    } catch (error) {
      console.warn(`⚠️  Failed to fetch languages for ${owner}/${repo}:`, error)
      return {}
    }
  }

  /**
   * Fetch repository README
   */
  async fetchRepositoryReadme(owner: string, repo: string): Promise<string> {
    try {
      const readme: any = await this.makeRequest(
        githubEndpoints.repoReadme(owner, repo)
      )

      // Decode base64 content
      if (readme.content && readme.encoding === 'base64') {
        return atob(readme.content.replace(/\n/g, ''))
      }

      return readme.content || ''
    } catch (error) {
      console.warn(`⚠️  Failed to fetch README for ${owner}/${repo}:`, error)
      return ''
    }
  }

  /**
   * Fetch repository releases
   */
  async fetchRepositoryReleases(
    owner: string,
    repo: string
  ): Promise<Release[]> {
    try {
      const releases: any[] = await this.makeRequest(
        `/repos/${owner}/${repo}/releases?per_page=10`
      )

      return releases.map(release => ({
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        publishedAt: new Date(release.published_at),
        isPrerelease: release.prerelease,
        isDraft: release.draft,
        author: {
          login: release.author.login,
          id: release.author.id,
          type: release.author.type,
          avatarUrl: release.author.avatar_url,
          htmlUrl: release.author.html_url,
        },
      }))
    } catch (error) {
      console.warn(`⚠️  Failed to fetch releases for ${owner}/${repo}:`, error)
      return []
    }
  }

  /**
   * Fetch user contribution statistics
   */
  async fetchUserContributions(username: string): Promise<MemberContributions> {
    console.log(`📈 Fetching contribution statistics for user: ${username}`)

    try {
      // Fetch multiple data sources in parallel for comprehensive stats
      const [events, profile, repos] = await Promise.allSettled([
        this.makeRequest(`/users/${username}/events/public?per_page=100`),
        this.fetchUserProfile(username),
        this.makeRequest(`/users/${username}/repos?per_page=100&type=owner`),
      ])

      // Calculate contribution statistics from events
      const eventsData = events.status === 'fulfilled' ? (events.value as any[]) : []
      const contributions = this.calculateContributionStats(eventsData, username)

      // Add profile data
      if (profile.status === 'fulfilled') {
        contributions.repositories = profile.value.publicRepos
      }

      // Add language statistics from repositories
      if (repos.status === 'fulfilled') {
        const languageStats = await this.calculateUserLanguageStats(repos.value as any[], username)
        contributions.topLanguages = languageStats
      }

      return contributions
    } catch (error) {
      console.error(`❌ Failed to fetch contributions for ${username}:`, error)

      // Return empty contribution stats as fallback
      return {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0,
        repositories: 0,
        totalContributions: 0,
        contributionCalendar: [],
        topLanguages: [],
        streak: {
          current: 0,
          longest: 0,
        },
      }
    }
  }

  /**
   * Calculate user language statistics from their repositories
   */
  private async calculateUserLanguageStats(
    repos: any[],
    username: string
  ): Promise<LanguageContribution[]> {
    const languageMap = new Map<string, { commits: number; bytes: number }>()
    const maxRepos = Math.min(repos.length, 20) // Limit to avoid rate limiting

    for (let i = 0; i < maxRepos; i++) {
      const repo = repos[i]
      try {
        const languages = await this.fetchRepositoryLanguages(username, repo.name)
        
        Object.entries(languages).forEach(([language, stats]) => {
          const existing = languageMap.get(language) || { commits: 0, bytes: 0 }
          existing.bytes += stats.bytes
          existing.commits += 1 // Simplified: count repositories as commits
          languageMap.set(language, existing)
        })
      } catch (error) {
        // Skip failed language fetches to avoid breaking the entire process
        console.warn(`⚠️  Failed to fetch languages for ${username}/${repo.name}`)
      }
    }

    const totalBytes = Array.from(languageMap.values()).reduce(
      (sum, lang) => sum + lang.bytes,
      0
    )

    return Array.from(languageMap.entries())
      .map(([language, data]) => ({
        language,
        commits: data.commits,
        percentage: totalBytes > 0 ? (data.bytes / totalBytes) * 100 : 0,
        color: this.getLanguageColor(language),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10) // Top 10 languages
  }

  /**
   * Get language color for visualization
   */
  private getLanguageColor(language: string): string {
    const colors: Record<string, string> = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      Go: '#00ADD8',
      Rust: '#dea584',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      'C++': '#f34b7d',
      'C#': '#239120',
      HTML: '#e34c26',
      CSS: '#1572B6',
      Vue: '#4FC08D',
      Shell: '#89e051',
      Dart: '#00B4AB',
      Scala: '#c22d40',
      Perl: '#0298c3',
      Lua: '#000080',
    }

    return colors[language] || '#858585'
  }

  /**
   * Calculate contribution statistics from GitHub events
   */
  private calculateContributionStats(
    events: any[],
    _username: string
  ): MemberContributions {
    const stats = {
      commits: 0,
      pullRequests: 0,
      issues: 0,
      reviews: 0,
      repositories: 0,
      totalContributions: 0,
      contributionCalendar: [] as ContributionDay[],
      topLanguages: [] as LanguageContribution[],
      streak: {
        current: 0,
        longest: 0,
      } as ContributionStreak,
    }

    const dailyContributions = new Map<string, number>()
    const languageContributions = new Map<string, number>()

    for (const event of events) {
      const eventDate = new Date(event.created_at).toISOString().split('T')[0]

      // Count different types of contributions
      switch (event.type) {
        case 'PushEvent':
          stats.commits += event.payload.commits?.length || 0
          break
        case 'PullRequestEvent':
          if (event.payload.action === 'opened') {
            stats.pullRequests++
          }
          break
        case 'IssuesEvent':
          if (event.payload.action === 'opened') {
            stats.issues++
          }
          break
        case 'PullRequestReviewEvent':
          stats.reviews++
          break
      }

      // Track daily contributions
      const currentCount = dailyContributions.get(eventDate) || 0
      dailyContributions.set(eventDate, currentCount + 1)

      // Track language contributions (simplified)
      if (event.repo && event.repo.name) {
        const repoName = event.repo.name
        const currentLangCount = languageContributions.get(repoName) || 0
        languageContributions.set(repoName, currentLangCount + 1)
      }
    }

    stats.totalContributions =
      stats.commits + stats.pullRequests + stats.issues + stats.reviews

    // Generate contribution calendar (last 365 days)
    const today = new Date()
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const count = dailyContributions.get(dateStr) || 0

      stats.contributionCalendar.push({
        date: new Date(d),
        count,
        level: this.getContributionLevel(count),
      })
    }

    // Calculate contribution streak
    stats.streak = this.calculateContributionStreak(stats.contributionCalendar)

    return stats
  }

  /**
   * Get contribution level (0-4) based on count
   */
  private getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 5) return 2
    if (count <= 10) return 3
    return 4
  }

  /**
   * Calculate contribution streak from calendar data
   */
  private calculateContributionStreak(
    calendar: ContributionDay[]
  ): ContributionStreak {
    let currentStreak = 0
    let longestStreak = 0
    let currentStart: Date | undefined
    let currentEnd: Date | undefined
    let longestStart: Date | undefined
    let longestEnd: Date | undefined

    // Iterate from most recent to oldest
    for (let i = calendar.length - 1; i >= 0; i--) {
      const day = calendar[i]

      if (day.count > 0) {
        if (currentStreak === 0) {
          currentEnd = day.date
        }
        currentStreak++
        currentStart = day.date
      } else {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
          longestStart = currentStart
          longestEnd = currentEnd
        }
        currentStreak = 0
        currentStart = undefined
        currentEnd = undefined
      }
    }

    // Check if current streak is the longest
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak
      longestStart = currentStart
      longestEnd = currentEnd
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      currentStart,
      currentEnd,
      longestStart,
      longestEnd,
    }
  }

  /**
   * Fetch organization details
   */
  async fetchOrganizationDetails(): Promise<Organization | null> {
    if (!this.config.organization) {
      return null
    }

    console.log(`🏢 Fetching organization details: ${this.config.organization}`)

    try {
      const org: any = await this.makeRequest(
        githubEndpoints.orgDetails(this.config.organization)
      )

      return {
        id: org.id.toString(),
        login: org.login,
        name: org.name,
        description: org.description,
        avatarUrl: org.avatar_url,
        websiteUrl: org.blog,
        location: org.location,
        email: org.email,
        twitterUsername: org.twitter_username,
        blog: org.blog,
        company: org.company,
        createdAt: new Date(org.created_at),
        updatedAt: new Date(org.updated_at),
        publicRepos: org.public_repos,
        publicGists: org.public_gists,
        followers: org.followers,
        following: org.following,
        htmlUrl: org.html_url,
      }
    } catch (error) {
      console.error(`❌ Failed to fetch organization details:`, error)
      return null
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(): Promise<{
    remaining: number
    reset: Date
    limit: number
  }> {
    try {
      const rateLimit: any = await this.makeRequest('/rate_limit')

      return {
        remaining: rateLimit.rate.remaining,
        reset: new Date(rateLimit.rate.reset * 1000),
        limit: rateLimit.rate.limit,
      }
    } catch (error) {
      console.warn('⚠️  Failed to fetch rate limit status:', error)
      return {
        remaining: this.rateLimitRemaining,
        reset: this.rateLimitReset,
        limit: 5000,
      }
    }
  }

  /**
   * Fetch repository traffic statistics (requires push access)
   */
  async fetchRepositoryTraffic(
    owner: string,
    repo: string
  ): Promise<{
    views: { count: number; uniques: number }
    clones: { count: number; uniques: number }
    referrers: Array<{ referrer: string; count: number; uniques: number }>
  } | null> {
    try {
      const [views, clones, referrers] = await Promise.allSettled([
        this.makeRequest(`/repos/${owner}/${repo}/traffic/views`),
        this.makeRequest(`/repos/${owner}/${repo}/traffic/clones`),
        this.makeRequest(`/repos/${owner}/${repo}/traffic/popular/referrers`),
      ])

      // If all requests failed (likely due to access restrictions), return null
      if (views.status === 'rejected' && clones.status === 'rejected' && referrers.status === 'rejected') {
        return null
      }

      return {
        views: views.status === 'fulfilled' 
          ? { count: (views.value as any).count || 0, uniques: (views.value as any).uniques || 0 }
          : { count: 0, uniques: 0 },
        clones: clones.status === 'fulfilled'
          ? { count: (clones.value as any).count || 0, uniques: (clones.value as any).uniques || 0 }
          : { count: 0, uniques: 0 },
        referrers: referrers.status === 'fulfilled' ? (referrers.value as any[]) : [],
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch traffic data for ${owner}/${repo}:`, error)
      return null
    }
  }

  /**
   * Fetch repository activity and health metrics
   */
  async fetchRepositoryActivity(
    owner: string,
    repo: string
  ): Promise<{
    hasRecentActivity: boolean
    lastCommitDate: Date | null
    isHealthy: boolean
    healthScore: number
    metrics: {
      commitFrequency: number
      issueResponseTime: number
      prMergeTime: number
      codeQuality: number
    }
  }> {
    try {
      // Fetch recent commits
      const commits: any[] = await this.makeRequest(
        `/repos/${owner}/${repo}/commits?per_page=10`
      )

      const lastCommitDate = commits.length > 0 
        ? new Date(commits[0].commit.author.date)
        : null

      const hasRecentActivity = lastCommitDate 
        ? (Date.now() - lastCommitDate.getTime()) < (30 * 24 * 60 * 60 * 1000) // 30 days
        : false

      // Calculate commit frequency (commits per week over last 3 months)
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const recentCommits = commits.filter(commit => 
        new Date(commit.commit.author.date) >= threeMonthsAgo
      )
      const commitFrequency = recentCommits.length / 12 // per week

      // Basic health scoring
      let healthScore = 0
      if (hasRecentActivity) healthScore += 30
      if (commitFrequency > 1) healthScore += 25
      if (commits.length >= 10) healthScore += 20
      if (lastCommitDate && (Date.now() - lastCommitDate.getTime()) < (7 * 24 * 60 * 60 * 1000)) {
        healthScore += 25 // Recent activity bonus
      }

      const isHealthy = healthScore >= 50

      return {
        hasRecentActivity,
        lastCommitDate,
        isHealthy,
        healthScore,
        metrics: {
          commitFrequency,
          issueResponseTime: 0, // Would need more complex calculation
          prMergeTime: 0, // Would need more complex calculation
          codeQuality: Math.min(healthScore / 100, 1), // Simplified
        },
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch activity data for ${owner}/${repo}:`, error)
      return {
        hasRecentActivity: false,
        lastCommitDate: null,
        isHealthy: false,
        healthScore: 0,
        metrics: {
          commitFrequency: 0,
          issueResponseTime: 0,
          prMergeTime: 0,
          codeQuality: 0,
        },
      }
    }
  }

  /**
   * Test GitHub API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing GitHub API connection...')

      const user: GitHubUser = await this.makeRequest('/user')
      console.log(`✅ Connected to GitHub API as: ${user.login}`)

      const rateLimit = await this.getRateLimitStatus()
      console.log(
        `📊 Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`
      )

      return true
    } catch (error) {
      console.error('❌ GitHub API connection test failed:', error)
      return false
    }
  }
}

/**
 * Default GitHub fetcher instance
 */
export const githubFetcher = new GitHubFetcher()

/**
 * Utility function to create a configured GitHub fetcher
 */
export function createGitHubFetcher(
  config?: Partial<GitHubConfig>
): GitHubFetcher {
  return new GitHubFetcher(config)
}
