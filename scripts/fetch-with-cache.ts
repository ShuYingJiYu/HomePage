#!/usr/bin/env tsx

/**
 * Data Fetching with Cache Integration
 * Enhanced data fetching that uses the cache management system
 */

import 'dotenv/config';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GitHubDataManager } from '../src/services/github-data-manager.js';
import { GitHubFetcher } from '../src/services/github-fetcher.js';
import { WordPressDataManager } from '../src/services/wordpress-data-manager.js';
import { WordPressFetcher } from '../src/services/wordpress-fetcher.js';
import { 
  GitHubDataCache, 
  WordPressDataCache, 
  StatusDataCache,
  CacheMonitor 
} from '../src/utils/cache-integration.js';
import { cacheManager } from '../src/services/cache-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FetchWithCacheResult {
  success: boolean;
  cached: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: string;
}

async function fetchGitHubWithCache(forceRefresh = false): Promise<FetchWithCacheResult> {
  const startTime = Date.now();
  
  try {
    console.log('🐙 Fetching GitHub data with cache...');
    
    const githubFetcher = async () => {
      const fetcher = new GitHubFetcher();
      const dataManager = new GitHubDataManager(fetcher);
      
      console.log('   📡 Calling GitHub API...');
      return await dataManager.fetchAllData({
        includeDetails: true,
        includeMembers: true,
        includeOrganization: true,
        maxRepositories: 50
      });
    };
    
    const data = await GitHubDataCache.getRepositories(githubFetcher, forceRefresh);
    
    return {
      success: true,
      cached: !forceRefresh,
      data,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

async function fetchWordPressWithCache(forceRefresh = false): Promise<FetchWithCacheResult> {
  const startTime = Date.now();
  
  try {
    console.log('📝 Fetching WordPress data with cache...');
    
    const wordpressFetcher = async () => {
      const fetcher = new WordPressFetcher();
      const dataManager = new WordPressDataManager(fetcher);
      
      console.log('   📡 Calling WordPress API...');
      return await dataManager.fetchAllData({
        maxPosts: 100,
        includeCategories: true,
        includeTags: true
      });
    };
    
    const data = await WordPressDataCache.getPosts(wordpressFetcher, forceRefresh);
    
    return {
      success: true,
      cached: !forceRefresh,
      data,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

async function fetchStatusWithCache(forceRefresh = false): Promise<FetchWithCacheResult> {
  const startTime = Date.now();
  
  try {
    console.log('📈 Fetching status data with cache...');
    
    const statusFetcher = async () => {
      console.log('   📡 Generating mock status data...');
      return {
        services: [
          {
            name: 'Website',
            status: 'operational' as const,
            responseTime: 150,
            uptime: 99.9,
            lastChecked: new Date().toISOString()
          },
          {
            name: 'API',
            status: 'operational' as const,
            responseTime: 80,
            uptime: 99.8,
            lastChecked: new Date().toISOString()
          }
        ],
        overall: {
          status: 'operational' as const,
          uptime: 99.85,
          incidents: 0
        }
      };
    };
    
    const data = await StatusDataCache.getStatus(statusFetcher, forceRefresh);
    
    return {
      success: true,
      cached: !forceRefresh,
      data,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

async function demonstrateCacheIntegration(): Promise<void> {
  console.log('🚀 Data Fetching with Cache Integration Demo');
  console.log('============================================');
  
  const dataDir = join(__dirname, '../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    // 1. First fetch (should hit APIs)
    console.log('\n1️⃣  First Fetch (Fresh Data)');
    console.log('----------------------------');
    
    const firstGitHub = await fetchGitHubWithCache(true);
    const firstWordPress = await fetchWordPressWithCache(true);
    const firstStatus = await fetchStatusWithCache(true);
    
    console.log(`✅ GitHub: ${firstGitHub.success ? 'Success' : 'Failed'} (${firstGitHub.duration}ms)`);
    console.log(`✅ WordPress: ${firstWordPress.success ? 'Success' : 'Failed'} (${firstWordPress.duration}ms)`);
    console.log(`✅ Status: ${firstStatus.success ? 'Success' : 'Failed'} (${firstStatus.duration}ms)`);
    
    // 2. Second fetch (should use cache)
    console.log('\n2️⃣  Second Fetch (Cached Data)');
    console.log('------------------------------');
    
    const secondGitHub = await fetchGitHubWithCache(false);
    const secondWordPress = await fetchWordPressWithCache(false);
    const secondStatus = await fetchStatusWithCache(false);
    
    console.log(`⚡ GitHub: ${secondGitHub.success ? 'Success' : 'Failed'} (${secondGitHub.duration}ms) - ${secondGitHub.cached ? 'FROM CACHE' : 'FROM API'}`);
    console.log(`⚡ WordPress: ${secondWordPress.success ? 'Success' : 'Failed'} (${secondWordPress.duration}ms) - ${secondWordPress.cached ? 'FROM CACHE' : 'FROM API'}`);
    console.log(`⚡ Status: ${secondStatus.success ? 'Success' : 'Failed'} (${secondStatus.duration}ms) - ${secondStatus.cached ? 'FROM CACHE' : 'FROM API'}`);
    
    // 3. Cache performance comparison
    console.log('\n3️⃣  Performance Comparison');
    console.log('---------------------------');
    
    const apiTime = firstGitHub.duration + firstWordPress.duration + firstStatus.duration;
    const cacheTime = secondGitHub.duration + secondWordPress.duration + secondStatus.duration;
    const speedup = apiTime / cacheTime;
    
    console.log(`📊 API calls total time: ${apiTime}ms`);
    console.log(`📊 Cache calls total time: ${cacheTime}ms`);
    console.log(`🚀 Cache speedup: ${speedup.toFixed(1)}x faster`);
    
    // 4. Cache status
    console.log('\n4️⃣  Cache Status');
    console.log('----------------');
    
    const cacheStatus = await CacheMonitor.getStatus();
    console.log(`📊 Total entries: ${cacheStatus.stats.totalEntries}`);
    console.log(`📊 Hit rate: ${(cacheStatus.stats.hitRate * 100).toFixed(1)}%`);
    console.log(`📊 Cache health: ${cacheStatus.health.status}`);
    
    // 5. Save results
    const results = {
      firstFetch: {
        github: firstGitHub,
        wordpress: firstWordPress,
        status: firstStatus
      },
      secondFetch: {
        github: secondGitHub,
        wordpress: secondWordPress,
        status: secondStatus
      },
      performance: {
        apiTime,
        cacheTime,
        speedup
      },
      cacheStatus: cacheStatus.stats
    };
    
    const resultsPath = join(dataDir, 'cache-integration-demo.json');
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('\n✅ Cache integration demo completed successfully!');
    console.log(`📄 Results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('❌ Cache integration demo failed:', error);
    process.exit(1);
  } finally {
    // Clean up cache manager resources
    console.log('🧹 Cleaning up cache resources...');
    cacheManager.destroy();
    console.log('✅ Cache cleanup completed');
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateCacheIntegration()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { demonstrateCacheIntegration, fetchGitHubWithCache, fetchWordPressWithCache, fetchStatusWithCache };