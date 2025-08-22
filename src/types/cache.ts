/**
 * Cache Management Types
 * Types for the data cache management system
 */

export interface CacheEntry<T = any> {
  data: T;
  metadata: CacheMetadata;
  checksum: string;
}

export interface CacheMetadata {
  lastUpdated: Date;
  expiresAt: Date;
  version: string;
  source: string;
  size: number;
  compressionType?: 'none' | 'gzip' | 'brotli';
}

export interface CacheConfig {
  maxAge: number; // milliseconds
  maxSize: number; // bytes
  compressionEnabled: boolean;
  checksumAlgorithm: 'md5' | 'sha256';
  autoCleanup: boolean;
  cleanupInterval: number; // milliseconds
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  lastCleanup: Date;
  expiredEntries: number;
}

export interface CacheOperation {
  type: 'read' | 'write' | 'delete' | 'cleanup';
  key: string;
  timestamp: Date;
  success: boolean;
  duration: number; // milliseconds
  error?: string;
}

export interface IncrementalUpdateConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export interface DataSource {
  name: string;
  type: 'github' | 'wordpress' | 'status' | 'seo';
  lastFetch: Date;
  nextFetch: Date;
  fetchInterval: number; // milliseconds
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
}

export interface CacheInvalidationRule {
  pattern: string | RegExp;
  condition: 'time' | 'dependency' | 'manual' | 'size';
  threshold?: number;
  action: 'delete' | 'refresh' | 'compress';
}

export interface DataMergeStrategy {
  type: 'replace' | 'merge' | 'append' | 'custom';
  conflictResolution: 'latest' | 'priority' | 'manual';
  customMerger?: (existing: any, incoming: any) => any;
}

export interface CachePerformanceMetrics {
  averageReadTime: number;
  averageWriteTime: number;
  compressionRatio: number;
  memoryUsage: number;
  diskUsage: number;
  networkSavings: number;
}

export interface CacheHealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  issues: CacheIssue[];
  recommendations: string[];
  lastCheck: Date;
}

export interface CacheIssue {
  type: 'corruption' | 'expiry' | 'size' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedKeys: string[];
  suggestedAction: string;
}

export interface CacheBackup {
  id: string;
  timestamp: Date;
  entries: number;
  size: number;
  checksum: string;
  compressed: boolean;
}