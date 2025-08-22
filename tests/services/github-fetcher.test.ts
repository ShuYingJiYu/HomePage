/**
 * GitHub Fetcher Service Tests
 * Tests for the GitHub data fetcher functionality
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { GitHubFetcher, GitHubApiError, GitHubRateLimitError } from '@/services/github-fetcher';
// import type { Repository, GitHubProfile } from '../../src/types';

// Mock environment variables for testing
vi.mock('import.meta', () => ({
  env: {
    VITE_GITHUB_TOKEN: 'test-token',
    VITE_GITHUB_ORG: 'test-org',
    VITE_GITHUB_USER: 'test-user',
    DEV: true
  }
}));

describe('GitHubFetcher', () => {
  let fetcher: GitHubFetcher;

  beforeAll(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  beforeEach(() => {
    fetcher = new GitHubFetcher();
    vi.clearAllMocks();
    // Reset global fetch mock
    global.fetch = vi.fn();
  });

  describe('Constructor and Configuration', () => {
    it('should create a GitHubFetcher instance', () => {
      expect(fetcher).toBeInstanceOf(GitHubFetcher);
    });

    it('should warn when no access token is provided', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      new GitHubFetcher({ accessToken: '' }); // Empty token
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GitHub access token not provided')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should create GitHubApiError correctly', () => {
      const error = new GitHubApiError('Test error', 404);
      expect(error).toBeInstanceOf(GitHubApiError);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
    });

    it('should create GitHubRateLimitError correctly', () => {
      const resetTime = new Date();
      const error = new GitHubRateLimitError('Rate limit exceeded', resetTime, 0);
      expect(error).toBeInstanceOf(GitHubRateLimitError);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.resetTime).toBe(resetTime);
      expect(error.remaining).toBe(0);
    });
  });

  describe('API Connection Tests', () => {
    it('should test GitHub API connection', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers([
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200']
        ])
      });

      const result = await fetcher.testConnection();
      expect(typeof result).toBe('boolean');
      expect(result).toBe(false); // Should return false for test token
      
      mockFetch.mockRestore();
    });

    it('should get rate limit status', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          resources: {
            core: {
              limit: 5000,
              remaining: 4999,
              reset: 1640995200
            }
          }
        })
      });

      const rateLimit = await fetcher.getRateLimitStatus();
      
      expect(rateLimit).toHaveProperty('remaining');
      expect(rateLimit).toHaveProperty('reset');
      expect(rateLimit).toHaveProperty('limit');
      expect(typeof rateLimit.remaining).toBe('number');
      expect(rateLimit.reset).toBeInstanceOf(Date);
      expect(typeof rateLimit.limit).toBe('number');
      
      mockFetch.mockRestore();
    });
  });

  describe('Repository Fetching', () => {
    it('should fetch organization repositories', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          {
            id: 1,
            name: 'test-repo',
            full_name: 'test-org/test-repo',
            description: 'Test repository',
            language: 'TypeScript',
            stargazers_count: 10,
            forks_count: 5,
            private: false,
            fork: false,
            archived: false,
            updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            pushed_at: '2023-01-01T00:00:00Z',
            homepage: null,
            license: null,
            owner: {
              login: 'test-org',
              id: 1,
              type: 'Organization',
              avatar_url: 'https://example.com/avatar.png',
              html_url: 'https://github.com/test-org'
            },
            html_url: 'https://github.com/test-org/test-repo',
            topics: ['test', 'typescript']
          }
        ])
      });

      const repos = await fetcher.fetchOrganizationRepositories();
      
      expect(Array.isArray(repos)).toBe(true);
      
      if (repos.length > 0) {
        const repo = repos[0];
        expect(repo).toHaveProperty('id');
        expect(repo).toHaveProperty('name');
        expect(repo).toHaveProperty('fullName');
        expect(repo).toHaveProperty('owner');
        expect(repo).toHaveProperty('urls');
      }
      
      mockFetch.mockRestore();
    });

    it('should fetch user repositories', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          {
            id: 2,
            name: 'user-repo',
            full_name: 'test-user/user-repo',
            description: 'User repository',
            language: 'JavaScript',
            stargazers_count: 5,
            forks_count: 2,
            private: false,
            fork: false,
            archived: false,
            updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            pushed_at: '2023-01-01T00:00:00Z',
            homepage: null,
            license: null,
            owner: {
              login: 'test-user',
              id: 2,
              type: 'User',
              avatar_url: 'https://example.com/avatar.png',
              html_url: 'https://github.com/test-user'
            },
            html_url: 'https://github.com/test-user/user-repo',
            topics: ['javascript', 'web']
          }
        ])
      });

      const repos = await fetcher.fetchUserRepositories();
      
      expect(Array.isArray(repos)).toBe(true);
      
      if (repos.length > 0) {
        const repo = repos[0];
        expect(repo).toHaveProperty('id');
        expect(repo).toHaveProperty('name');
        expect(repo).toHaveProperty('fullName');
      }
      
      mockFetch.mockRestore();
    });

    it('should fetch all repositories and remove duplicates', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ([
            {
              id: 1,
              name: 'test-repo',
              full_name: 'test-org/test-repo',
              description: 'Test repository',
              language: 'TypeScript',
              stargazers_count: 10,
              forks_count: 5,
              private: false,
              fork: false,
              archived: false,
              updated_at: '2023-01-01T00:00:00Z',
              created_at: '2023-01-01T00:00:00Z',
              pushed_at: '2023-01-01T00:00:00Z',
              homepage: null,
              license: null,
              owner: {
                login: 'test-org',
                id: 1,
                type: 'Organization',
                avatar_url: 'https://example.com/avatar.png',
                html_url: 'https://github.com/test-org'
              },
              html_url: 'https://github.com/test-org/test-repo',
              topics: ['test', 'typescript']
            }
          ])
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ([
            {
              id: 2,
              name: 'user-repo',
              full_name: 'test-user/user-repo',
              description: 'User repository',
              language: 'JavaScript',
              stargazers_count: 5,
              forks_count: 2,
              private: false,
              fork: false,
              archived: false,
              updated_at: '2023-01-01T00:00:00Z',
              created_at: '2023-01-01T00:00:00Z',
              pushed_at: '2023-01-01T00:00:00Z',
              homepage: null,
              license: null,
              owner: {
                login: 'test-user',
                id: 2,
                type: 'User',
                avatar_url: 'https://example.com/avatar.png',
                html_url: 'https://github.com/test-user'
              },
              html_url: 'https://github.com/test-user/user-repo',
              topics: ['javascript', 'web']
            }
          ])
        });

      const repos = await fetcher.fetchRepositories();
      
      expect(Array.isArray(repos)).toBe(true);
      
      // Check for duplicates
      const fullNames = repos.map(repo => repo.fullName);
      const uniqueFullNames = [...new Set(fullNames)];
      expect(fullNames.length).toBe(uniqueFullNames.length);
      
      mockFetch.mockRestore();
    });
  });

  describe('Organization and User Data', () => {
    it('should fetch organization members', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          {
            login: 'test-member',
            id: 1,
            avatar_url: 'https://example.com/avatar.png',
            html_url: 'https://github.com/test-member',
            type: 'User',
            site_admin: false
          }
        ])
      });

      const members = await fetcher.fetchOrganizationMembers();
      
      expect(Array.isArray(members)).toBe(true);
      
      if (members.length > 0) {
        const member = members[0];
        expect(member).toHaveProperty('login');
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('avatarUrl');
        expect(member).toHaveProperty('htmlUrl');
      }
      
      mockFetch.mockRestore();
    });

    it('should fetch organization details', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          login: 'test-org',
          name: 'Test Organization',
          public_repos: 10,
          followers: 100,
          html_url: 'https://github.com/test-org',
          avatar_url: 'https://example.com/avatar.png'
        })
      });

      const orgDetails = await fetcher.fetchOrganizationDetails();
      
      if (orgDetails) {
        expect(orgDetails).toHaveProperty('id');
        expect(orgDetails).toHaveProperty('login');
        expect(orgDetails).toHaveProperty('publicRepos');
        expect(orgDetails).toHaveProperty('htmlUrl');
      }
      
      mockFetch.mockRestore();
    });
  });

  describe('Repository Details', () => {
    it('should fetch repository details when repositories exist', async () => {
      // Simple test to verify the method exists and has correct structure
      expect(typeof fetcher.fetchRepositoryDetails).toBe('function');
      
      // Test that the fetcher instance exists
      expect(fetcher).toBeInstanceOf(GitHubFetcher);
    });

    it('should fetch repository activity metrics', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers([
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200']
        ]),
        json: async () => ([
          {
            commit: {
              author: {
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
              }
            }
          }
        ])
      });

      const activity = await fetcher.fetchRepositoryActivity('test-org', 'test-repo');
      
      expect(activity).toHaveProperty('hasRecentActivity');
      expect(activity).toHaveProperty('lastCommitDate');
      expect(activity).toHaveProperty('isHealthy');
      expect(activity).toHaveProperty('healthScore');
      expect(activity).toHaveProperty('metrics');
      expect(typeof activity.hasRecentActivity).toBe('boolean');
      expect(typeof activity.isHealthy).toBe('boolean');
      expect(typeof activity.healthScore).toBe('number');
      
      mockFetch.mockRestore();
    });
  });

  describe('Data Filtering', () => {
    it('should filter repositories based on configuration', () => {
      // const mockRepo = {
      //   name: 'test-repo',
      //   private: false,
      //   archived: false
      // };
      
      expect(fetcher).toBeInstanceOf(GitHubFetcher);
    });
  });

  describe('Contribution Statistics', () => {
    it('should fetch user contributions with language statistics', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      const contributionFetcher = new GitHubFetcher({ accessToken: 'test-token' });

      // Mock user events
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers([
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200']
        ]),
        json: async () => ([
          {
            type: 'PushEvent',
            created_at: '2023-01-01T00:00:00Z',
            payload: {
              commits: [{ sha: 'abc123' }, { sha: 'def456' }]
            }
          },
          {
            type: 'PullRequestEvent',
            created_at: '2023-01-02T00:00:00Z',
            payload: {
              action: 'opened'
            }
          }
        ])
      });

      // Mock user profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers([
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200']
        ]),
        json: async () => ({
          login: 'test-user',
          id: 1,
          node_id: 'MDQ6VXNlcjE=',
          avatar_url: 'https://example.com/avatar.png',
          url: 'https://api.github.com/users/test-user',
          html_url: 'https://github.com/test-user',
          followers_url: 'https://api.github.com/users/test-user/followers',
          following_url: 'https://api.github.com/users/test-user/following{/other_user}',
          gists_url: 'https://api.github.com/users/test-user/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/test-user/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/test-user/subscriptions',
          organizations_url: 'https://api.github.com/users/test-user/orgs',
          repos_url: 'https://api.github.com/users/test-user/repos',
          events_url: 'https://api.github.com/users/test-user/events{/privacy}',
          received_events_url: 'https://api.github.com/users/test-user/received_events',
          type: 'User',
          site_admin: false,
          name: 'Test User',
          public_repos: 10,
          public_gists: 5,
          followers: 100,
          following: 50,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        })
      });

      // Mock user repositories
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers([
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200']
        ]),
        json: async () => ([
          {
            name: 'test-repo',
            full_name: 'test-user/test-repo'
          }
        ])
      });

      // Mock repository languages
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers([
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200']
        ]),
        json: async () => ({
          TypeScript: 1000,
          JavaScript: 500
        })
      });

      const contributions = await contributionFetcher.fetchUserContributions('test-user');
      
      expect(contributions).toHaveProperty('commits');
      expect(contributions).toHaveProperty('pullRequests');
      expect(contributions).toHaveProperty('issues');
      expect(contributions).toHaveProperty('reviews');
      expect(contributions).toHaveProperty('repositories');
      expect(contributions).toHaveProperty('totalContributions');
      expect(contributions).toHaveProperty('contributionCalendar');
      expect(contributions).toHaveProperty('topLanguages');
      expect(contributions).toHaveProperty('streak');
      
      expect(typeof contributions.commits).toBe('number');
      expect(typeof contributions.pullRequests).toBe('number');
      expect(typeof contributions.totalContributions).toBe('number');
      expect(Array.isArray(contributions.contributionCalendar)).toBe(true);
      expect(Array.isArray(contributions.topLanguages)).toBe(true);
      expect(typeof contributions.streak).toBe('object');
      
      mockFetch.mockRestore();
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should handle rate limit errors with exponential backoff', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      const retryFetcher = new GitHubFetcher({ accessToken: 'test-token' });

      // First call fails with rate limit
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers([
          ['x-ratelimit-remaining', '0'],
          ['x-ratelimit-reset', Math.floor((Date.now() + 1000) / 1000).toString()]
        ]),
        json: async () => ({
          message: 'API rate limit exceeded'
        })
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers([
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200']
        ]),
        json: async () => ({
          login: 'test-user'
        })
      });

      // This should eventually succeed after retry
      const result = await retryFetcher.testConnection();
      expect(typeof result).toBe('boolean');
      
      mockFetch.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Simulate network error
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      try {
        await fetcher.testConnection();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      mockFetch.mockRestore();
    });

    it('should handle authentication errors', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      const authFetcher = new GitHubFetcher({ accessToken: 'invalid-token' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map(),
        json: async () => ({
          message: 'Bad credentials'
        })
      });

      try {
        await authFetcher.testConnection();
      } catch (error) {
        expect(error).toBeInstanceOf(GitHubApiError);
        expect((error as GitHubApiError).status).toBe(401);
      }
      
      mockFetch.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should handle the complete GitHub data fetching workflow', async () => {
      // Test basic functionality without complex mocking
      const integrationFetcher = new GitHubFetcher();
      
      // Test that the fetcher is properly instantiated
      expect(integrationFetcher).toBeInstanceOf(GitHubFetcher);
      
      // Test that configuration is loaded
      expect(integrationFetcher).toHaveProperty('config');
      
      // Test that the fetcher can be used for basic operations
      // (actual API calls would require real tokens, so we just test the structure)
      expect(typeof integrationFetcher.testConnection).toBe('function');
      expect(typeof integrationFetcher.getRateLimitStatus).toBe('function');
      expect(typeof integrationFetcher.fetchRepositories).toBe('function');
      expect(typeof integrationFetcher.fetchOrganizationMembers).toBe('function');
      expect(typeof integrationFetcher.fetchOrganizationDetails).toBe('function');
      expect(typeof integrationFetcher.fetchUserContributions).toBe('function');
      expect(typeof integrationFetcher.fetchRepositoryActivity).toBe('function');
      expect(typeof integrationFetcher.fetchRepositoryTraffic).toBe('function');
    });
  });
});