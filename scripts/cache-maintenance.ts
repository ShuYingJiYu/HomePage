#!/usr/bin/env tsx

/**
 * Cache Maintenance Script
 * Performs cache optimization, cleanup, and health monitoring
 */

import 'dotenv/config';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CacheManager } from '@/services/cache-manager.js';
import { CacheMonitor, CacheWarmer } from '@/utils/cache-integration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MaintenanceResult {
  success: boolean;
  duration: number;
  operations: string[];
  errors: string[];
  warnings: string[];
  metrics: any;
  timestamp: string;
}

async function performCacheMaintenance(): Promise<void> {
  console.log('🔧 Cache Maintenance Script');
  console.log('🚀 Starting comprehensive cache maintenance...');
  
  const startTime = Date.now();
  const operations: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Ensure data directory exists
  const dataDir = join(__dirname, '../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    // 1. Check cache health
    console.log('📊 Checking cache health status...');
    operations.push('Health check');
    
    const initialStatus = await CacheMonitor.getStatus();
    console.log(`   Cache status: ${initialStatus.health.status}`);
    console.log(`   Total entries: ${initialStatus.stats.totalEntries}`);
    console.log(`   Hit rate: ${(initialStatus.stats.hitRate * 100).toFixed(1)}%`);
    console.log(`   Miss rate: ${(initialStatus.stats.missRate * 100).toFixed(1)}%`);
    
    if (initialStatus.health.issues.length > 0) {
      console.log('⚠️  Issues found:');
      initialStatus.health.issues.forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.description}`);
        if (issue.severity === 'critical' || issue.severity === 'high') {
          warnings.push(`${issue.type}: ${issue.description}`);
        }
      });
    }
    
    // 2. Check if maintenance is needed
    console.log('🔍 Checking if maintenance is needed...');
    const needsMaintenance = await CacheMonitor.needsMaintenance();
    
    if (needsMaintenance) {
      console.log('✅ Maintenance is needed, proceeding...');
      
      // 3. Perform maintenance
      console.log('🛠️  Performing cache maintenance...');
      operations.push('Cache maintenance');
      
      const maintenanceResult = await CacheMonitor.performMaintenance();
      console.log(`   Maintenance completed in ${maintenanceResult.duration}ms`);
      
      // 4. Optimize cache performance
      console.log('⚡ Optimizing cache performance...');
      operations.push('Performance optimization');
      
      const cacheManager = new CacheManager(dataDir);
      const metrics = await cacheManager.optimizeCache();
      
      console.log('📈 Performance metrics:');
      console.log(`   Average read time: ${metrics.averageReadTime}ms`);
      console.log(`   Average write time: ${metrics.averageWriteTime}ms`);
      console.log(`   Compression ratio: ${(metrics.compressionRatio * 100).toFixed(1)}%`);
      console.log(`   Memory usage: ${Math.round(metrics.memoryUsage / 1024)}KB`);
      console.log(`   Disk usage: ${Math.round(metrics.diskUsage / 1024)}KB`);
      
      cacheManager.destroy();
      
    } else {
      console.log('ℹ️  Cache is healthy, no maintenance needed');
      operations.push('Health check only');
    }
    
    // 5. Generate maintenance report
    console.log('📝 Generating maintenance report...');
    operations.push('Report generation');
    
    const finalStatus = await CacheMonitor.getStatus();
    const duration = Date.now() - startTime;
    
    const result: MaintenanceResult = {
      success: true,
      duration,
      operations,
      errors,
      warnings,
      metrics: {
        initialHealth: initialStatus.health,
        finalHealth: finalStatus.health,
        initialStats: initialStatus.stats,
        finalStats: finalStatus.stats,
        needsMaintenance
      },
      timestamp: new Date().toISOString()
    };
    
    // Save maintenance report
    const reportPath = join(dataDir, 'cache-maintenance-report.json');
    writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    // Log summary
    console.log('\n📊 Maintenance Summary:');
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Operations: ${operations.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Errors: ${errors.length}`);
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n✅ Cache maintenance completed successfully');
    
    // Force exit after a short delay to ensure cleanup
    setTimeout(() => {
      process.exit(0);
    }, 100);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Cache maintenance failed:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    // Save error report
    const errorResult: MaintenanceResult = {
      success: false,
      duration,
      operations,
      errors,
      warnings,
      metrics: null,
      timestamp: new Date().toISOString()
    };
    
    const reportPath = join(dataDir, 'cache-maintenance-report.json');
    writeFileSync(reportPath, JSON.stringify(errorResult, null, 2));
    
    // Force exit after a short delay
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}

