#!/usr/bin/env tsx

/**
 * Data Fetching Script
 * Fetches data from all configured sources (GitHub, WordPress, etc.)
 */

import 'dotenv/config';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GitHubDataManager } from '@/services/github-data-manager.js';
import { GitHubFetcher } from '@/services/github-fetcher.js';
import { WordPressDataManager } from '@/services/wordpress-data-manager.js';
import { WordPressFetcher } from '@/services/wordpress-fetcher.js';
import { GitHubDataCache, WordPressDataCache, StatusDataCache } from '@/utils/cache-integration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DataFetchResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
  timestamp: string;
  duration: number;
}

async function fetchGitHubData(useCache: boolean = true): Promise<DataFetchResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Fetching GitHub data...');
    
    const githubFetcher = async () => {
      const fetcher = new GitHubFetcher();
      const dataManager = new GitHubDataManager(fetcher);
      
      // Test connection first
      const isConnected = await fetcher.testConnection();
      if (!isConnected) {
        throw new Error('GitHub API connection failed');
      }
      
      // Fetch all GitHub data
      return await dataManager.fetchAllData({
        includeRepositories: true,
        includeMembers: true,
        includeStats: true,
        maxRepositories: 50
      });
    };
    
    // Use cache if enabled
    const githubData = useCache 
      ? await GitHubDataCache.getRepositories(githubFetcher, false)
      : await githubFetcher();
    
    return {
      success: githubData.errors?.length === 0 || !githubData.errors,
      data: githubData,
      error: githubData.errors?.length > 0 ? githubData.errors.join('; ') : undefined,
      warnings: githubData.warnings?.length > 0 ? githubData.warnings : undefined,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown GitHub error',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

async function fetchWordPressData(useCache: boolean = true): Promise<DataFetchResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Fetching WordPress data...');
    
    const wordpressFetcher = async () => {
      const fetcher = new WordPressFetcher();
      const dataManager = new WordPressDataManager(fetcher);
      
      // Test connection first
      const isConnected = await fetcher.testConnection();
      if (!isConnected) {
        throw new Error('WordPress API connection failed');
      }
      
      // Fetch all WordPress data
      return await dataManager.fetchAllData({
        includeStats: true,
        includeAuthors: true,
        includeCategories: true,
        includeTags: true,
        maxPosts: 100
      });
    };
    
    // Use cache if enabled
    const wordpressData = useCache 
      ? await WordPressDataCache.getPosts(wordpressFetcher, false)
      : await wordpressFetcher();
    
    return {
      success: wordpressData.errors?.length === 0 || !wordpressData.errors,
      data: wordpressData,
      error: wordpressData.errors?.length > 0 ? wordpressData.errors.join('; ') : undefined,
      warnings: wordpressData.warnings?.length > 0 ? wordpressData.warnings : undefined,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WordPress error',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

async function fetchStatusData(): Promise<DataFetchResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Fetching status monitoring data...');
    
    // TODO: Implement actual status monitoring
    // For now, return a placeholder with simulated data
    const mockStatusData = {
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
        },
        {
          name: 'Database',
          status: 'operational' as const,
          responseTime: 25,
          uptime: 99.95,
          lastChecked: new Date().toISOString()
        }
      ],
      overall: {
        status: 'operational' as const,
        uptime: 99.85,
        incidents: 0
      }
    };
    
    return {
      success: true,
      data: mockStatusData,
      warnings: ['Using mock status data - real monitoring not yet implemented'],
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown status error',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

async function fetchAllData(): Promise<void> {
  console.log('📊 Complete Data Fetching Script');
  console.log('🚀 Starting comprehensive data collection...');
  
  const overallStartTime = Date.now();
  
  // Ensure data directory exists
  const dataDir = join(__dirname, '../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  const results: Record<string, DataFetchResult> = {};
  
  try {
    // Fetch GitHub data
    results.github = await fetchGitHubData();
    
    // Fetch WordPress data
    results.wordpress = await fetchWordPressData();
    
    // Fetch status monitoring data
    results.status = await fetchStatusData();
    
    // Save individual data files
    if (results.github.success && results.github.data) {
      const githubData = results.github.data;
      if (githubData.repositories) {
        writeFileSync(join(dataDir, 'github-repositories.json'), JSON.stringify(githubData.repositories, null, 2));
      }
      if (githubData.members) {
        writeFileSync(join(dataDir, 'github-members.json'), JSON.stringify(githubData.members, null, 2));
      }
      if (githubData.stats) {
        writeFileSync(join(dataDir, 'github-stats.json'), JSON.stringify(githubData.stats, null, 2));
      }
      if (githubData.projects) {
        writeFileSync(join(dataDir, 'github-projects.json'), JSON.stringify(githubData.projects, null, 2));
      }
    }
    
    if (results.wordpress.success && results.wordpress.data) {
      const wordpressData = results.wordpress.data;
      if (wordpressData.posts) {
        writeFileSync(join(dataDir, 'blog-posts.json'), JSON.stringify(wordpressData.posts, null, 2));
      }
      if (wordpressData.authors) {
        writeFileSync(join(dataDir, 'blog-authors.json'), JSON.stringify(wordpressData.authors, null, 2));
      }
      if (wordpressData.categories) {
        writeFileSync(join(dataDir, 'blog-categories.json'), JSON.stringify(wordpressData.categories, null, 2));
      }
      if (wordpressData.tags) {
        writeFileSync(join(dataDir, 'blog-tags.json'), JSON.stringify(wordpressData.tags, null, 2));
      }
      if (wordpressData.stats) {
        writeFileSync(join(dataDir, 'blog-stats.json'), JSON.stringify(wordpressData.stats, null, 2));
      }
    }
    
    if (results.status.success && results.status.data) {
      writeFileSync(join(dataDir, 'status-data.json'), JSON.stringify(results.status.data, null, 2));
    }
    
    // Save overall results
    const resultsPath = join(dataDir, 'fetch-results.json');
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    // Log summary
    const overallDuration = Math.round((Date.now() - overallStartTime) / 1000);
    
    console.log('\n📊 Data Fetch Summary:');
    console.log(`   🐙 GitHub: ${results.github.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   📝 WordPress: ${results.wordpress.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   📈 Status: ${results.status.success ? '✅ Success' : '❌ Failed'}`);
    
    // Show warnings
    const allWarnings = [
      ...(results.github.warnings || []),
      ...(results.wordpress.warnings || []),
      ...(results.status.warnings || [])
    ];
    
    if (allWarnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      allWarnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    // Show errors
    const allErrors = [
      results.github.error,
      results.wordpress.error,
      results.status.error
    ].filter(Boolean);
    
    if (allErrors.length > 0) {
      console.log('\n❌ Errors:');
      allErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log(`\n⏱️  Total duration: ${overallDuration}s`);
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    if (successCount === totalCount) {
      console.log('✅ All data fetching completed successfully');
    } else {
      console.log(`⚠️  Data fetching completed with ${totalCount - successCount} failures`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Data fetching failed:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllData().catch(console.error);
}

export { fetchAllData };
