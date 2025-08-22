/**
 * GitHub Data Manager
 * Orchestrates GitHub data fetching, caching, and processing
 */

import type {
  Repository,
  RepositoryDetails,
  TechStackStats,
  LanguageStat,
} from '@/types/repository'
import type {
  Member,
  MemberContributions,
  Organization,
  GitHubProfile,
} from '@/types/member'
import { GitHubFetcher, GitHubRateLimitError } from './github-fetcher'
import { githubConfig } from '../../config/github.config'

/**
 * GitHub data processing result
 */
export interface GitHubDataResult {
  repositories: Repository[]
  repositoryDetails: RepositoryDetails[]
  members: Member[]
  organization: Organization | null
  techStackStats: TechStackStats
  lastUpdated: Date
  errors: string[]
  warnings: string[]
}

/**
 * Data fetching options
 */
export interface FetchOptions {
  includeDetails?: boolean
  includeMembers?: boolean
  includeOrganization?: boolean
  maxRepositories?: number
  maxMembers?: number
  skipCache?: boolean
  timeout?: number
}

/**
 * GitHub Data Manager Class
 */
export class GitHubDataManager {
  private fetcher: GitHubFetcher
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, Date> = new Map()

  constructor(fetcher?: GitHubFetcher) {
    this.fetcher = fetcher || new GitHubFetcher()
  }