async function warmCaches(): Promise<void> {
  console.log('🔥 Cache Warming Script');
  console.log('🚀 Starting cache warming process...');
  
  try {
    // Warm up caches with mock data for demonstration
    await CacheWarmer.warmAllCaches({
      github: async () => {
        console.log('   Warming GitHub cache...');
        return { repositories: [], members: [], stats: {} };
      },
      wordpress: async () => {
        console.log('   Warming WordPress cache...');
        return { posts: [], authors: [], categories: [] };
      },
      status: async () => {
        console.log('   Warming status cache...');
        return { services: [], overall: { status: 'operational' } };
      },
      seo: async () => {
        console.log('   Warming SEO cache...');
        return { metadata: {} };
      }
    });
    
    console.log('✅ Cache warming completed successfully');
    
    // Force exit after a short delay
    setTimeout(() => {
      process.exit(0);
    }, 100);
    
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}

async function showCacheStatus(): Promise<void> {
  console.log('📊 Cache Status Report');
  console.log('🔍 Gathering cache information...');
  
  const dataDir = join(__dirname, '../data');
  let cacheManager: CacheManager | null = null;
  
  try {
    // Create a temporary cache manager for status checking
    cacheManager = new CacheManager(dataDir, { autoCleanup: false });
    
    // Get basic stats
    const stats = cacheManager.getStats();
    console.log('\n📈 Cache Statistics:');
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Total size: ${Math.round(stats.totalSize / 1024)}KB`);
    console.log(`   Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    console.log(`   Miss rate: ${(stats.missRate * 100).toFixed(1)}%`);
    console.log(`   Expired entries: ${stats.expiredEntries}`);
    console.log(`   Last cleanup: ${stats.lastCleanup.toLocaleString()}`);
    
    // Get health status with timeout
    console.log('\n🏥 Health Status:');
    const healthPromise = cacheManager.getHealthStatus();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), 5000)
    );
    
    try {
      const health = await Promise.race([healthPromise, timeoutPromise]) as any;
      console.log(`   Status: ${health.status}`);
      console.log(`   Issues: ${health.issues.length}`);
      console.log(`   Recommendations: ${health.recommendations.length}`);
      console.log(`   Last check: ${health.lastCheck.toLocaleString()}`);
      
      if (health.issues.length > 0) {
        console.log('\n⚠️  Issues:');
        health.issues.forEach((issue: any) => {
          console.log(`   - [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
        });
      }
      
      if (health.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        health.recommendations.forEach((rec: string) => {
          console.log(`   - ${rec}`);
        });
      }
    } catch (error) {
      console.log('   Status: unknown (health check failed)');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Get recent operations
    console.log('\n🔄 Recent Operations:');
    const recentOps = cacheManager.getRecentOperations(10);
    if (recentOps.length > 0) {
      recentOps.forEach(op => {
        const opStatus = op.success ? '✅' : '❌';
        console.log(`   ${opStatus} ${op.type} ${op.key} (${op.duration}ms)`);
      });
    } else {
      console.log('   No recent operations');
    }
    
    console.log('\n✅ Cache status report completed');
    
  } catch (error) {
    console.error('❌ Failed to get cache status:', error);
    process.exit(1);
  } finally {
    // Clean up cache manager to prevent hanging
    if (cacheManager) {
      cacheManager.destroy();
    }
    
    // Force exit after a short delay to ensure cleanup
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }
}

// Main execution
async function main(): Promise<void> {
  const command = process.argv[2] || 'maintenance';
  
  switch (command) {
    case 'maintenance':
    case 'maintain':
      await performCacheMaintenance();
      break;
      
    case 'warm':
    case 'warmup':
      await warmCaches();
      break;
      
    case 'status':
    case 'info':
      await showCacheStatus();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log('Cache Maintenance Script');
      console.log('');
      console.log('Usage: tsx scripts/cache-maintenance.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  maintenance, maintain  Perform cache maintenance and optimization');
      console.log('  warm, warmup          Warm up all caches with fresh data');
      console.log('  status, info          Show current cache status and health');
      console.log('  help                  Show this help message');
      console.log('');
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use "help" to see available commands');
      process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { performCacheMaintenance, warmCaches, showCacheStatus };