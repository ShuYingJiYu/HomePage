/**
 * Cache Integration Tests
 * Tests for cache integration utilities
 */

import { describe, it, expect } from 'vitest';
import {
  CacheKeys,
  CacheConfigs
} from '@/utils/cache-integration';

describe('Cache Integration', () => {
  describe('CacheKeys', () => {
    it('should generate correct cache keys', () => {
      expect(CacheKeys.githubRepositories()).toBe('github-repositories');
      expect(CacheKeys.githubMembers()).toBe('github-members');
      expect(CacheKeys.githubStats()).toBe('github-stats');
      expect(CacheKeys.githubProjects()).toBe('github-projects');
      
      expect(CacheKeys.blogPosts()).toBe('blog-posts');
      expect(CacheKeys.blogAuthors()).toBe('blog-authors');
      expect(CacheKeys.blogCategories()).toBe('blog-categories');
      expect(CacheKeys.blogTags()).toBe('blog-tags');
      expect(CacheKeys.blogStats()).toBe('blog-stats');
      
      expect(CacheKeys.statusData()).toBe('status-data');
      expect(CacheKeys.seoMetadata()).toBe('seo-metadata');
      expect(CacheKeys.fetchResults()).toBe('fetch-results');
    });
  });

  describe('CacheConfigs', () => {
    it('should have correct cache configurations', () => {
      expect(CacheConfigs.github.maxAge).toBe(6 * 60 * 60 * 1000); // 6 hours
      expect(CacheConfigs.github.source).toBe('github-api');
      expect(CacheConfigs.github.version).toBe('1.0.0');
      
      expect(CacheConfigs.wordpress.maxAge).toBe(2 * 60 * 60 * 1000); // 2 hours
      expect(CacheConfigs.wordpress.source).toBe('wordpress-api');
      expect(CacheConfigs.wordpress.version).toBe('1.0.0');
      
      expect(CacheConfigs.status.maxAge).toBe(15 * 60 * 1000); // 15 minutes
      expect(CacheConfigs.status.source).toBe('status-api');
      expect(CacheConfigs.status.version).toBe('1.0.0');
      
      expect(CacheConfigs.seo.maxAge).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(CacheConfigs.seo.source).toBe('seo-generator');
      expect(CacheConfigs.seo.version).toBe('1.0.0');
    });

    it('should have different max ages for different data types', () => {
      // Status data should have the shortest cache time
      expect(CacheConfigs.status.maxAge).toBeLessThan(CacheConfigs.wordpress.maxAge);
      expect(CacheConfigs.wordpress.maxAge).toBeLessThan(CacheConfigs.github.maxAge);
      expect(CacheConfigs.github.maxAge).toBeLessThan(CacheConfigs.seo.maxAge);
    });
  });

  describe('Cache Integration Structure', () => {
    it('should export all required classes and utilities', async () => {
      const integration = await import('@/utils/cache-integration');
      
      expect(integration.CacheKeys).toBeDefined();
      expect(integration.CacheConfigs).toBeDefined();
      expect(integration.CachedDataFetcher).toBeDefined();
      expect(integration.GitHubDataCache).toBeDefined();
      expect(integration.WordPressDataCache).toBeDefined();
      expect(integration.StatusDataCache).toBeDefined();
      expect(integration.SEODataCache).toBeDefined();
      expect(integration.CacheMonitor).toBeDefined();
      expect(integration.CacheWarmer).toBeDefined();
    });

    it('should have static methods on cache utility classes', async () => {
      const integration = await import('@/utils/cache-integration');
      
      // Check GitHubDataCache methods
      expect(typeof integration.GitHubDataCache.getRepositories).toBe('function');
      expect(typeof integration.GitHubDataCache.getMembers).toBe('function');
      expect(typeof integration.GitHubDataCache.getStats).toBe('function');
      expect(typeof integration.GitHubDataCache.getProjects).toBe('function');
      expect(typeof integration.GitHubDataCache.invalidateAll).toBe('function');
      
      // Check WordPressDataCache methods
      expect(typeof integration.WordPressDataCache.getPosts).toBe('function');
      expect(typeof integration.WordPressDataCache.getAuthors).toBe('function');
      expect(typeof integration.WordPressDataCache.getCategories).toBe('function');
      expect(typeof integration.WordPressDataCache.getTags).toBe('function');
      expect(typeof integration.WordPressDataCache.getStats).toBe('function');
      expect(typeof integration.WordPressDataCache.invalidateAll).toBe('function');
      
      // Check CachedDataFetcher methods
      expect(typeof integration.CachedDataFetcher.getOrFetch).toBe('function');
      expect(typeof integration.CachedDataFetcher.batchFetch).toBe('function');
      expect(typeof integration.CachedDataFetcher.invalidateRelated).toBe('function');
      expect(typeof integration.CachedDataFetcher.getCacheHealth).toBe('function');
      expect(typeof integration.CachedDataFetcher.optimizeCache).toBe('function');
    });
  });

  describe('Cache Key Consistency', () => {
    it('should generate consistent keys', () => {
      // Keys should be consistent across multiple calls
      expect(CacheKeys.githubRepositories()).toBe(CacheKeys.githubRepositories());
      expect(CacheKeys.blogPosts()).toBe(CacheKeys.blogPosts());
      expect(CacheKeys.statusData()).toBe(CacheKeys.statusData());
    });

    it('should generate unique keys for different data types', () => {
      const keys = [
        CacheKeys.githubRepositories(),
        CacheKeys.githubMembers(),
        CacheKeys.blogPosts(),
        CacheKeys.blogAuthors(),
        CacheKeys.statusData(),
        CacheKeys.seoMetadata()
      ];
      
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid configuration values', () => {
      Object.values(CacheConfigs).forEach(config => {
        expect(config.maxAge).toBeGreaterThan(0);
        expect(config.source).toBeTruthy();
        expect(config.version).toBeTruthy();
        expect(typeof config.maxAge).toBe('number');
        expect(typeof config.source).toBe('string');
        expect(typeof config.version).toBe('string');
      });
    });

    it('should have reasonable cache durations', () => {
      // All cache durations should be reasonable (between 1 minute and 1 week)
      const oneMinute = 60 * 1000;
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      Object.values(CacheConfigs).forEach(config => {
        expect(config.maxAge).toBeGreaterThanOrEqual(oneMinute);
        expect(config.maxAge).toBeLessThanOrEqual(oneWeek);
      });
    });
  });
});