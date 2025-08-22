/**
 * Tests for Gemini AI Analyzer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Repository } from '@/types/repository';

// Mock the Google Generative AI module
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn()
    })
  }))
}));

// Mock the AI config
vi.mock('../../config/ai.config', () => ({
  aiConfig: {
    geminiApiKey: 'test-api-key',
    analysisPrompts: {
      projectEvaluation: 'Test prompt for {name} with {description}',
      multilingualGeneration: 'Generate content for {name}'
    },
    rateLimiting: {
      requestsPerMinute: 60
    },
    fallbackStrategy: 'use-cache'
  },
  aiModelConfig: {
    model: 'gemini-pro',
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxTokens: 2048
  },
  qualityThresholds: {
    minDisplayScore: 60,
    minConfidenceScore: 0.7,
    minReadmeLength: 100,
    minDescriptionLength: 20
  },
  fallbackContent: {
    defaultDescription: {
      zh: '这是一个优秀的开源项目',
      en: 'This is an excellent open source project'
    },
    defaultHighlights: {
      zh: ['现代化技术栈', '优秀的代码质量'],
      en: ['Modern tech stack', 'Excellent code quality']
    },
    categoryMapping: {
      'javascript': 'web-app',
      'python': 'automation',
      'swift': 'mobile-app'
    }
  }
}));

describe('GeminiAnalyzer', () => {
  let GeminiAnalyzer: any;
  let analyzer: any;

  const mockRepository: Repository = {
    id: 'test-repo',
    name: 'test-project',
    description: 'A test project for unit testing',
    language: 'TypeScript',
    topics: ['react', 'typescript', 'testing'],
    stars: 100,
    forks: 25,
    readme: 'This is a comprehensive README with detailed documentation...',
    homepage: 'https://test-project.com',
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

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Dynamically import the analyzer after mocks are set up
    const module = await import('../../src/services/gemini-analyzer');
    GeminiAnalyzer = module.GeminiAnalyzer;
    analyzer = new GeminiAnalyzer();
  });

  describe('constructor', () => {
    it('should initialize with valid API key', () => {
      expect(analyzer).toBeInstanceOf(GeminiAnalyzer);
    });
  });

  describe('analyzeRepository', () => {
    it('should handle API errors gracefully and return fallback analysis', async () => {
      // Mock the generateContent to reject
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));
      
      // Mock the Google AI instance
      vi.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
          getGenerativeModel: vi.fn().mockReturnValue({
            generateContent: mockGenerateContent
          })
        }))
      }));

      const result = await analyzer.analyzeRepository(mockRepository);

      expect(result).toBeDefined();
      expect(result.repositoryId).toBe('test-repo');
      expect(result.aiModel).toBe('fallback');
      expect(result.reasoning).toContain('Fallback analysis');
      expect(result.confidence).toBe(0.5);
      expect(result.shouldDisplay).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    it('should infer category from repository language', async () => {
      const jsRepo = { ...mockRepository, language: 'JavaScript' };
      const result = await analyzer.analyzeRepository(jsRepo);

      expect(result.category).toBe('web-app');
    });

    it('should calculate basic score based on repository metrics', async () => {
      const highQualityRepo = {
        ...mockRepository,
        stars: 500,
        forks: 100,
        description: 'A very detailed and comprehensive description of this amazing project with lots of useful information',
        topics: ['react', 'typescript', 'testing', 'documentation', 'ci-cd']
      };

      const result = await analyzer.analyzeRepository(highQualityRepo);

      expect(result.score).toBeGreaterThan(60);
      expect(result.shouldDisplay).toBe(true);
    });

    it('should extract tech stack from repository data', async () => {
      const repo = {
        ...mockRepository,
        language: 'JavaScript',
        topics: ['react', 'node', 'express', 'mongodb']
      };

      const result = await analyzer.analyzeRepository(repo);

      expect(result.techStack).toContain('JavaScript');
      expect(result.techStack).toContain('react');
    });
  });

  describe('generateProjectDescription', () => {
    it('should generate description in specified language', async () => {
      const zhDescription = await analyzer.generateProjectDescription(mockRepository, 'zh');
      const enDescription = await analyzer.generateProjectDescription(mockRepository, 'en');

      expect(typeof zhDescription).toBe('string');
      expect(typeof enDescription).toBe('string');
      expect(zhDescription.length).toBeGreaterThan(0);
      expect(enDescription.length).toBeGreaterThan(0);
    });
  });

  describe('categorizeProjects', () => {
    it('should categorize multiple projects', async () => {
      const repositories = [
        { ...mockRepository, id: 'repo1', language: 'JavaScript', topics: ['react', 'web'] },
        { ...mockRepository, id: 'repo2', language: 'Swift', topics: ['ios', 'mobile'] },
        { ...mockRepository, id: 'repo3', language: 'Python', topics: ['automation', 'cli'] }
      ];

      const categories = await analyzer.categorizeProjects(repositories);

      expect(categories).toHaveLength(3);
      // Check that we get valid categories (the exact categories depend on the inference logic)
      categories.forEach(category => {
        expect(['web-app', 'mobile-app', 'automation', 'library', 'other']).toContain(category);
      });
    });
  });

  describe('evaluateProjectValue', () => {
    it('should evaluate project value with detailed scoring', async () => {
      const score = await analyzer.evaluateProjectValue(mockRepository);

      expect(score).toBeDefined();
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.completeness).toBeGreaterThan(0);
      expect(score.technicalComplexity).toBeGreaterThan(0);
      expect(score.documentationQuality).toBeGreaterThan(0);
      expect(score.factors).toHaveLength(1);
    });
  });

  describe('generateMultilingualContent', () => {
    it('should generate multilingual content with fallback', async () => {
      const content = await analyzer.generateMultilingualContent(mockRepository);

      expect(content).toBeDefined();
      expect(content.zh).toBeDefined();
      expect(content.en).toBeDefined();
      expect(typeof content.zh).toBe('string');
      expect(typeof content.en).toBe('string');
    });
  });

  describe('intelligentProjectFiltering', () => {
    it('should filter projects based on analysis', async () => {
      const repositories = [
        { ...mockRepository, id: 'good-repo', stars: 1000 },
        { ...mockRepository, id: 'bad-repo', stars: 0, description: '' }
      ];

      const filtered = await analyzer.intelligentProjectFiltering(repositories);

      expect(Array.isArray(filtered)).toBe(true);
      expect(filtered.length).toBeLessThanOrEqual(repositories.length);
    });
  });

  describe('generateSEOContent', () => {
    it('should generate SEO content for repository', async () => {
      const seoContent = await analyzer.generateSEOContent(mockRepository, 'en');

      expect(seoContent).toBeDefined();
      expect(seoContent.title).toBeDefined();
      expect(seoContent.description).toBeDefined();
      expect(Array.isArray(seoContent.keywords)).toBe(true);
      expect(seoContent.ogTitle).toBeDefined();
      expect(seoContent.twitterTitle).toBeDefined();
    });
  });

  describe('translateContent', () => {
    it('should return original content for same language', async () => {
      const content = 'Same language content';
      const result = await analyzer.translateContent(content, 'en', 'en');

      expect(result).toBe(content);
    });

    it('should handle translation between different languages', async () => {
      const original = 'Original content';
      const result = await analyzer.translateContent(original, 'zh', 'en');

      // Should return something (either translated or original as fallback)
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('fallback mechanisms', () => {
    it('should provide meaningful fallback content', async () => {
      const repo = {
        ...mockRepository,
        name: 'awesome-project',
        language: 'Python',
        description: 'An awesome Python project'
      };

      const result = await analyzer.analyzeRepository(repo);

      // Check that the project name appears in the generated content
      expect(result.description.zh).toContain('awesome-project');
      expect(result.description.en).toContain('awesome-project');
      expect(result.socialShareContent.zh.title).toBe('awesome-project');
      expect(result.socialShareContent.en.title).toBe('awesome-project');
      expect(result.techStack).toContain('Python');
    });

    it('should handle repositories with minimal data', async () => {
      const minimalRepo = {
        ...mockRepository,
        description: '',
        readme: '',
        topics: [],
        stars: 0,
        forks: 0
      };

      const result = await analyzer.analyzeRepository(minimalRepo);

      expect(result).toBeDefined();
      expect(result.repositoryId).toBe(minimalRepo.id);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.category).toBeDefined();
    });
  });
});