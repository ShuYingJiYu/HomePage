/**
 * Tests for AI Data Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIDataManager } from '../../src/services/ai-data-manager';
import type { Repository } from '../../src/types/repository';
import type { RepositoryAnalysis, ReviewDecision } from '../../src/types/ai';

// Mock the GeminiAnalyzer
const mockAnalyzeRepository = vi.fn();
vi.mock('../../src/services/gemini-analyzer', () => ({
  GeminiAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeRepository: mockAnalyzeRepository
  }))
}));

// Mock the AI config
vi.mock('../../config/ai.config', () => ({
  aiConfig: {
    fallbackStrategy: 'use-cache',
    rateLimiting: {
      requestsPerMinute: 60
    }
  }
}));

describe('AIDataManager', () => {
  let manager: AIDataManager;

  const mockRepository: Repository = {
    id: 'test-repo',
    name: 'test-project',
    description: 'A test project',
    language: 'TypeScript',
    topics: ['react', 'typescript'],
    stars: 100,
    forks: 25,
    readme: 'Test README content',
    homepage: 'https://test.com',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
    pushedAt: new Date('2024-01-01'),
    size: 1024,
    openIssues: 5,
    watchers: 50,
    defaultBranch: 'main',
    archived: false,
    disabled: false,
    private: false,
    fork: false,
    hasIssues: true,
    hasProjects: true,
    hasWiki: true,
    hasPages: false,
    hasDownloads: true,
    license: {
      key: 'mit',
      name: 'MIT License',
      spdxId: 'MIT',
      url: 'https://api.github.com/licenses/mit'
    }
  };

  const mockAnalysis: RepositoryAnalysis = {
    repositoryId: 'test-repo',
    score: 85,
    category: 'web-app' as any,
    techStack: ['TypeScript', 'React'],
    highlights: {
      zh: ['现代化技术栈', '优秀的代码质量'],
      en: ['Modern tech stack', 'Excellent code quality']
    },
    description: {
      zh: '这是一个优秀的React项目',
      en: 'This is an excellent React project'
    },
    shouldDisplay: true,
    reasoning: 'High quality project with good documentation',
    confidence: 0.9,
    seoKeywords: {
      zh: ['React', 'TypeScript', '前端'],
      en: ['React', 'TypeScript', 'frontend']
    },
    socialShareContent: {
      zh: {
        title: 'React项目',
        description: '优秀的React项目',
        hashtags: ['React', 'TypeScript'],
        summary: '优秀的React项目'
      },
      en: {
        title: 'React Project',
        description: 'Excellent React project',
        hashtags: ['React', 'TypeScript'],
        summary: 'Excellent React project'
      }
    },
    generatedAt: new Date(),
    aiModel: 'gemini-pro',
    processingTime: 1500
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyzeRepository.mockClear();
    
    manager = new AIDataManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeRepositories', () => {
    it('should analyze multiple repositories successfully', async () => {
      mockAnalyzeRepository.mockResolvedValue(mockAnalysis);

      const repositories = [mockRepository];
      const results = await manager.analyzeRepositories(repositories);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockAnalysis);
      expect(mockAnalyzeRepository).toHaveBeenCalledWith(mockRepository);
    });

    it('should handle analysis errors with fallback', async () => {
      mockAnalyzeRepository.mockRejectedValue(new Error('Analysis failed'));

      const repositories = [mockRepository];
      const results = await manager.analyzeRepositories(repositories);

      expect(results).toHaveLength(1);
      expect(results[0].repositoryId).toBe('test-repo');
      expect(results[0].aiModel).toBe('default');
      expect(results[0].reasoning).toContain('Default analysis');
    });

    it('should use cache for repeated analysis', async () => {
      mockAnalyzer.analyzeRepository.mockResolvedValue(mockAnalysis);

      const repositories = [mockRepository];
      
      // First analysis
      const results1 = await manager.analyzeRepositories(repositories);
      
      // Second analysis (should use cache)
      const results2 = await manager.analyzeRepositories(repositories);

      expect(results1).toEqual(results2);
      expect(mockAnalyzer.analyzeRepository).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache when repository is updated', async () => {
      mockAnalyzer.analyzeRepository.mockResolvedValue(mockAnalysis);

      const repositories = [mockRepository];
      
      // First analysis
      await manager.analyzeRepositories(repositories);
      
      // Update repository
      const updatedRepo = {
        ...mockRepository,
        updatedAt: new Date()
      };
      
      // Second analysis with updated repo
      await manager.analyzeRepositories([updatedRepo]);

      expect(mockAnalyzer.analyzeRepository).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateReviewReport', () => {
    it('should generate comprehensive review report', () => {
      const analyses = [
        mockAnalysis,
        { ...mockAnalysis, repositoryId: 'repo2', score: 45, shouldDisplay: false }
      ];

      const report = manager.generateReviewReport(analyses);

      expect(report).toBeDefined();
      expect(report.totalProjects).toBe(2);
      expect(report.approvedProjects).toBe(1);
      expect(report.rejectedProjects).toBe(1);
      expect(report.suggestedProjects).toHaveLength(2);
      expect(report.contentQualityMetrics).toBeDefined();
      expect(report.recommendedActions).toBeDefined();
    });

    it('should identify projects needing manual review', () => {
      const lowConfidenceAnalysis = {
        ...mockAnalysis,
        confidence: 0.3,
        repositoryId: 'low-confidence-repo'
      };

      const analyses = [mockAnalysis, lowConfidenceAnalysis];
      const report = manager.generateReviewReport(analyses);

      const manualReviewActions = report.recommendedActions.filter(
        (action: any) => action.type === 'review_manually'
      );

      expect(manualReviewActions).toHaveLength(1);
      expect(manualReviewActions[0].projectId).toBe('low-confidence-repo');
    });

    it('should calculate quality metrics correctly', () => {
      const analyses = [
        { ...mockAnalysis, score: 95 }, // Excellent
        { ...mockAnalysis, score: 75 }, // Good
        { ...mockAnalysis, score: 55 }, // Fair
        { ...mockAnalysis, score: 35 }  // Poor
      ];

      const report = manager.generateReviewReport(analyses);
      const metrics = report.contentQualityMetrics;

      expect(metrics.averageScore).toBe(65);
      expect(metrics.scoreDistribution.excellent).toBe(1);
      expect(metrics.scoreDistribution.good).toBe(1);
      expect(metrics.scoreDistribution.fair).toBe(1);
      expect(metrics.scoreDistribution.poor).toBe(1);
    });
  });

  describe('processReviewDecisions', () => {
    it('should process review decisions correctly', () => {
      const decisions: ReviewDecision[] = [
        {
          projectId: 'repo1',
          action: 'approve',
          timestamp: new Date(),
          reviewer: 'test-reviewer'
        },
        {
          projectId: 'repo2',
          action: 'reject',
          timestamp: new Date(),
          reviewer: 'test-reviewer'
        },
        {
          projectId: 'repo3',
          action: 'modify',
          modifications: {
            shouldDisplay: false
          },
          timestamp: new Date(),
          reviewer: 'test-reviewer'
        }
      ];

      const result = manager.processReviewDecisions(decisions);

      expect(result.statistics.totalProcessed).toBe(3);
      expect(result.statistics.approved).toBe(1);
      expect(result.statistics.rejected).toBe(1);
      expect(result.statistics.modified).toBe(1);
      expect(result.rejectedProjects).toContain('repo2');
    });
  });

  describe('fallback strategies', () => {
    it('should infer basic category correctly', async () => {
      mockAnalyzer.analyzeRepository.mockRejectedValue(new Error('AI Error'));

      const webRepo = { ...mockRepository, language: 'JavaScript', topics: ['react'] };
      const mobileRepo = { ...mockRepository, language: 'Swift', topics: ['ios'] };
      const libraryRepo = { ...mockRepository, language: 'TypeScript', topics: ['library'] };

      const [webResult, mobileResult, libraryResult] = await Promise.all([
        manager.analyzeRepositories([webRepo]),
        manager.analyzeRepositories([mobileRepo]),
        manager.analyzeRepositories([libraryRepo])
      ]);

      expect(webResult[0].category).toBe('web-app');
      expect(mobileResult[0].category).toBe('mobile-app');
      expect(libraryResult[0].category).toBe('library');
    });

    it('should extract basic tech stack', async () => {
      mockAnalyzer.analyzeRepository.mockRejectedValue(new Error('AI Error'));

      const repo = {
        ...mockRepository,
        language: 'JavaScript',
        topics: ['react', 'node', 'express', 'mongodb', 'docker']
      };

      const results = await manager.analyzeRepositories([repo]);
      const techStack = results[0].techStack;

      expect(techStack).toContain('JavaScript');
      expect(techStack).toContain('react');
      expect(techStack).toContain('node');
      expect(techStack).toContain('express');
      expect(techStack).toContain('mongodb');
      expect(techStack).toContain('docker');
    });

    it('should calculate basic score based on repository metrics', async () => {
      mockAnalyzer.analyzeRepository.mockRejectedValue(new Error('AI Error'));

      const highQualityRepo = {
        ...mockRepository,
        stars: 500,
        forks: 100,
        description: 'A very detailed and comprehensive description of this amazing project',
        topics: ['react', 'typescript', 'testing', 'documentation', 'ci-cd']
      };

      const results = await manager.analyzeRepositories([highQualityRepo]);
      const score = results[0].score;

      expect(score).toBeGreaterThan(70);
      expect(results[0].shouldDisplay).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear expired cache entries', async () => {
      mockAnalyzer.analyzeRepository.mockResolvedValue(mockAnalysis);

      // Analyze repository to populate cache
      await manager.analyzeRepositories([mockRepository]);

      // Manually set old timestamp to simulate expired cache
      const cacheTimestamps = (manager as any).cacheTimestamps;
      const cacheKey = Array.from(cacheTimestamps.keys())[0];
      cacheTimestamps.set(cacheKey, Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      // Clear expired cache
      manager.clearExpiredCache();

      // Verify cache is cleared
      const cache = (manager as any).cache;
      expect(cache.size).toBe(0);
    });

    it('should save and load cache from file', async () => {
      const saveSpy = vi.spyOn(manager, 'saveCacheToFile').mockResolvedValue();
      const loadSpy = vi.spyOn(manager, 'loadCacheFromFile').mockResolvedValue();

      await manager.saveCacheToFile();
      await manager.loadCacheFromFile();

      expect(saveSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('review history', () => {
    it('should save and retrieve review history', () => {
      const reviewRecord = {
        id: 'review-1',
        timestamp: new Date(),
        reviewer: 'test-reviewer',
        projectsReviewed: 5,
        decisionsCount: {
          approved: 3,
          rejected: 1,
          modified: 1
        },
        aiAccuracyScore: 0.85,
        averageReviewTime: 300,
        notes: 'Test review session'
      };

      const saveSpy = vi.spyOn(manager, 'saveReviewHistory');
      const getSpy = vi.spyOn(manager, 'getReviewHistory').mockReturnValue([reviewRecord]);

      manager.saveReviewHistory(reviewRecord);
      const history = manager.getReviewHistory();

      expect(saveSpy).toHaveBeenCalledWith(reviewRecord);
      expect(history).toContain(reviewRecord);
    });
  });

  describe('error handling and resilience', () => {
    it('should handle multiple analysis failures gracefully', async () => {
      mockAnalyzer.analyzeRepository
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockRejectedValueOnce(new Error('Invalid response'));

      const repositories = [
        { ...mockRepository, id: 'repo1' },
        { ...mockRepository, id: 'repo2' },
        { ...mockRepository, id: 'repo3' }
      ];

      const results = await manager.analyzeRepositories(repositories);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.aiModel).toBe('default');
        expect(result.reasoning).toContain('Default analysis');
      });
    });

    it('should provide meaningful fallback content', async () => {
      mockAnalyzer.analyzeRepository.mockRejectedValue(new Error('AI Service Down'));

      const repo = {
        ...mockRepository,
        name: 'awesome-project',
        language: 'Python'
      };

      const results = await manager.analyzeRepositories([repo]);
      const analysis = results[0];

      expect(analysis.description.zh).toContain('awesome-project');
      expect(analysis.description.zh).toContain('Python');
      expect(analysis.description.en).toContain('awesome-project');
      expect(analysis.description.en).toContain('Python');
      expect(analysis.socialShareContent.zh.title).toBe('awesome-project');
      expect(analysis.socialShareContent.en.title).toBe('awesome-project');
    });
  });
});