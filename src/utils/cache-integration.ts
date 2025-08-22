/**
 * Cache Integration Utilities
 * Utilities for integrating cache manager with existing data fetching systems
 */

import { cacheManager } from '@/services/cache-manager';
import type { CacheMetadata, DataMergeStrategy } from '@/types/cache';

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  // GitHub data keys
  githubRepositories: () => 'github-repositories',
  githubMembers: () => 'github-members',
  githubStats: () => 'github-stats',
  githubProjects: () => 'github-projects',
  
  // WordPress data keys
  blogPosts: () => 'blog-posts',
  blogAuthors: () => 'blog-authors',
  blogCategories: () => 'blog-categories',
  blogTags: () => 'blog-tags',
  blogStats: () => 'blog-stats',
  
  // Status monitoring keys
  statusData: () => 'status-data',
  
  // SEO metadata keys
  seoMetadata: () => 'seo-metadata',
  
  // Fetch results
  fetchResults: () => 'fetch-results'
} as const;

/**
 * Cache metadata configurations for different data types
 */
export const CacheConfigs = {
  github: {
    maxAge: 6 * 60 * 60 * 1000, // 6 hours
    source: 'github-api',
    version: '1.0.0'
  },
  wordpress: {
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    source: 'wordpress-api',
    version: '1.0.0'
  },
  status: {
    maxAge: 15 * 60 * 1000, // 15 minutes
    source: 'status-api',
    version: '1.0.0'
  },
  seo: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    source: 'seo-generator',
    version: '1.0.0'
  }
} as const;

/**
 * Cached data fetcher with automatic cache management
 */
export class CachedDataFetcher {
  /**
   * Get cached data or fetch if not available/expired
   */
  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      cacheConfig?: Partial<CacheMetadata>;
      forceRefresh?: boolean;
      mergeStrategy?: DataMergeStrategy;
    } = {}
  ): Promise<T> {
    const { cacheConfig, forceRefresh = false, mergeStrategy } = options;

    // Check if we should force refresh or if incremental update is needed
    if (!forceRefresh) {
      const cachedData = await cacheManager.get<T>(key);
      if (cachedData !== null) {
        return cachedData;
      }
    }

    // Fetch new data
    const newData = await fetcher();

    // Handle incremental updates if cache exists and merge strategy is provided
    if (!forceRefresh && mergeStrategy) {
      const changes = await cacheManager.detectIncrementalChanges(key, newData);
      if (changes.hasChanges) {
        const mergedData = await cacheManager.mergeData(key, newData, mergeStrategy);
        await cacheManager.set(key, mergedData, cacheConfig);
        return mergedData;
      }
    }

    // Set new data in cache
    await cacheManager.set(key, newData, cacheConfig);
    return newData;
  }

  /**
   * Batch fetch multiple data sources with caching
   */
  static async batchFetch<T extends Record<string, any>>(
    fetchers: Record<keyof T, {
      fetcher: () => Promise<T[keyof T]>;
      cacheKey: string;
      cacheConfig?: Partial<CacheMetadata>;
      forceRefresh?: boolean;
    }>
  ): Promise<T> {
    const results = {} as T;
    const fetchPromises = Object.entries(fetchers).map(async ([key, config]) => {
      const data = await this.getOrFetch(
        config.cacheKey,
        config.fetcher,
        {
          cacheConfig: config.cacheConfig,
          forceRefresh: config.forceRefresh
        }
      );
      results[key as keyof T] = data;
    });

    await Promise.all(fetchPromises);
    return results;
  }

  /**
   * Invalidate related caches
   */
  static async invalidateRelated(pattern: string | RegExp): Promise<number> {
    return await cacheManager.invalidateCache(pattern);
  }

  /**
   * Get cache health for monitoring
   */
  static async getCacheHealth() {
    return await cacheManager.getHealthStatus();
  }

  /**
   * Optimize cache performance
   */
  static async optimizeCache() {
    return await cacheManager.optimizeCache();
  }
}

/**
 * GitHub data cache utilities
 */
export class GitHubDataCache {
  static async getRepositories(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.githubRepositories(),
      fetcher,
      {
        cacheConfig: CacheConfigs.github,
        forceRefresh,
        mergeStrategy: { type: 'merge', conflictResolution: 'latest' }
      }
    );
  }

  static async getMembers(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.githubMembers(),
      fetcher,
      {
        cacheConfig: CacheConfigs.github,
        forceRefresh,
        mergeStrategy: { type: 'merge', conflictResolution: 'latest' }
      }
    );
  }

  static async getStats(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.githubStats(),
      fetcher,
      {
        cacheConfig: CacheConfigs.github,
        forceRefresh
      }
    );
  }

  static async getProjects(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.githubProjects(),
      fetcher,
      {
        cacheConfig: CacheConfigs.github,
        forceRefresh,
        mergeStrategy: { type: 'merge', conflictResolution: 'latest' }
      }
    );
  }

  static async invalidateAll() {
    return CachedDataFetcher.invalidateRelated(/^github-/);
  }
}

/**
 * WordPress data cache utilities
 */
