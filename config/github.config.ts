/**
 * GitHub specific configuration
 * Contains GitHub API settings, rate limiting, and error handling strategies
 */

import type { GitHubConfig } from '@/types/config';

export const githubConfig: GitHubConfig = {
  organization: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_ORG) || process.env.VITE_GITHUB_ORG || '',
  personalAccount: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_USER) || process.env.VITE_GITHUB_USER || '',
  accessToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_TOKEN) || process.env.VITE_GITHUB_TOKEN || '',
  
  // Repositories to exclude from analysis and display
  excludeRepositories: [
    'dotfiles',
    'private-notes',
    '.github',
    'config',
    'secrets',
    'backup',
    'archive',
    'test-repo',
    'playground'
  ],
  
  // If specified, only these repositories will be included
  includeRepositories: undefined,
  
  // GitHub API rate limiting configuration
  rateLimiting: {
    requestsPerHour: 5000, // GitHub's default rate limit for authenticated requests
    retryAfter: 60 // Seconds to wait before retrying after rate limit
  },
  
  // Error handling strategies for different types of GitHub API errors
  errorHandling: {
    // When rate limit is exceeded
    rateLimitStrategy: 'retry-backoff',
    
    // When network errors occur
    networkErrorStrategy: 'use-cache',
    
    // When authentication fails
    authErrorStrategy: 'fail-build'
  }
};

/**
 * GitHub API endpoints configuration
 */
export const githubEndpoints = {
  baseUrl: 'https://api.github.com',
  
  // Repository endpoints
  orgRepos: (org: string) => `/orgs/${org}/repos`,
  userRepos: (user: string) => `/users/${user}/repos`,
  repoDetails: (owner: string, repo: string) => `/repos/${owner}/${repo}`,
  repoReadme: (owner: string, repo: string) => `/repos/${owner}/${repo}/readme`,
  repoLanguages: (owner: string, repo: string) => `/repos/${owner}/${repo}/languages`,
  repoTopics: (owner: string, repo: string) => `/repos/${owner}/${repo}/topics`,
  
  // Organization endpoints
  orgMembers: (org: string) => `/orgs/${org}/members`,
  orgDetails: (org: string) => `/orgs/${org}`,
  
  // User endpoints
  userDetails: (user: string) => `/users/${user}`,
  userContributions: (user: string) => `/users/${user}/events`,
  
  // Statistics endpoints
  repoStats: (owner: string, repo: string) => `/repos/${owner}/${repo}/stats/contributors`,
  repoCommits: (owner: string, repo: string) => `/repos/${owner}/${repo}/commits`
};

/**
 * GitHub request headers configuration
 */
export const githubHeaders = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'Shuying-Studio-Homepage/1.0',
  Authorization: `token ${(typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_TOKEN) || process.env.VITE_GITHUB_TOKEN || ''}`
};

/**
 * Repository filtering configuration
 */
export const repositoryFilters = {
  // Minimum stars required for a repository to be considered
  minStars: 0,
  
  // Minimum size in KB (0 means no minimum)
  minSize: 0,
  
  // Maximum age in days (0 means no maximum)
  maxAge: 0,
  
  // Repository types to include
  includeTypes: ['public'],
  
  // Languages to prioritize (empty means all languages)
  priorityLanguages: [
    'TypeScript',
    'JavaScript',
    'React',
    'Vue',
    'Python',
    'Java',
    'Go',
    'Rust'
  ],
  
  // Topics that indicate high-quality projects
  qualityTopics: [
    'production',
    'enterprise',
    'framework',
    'library',
    'tool',
    'application',
    'web-app',
    'mobile-app'
  ]
};

export default githubConfig;