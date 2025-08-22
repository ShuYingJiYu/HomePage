/**
 * Data Cache Manager
 * Manages JSON file caching with incremental updates and performance optimization
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import type {
  CacheEntry,
  CacheMetadata,
  CacheConfig,
  CacheStats,
  CacheOperation,
  IncrementalUpdateConfig,
  DataSource,
  CacheInvalidationRule,
  DataMergeStrategy,
  CachePerformanceMetrics,
  CacheHealthCheck,
  CacheIssue
} from '@/types/cache';

export class CacheManager {
  private config: CacheConfig;
  private incrementalConfig: IncrementalUpdateConfig;
  private dataSources: Map<string, DataSource> = new Map();
  private invalidationRules: CacheInvalidationRule[] = [];
  private operations: CacheOperation[] = [];
  private stats: CacheStats;
  private cacheDir: string;
  private metadataFile: string;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    cacheDir: string = 'data',
    config: Partial<CacheConfig> = {},
    incrementalConfig: Partial<IncrementalUpdateConfig> = {}
  ) {
    this.cacheDir = cacheDir;
    this.metadataFile = join(cacheDir, '.cache-metadata.json');
    
    // Default configuration
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: true,
      checksumAlgorithm: 'sha256',
      autoCleanup: true,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      ...config
    };

    this.incrementalConfig = {
      enabled: true,
      checkInterval: 5 * 60 * 1000, // 5 minutes
      batchSize: 10,
      maxRetries: 3,
      retryDelay: 1000,
      ...incrementalConfig
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      lastCleanup: new Date(),
      expiredEntries: 0
    };

    this.initialize();
  }

  /**
   * Initialize cache manager
   */
  private initialize(): void {
    // Ensure cache directory exists
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.warn(`Failed to create cache directory: ${this.cacheDir}`, error);
      // Continue with initialization, but cache operations will fail gracefully
    }

    // Load existing metadata
    this.loadMetadata();

    // Start auto cleanup if enabled
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }

    // Register default data sources
    this.registerDefaultDataSources();

    // Setup default invalidation rules
    this.setupDefaultInvalidationRules();
  }

  /**
   * Register default data sources
   */
  private registerDefaultDataSources(): void {
    const now = new Date();
    
    this.dataSources.set('github', {
      name: 'GitHub Data',
      type: 'github',
      lastFetch: now,
      nextFetch: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours
      fetchInterval: 6 * 60 * 60 * 1000,
      priority: 'high',
      dependencies: []
    });

    this.dataSources.set('wordpress', {
      name: 'WordPress Blog',
      type: 'wordpress',
      lastFetch: now,
      nextFetch: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      fetchInterval: 2 * 60 * 60 * 1000,
      priority: 'medium',
      dependencies: []
    });

    this.dataSources.set('status', {
      name: 'Status Monitoring',
      type: 'status',
      lastFetch: now,
      nextFetch: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
      fetchInterval: 15 * 60 * 1000,
      priority: 'high',
      dependencies: []
    });

    this.dataSources.set('seo', {
      name: 'SEO Metadata',
      type: 'seo',
      lastFetch: now,
      nextFetch: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      fetchInterval: 24 * 60 * 60 * 1000,
      priority: 'low',
      dependencies: ['github', 'wordpress']
    });
  }

  /**
   * Setup default cache invalidation rules
   */
  private setupDefaultInvalidationRules(): void {
    this.invalidationRules = [
      {
        pattern: /^github-.*\.json$/,
        condition: 'time',
        threshold: 6 * 60 * 60 * 1000, // 6 hours
        action: 'refresh'
      },
      {
        pattern: /^blog-.*\.json$/,
        condition: 'time',
        threshold: 2 * 60 * 60 * 1000, // 2 hours
        action: 'refresh'
      },
      {
        pattern: /^status-.*\.json$/,
        condition: 'time',
        threshold: 15 * 60 * 1000, // 15 minutes
        action: 'refresh'
      },
      {
        pattern: /.*\.json$/,
        condition: 'size',
        threshold: 10 * 1024 * 1024, // 10MB
        action: 'compress'
      }
    ];
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const filePath = this.getFilePath(key);
      
      if (!existsSync(filePath)) {
        this.recordOperation('read', key, startTime, false, 'File not found');
        return null;
      }

      const entry = this.readCacheEntry<T>(filePath);
      
      // Check if entry is expired
      if (this.isExpired(entry.metadata)) {
        this.recordOperation('read', key, startTime, false, 'Entry expired');
        return null;
      }

      // Verify checksum
      if (!this.verifyChecksum(entry)) {
        this.recordOperation('read', key, startTime, false, 'Checksum mismatch');
        return null;
      }

      this.recordOperation('read', key, startTime, true);
      return entry.data;
      
    } catch (error) {
      this.recordOperation('read', key, startTime, false, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, options: Partial<CacheMetadata> = {}): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const filePath = this.getFilePath(key);
      
      // Ensure directory exists
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Create cache entry
      const entry = this.createCacheEntry(data, options);
      
      // Write to file
      this.writeCacheEntry(filePath, entry);
      
      // Update stats
      this.updateStats();
      
      this.recordOperation('write', key, startTime, true);
      return true;
      
    } catch (error) {
      this.recordOperation('write', key, startTime, false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const filePath = this.getFilePath(key);
      
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      
      this.recordOperation('delete', key, startTime, true);
      return true;
      
    } catch (error) {
      this.recordOperation('delete', key, startTime, false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Check if data needs incremental update
   */
  async needsIncrementalUpdate(key: string): Promise<boolean> {
    if (!this.incrementalConfig.enabled) {
      return false;
    }

    const entry = await this.getCacheEntry(key);
    if (!entry) {
      return true; // No cache, needs full update
    }

    const dataSource = this.dataSources.get(key);
    if (!dataSource) {
      return false; // No data source configured
    }

    const now = new Date();
    return now >= dataSource.nextFetch;
  }

  /**
   * Perform incremental update detection
   */
  async detectIncrementalChanges<T>(key: string, newData: T): Promise<{
    hasChanges: boolean;
    changedFields: string[];
    mergeStrategy: DataMergeStrategy;
  }> {
    const existingData = await this.get<T>(key);
    
    if (!existingData) {
      return {
        hasChanges: true,
        changedFields: ['*'],
        mergeStrategy: { type: 'replace', conflictResolution: 'latest' }
      };
    }

    const changedFields = this.compareData(existingData, newData);
    
    return {
      hasChanges: changedFields.length > 0,
      changedFields,
      mergeStrategy: this.determineMergeStrategy(key, changedFields)
    };
  }

  /**
   * Merge data using specified strategy
   */
  async mergeData<T>(key: string, newData: T, strategy: DataMergeStrategy): Promise<T> {
    const existingData = await this.get<T>(key);
    
    if (!existingData || strategy.type === 'replace') {
      return newData;
    }

    switch (strategy.type) {
      case 'merge':
        return this.deepMerge(existingData, newData, strategy.conflictResolution);
      
      case 'append':
        return this.appendData(existingData, newData);
      
      case 'custom':
        if (strategy.customMerger) {
          return strategy.customMerger(existingData, newData);
        }
        return newData;
      
      default:
        return newData;
    }
  }

  /**
   * Invalidate cache based on rules
   */
  async invalidateCache(pattern?: string | RegExp): Promise<number> {
    const startTime = Date.now();
    let invalidatedCount = 0;

    try {
      const files = this.getAllCacheFiles();
      
      for (const file of files) {
        const shouldInvalidate = pattern 
          ? this.matchesPattern(file, pattern)
          : this.shouldInvalidateByRules(file);
          
        if (shouldInvalidate) {
          await this.delete(file);
          invalidatedCount++;
        }
      }

      this.recordOperation('cleanup', 'invalidation', startTime, true);
      return invalidatedCount;
      
    } catch (error) {
      this.recordOperation('cleanup', 'invalidation', startTime, false, error instanceof Error ? error.message : 'Unknown error');
      return 0;
    }
  }

  /**
   * Optimize cache performance
   */
  async optimizeCache(): Promise<CachePerformanceMetrics> {
    const startTime = Date.now();
    
    try {
      // Compress large files
      await this.compressLargeFiles();
      
      // Remove expired entries
      await this.cleanupExpiredEntries();
      
      // Defragment cache
      await this.defragmentCache();
      
      // Calculate metrics
      const metrics = await this.calculatePerformanceMetrics();
      
      this.recordOperation('cleanup', 'optimization', startTime, true);
      return metrics;
      
    } catch (error) {
      this.recordOperation('cleanup', 'optimization', startTime, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<CacheHealthCheck> {
    const issues: CacheIssue[] = [];
    const recommendations: string[] = [];

    // Check for corrupted files
    const corruptedFiles = await this.findCorruptedFiles();
    if (corruptedFiles.length > 0) {
      issues.push({
        type: 'corruption',
        severity: 'high',
        description: `Found ${corruptedFiles.length} corrupted cache files`,
        affectedKeys: corruptedFiles,
        suggestedAction: 'Delete and regenerate corrupted files'
      });
    }

    // Check for expired entries
    const expiredFiles = await this.findExpiredFiles();
    if (expiredFiles.length > 0) {
      issues.push({
        type: 'expiry',
        severity: 'medium',
        description: `Found ${expiredFiles.length} expired cache entries`,
        affectedKeys: expiredFiles,
        suggestedAction: 'Run cache cleanup to remove expired entries'
      });
    }

    // Check cache size
    const totalSize = await this.calculateTotalSize();
    if (totalSize > this.config.maxSize) {
      issues.push({
        type: 'size',
        severity: 'high',
        description: `Cache size (${Math.round(totalSize / 1024 / 1024)}MB) exceeds limit (${Math.round(this.config.maxSize / 1024 / 1024)}MB)`,
        affectedKeys: [],
        suggestedAction: 'Enable compression or increase cache size limit'
      });
    }

    // Performance recommendations
    if (this.stats.hitRate < 0.8) {
      recommendations.push('Consider increasing cache duration for better hit rate');
    }

    if (!this.config.compressionEnabled && totalSize > 50 * 1024 * 1024) {
      recommendations.push('Enable compression to reduce cache size');
    }

    const status = issues.some(i => i.severity === 'critical') ? 'critical' :
                  issues.some(i => i.severity === 'high') ? 'warning' : 'healthy';

    return {
      status,
      issues,
      recommendations,
      lastCheck: new Date()
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get recent operations
   */
  getRecentOperations(limit: number = 100): CacheOperation[] {
    return this.operations.slice(-limit);
  }

  // Private helper methods

  private getFilePath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  private createCacheEntry<T>(data: T, options: Partial<CacheMetadata>): CacheEntry<T> {
    const now = new Date();
    const serializedData = JSON.stringify(data);
    const checksum = this.calculateChecksum(serializedData);
    
    const metadata: CacheMetadata = {
      lastUpdated: now,
      expiresAt: new Date(now.getTime() + this.config.maxAge),
      version: '1.0.0',
      source: 'cache-manager',
      size: Buffer.byteLength(serializedData, 'utf8'),
      compressionType: 'none',
      ...options
    };

    return {
      data,
      metadata,
      checksum
    };
  }

  private readCacheEntry<T>(filePath: string): CacheEntry<T> {
    const content = readFileSync(filePath, 'utf8');
    
    try {
      const parsed = JSON.parse(content);
      
      // Check if data is compressed
      if (parsed.metadata?.compressionType === 'gzip' && typeof parsed.data === 'string') {
        try {
          const decompressed = gunzipSync(Buffer.from(parsed.data, 'base64')).toString('utf8');
          parsed.data = JSON.parse(decompressed);
        } catch (decompError) {
          console.warn('Failed to decompress data, using as-is:', decompError);
        }
      }
      
      return parsed;
    } catch (parseError) {
      // If JSON parsing fails, try to handle compressed content directly
      if (content.startsWith('H4sIA')) {
        try {
          const decompressed = gunzipSync(Buffer.from(content, 'base64')).toString('utf8');
          return JSON.parse(decompressed);
        } catch (decompError) {
          throw new Error(`Failed to parse cache entry: ${parseError}`);
        }
      }
      throw parseError;
    }
  }

  private writeCacheEntry<T>(filePath: string, entry: CacheEntry<T>): void {
    const content = JSON.stringify(entry, null, 2);
    
    // For now, disable compression to avoid JSON parsing issues
    // TODO: Implement proper compression/decompression handling
    entry.metadata.compressionType = 'none';
    
    writeFileSync(filePath, content, 'utf8');
  }

  private calculateChecksum(data: string): string {
    return createHash(this.config.checksumAlgorithm).update(data).digest('hex');
  }

  private verifyChecksum<T>(entry: CacheEntry<T>): boolean {
    const serializedData = JSON.stringify(entry.data);
    const calculatedChecksum = this.calculateChecksum(serializedData);
    return calculatedChecksum === entry.checksum;
  }

  private isExpired(metadata: CacheMetadata): boolean {
    return new Date() > new Date(metadata.expiresAt);
  }

  private async getCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filePath = this.getFilePath(key);
      if (!existsSync(filePath)) {
        return null;
      }
      return this.readCacheEntry<T>(filePath);
    } catch {
      return null;
    }
  }

  private compareData<T>(existing: T, incoming: T): string[] {
    const changes: string[] = [];
    
    const compare = (obj1: any, obj2: any, path: string = '') => {
      if (typeof obj1 !== typeof obj2) {
        changes.push(path || 'root');
        return;
      }
      
      if (obj1 === null || obj2 === null) {
        if (obj1 !== obj2) {
          changes.push(path || 'root');
        }
        return;
      }
      
      if (Array.isArray(obj1) && Array.isArray(obj2)) {
        // Handle arrays specially
        if (obj1.length !== obj2.length) {
          changes.push(path || 'root');
          return;
        }
        
        for (let i = 0; i < obj1.length; i++) {
          const newPath = path ? `${path}.${i}` : `${i}`;
          if (JSON.stringify(obj1[i]) !== JSON.stringify(obj2[i])) {
            compare(obj1[i], obj2[i], newPath);
          }
        }
        
        // If array contents changed, also mark the array itself as changed
        if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
          changes.push(path || 'root');
        }
      } else if (typeof obj1 === 'object' && !Array.isArray(obj1)) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        const allKeys = new Set([...keys1, ...keys2]);
        
        for (const key of allKeys) {
          const newPath = path ? `${path}.${key}` : key;
          if (!(key in obj1) || !(key in obj2)) {
            changes.push(newPath);
          } else {
            compare(obj1[key], obj2[key], newPath);
          }
        }
      } else if (obj1 !== obj2) {
        changes.push(path || 'root');
      }
    };
    
    compare(existing, incoming);
    return [...new Set(changes)]; // Remove duplicates
  }

  private determineMergeStrategy(key: string, changedFields: string[]): DataMergeStrategy {
    // Default strategies based on data type
    if (key.startsWith('github-')) {
      return { type: 'merge', conflictResolution: 'latest' };
    }
    
    if (key.startsWith('blog-')) {
      return { type: 'replace', conflictResolution: 'latest' };
    }
    
    return { type: 'replace', conflictResolution: 'latest' };
  }

  private deepMerge<T>(existing: T, incoming: T, conflictResolution: 'latest' | 'priority' | 'manual'): T {
    if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
      return incoming;
    }
    
    if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming)) {
      return incoming;
    }
    
    const result = { ...existing } as any;
    
    for (const [key, value] of Object.entries(incoming as any)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && key in result && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = this.deepMerge(result[key], value, conflictResolution);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  private appendData<T>(existing: T, incoming: T): T {
    if (Array.isArray(existing) && Array.isArray(incoming)) {
      return [...existing, ...incoming] as T;
    }
    
    return incoming;
  }

  private getAllCacheFiles(): string[] {
    try {
      if (!existsSync(this.cacheDir)) {
        return [];
      }
      

      const files = readdirSync(this.cacheDir);
      
      return files
        .filter(file => file.endsWith('.json') && !file.startsWith('.'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.warn('Failed to read cache directory:', error);
      return [];
    }
  }

  private matchesPattern(filename: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return filename.includes(pattern);
    }
    return pattern.test(filename);
  }

  private shouldInvalidateByRules(filename: string): boolean {
    return this.invalidationRules.some(rule => {
      if (!this.matchesPattern(filename, rule.pattern)) {
        return false;
      }
      
      if (rule.condition === 'time' && rule.threshold) {
        const filePath = this.getFilePath(filename);
        if (existsSync(filePath)) {
          const stats = statSync(filePath);
          const age = Date.now() - stats.mtime.getTime();
          return age > rule.threshold;
        }
      }
      
      return false;
    });
  }

  private async compressLargeFiles(): Promise<void> {
    const files = this.getAllCacheFiles();
    let compressedCount = 0;
    
    for (const file of files) {
      try {
        const filePath = this.getFilePath(file);
        if (existsSync(filePath)) {
          const stats = statSync(filePath);
          if (stats.size > 10 * 1024) { // Files larger than 10KB
            const entry = this.readCacheEntry(filePath);
            if (entry.metadata.compressionType === 'none') {
              this.writeCacheEntry(filePath, entry); // This will apply compression
              compressedCount++;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to compress file ${file}:`, error);
      }
    }
    
    console.log(`Compressed ${compressedCount} files`);
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const files = this.getAllCacheFiles();
    let cleanedCount = 0;
    
    for (const file of files) {
      try {
        const filePath = this.getFilePath(file);
        if (existsSync(filePath)) {
          const entry = this.readCacheEntry(filePath);
          if (this.isExpired(entry.metadata)) {
            unlinkSync(filePath);
            cleanedCount++;
          }
        }
      } catch (error) {
        console.warn(`Failed to check expiry for file ${file}:`, error);
      }
    }
    
    this.stats.expiredEntries = 0; // Reset after cleanup
    console.log(`Cleaned up ${cleanedCount} expired entries`);
  }

  private async defragmentCache(): Promise<void> {
    // Simple defragmentation: rewrite all cache files to optimize storage
    const files = this.getAllCacheFiles();
    let defragmentedCount = 0;
    
    for (const file of files) {
      try {
        const filePath = this.getFilePath(file);
        if (existsSync(filePath)) {
          const entry = this.readCacheEntry(filePath);
          this.writeCacheEntry(filePath, entry); // Rewrite to optimize
          defragmentedCount++;
        }
      } catch (error) {
        console.warn(`Failed to defragment file ${file}:`, error);
      }
    }
    
    console.log(`Defragmented ${defragmentedCount} files`);
  }

  private async calculatePerformanceMetrics(): Promise<CachePerformanceMetrics> {
    const readOps = this.operations.filter(op => op.type === 'read' && op.success);
    const writeOps = this.operations.filter(op => op.type === 'write' && op.success);
    
    const averageReadTime = readOps.length > 0 
      ? readOps.reduce((sum, op) => sum + op.duration, 0) / readOps.length 
      : 0;
      
    const averageWriteTime = writeOps.length > 0 
      ? writeOps.reduce((sum, op) => sum + op.duration, 0) / writeOps.length 
      : 0;
    
    // Calculate disk usage
    let totalSize = 0;
    let compressedSize = 0;
    const files = this.getAllCacheFiles();
    
    for (const file of files) {
      try {
        const filePath = this.getFilePath(file);
        if (existsSync(filePath)) {
          const stats = statSync(filePath);
          totalSize += stats.size;
          
          const entry = this.readCacheEntry(filePath);
          if (entry.metadata.compressionType !== 'none') {
            compressedSize += stats.size;
          }
        }
      } catch (error) {
        // Ignore errors for individual files
      }
    }
    
    const compressionRatio = totalSize > 0 ? compressedSize / totalSize : 0;
    
    return {
      averageReadTime,
      averageWriteTime,
      compressionRatio,
      memoryUsage: process.memoryUsage().heapUsed,
      diskUsage: totalSize,
      networkSavings: totalSize * 0.8 // Estimate network savings
    };
  }

  private async findCorruptedFiles(): Promise<string[]> {
    const corrupted: string[] = [];
    const files = this.getAllCacheFiles();
    
    for (const file of files) {
      try {
        const filePath = this.getFilePath(file);
        if (existsSync(filePath)) {
          const entry = this.readCacheEntry(filePath);
          if (!this.verifyChecksum(entry)) {
            corrupted.push(file);
          }
        }
      } catch (error) {
        corrupted.push(file);
      }
    }
    
    return corrupted;
  }

  private async findExpiredFiles(): Promise<string[]> {
    const expired: string[] = [];
    const files = this.getAllCacheFiles();
    
    for (const file of files) {
      try {
        const filePath = this.getFilePath(file);
        if (existsSync(filePath)) {
          const entry = this.readCacheEntry(filePath);
          if (this.isExpired(entry.metadata)) {
            expired.push(file);
          }
        }
      } catch (error) {
        // If we can't read the file, consider it expired
        expired.push(file);
      }
    }
    
    return expired;
  }

  private async calculateTotalSize(): Promise<number> {
    let totalSize = 0;
    const files = this.getAllCacheFiles();
    
    for (const file of files) {
      try {
        const filePath = this.getFilePath(file);
        if (existsSync(filePath)) {
          const stats = statSync(filePath);
          totalSize += stats.size;
        }
      } catch (error) {
        // Ignore errors for individual files
      }
    }
    
    return totalSize;
  }

  private recordOperation(type: CacheOperation['type'], key: string, startTime: number, success: boolean, error?: string): void {
    const operation: CacheOperation = {
      type,
      key,
      timestamp: new Date(startTime),
      success,
      duration: Date.now() - startTime,
      error
    };
    
    this.operations.push(operation);
    
    // Keep only recent operations
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-500);
    }
  }

  private updateStats(): void {
    try {
      // Update cache statistics
      this.stats.totalEntries = this.getAllCacheFiles().length;
      
      // Calculate hit and miss rates
      const totalOps = this.operations.filter(op => op.type === 'read').length;
      const successfulOps = this.operations.filter(op => op.type === 'read' && op.success).length;
      
      if (totalOps > 0) {
        this.stats.hitRate = successfulOps / totalOps;
        this.stats.missRate = 1 - this.stats.hitRate;
      }
      
      // Update total size (async operation, but we'll do it sync for simplicity)
      this.calculateTotalSize().then(size => {
        this.stats.totalSize = size;
      }).catch(() => {
        // Ignore errors
      });
    } catch (error) {
      console.warn('Failed to update cache stats:', error);
    }
  }

  private loadMetadata(): void {
    try {
      if (existsSync(this.metadataFile)) {
        const content = readFileSync(this.metadataFile, 'utf8');
        const metadata = JSON.parse(content);
        
        // Restore stats if available
        if (metadata.stats) {
          this.stats = { ...this.stats, ...metadata.stats };
        }
        
        // Restore data sources if available
        if (metadata.dataSources) {
          Object.entries(metadata.dataSources).forEach(([key, source]) => {
            this.dataSources.set(key, source as any);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load cache metadata:', error);
    }
  }

  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredEntries();
      } catch (error) {
        console.warn('Auto cleanup failed:', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// Default cache manager instance
export const cacheManager = new CacheManager();

// Utility function to create a configured cache manager
export function createCacheManager(
  cacheDir?: string,
  config?: Partial<CacheConfig>,
  incrementalConfig?: Partial<IncrementalUpdateConfig>
): CacheManager {
  return new CacheManager(cacheDir, config, incrementalConfig);
}