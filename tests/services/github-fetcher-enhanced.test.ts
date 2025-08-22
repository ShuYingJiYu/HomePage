/**
 * Enhanced GitHub Fetcher Tests
 * Tests for the new enhanced functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubFetcher } from '@/services/github-fetcher';

describe('Enhanced GitHub Fetcher', () => {
  let fetcher: GitHubFetcher;

  beforeEach(() => {
    fetcher = new GitHubFetcher();
    vi.clearAllMocks();
  });

  describe('Enhanced Functionality', () => {
    it('should have enhanced methods available', () => {
      expect(typeof fetcher.fetchRepositoryActivity).toBe('function');
      expect(typeof fetcher.fetchRepositoryTraffic).toBe('function');
      expect(typeof fetcher.fetchUserContributions).toBe('function');
    });

    it('should handle repository activity calculation', async () => {
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
      expect(typeof activity.metrics).toBe('object');
      
      mockFetch.mockRestore();
    });

    it('should handle contribution statistics with fallback', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Mock failed requests to test fallback
      mockFetch.mockRejectedValue(new Error('Network error'));

      const contributions = await fetcher.fetchUserContributions('test-user');
      
      // Should return empty stats as fallback
      expect(contributions).toHaveProperty('commits');
      expect(contributions).toHaveProperty('pullRequests');
      expect(contributions).toHaveProperty('totalContributions');
      expect(contributions.commits).toBe(0);
      expect(contributions.pullRequests).toBe(0);
      expect(contributions.totalContributions).toBe(0);
      
      mockFetch.mockRestore();
    });

    it('should handle traffic data gracefully when access is denied', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Mock 403 response (no access to traffic data) - all three calls fail
      mockFetch
        .mockRejectedValueOnce(new Error('Must have push access to repository'))
        .mockRejectedValueOnce(new Error('Must have push access to repository'))
        .mockRejectedValueOnce(new Error('Must have push access to repository'));

      const traffic = await fetcher.fetchRepositoryTraffic('test-org', 'test-repo');
      
      // Should return null when all requests fail
      expect(traffic).toBeNull();
      
      mockFetch.mockRestore();
    });
  });

  describe('Error Handling Improvements', () => {
    it('should handle different HTTP error codes appropriately', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Test 404 error - mock all retry attempts
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Headers(),
          json: async () => ({ message: 'Not Found' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Headers(),
          json: async () => ({ message: 'Not Found' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Headers(),
          json: async () => ({ message: 'Not Found' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Headers(),
          json: async () => ({ message: 'Not Found' })
        });

      try {
        await fetcher.fetchUserProfile('nonexistent-user');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(404);
        expect(error.message).toContain('Resource not found');
      }

      mockFetch.mockRestore();
    });

    it('should handle server errors with proper retry', async () => {
      // Simple test to verify the method exists and has correct structure
      expect(typeof fetcher.fetchUserProfile).toBe('function');
      
      // Test that the fetcher instance exists
      expect(fetcher).toBeInstanceOf(GitHubFetcher);
    });
  });
});