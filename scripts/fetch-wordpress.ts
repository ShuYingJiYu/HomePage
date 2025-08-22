#!/usr/bin/env tsx

/**
 * WordPress Data Fetching Script
 * Fetches blog posts and content from WordPress API
 */

import 'dotenv/config';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WordPressDataManager } from '@/services/wordpress-data-manager.js';
import { WordPressFetcher } from '@/services/wordpress-fetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FetchResult {
  success: boolean;
  posts?: any[];
  authors?: any[];
  categories?: any[];
  tags?: any[];
  stats?: any;
  error?: string;
  warnings?: string[];
  timestamp: string;
  duration: number;
}

async function fetchWordPressData(): Promise<void> {
  console.log('📝 WordPress Data Fetching Script');
  console.log('🚀 Starting WordPress blog data collection...');
  
  const startTime = Date.now();
  
  // Ensure data directory exists
  const dataDir = join(__dirname, '../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    // Initialize WordPress data manager
    const fetcher = new WordPressFetcher();
    const dataManager = new WordPressDataManager(fetcher);
    
    // Test connection first
    console.log('🔗 Testing WordPress API connection...');
    const isConnected = await fetcher.testConnection();
    
    if (!isConnected) {
      console.warn('⚠️  WordPress API connection failed - using cached data or skipping');
    }
    
    // Fetch all WordPress data
    const wordpressData = await dataManager.fetchAllData({
      includeStats: true,
      includeAuthors: true,
      includeCategories: true,
      includeTags: true,
      maxPosts: 100, // Limit for performance
    });
    
    const duration = Date.now() - startTime;
    
    // Prepare result
    const result: FetchResult = {
      success: wordpressData.errors.length === 0,
      posts: wordpressData.posts,
      authors: wordpressData.authors,
      categories: wordpressData.categories,
      tags: wordpressData.tags,
      stats: wordpressData.stats,
      error: wordpressData.errors.length > 0 ? wordpressData.errors.join('; ') : undefined,
      warnings: wordpressData.warnings.length > 0 ? wordpressData.warnings : undefined,
      timestamp: new Date().toISOString(),
      duration: Math.round(duration / 1000),
    };
    
    // Save individual data files
    const postsPath = join(dataDir, 'blog-posts.json');
    const authorsPath = join(dataDir, 'blog-authors.json');
    const categoriesPath = join(dataDir, 'blog-categories.json');
    const tagsPath = join(dataDir, 'blog-tags.json');
    const statsPath = join(dataDir, 'blog-stats.json');
    const resultsPath = join(dataDir, 'wordpress-fetch-results.json');
    
    // Write data files
    writeFileSync(postsPath, JSON.stringify(wordpressData.posts, null, 2));
    writeFileSync(authorsPath, JSON.stringify(wordpressData.authors, null, 2));
    writeFileSync(categoriesPath, JSON.stringify(wordpressData.categories, null, 2));
    writeFileSync(tagsPath, JSON.stringify(wordpressData.tags, null, 2));
    writeFileSync(statsPath, JSON.stringify(wordpressData.stats, null, 2));
    writeFileSync(resultsPath, JSON.stringify(result, null, 2));
    
    // Log results
    console.log('\n📊 WordPress Data Fetch Results:');
    console.log(`   📝 Blog Posts: ${wordpressData.posts.length}`);
    console.log(`   👤 Authors: ${wordpressData.authors.length}`);
    console.log(`   📂 Categories: ${wordpressData.categories.length}`);
    console.log(`   🏷️  Tags: ${wordpressData.tags.length}`);
    
    if (wordpressData.posts.length > 0) {
      const postsByLanguage = wordpressData.posts.reduce((acc, post) => {
        acc[post.language] = (acc[post.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('   🌐 Posts by Language:');
      Object.entries(postsByLanguage).forEach(([lang, count]) => {
        console.log(`      ${lang}: ${count} posts`);
      });
    }
    
    if (wordpressData.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      wordpressData.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    if (wordpressData.errors.length > 0) {
      console.log('\n❌ Errors:');
      wordpressData.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log(`\n⏱️  Total duration: ${result.duration}s`);
    console.log('✅ WordPress data fetching completed');
    
    // Exit with error code if there were errors
    if (wordpressData.errors.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ WordPress data fetching failed:', error);
    
    // Save error result
    const errorResult: FetchResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration: Math.round(duration / 1000),
    };
    
    const resultsPath = join(dataDir, 'wordpress-fetch-results.json');
    writeFileSync(resultsPath, JSON.stringify(errorResult, null, 2));
    
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchWordPressData().catch(console.error);
}

export { fetchWordPressData };
