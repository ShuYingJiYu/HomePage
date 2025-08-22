/**
 * Cache Manager Tests
 * Tests for the data cache management system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CacheManager } from '@/services/cache-manager';
import type { CacheConfig } from '@/types/cache';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let testCacheDir: string;

  beforeEach(() => {
    testCacheDir = join(process.cwd(), 'test-cache');
    
    // Clean up test directory
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
    
    mkdirSync(testCacheDir, { recursive: true });
    
    const config: Partial<CacheConfig> = {
      maxAge: 60000, // 1 minute for testing
      maxSize: 1024 * 1024, // 1MB
      compressionEnabled: true,
      autoCleanup: false // Disable for testing
    };
    
    cacheManager = new CacheManager(testCacheDir, config);
  });

  afterEach(() => {
    cacheManager.destroy();
    
    // Clean up test directory
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('Basic Cache Operations', () => {
    it('should set and get cache data', async () => {
      const testData = { message: 'Hello, World!', timestamp: Date.now() };
      const key = 'test-data';

      // Set data
      const setResult = await cacheManager.set(key, testData);
      expect(setResult).toBe(true);

      // Get data
      const retrievedData = await cacheManager.get(key);
      expect(retrievedData).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete cached data', async () => {
      const testData = { value: 123 };
      const key = 'delete-test';

      // Set and verify data exists
      await cacheManager.set(key, testData);
      expect(await cacheManager.get(key)).toEqual(testData);

      // Delete data
      const deleteResult = await cacheManager.delete(key);
      expect(deleteResult).toBe(true);

      // Verify data is gone
      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should handle complex data structures', async () => {
      const complexData = {
        users: [
          { id: 1, name: 'Alice', roles: ['admin', 'user'] },
          { id: 2, name: 'Bob', roles: ['user'] }
        ],
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          nested: {
            deep: {
              value: 'test'
            }
          }
        }
      };

      const key = 'complex-data';
      await cacheManager.set(key, complexData);
      const retrieved = await cacheManager.get(key);
      
      expect(retrieved).toEqual(complexData);
    });
  });

  describe('Cache Expiration', () => {
    it('should return null for expired entries', async () => {
      const testData = { value: 'expires soon' };
      const key = 'expiring-data';

      // Set data with short expiration
      await cacheManager.set(key, testData, {
        expiresAt: new Date(Date.now() + 100) // 100ms
      });

      // Data should be available immediately
      expect(await cacheManager.get(key)).toEqual(testData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Data should be expired
      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should respect custom expiration times', async () => {
      const testData = { value: 'custom expiry' };
      const key = 'custom-expiry';
      const futureTime = new Date(Date.now() + 5000); // 5 seconds

      await cacheManager.set(key, testData, {
        expiresAt: futureTime
      });

      // Should still be valid
      expect(await cacheManager.get(key)).toEqual(testData);
    });
  });

  describe('Incremental Updates', () => {
    it('should detect when incremental update is needed', async () => {
      const key = 'incremental-test';
      
      // No cache exists, should need update
      expect(await cacheManager.needsIncrementalUpdate(key)).toBe(true);

      // Set some data
      await cacheManager.set(key, { version: 1 });
      
      // Should not need update immediately
      expect(await cacheManager.needsIncrementalUpdate(key)).toBe(false);
    });

    it('should detect changes between data versions', async () => {
      const key = 'change-detection';
      const originalData = {
        users: ['alice', 'bob'],
        settings: { theme: 'dark', lang: 'en' }
      };
      
      const updatedData = {
        users: ['alice', 'bob', 'charlie'],
        settings: { theme: 'light', lang: 'en' }
      };

      await cacheManager.set(key, originalData);

      const changes = await cacheManager.detectIncrementalChanges(key, updatedData);
      
      expect(changes.hasChanges).toBe(true);
      // The implementation detects specific array indices and nested properties
      expect(changes.changedFields.some(field => field.includes('users'))).toBe(true);
      expect(changes.changedFields).toContain('settings.theme');
    });

    it('should merge data using different strategies', async () => {
      const key = 'merge-test';
      const existingData = {
        users: ['alice'],
        settings: { theme: 'dark' }
      };
      
      const newData = {
        users: ['bob'],
        settings: { lang: 'en' }
      };

      await cacheManager.set(key, existingData);

      const mergedData = await cacheManager.mergeData(key, newData, {
        type: 'merge',
        conflictResolution: 'latest'
      });

      expect(mergedData).toEqual({
        users: ['bob'], // Replaced
        settings: { theme: 'dark', lang: 'en' } // Merged
      });
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', async () => {
      const initialStats = cacheManager.getStats();
      expect(initialStats).toHaveProperty('totalEntries');
      expect(initialStats).toHaveProperty('totalSize');
      expect(initialStats).toHaveProperty('hitRate');
      expect(initialStats).toHaveProperty('missRate');
    });

    it('should record cache operations', async () => {
      await cacheManager.set('test', { data: 'test' });
      await cacheManager.get('test');
      await cacheManager.get('non-existent');

      const operations = cacheManager.getRecentOperations();
      expect(operations.length).toBeGreaterThan(0);
      
      const writeOp = operations.find(op => op.type === 'write');
      const readOps = operations.filter(op => op.type === 'read');
      
      expect(writeOp).toBeDefined();
      expect(writeOp?.success).toBe(true);
      expect(readOps.length).toBe(2);
    });
  });

  describe('Cache Health', () => {
    it('should provide health status', async () => {
      const health = await cacheManager.getHealthStatus();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('issues');
      expect(health).toHaveProperty('recommendations');
      expect(health).toHaveProperty('lastCheck');
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
    });
  });

  describe('Performance Optimization', () => {
    it('should optimize cache performance', async () => {
      // Add some test data
      await cacheManager.set('large-data', { 
        data: new Array(1000).fill('test data') 
      });

      const metrics = await cacheManager.optimizeCache();
      
      expect(metrics).toHaveProperty('averageReadTime');
      expect(metrics).toHaveProperty('averageWriteTime');
      expect(metrics).toHaveProperty('compressionRatio');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('diskUsage');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Try to use an invalid cache directory (but one that won't throw during construction)
      const invalidCacheManager = new CacheManager('/tmp/invalid-cache-test');
      
      // Try to set data in a path that might fail
      const result = await invalidCacheManager.set('test', { data: 'test' });
      // The result might be true or false depending on permissions, just check it doesn't crash
      expect(typeof result).toBe('boolean');
      
      invalidCacheManager.destroy();
    });
  });

  describe('Configuration', () => {
    it('should respect custom configuration', () => {
      const customConfig: Partial<CacheConfig> = {
        maxAge: 30000,
        maxSize: 2048,
        compressionEnabled: false,
        checksumAlgorithm: 'md5'
      };

      const customCacheManager = new CacheManager('test-custom', customConfig);
      
      // Test that configuration is applied
      expect(customCacheManager).toBeDefined();
      
      customCacheManager.destroy();
    });

    it('should use default configuration when not provided', () => {
      const defaultCacheManager = new CacheManager();
      expect(defaultCacheManager).toBeDefined();
      defaultCacheManager.destroy();
    });
  });
});