export class WordPressDataCache {
  static async getPosts(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.blogPosts(),
      fetcher,
      {
        cacheConfig: CacheConfigs.wordpress,
        forceRefresh,
        mergeStrategy: { type: 'replace', conflictResolution: 'latest' }
      }
    );
  }

  static async getAuthors(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.blogAuthors(),
      fetcher,
      {
        cacheConfig: CacheConfigs.wordpress,
        forceRefresh
      }
    );
  }

  static async getCategories(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.blogCategories(),
      fetcher,
      {
        cacheConfig: CacheConfigs.wordpress,
        forceRefresh
      }
    );
  }

  static async getTags(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.blogTags(),
      fetcher,
      {
        cacheConfig: CacheConfigs.wordpress,
        forceRefresh
      }
    );
  }

  static async getStats(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.blogStats(),
      fetcher,
      {
        cacheConfig: CacheConfigs.wordpress,
        forceRefresh
      }
    );
  }

  static async invalidateAll() {
    return CachedDataFetcher.invalidateRelated(/^blog-/);
  }
}

/**
 * Status monitoring cache utilities
 */
export class StatusDataCache {
  static async getStatus(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.statusData(),
      fetcher,
      {
        cacheConfig: CacheConfigs.status,
        forceRefresh
      }
    );
  }

  static async invalidateAll() {
    return CachedDataFetcher.invalidateRelated(/^status-/);
  }
}

/**
 * SEO metadata cache utilities
 */
export class SEODataCache {
  static async getMetadata(fetcher: () => Promise<any>, forceRefresh = false) {
    return CachedDataFetcher.getOrFetch(
      CacheKeys.seoMetadata(),
      fetcher,
      {
        cacheConfig: CacheConfigs.seo,
        forceRefresh
      }
    );
  }

  static async invalidateAll() {
    return CachedDataFetcher.invalidateRelated(/^seo-/);
  }
}

/**
 * Cache monitoring and maintenance utilities
 */
export class CacheMonitor {
  /**
   * Get comprehensive cache status
   */
  static async getStatus() {
    try {
      const health = await cacheManager.getHealthStatus();
      const stats = cacheManager.getStats();
      const recentOps = cacheManager.getRecentOperations(50);

      return {
        health,
        stats,
        recentOperations: recentOps,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      throw error;
    }
  }

  /**
   * Perform cache maintenance
   */
  static async performMaintenance() {
    console.log('🔧 Starting cache maintenance...');
    
    const startTime = Date.now();
    
    // Get initial status
    const initialHealth = await cacheManager.getHealthStatus();
    console.log(`📊 Initial cache status: ${initialHealth.status}`);
    
    // Optimize cache
    const metrics = await cacheManager.optimizeCache();
    console.log('⚡ Cache optimization completed');
    
    // Get final status
    const finalHealth = await cacheManager.getHealthStatus();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Cache maintenance completed in ${duration}ms`);
    console.log(`📊 Final cache status: ${finalHealth.status}`);
    
    return {
      initialHealth,
      finalHealth,
      metrics,
      duration
    };
  }

  /**
   * Check if cache needs maintenance
   */
  static async needsMaintenance(): Promise<boolean> {
    const health = await cacheManager.getHealthStatus();
    const stats = cacheManager.getStats();
    
    // Check for critical issues
    if (health.status === 'critical') {
      return true;
    }
    
    // Check for high miss rate
    if (stats.missRate > 0.5) {
      return true;
    }
    
    // Check for expired entries
    if (stats.expiredEntries > 10) {
      return true;
    }
    
    return false;
  }

  /**
   * Schedule automatic maintenance
   */
  static scheduleAutoMaintenance(intervalMs: number = 60 * 60 * 1000): NodeJS.Timeout {
    return setInterval(async () => {
      const needsMaintenance = await this.needsMaintenance();
      if (needsMaintenance) {
        await this.performMaintenance();
      }
    }, intervalMs);
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm up all caches with fresh data
   */
  static async warmAllCaches(fetchers: {
    github?: () => Promise<any>;
    wordpress?: () => Promise<any>;
    status?: () => Promise<any>;
    seo?: () => Promise<any>;
  }) {
    console.log('🔥 Warming up caches...');
    
    const promises: Promise<any>[] = [];
    
    if (fetchers.github) {
      promises.push(GitHubDataCache.getRepositories(fetchers.github, true));
    }
    
    if (fetchers.wordpress) {
      promises.push(WordPressDataCache.getPosts(fetchers.wordpress, true));
    }
    
    if (fetchers.status) {
      promises.push(StatusDataCache.getStatus(fetchers.status, true));
    }
    
    if (fetchers.seo) {
      promises.push(SEODataCache.getMetadata(fetchers.seo, true));
    }
    
    await Promise.allSettled(promises);
    console.log('✅ Cache warming completed');
  }

  /**
   * Warm up specific cache
   */
  static async warmCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheConfig?: Partial<CacheMetadata>
  ): Promise<T> {
    return CachedDataFetcher.getOrFetch(key, fetcher, {
      cacheConfig,
      forceRefresh: true
    });
  }
}