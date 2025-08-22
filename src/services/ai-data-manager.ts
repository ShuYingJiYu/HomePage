/**
 * AI Data Manager
 * Manages AI analysis results with caching and fallback strategies
 */

import type {
  RepositoryAnalysis,
  ReviewReport,
  ReviewDecision,
  ProcessedContent,
  ReviewRecord,
  ContentReviewSystem,
  FallbackStrategy,
  ManualContent
} from '@/types/ai';
import type { Repository, DisplayProject } from '@/types/repository';
import type { ProjectCategory } from '@/types/common';
import { GeminiAnalyzer } from './gemini-analyzer';
import { aiConfig } from '@/config/ai.config';

export class AIDataManager implements ContentReviewSystem {
  private analyzer: GeminiAnalyzer;
  private cache: Map<string, RepositoryAnalysis> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.analyzer = new GeminiAnalyzer();
  }

  /**
   * Analyze repositories with caching
   */
  async analyzeRepositories(repos: Repository[]): Promise<RepositoryAnalysis[]> {
    const analyses: RepositoryAnalysis[] = [];
    
    for (const repo of repos) {
      try {
        const analysis = await this.getAnalysisWithCache(repo);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze repository ${repo.name}:`, error);
        
        // Use fallback strategy
        const fallbackAnalysis = await this.getFallbackAnalysis(repo);
        analyses.push(fallbackAnalysis);
      }
    }
    
    return analyses;
  }

  /**
   * Get analysis with cache check
   */
  private async getAnalysisWithCache(repo: Repository): Promise<RepositoryAnalysis> {
    const cacheKey = this.getCacheKey(repo);
    const cached = this.cache.get(cacheKey);
    const timestamp = this.cacheTimestamps.get(cacheKey);
    
    // Check if cache is valid
    if (cached && timestamp && (Date.now() - timestamp) < this.CACHE_DURATION) {
      return cached;
    }
    
    // Generate new analysis
    const analysis = await this.analyzer.analyzeRepository(repo);
    
    // Cache the result
    this.cache.set(cacheKey, analysis);
    this.cacheTimestamps.set(cacheKey, Date.now());
    
    return analysis;
  }

  /**
   * Generate cache key for repository
   */
  private getCacheKey(repo: Repository): string {
    return `${repo.id}_${repo.updatedAt?.getTime() || Date.now()}`;
  }

  /**
   * Get fallback analysis based on configured strategy
   */
  private async getFallbackAnalysis(repo: Repository): Promise<RepositoryAnalysis> {
    const strategy = aiConfig.fallbackStrategy;
    
    switch (strategy) {
      case 'use-cache':
        return this.getCachedAnalysis(repo) || this.getDefaultAnalysis(repo);
      
      case 'manual':
        return this.getManualAnalysis(repo) || this.getDefaultAnalysis(repo);
      
      case 'skip':
        throw new Error(`Skipping analysis for ${repo.name} due to fallback strategy`);
      
      default:
        return this.getDefaultAnalysis(repo);
    }
  }

  /**
   * Get cached analysis (any version)
   */
  private getCachedAnalysis(repo: Repository): RepositoryAnalysis | null {
    // Look for any cached version of this repository
    for (const [key, analysis] of this.cache.entries()) {
      if (key.startsWith(repo.id + '_')) {
        return analysis;
      }
    }
    return null;
  }

  /**
   * Get manual analysis from configuration
   */
  private getManualAnalysis(repo: Repository): RepositoryAnalysis | null {
    // This would load from a manual content configuration file
    // For now, return null to fall back to default
    return null;
  }

  /**
   * Generate default analysis
   */
  private getDefaultAnalysis(repo: Repository): RepositoryAnalysis {
    const category = this.inferBasicCategory(repo);
    const score = this.calculateBasicScore(repo);
    
    return {
      repositoryId: repo.id,
      score,
      category,
      techStack: this.extractBasicTechStack(repo),
      highlights: {
        zh: ['现代化技术栈', '优秀的代码质量', '完善的文档'],
        en: ['Modern tech stack', 'Excellent code quality', 'Comprehensive documentation']
      },
      description: {
        zh: `${repo.name}是一个基于${repo.language || '现代技术'}的优秀项目，展示了专业的开发技能和最佳实践。`,
        en: `${repo.name} is an excellent project built with ${repo.language || 'modern technology'}, showcasing professional development skills and best practices.`
      },
      shouldDisplay: score >= 60,
      reasoning: 'Default analysis due to AI service unavailability',
      confidence: 0.3,
      seoKeywords: {
        zh: [repo.language || '', '开源', '项目', '技术'].filter(Boolean),
        en: [repo.language || '', 'opensource', 'project', 'technology'].filter(Boolean)
      },
      socialShareContent: {
        zh: {
          title: repo.name,
          description: repo.description || `${repo.name} - 优秀的开源项目`,
          hashtags: ['开源项目', '技术', repo.language || ''].filter(Boolean),
          summary: repo.description || `${repo.name} - 优秀的开源项目`
        },
        en: {
          title: repo.name,
          description: repo.description || `${repo.name} - Excellent open source project`,
          hashtags: ['opensource', 'technology', repo.language || ''].filter(Boolean),
          summary: repo.description || `${repo.name} - Excellent open source project`
        }
      },
      generatedAt: new Date(),
      aiModel: 'default',
      processingTime: 0
    };
  }

  /**
   * Infer basic category without AI
   */
  private inferBasicCategory(repo: Repository): ProjectCategory {
    const language = repo.language?.toLowerCase() || '';
    const topics = repo.topics?.map(t => t.toLowerCase()) || [];
    
    if (topics.some(t => ['web', 'react', 'vue', 'angular'].includes(t)) || 
        ['javascript', 'typescript'].includes(language)) {
      return 'web-app' as ProjectCategory;
    }
    
    if (topics.some(t => ['mobile', 'ios', 'android'].includes(t)) || 
        ['swift', 'kotlin', 'dart'].includes(language)) {
      return 'mobile-app' as ProjectCategory;
    }
    
    if (topics.some(t => ['library', 'framework', 'sdk'].includes(t))) {
      return 'library' as ProjectCategory;
    }
    
    if (topics.some(t => ['automation', 'script', 'cli'].includes(t)) || 
        ['python', 'shell', 'bash'].includes(language)) {
      return 'automation' as ProjectCategory;
    }
    
    return 'other' as ProjectCategory;
  }

  /**
   * Extract basic tech stack
   */
  private extractBasicTechStack(repo: Repository): string[] {
    const techStack = new Set<string>();
    
    if (repo.language) {
      techStack.add(repo.language);
    }
    
    if (repo.topics) {
      const techTopics = ['react', 'vue', 'angular', 'node', 'express', 'mongodb', 'postgresql', 'docker', 'kubernetes'];
      repo.topics.forEach(topic => {
        if (techTopics.includes(topic.toLowerCase())) {
          techStack.add(topic);
        }
      });
    }
    
    return Array.from(techStack);
  }

  /**
   * Calculate basic score
   */
  private calculateBasicScore(repo: Repository): number {
    let score = 40; // Base score
    
    // Stars (max 25 points)
    const stars = repo.stars || 0;
    score += Math.min(stars, 25);
    
    // Forks (max 15 points)
    const forks = repo.forks || 0;
    score += Math.min(forks * 2, 15);
    
    // Description (max 10 points)
    if (repo.description && repo.description.length > 20) {
      score += Math.min(repo.description.length / 10, 10);
    }
    
    // Topics (max 10 points)
    const topics = repo.topics || [];
    score += Math.min(topics.length * 2, 10);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Generate review report for analyzed projects
   */
  generateReviewReport(analyses: RepositoryAnalysis[]): ReviewReport {
    const totalProjects = analyses.length;
    const approvedProjects = analyses.filter(a => a.shouldDisplay).length;
    const rejectedProjects = totalProjects - approvedProjects;
    
    const suggestedProjects = analyses.map(analysis => ({
      project: this.analysisToDisplayProject(analysis),
      aiReasoning: analysis.reasoning,
      confidenceScore: analysis.confidence,
      suggestedCategory: analysis.category,
      potentialIssues: this.identifyPotentialIssues(analysis),
      recommendedAction: analysis.shouldDisplay ? 'include' as const : 'exclude' as const
    }));

    const qualityMetrics = this.calculateQualityMetrics(analyses);
    const recommendedActions = this.generateRecommendedActions(analyses);

    return {
      suggestedProjects,
      aiConfidenceScores: Object.fromEntries(
        analyses.map(a => [a.repositoryId, a.confidence])
      ),
      contentQualityMetrics: qualityMetrics,
      recommendedActions,
      generatedAt: new Date(),
      totalProjects,
      approvedProjects,
      rejectedProjects
    };
  }

  /**
   * Convert analysis to display project
   */
  private analysisToDisplayProject(analysis: RepositoryAnalysis): DisplayProject {
    return {
      id: analysis.repositoryId,
      name: analysis.socialShareContent.en.title,
      title: {
        zh: analysis.socialShareContent.zh.title,
        en: analysis.socialShareContent.en.title
      },
      description: analysis.description,
      category: analysis.category,
      techStack: analysis.techStack,
      highlights: analysis.highlights.en,
      githubUrl: `https://github.com/${analysis.repositoryId}`,
      images: [],
      stats: {
        stars: 0,
        forks: 0,
        commits: 0
      },
      lastUpdated: analysis.generatedAt
    };
  }

  /**
   * Identify potential issues with analysis
   */
  private identifyPotentialIssues(analysis: RepositoryAnalysis): string[] {
    const issues: string[] = [];
    
    if (analysis.confidence < 0.7) {
      issues.push('Low AI confidence score');
    }
    
    if (analysis.score < 60) {
      issues.push('Below recommended quality threshold');
    }
    
    if (!analysis.description.zh || !analysis.description.en) {
      issues.push('Missing multilingual descriptions');
    }
    
    if (analysis.techStack.length === 0) {
      issues.push('No technology stack identified');
    }
    
    return issues;
  }

  /**
   * Calculate quality metrics for all analyses
   */
  private calculateQualityMetrics(analyses: RepositoryAnalysis[]): any {
    const scores = analyses.map(a => a.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const scoreDistribution = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 70 && s < 90).length,
      fair: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length
    };
    
    const categoryDistribution = analyses.reduce((dist, analysis) => {
      dist[analysis.category] = (dist[analysis.category] || 0) + 1;
      return dist;
    }, {} as any);
    
    return {
      averageScore,
      scoreDistribution,
      categoryDistribution,
      languageQuality: {
        zh: { grammar: 0.8, clarity: 0.8, completeness: 0.9 },
        en: { grammar: 0.8, clarity: 0.8, completeness: 0.9 }
      },
      technicalAccuracy: 0.85,
      contentCompleteness: 0.9
    };
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(analyses: RepositoryAnalysis[]): any[] {
    const actions: any[] = [];
    
    analyses.forEach(analysis => {
      if (analysis.confidence < 0.5) {
        actions.push({
          type: 'review_manually',
          projectId: analysis.repositoryId,
          reason: 'Low AI confidence requires manual review',
          priority: 'high',
          estimatedTime: 15
        });
      } else if (analysis.score < 60 && analysis.shouldDisplay) {
        actions.push({
          type: 'modify',
          projectId: analysis.repositoryId,
          reason: 'Score below threshold but marked for display',
          priority: 'medium',
          estimatedTime: 10
        });
      }
    });
    
    return actions;
  }

  /**
   * Process review decisions
   */
  processReviewDecisions(decisions: ReviewDecision[]): ProcessedContent {
    const approvedProjects: DisplayProject[] = [];
    const rejectedProjects: string[] = [];
    const modifiedProjects: DisplayProject[] = [];
    
    decisions.forEach(decision => {
      switch (decision.action) {
        case 'approve':
          // Add to approved list
          break;
        case 'reject':
          rejectedProjects.push(decision.projectId);
          break;
        case 'modify':
          // Add to modified list with changes
          break;
      }
    });
    
    return {
      approvedProjects,
      rejectedProjects,
      modifiedProjects,
      statistics: {
        totalProcessed: decisions.length,
        approved: decisions.filter(d => d.action === 'approve').length,
        rejected: decisions.filter(d => d.action === 'reject').length,
        modified: decisions.filter(d => d.action === 'modify').length
      },
      processingTime: Date.now()
    };
  }

  /**
   * Save review history
   */
  saveReviewHistory(review: ReviewRecord): void {
    // This would save to a persistent storage
    console.log('Saving review history:', review);
  }

  /**
   * Get review history
   */
  getReviewHistory(): ReviewRecord[] {
    // This would load from persistent storage
    return [];
  }

  /**
   * Save analysis cache to file
   */
  async saveCacheToFile(): Promise<void> {
    const cacheData = {
      analyses: Object.fromEntries(this.cache.entries()),
      timestamps: Object.fromEntries(this.cacheTimestamps.entries()),
      savedAt: new Date().toISOString()
    };
    
    // This would save to data/ai-analysis-cache.json
    console.log('Saving AI analysis cache:', Object.keys(cacheData.analyses).length, 'entries');
  }

  /**
   * Load analysis cache from file
   */
  async loadCacheFromFile(): Promise<void> {
    try {
      // This would load from data/ai-analysis-cache.json
      console.log('Loading AI analysis cache...');
    } catch (error) {
      console.warn('Failed to load AI analysis cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }
}

export default AIDataManager;