  /**
   * Fetch all GitHub data
   */
  async fetchAllData(options: FetchOptions = {}): Promise<GitHubDataResult> {
    const startTime = Date.now()
    console.log('🚀 Starting GitHub data fetch process...')

    const result: GitHubDataResult = {
      repositories: [],
      repositoryDetails: [],
      members: [],
      organization: null,
      techStackStats: {
        languages: [],
        frameworks: [],
        tools: [],
        services: [],
        totalProjects: 0,
        lastUpdated: new Date(),
      },
      lastUpdated: new Date(),
      errors: [],
      warnings: [],
    }

    try {
      // Test connection first
      const isConnected = await this.fetcher.testConnection()
      if (!isConnected) {
        throw new Error('Failed to connect to GitHub API')
      }

      // Fetch repositories
      console.log('📦 Fetching repositories...')
      result.repositories = await this.fetchRepositoriesWithRetry()

      if (options.maxRepositories) {
        result.repositories = result.repositories.slice(
          0,
          options.maxRepositories
        )
      }

      console.log(`✅ Fetched ${result.repositories.length} repositories`)

      // Fetch repository details if requested
      if (options.includeDetails && result.repositories.length > 0) {
        console.log('📊 Fetching repository details...')
        result.repositoryDetails = await this.fetchRepositoryDetails(
          result.repositories
        )
        console.log(
          `✅ Fetched details for ${result.repositoryDetails.length} repositories`
        )
      }

      // Fetch organization data if requested
      if (options.includeOrganization) {
        console.log('🏢 Fetching organization data...')
        result.organization = await this.fetchOrganizationWithRetry()
        if (result.organization) {
          console.log(`✅ Fetched organization: ${result.organization.name}`)
        }
      }

      // Fetch members if requested
      if (options.includeMembers) {
        console.log('👥 Fetching team members...')
        result.members = await this.fetchMembersWithRetry()

        if (options.maxMembers) {
          result.members = result.members.slice(0, options.maxMembers)
        }

        console.log(`✅ Fetched ${result.members.length} team members`)
      }

      // Generate tech stack statistics
      console.log('📈 Generating tech stack statistics...')
      result.techStackStats = this.generateTechStackStats(
        result.repositories,
        result.repositoryDetails
      )

      const duration = (Date.now() - startTime) / 1000
      console.log(`🎉 GitHub data fetch completed in ${duration.toFixed(2)}s`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ GitHub data fetch failed:', error)
      result.errors.push(errorMessage)

      if (error instanceof GitHubRateLimitError) {
        result.warnings.push(
          `Rate limit exceeded. Reset at: ${error.resetTime.toISOString()}`
        )
      }
    }

    return result
  }

  /**
   * Fetch repositories with retry logic
   */
  private async fetchRepositoriesWithRetry(): Promise<Repository[]> {
    try {
      return await this.fetcher.fetchRepositories()
    } catch (error) {
      console.warn(
        '⚠️  Repository fetch failed, attempting fallback strategies...'
      )

      if (githubConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache('repositories')
        if (cached) {
          console.log('🔄 Using cached repository data')
          return cached
        }
      }

      throw error
    }
  }

  /**
   * Fetch repository details with error handling
   */
  private async fetchRepositoryDetails(
    repositories: Repository[]
  ): Promise<RepositoryDetails[]> {
    const details: RepositoryDetails[] = []
    const maxConcurrent = 5 // Limit concurrent requests to avoid rate limiting

    for (let i = 0; i < repositories.length; i += maxConcurrent) {
      const batch = repositories.slice(i, i + maxConcurrent)

      const batchPromises = batch.map(async repo => {
        try {
          const [owner, name] = repo.fullName.split('/')
          return await this.fetcher.fetchRepositoryDetails(owner, name)
        } catch (error) {
          console.warn(
            `⚠️  Failed to fetch details for ${repo.fullName}:`,
            error
          )
          return null
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          details.push(result.value)
        }
      }

      // Add delay between batches to respect rate limits
      if (i + maxConcurrent < repositories.length) {
        await this.sleep(1000)
      }
    }

    return details
  }

  /**
   * Fetch organization with retry logic
   */
  private async fetchOrganizationWithRetry(): Promise<Organization | null> {
    try {
      return await this.fetcher.fetchOrganizationDetails()
    } catch (error) {
      console.warn('⚠️  Organization fetch failed:', error)

      if (githubConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache('organization')
        if (cached) {
          console.log('🔄 Using cached organization data')
          return cached
        }
      }

      return null
    }
  }

  /**
   * Fetch members with retry logic and contribution data
   */
  private async fetchMembersWithRetry(): Promise<Member[]> {
    try {
      const profiles = await this.fetcher.fetchOrganizationMembers()
      const members: Member[] = []

      // Fetch detailed member data
      for (const profile of profiles) {
        try {
          const contributions = await this.fetcher.fetchUserContributions(
            profile.login
          )

          const member: Member = {
            id: profile.id.toString(),
            name: profile.name || profile.login,
            username: profile.login,
            role: {
              zh: '团队成员',
              en: 'Team Member',
            },
            avatar: profile.avatarUrl,
            githubUsername: profile.login,
            bio: {
              zh: profile.bio || '暂无介绍',
              en: profile.bio || 'No bio available',
            },
            skills: this.extractSkillsFromProfile(profile, contributions),
            contributions,
            socialLinks: {
              github: profile.htmlUrl,
              blog: profile.blog || undefined,
              twitter: profile.twitterUsername
                ? `https://twitter.com/${profile.twitterUsername}`
                : undefined,
              email: profile.email || undefined,
            },
            joinDate: profile.createdAt,
            isActive: true,
            featured: contributions.totalContributions > 100, // Feature active contributors
          }

          members.push(member)
        } catch (error) {
          console.warn(
            `⚠️  Failed to fetch member data for ${profile.login}:`,
            error
          )
        }
      }

      return members
    } catch (error) {
      console.warn('⚠️  Members fetch failed:', error)

      if (githubConfig.errorHandling.networkErrorStrategy === 'use-cache') {
        const cached = this.getFromCache('members')
        if (cached) {
          console.log('🔄 Using cached members data')
          return cached
        }
      }

      return []
    }
  }

  /**
   * Extract skills from user profile and contributions
   */
  private extractSkillsFromProfile(
    profile: GitHubProfile,
    contributions: MemberContributions
  ): string[] {
    const skills: Set<string> = new Set()

    // Add languages from contributions
    contributions.topLanguages.forEach(lang => {
      skills.add(lang.language)
    })

    // Add skills based on bio keywords
    const bio = (profile.bio || '').toLowerCase()
    const skillKeywords = [
      'javascript',
      'typescript',
      'react',
      'vue',
      'angular',
      'node.js',
      'python',
      'java',
      'go',
      'rust',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'flutter',
      'docker',
      'kubernetes',
      'aws',
      'azure',
      'gcp',
      'terraform',
      'mongodb',
      'postgresql',
      'mysql',
      'redis',
      'elasticsearch',
    ]

    skillKeywords.forEach(keyword => {
      if (bio.includes(keyword)) {
        skills.add(keyword)
      }
    })

    return Array.from(skills).slice(0, 10) // Limit to top 10 skills
  }

  /**
   * Generate tech stack statistics from repositories
   */
  private generateTechStackStats(
    repositories: Repository[],
    repositoryDetails: RepositoryDetails[]
  ): TechStackStats {
    const languageMap = new Map<
      string,
      { bytes: number; projects: Set<string> }
    >()
    const frameworkMap = new Map<string, Set<string>>()
    const toolMap = new Map<string, Set<string>>()

    // Process repository languages
    repositoryDetails.forEach(repo => {
      Object.entries(repo.languages).forEach(([language, stats]) => {
        const existing = languageMap.get(language) || {
          bytes: 0,
          projects: new Set(),
        }
        existing.bytes += stats.bytes
        existing.projects.add(repo.id)
        languageMap.set(language, existing)
      })

      // Extract frameworks and tools from topics and README
      const topics = repo.topics || []
      const readme = repo.readme || ''

      this.extractFrameworksAndTools(
        topics,
        readme,
        frameworkMap,
        toolMap,
        repo.id
      )
    })

    // Calculate total bytes for percentages
    const totalBytes = Array.from(languageMap.values()).reduce(
      (sum, lang) => sum + lang.bytes,
      0
    )

    // Generate language statistics
    const languages: LanguageStat[] = Array.from(languageMap.entries())
      .map(([name, data]) => ({
        name,
        percentage: totalBytes > 0 ? (data.bytes / totalBytes) * 100 : 0,
        projectCount: data.projects.size,
        linesOfCode: Math.round(data.bytes / 50), // Rough estimate: 50 bytes per line
        color: this.getLanguageColor(name),
        category: this.getLanguageCategory(name),
      }))
      .sort((a, b) => b.percentage - a.percentage)

    // Generate framework statistics
    const frameworks = Array.from(frameworkMap.entries())
      .map(([name, projects]) => ({
        name,
        category: this.getFrameworkCategory(name),
        projectCount: projects.size,
        percentage: (projects.size / repositories.length) * 100,
        description: {
          zh: `基于 ${name} 的项目开发`,
          en: `Project development with ${name}`,
        },
      }))
      .sort((a, b) => b.projectCount - a.projectCount)

    // Generate tool statistics
    const tools = Array.from(toolMap.entries())
      .map(([name, projects]) => ({
        name,
        category: this.getToolCategory(name),
        projectCount: projects.size,
        description: {
          zh: `使用 ${name} 进行开发`,
          en: `Development with ${name}`,
        },
      }))
      .sort((a, b) => b.projectCount - a.projectCount)

    return {
      languages,
      frameworks,
      tools,
      services: this.generateServiceOfferings(languages, frameworks),
      totalProjects: repositories.length,
      lastUpdated: new Date(),
    }
  }

  /**
   * Extract frameworks and tools from repository metadata
   */
  private extractFrameworksAndTools(
    topics: string[],
    readme: string,
    frameworkMap: Map<string, Set<string>>,
    toolMap: Map<string, Set<string>>,
    repoId: string
  ): void {
    const frameworks = [
      'react',
      'vue',
      'angular',
      'svelte',
      'next.js',
      'nuxt.js',
      'gatsby',
      'express',
      'fastify',
      'koa',
      'nest.js',
      'spring',
      'django',
      'flask',
      'laravel',
      'symfony',
      'rails',
      'phoenix',
    ]

    const tools = [
      'docker',
      'kubernetes',
      'terraform',
      'ansible',
      'jenkins',
      'github-actions',
      'webpack',
      'vite',
      'rollup',
      'babel',
      'eslint',
      'prettier',
      'jest',
      'cypress',
      'playwright',
      'storybook',
    ]

    const allText = [...topics, readme.toLowerCase()].join(' ')

    frameworks.forEach(framework => {
      if (allText.includes(framework)) {
        const projects = frameworkMap.get(framework) || new Set()
        projects.add(repoId)
        frameworkMap.set(framework, projects)
      }
    })

    tools.forEach(tool => {
      if (allText.includes(tool)) {
        const projects = toolMap.get(tool) || new Set()
        projects.add(repoId)
        toolMap.set(tool, projects)
      }
    })
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
      Vue: '#2c3e50',
      Shell: '#89e051',
    }

    return colors[language] || '#858585'
  }

  /**
   * Get language category
   */
  private getLanguageCategory(language: string): LanguageStat['category'] {
    const categories: Record<string, LanguageStat['category']> = {
      JavaScript: 'programming',
      TypeScript: 'programming',
      Python: 'programming',
      Java: 'programming',
      Go: 'programming',
      Rust: 'programming',
      PHP: 'programming',
      Ruby: 'programming',
      Swift: 'programming',
      Kotlin: 'programming',
      'C++': 'programming',
      'C#': 'programming',
      HTML: 'markup',
      CSS: 'stylesheet',
      SCSS: 'stylesheet',
      JSON: 'data',
      YAML: 'data',
      XML: 'data',
    }

    return categories[language] || 'other'
  }

  /**
   * Get framework category
   */
  private getFrameworkCategory(
    framework: string
  ): 'frontend' | 'backend' | 'mobile' | 'desktop' | 'testing' | 'other' {
    const categories: Record<
      string,
      'frontend' | 'backend' | 'mobile' | 'desktop' | 'testing' | 'other'
    > = {
      react: 'frontend',
      vue: 'frontend',
      angular: 'frontend',
      svelte: 'frontend',
      'next.js': 'frontend',
      'nuxt.js': 'frontend',
      gatsby: 'frontend',
      express: 'backend',
      fastify: 'backend',
      koa: 'backend',
      'nest.js': 'backend',
      spring: 'backend',
      django: 'backend',
      flask: 'backend',
      laravel: 'backend',
      symfony: 'backend',
      rails: 'backend',
      phoenix: 'backend',
      flutter: 'mobile',
      'react-native': 'mobile',
      jest: 'testing',
      cypress: 'testing',
      playwright: 'testing',
    }

    return categories[framework] || 'other'
  }

  /**
   * Get tool category
   */
  private getToolCategory(
    tool: string
  ): 'development' | 'deployment' | 'monitoring' | 'design' | 'other' {
    const categories: Record<
      string,
      'development' | 'deployment' | 'monitoring' | 'design' | 'other'
    > = {
      docker: 'deployment',
      kubernetes: 'deployment',
      terraform: 'deployment',
      ansible: 'deployment',
      jenkins: 'deployment',
      'github-actions': 'deployment',
      webpack: 'development',
      vite: 'development',
      rollup: 'development',
      babel: 'development',
      eslint: 'development',
      prettier: 'development',
      jest: 'development',
      cypress: 'development',
      playwright: 'development',
      storybook: 'development',
    }

    return categories[tool] || 'other'
  }

  /**
   * Generate service offerings based on tech stack
   */
  private generateServiceOfferings(
    _languages: LanguageStat[],
    frameworks: any[]
  ): any[] {
    const services = []

    // Frontend development services
    const frontendFrameworks = frameworks.filter(f => f.category === 'frontend')
    if (frontendFrameworks.length > 0) {
      services.push({
        name: {
          zh: '前端开发',
          en: 'Frontend Development',
        },
        description: {
          zh: '现代化的前端应用开发，包括响应式设计和用户体验优化',
          en: 'Modern frontend application development with responsive design and UX optimization',
        },
        techStack: frontendFrameworks.map(f => f.name),
        category: 'frontend',
        featured: true,
      })
    }

    // Backend development services
    const backendFrameworks = frameworks.filter(f => f.category === 'backend')
    if (backendFrameworks.length > 0) {
      services.push({
        name: {
          zh: '后端开发',
          en: 'Backend Development',
        },
        description: {
          zh: '高性能的后端服务开发，包括API设计和数据库优化',
          en: 'High-performance backend service development with API design and database optimization',
        },
        techStack: backendFrameworks.map(f => f.name),
        category: 'backend',
        featured: true,
      })
    }

    return services
  }

  private getFromCache(key: string): any | null {
    const expiry = this.cacheExpiry.get(key)
    if (!expiry || expiry < new Date()) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
      return null
    }
    return this.cache.get(key) || null
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Default GitHub data manager instance
 */
export const githubDataManager = new GitHubDataManager()

/**
 * Utility function to create a configured GitHub data manager
 */
export function createGitHubDataManager(
  fetcher?: GitHubFetcher
): GitHubDataManager {
  return new GitHubDataManager(fetcher)
}
