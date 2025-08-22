#!/usr/bin/env tsx

/**
 * Cache Management System Demo
 * Demonstrates the capabilities of the data cache management system
 */

import 'dotenv/config';
import { CacheManager } from '@/services/cache-manager.js';
import { 
  CachedDataFetcher, 
  GitHubDataCache, 
  WordPressDataCache,
  CacheMonitor 
} from '@/utils/cache-integration.js';

async function demonstrateCacheSystem(): Promise<void> {
  console.log('🚀 Cache Management System Demo');
  console.log('===============================\n');

  // 1. Basic Cache Operations
  console.log('1️⃣  Basic Cache Operations');
  console.log('---------------------------');
  
  const cacheManager = new CacheManager('demo-cache');
  
  // Set some test data
  const testData = {
    message: 'Hello Cache!',
    timestamp: new Date().toISOString(),
    data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
  };
  
  console.log('📝 Setting cache data...');
  await cacheManager.set('demo-data', testData);
  
  console.log('📖 Reading cache data...');
  const cachedData = await cacheManager.get('demo-data');
  console.log(`✅ Retrieved: ${cachedData ? 'Success' : 'Failed'}`);
  
  // 2. Incremental Updates
  console.log('\n2️⃣  Incremental Update Detection');
  console.log('----------------------------------');
  
  const updatedData = {
    ...testData,
    message: 'Updated Cache!',
    newField: 'This is new',
    data: [...testData.data, { id: 100, value: 'new-item' }]
  };
  
  console.log('🔍 Detecting changes...');
  const changes = await cacheManager.detectIncrementalChanges('demo-data', updatedData);
  console.log(`📊 Changes detected: ${changes.hasChanges}`);
  console.log(`📋 Changed fields: ${changes.changedFields.slice(0, 3).join(', ')}${changes.changedFields.length > 3 ? '...' : ''}`);
  
  // 3. Data Merging
  console.log('\n3️⃣  Data Merging Strategies');
  console.log('----------------------------');
  
  const mergedData = await cacheManager.mergeData('demo-data', updatedData, {
    type: 'merge',
    conflictResolution: 'latest'
  });
  
  console.log('🔄 Data merged successfully');
  console.log(`📊 Original items: ${testData.data.length}`);
  console.log(`📊 Merged items: ${(mergedData as any).data.length}`);
  
  // 4. Cache Integration Utilities
  console.log('\n4️⃣  Cache Integration Utilities');
  console.log('--------------------------------');
  
  // Mock GitHub data fetcher
  const mockGitHubFetcher = async () => {
    console.log('   🐙 Fetching GitHub data...');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
    return {
      repositories: [
        { name: 'repo1', stars: 100 },
        { name: 'repo2', stars: 200 }
      ],
      totalRepos: 2
    };
  };
  
  console.log('📦 Using GitHub cache utility...');
  const githubData = await GitHubDataCache.getRepositories(mockGitHubFetcher);
  console.log(`✅ GitHub data cached: ${githubData.totalRepos} repositories`);
  
  // Second call should use cache
  console.log('📦 Second call (should use cache)...');
  const githubDataCached = await GitHubDataCache.getRepositories(mockGitHubFetcher);
  console.log(`✅ Retrieved from cache: ${githubDataCached.totalRepos} repositories`);
  
  // 5. Cache Health Monitoring
  console.log('\n5️⃣  Cache Health Monitoring');
  console.log('-----------------------------');
  
  const healthStatus = await cacheManager.getHealthStatus();
  console.log(`🏥 Cache health: ${healthStatus.status}`);
  console.log(`📊 Issues found: ${healthStatus.issues.length}`);
  console.log(`💡 Recommendations: ${healthStatus.recommendations.length}`);
  
  // 6. Performance Optimization
  console.log('\n6️⃣  Performance Optimization');
  console.log('------------------------------');
  
  console.log('⚡ Running cache optimization...');
  const metrics = await cacheManager.optimizeCache();
  console.log(`📈 Average read time: ${metrics.averageReadTime.toFixed(2)}ms`);
  console.log(`📈 Average write time: ${metrics.averageWriteTime.toFixed(2)}ms`);
  console.log(`💾 Disk usage: ${Math.round(metrics.diskUsage / 1024)}KB`);
  
  // 7. Cache Statistics
  console.log('\n7️⃣  Cache Statistics');
  console.log('---------------------');
  
  const stats = cacheManager.getStats();
  console.log(`📊 Total entries: ${stats.totalEntries}`);
  console.log(`📊 Total size: ${Math.round(stats.totalSize / 1024)}KB`);
  console.log(`📊 Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  
  const recentOps = cacheManager.getRecentOperations(5);
  console.log(`🔄 Recent operations: ${recentOps.length}`);
  
  // 8. Batch Operations
  console.log('\n8️⃣  Batch Cache Operations');
  console.log('---------------------------');
  
  const batchResult = await CachedDataFetcher.batchFetch({
    github: {
      fetcher: mockGitHubFetcher,
      cacheKey: 'batch-github'
    },
    wordpress: {
      fetcher: async () => {
        console.log('   📝 Fetching WordPress data...');
        return { posts: [{ title: 'Post 1' }, { title: 'Post 2' }] };
      },
      cacheKey: 'batch-wordpress'
    }
  });
  
  console.log(`✅ Batch fetch completed: ${Object.keys(batchResult).length} sources`);
  
  // 9. Cache Invalidation
  console.log('\n9️⃣  Cache Invalidation');
  console.log('-----------------------');
  
  console.log('🗑️  Invalidating demo caches...');
  const invalidatedCount = await cacheManager.invalidateCache(/^demo-/);
  console.log(`✅ Invalidated ${invalidatedCount} cache entries`);
  
  // Cleanup
  cacheManager.destroy();
  
  console.log('\n🎉 Cache Management System Demo Completed!');
  console.log('==========================================');
  console.log('✨ All cache management features demonstrated successfully');
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateCacheSystem().catch(console.error);
}

export { demonstrateCacheSystem };