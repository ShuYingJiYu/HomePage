/**
 * Google Gemini AI Analyzer Service
 * Provides intelligent project analysis, content generation, and multilingual support
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIAnalyzer,
  RepositoryAnalysis,
  ProjectScore,
  MultilingualContent,
  AIResponse,
  AIError,
  AIResponseMetadata,
  ContentGenerator,
  SEOContent,
  SocialContent
} from '@/types/ai';
import type { Repository } from '@/types/repository';
import type { ProjectCategory, Language } from '@/types/common';
import { aiConfig, aiModelConfig, qualityThresholds, fallbackContent } from '../../config/ai.config';

export class GeminiAnalyzer implements AIAnalyzer, ContentGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    if (!aiConfig.geminiApiKey) {
      throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY environment variable.');
    }
    
    this.genAI = new GoogleGenerativeAI(aiConfig.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: aiModelConfig.model,
      generationConfig: {
        temperature: aiModelConfig.temperature,
        topP: aiModelConfig.topP,
        topK: aiModelConfig.topK,
        maxOutputTokens: aiModelConfig.maxTokens,
      }
    });
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 60000) { // Within 1 minute
      if (this.requestCount >= aiConfig.rateLimiting.requestsPerMinute) {
        const waitTime = 60000 - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
      }
    } else {
      this.requestCount = 0;
    }
    
    this.requestCount++;
    this.lastRequestTime = now;
  }

  /**
   * Make a request to Gemini API with error handling
   */
  private async makeRequest<T>(prompt: string): Promise<AIResponse<T>> {
    const startTime = Date.now();
    
    try {
      await this.checkRateLimit();
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const processingTime = Date.now() - startTime;
      
      // Try to parse JSON response
      let data: T;
      try {
        data = JSON.parse(text);
      } catch {
        // If not JSON, return as string
        data = text as unknown as T;
      }

      const metadata: AIResponseMetadata = {
        model: aiModelConfig.model,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        processingTime,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      return {
        data,
        success: true,
        metadata
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      const aiError: AIError = {
        code: error.code || 'unknown_error',
        message: error.message || 'Unknown error occurred',
        type: this.categorizeError(error),
        details: { originalError: error }
      };

      const metadata: AIResponseMetadata = {
        model: aiModelConfig.model,
        tokensUsed: 0,
        processingTime,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      return {
        data: null as unknown as T,
        success: false,
        error: aiError,
        metadata
      };
    }
  }

  /**
   * Categorize error types for appropriate handling
   */
  private categorizeError(error: any): AIError['type'] {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('quota') || message.includes('limit')) {
      return 'quota_exceeded';
    }
    if (message.includes('rate') || message.includes('too many')) {
      return 'rate_limit';
    }
    if (message.includes('invalid') || message.includes('bad request')) {
      return 'invalid_request';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'network_error';
    }
    return 'server_error';
  }

  /**
   * Analyze repository and generate comprehensive analysis
   */
  async analyzeRepository(repo: Repository): Promise<RepositoryAnalysis> {
    const prompt = this.buildAnalysisPrompt(repo);
    const response = await this.makeRequest<any>(prompt);
    
    if (!response.success) {
      return this.getFallbackAnalysis(repo);
    }

    try {
      const analysis = response.data;
      
      return {
        repositoryId: repo.id,
        score: analysis.score || 0,
        category: analysis.category || this.inferCategory(repo),
        techStack: this.extractTechStack(repo),
        highlights: {
          zh: analysis.highlights || fallbackContent.defaultHighlights.zh,
          en: analysis.highlights || fallbackContent.defaultHighlights.en
        },
        description: {
          zh: analysis.description?.zh || fallbackContent.defaultDescription.zh,
          en: analysis.description?.en || fallbackContent.defaultDescription.en
        },
        shouldDisplay: analysis.shouldDisplay ?? (analysis.score >= qualityThresholds.minDisplayScore),
        reasoning: analysis.reasoning || 'AI analysis completed',
        confidence: 0.8,
        seoKeywords: {
          zh: analysis.seoKeywords?.zh || [],
          en: analysis.seoKeywords?.en || []
        },
        socialShareContent: {
          zh: {
            title: analysis.title?.zh || repo.name,
            description: analysis.description?.zh || repo.description || '',
            hashtags: ['开源项目', '技术', repo.language || ''].filter(Boolean),
            summary: analysis.description?.zh || repo.description || ''
          },
          en: {
            title: analysis.title?.en || repo.name,
            description: analysis.description?.en || repo.description || '',
            hashtags: ['opensource', 'tech', repo.language || ''].filter(Boolean),
            summary: analysis.description?.en || repo.description || ''
          }
        },
        generatedAt: new Date(),
        aiModel: aiModelConfig.model,
        processingTime: response.metadata.processingTime
      };
    } catch (error) {
      console.warn('Failed to parse AI analysis response:', error);
      return this.getFallbackAnalysis(repo);
    }
  }

  /**
   * Build analysis prompt with repository data
   */
  private buildAnalysisPrompt(repo: Repository): string {
    return aiConfig.analysisPrompts.projectEvaluation
      .replace('{name}', repo.name)
      .replace('{description}', repo.description || 'No description available')
      .replace('{language}', repo.language || 'Unknown')
      .replace('{stars}', repo.stars?.toString() || '0')
      .replace('{forks}', repo.forks?.toString() || '0')
      .replace('{topics}', repo.topics?.join(', ') || 'No topics')
      .replace('{readme}', this.truncateReadme(repo.readme || ''));
  }

  /**
   * Truncate README to fit within token limits
   */
  private truncateReadme(readme: string): string {
    const maxLength = 2000; // Approximate character limit
    if (readme.length <= maxLength) return readme;
    
    return readme.substring(0, maxLength) + '...[truncated]';
  }

  /**
   * Generate fallback analysis when AI fails
   */
  private getFallbackAnalysis(repo: Repository): RepositoryAnalysis {
    const category = this.inferCategory(repo);
    const score = this.calculateBasicScore(repo);
    
    // Generate project-specific descriptions
    const projectDescription = {
      zh: `${repo.name}是一个基于${repo.language || '现代技术'}的优秀项目，展示了专业的开发技能和最佳实践。`,
      en: `${repo.name} is an excellent project built with ${repo.language || 'modern technology'}, showcasing professional development skills and best practices.`
    };
    
    return {
      repositoryId: repo.id,
      score,
      category,
      techStack: this.extractTechStack(repo),
      highlights: fallbackContent.defaultHighlights,
      description: projectDescription,
      shouldDisplay: score >= qualityThresholds.minDisplayScore,
      reasoning: 'Fallback analysis due to AI service unavailability',
      confidence: 0.5,
      seoKeywords: {
        zh: [repo.language || '', '开源', '项目'].filter(Boolean),
        en: [repo.language || '', 'opensource', 'project'].filter(Boolean)
      },
      socialShareContent: {
        zh: {
          title: repo.name,
          description: repo.description || projectDescription.zh,
          hashtags: ['开源项目', repo.language || ''].filter(Boolean),
          summary: repo.description || projectDescription.zh
        },
        en: {
          title: repo.name,
          description: repo.description || projectDescription.en,
          hashtags: ['opensource', repo.language || ''].filter(Boolean),
          summary: repo.description || projectDescription.en
        }
      },
      generatedAt: new Date(),
      aiModel: 'fallback',
      processingTime: 0
    };
  }

  /**
   * Infer project category from repository data
   */
  private inferCategory(repo: Repository): ProjectCategory {
    const language = repo.language?.toLowerCase() || '';
    const topics = repo.topics?.map(t => t.toLowerCase()) || [];
    const name = repo.name.toLowerCase();
    const description = (repo.description || '').toLowerCase();
    
    // Check topics first
    if (topics.some(t => ['react', 'vue', 'angular', 'web', 'website'].includes(t))) {
      return 'web-app' as ProjectCategory;
    }
    if (topics.some(t => ['mobile', 'ios', 'android', 'flutter', 'react-native'].includes(t))) {
      return 'mobile-app' as ProjectCategory;
    }
    if (topics.some(t => ['library', 'framework', 'sdk', 'api'].includes(t))) {
      return 'library' as ProjectCategory;
    }
    if (topics.some(t => ['automation', 'script', 'tool', 'cli'].includes(t))) {
      return 'automation' as ProjectCategory;
    }
    
    // Check by language
    const categoryMapping = fallbackContent.categoryMapping as Record<string, ProjectCategory>;
    if (categoryMapping[language]) {
      return categoryMapping[language];
    }
    
    // Check name and description
    if (name.includes('app') || description.includes('application')) {
      return language === 'swift' || language === 'kotlin' ? 'mobile-app' as ProjectCategory : 'web-app' as ProjectCategory;
    }
    
    return 'other' as ProjectCategory;
  }

  /**
   * Extract tech stack from repository data
   */
  private extractTechStack(repo: Repository): string[] {
    const techStack = new Set<string>();
    
    if (repo.language) {
      techStack.add(repo.language);
    }
    
    if (repo.topics) {
      repo.topics.forEach(topic => {
        // Filter out non-tech topics
        const techTopics = ['react', 'vue', 'angular', 'node', 'python', 'java', 'typescript', 'javascript'];
        if (techTopics.some(tech => topic.toLowerCase().includes(tech))) {
          techStack.add(topic);
        }
      });
    }
    
    return Array.from(techStack);
  }

  /**
   * Calculate basic score for fallback analysis
   */
  private calculateBasicScore(repo: Repository): number {
    let score = 0;
    
    // Stars contribution (max 30 points)
    const stars = repo.stars || 0;
    score += Math.min(stars * 2, 30);
    
    // Forks contribution (max 20 points)
    const forks = repo.forks || 0;
    score += Math.min(forks * 3, 20);
    
    // Description quality (max 20 points)
    const description = repo.description || '';
    if (description.length > qualityThresholds.minDescriptionLength) {
      score += Math.min(description.length / 10, 20);
    }
    
    // README quality (max 20 points)
    const readme = repo.readme || '';
    if (readme.length > qualityThresholds.minReadmeLength) {
      score += Math.min(readme.length / 100, 20);
    }
    
    // Topics/tags (max 10 points)
    const topics = repo.topics || [];
    score += Math.min(topics.length * 2, 10);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Generate project description in specified language
   */
  async generateProjectDescription(repo: Repository, language: Language): Promise<string> {
    const analysis = await this.analyzeRepository(repo);
    return analysis.description[language];
  }

  /**
   * Categorize multiple projects
   */
  async categorizeProjects(repos: Repository[]): Promise<ProjectCategory[]> {
    const categories: ProjectCategory[] = [];
    
    for (const repo of repos) {
      const analysis = await this.analyzeRepository(repo);
      categories.push(analysis.category);
    }
    
    return categories;
  }

  /**
   * Evaluate project value with detailed scoring
   */
  async evaluateProjectValue(repo: Repository): Promise<ProjectScore> {
    const analysis = await this.analyzeRepository(repo);
    
    return {
      completeness: Math.round(analysis.score * 0.25),
      technicalComplexity: Math.round(analysis.score * 0.25),
      documentationQuality: Math.round(analysis.score * 0.25),
      activityLevel: Math.round(analysis.score * 0.15),
      communityEngagement: Math.round(analysis.score * 0.1),
      overallScore: analysis.score,
      factors: [
        {
          name: 'AI Analysis Score',
          weight: 1.0,
          score: analysis.score,
          reasoning: analysis.reasoning
        }
      ]
    };
  }

  /**
   * Generate multilingual content for a project
   */
  async generateMultilingualContent(repo: Repository): Promise<MultilingualContent> {
    const prompt = aiConfig.analysisPrompts.multilingualGeneration
      .replace('{name}', repo.name)
      .replace('{description}', repo.description || '')
      .replace('{language}', repo.language || '')
      .replace('{topics}', repo.topics?.join(', ') || '')
      .replace('{analysis}', 'Project analysis completed');

    const response = await this.makeRequest<any>(prompt);
    
    if (!response.success) {
      return {
        zh: fallbackContent.defaultDescription.zh,
        en: fallbackContent.defaultDescription.en
      };
    }

    try {
      const content = response.data;
      return {
        zh: content.description?.zh || fallbackContent.defaultDescription.zh,
        en: content.description?.en || fallbackContent.defaultDescription.en
      };
    } catch {
      return {
        zh: fallbackContent.defaultDescription.zh,
        en: fallbackContent.defaultDescription.en
      };
    }
  }

  /**
   * Intelligent project filtering based on AI analysis
   */
  async intelligentProjectFiltering(repos: Repository[]): Promise<Repository[]> {
    const filteredRepos: Repository[] = [];
    
    for (const repo of repos) {
      const analysis = await this.analyzeRepository(repo);
      
      if (analysis.shouldDisplay && analysis.score >= qualityThresholds.minDisplayScore) {
        filteredRepos.push(repo);
      }
    }
    
    // Sort by score (highest first)
    return filteredRepos.sort((a, b) => {
      // We would need to store scores, for now just return as-is
      return 0;
    });
  }

  // ContentGenerator interface methods

  async generateTitle(repo: Repository, language: Language): Promise<string> {
    const analysis = await this.analyzeRepository(repo);
    return analysis.socialShareContent[language].title;
  }

  async generateDescription(repo: Repository, language: Language): Promise<string> {
    const analysis = await this.analyzeRepository(repo);
    return analysis.description[language];
  }

  async generateHighlights(repo: Repository, language: Language): Promise<string[]> {
    const analysis = await this.analyzeRepository(repo);
    return analysis.highlights[language];
  }

  async generateSEOContent(repo: Repository, language: Language): Promise<SEOContent> {
    const analysis = await this.analyzeRepository(repo);
    const content = analysis.socialShareContent[language];
    
    return {
      title: content.title,
      description: content.description,
      keywords: analysis.seoKeywords[language],
      ogTitle: content.title,
      ogDescription: content.description,
      twitterTitle: content.title,
      twitterDescription: content.description
    };
  }

  async generateSocialContent(repo: Repository, language: Language): Promise<SocialContent> {
    const analysis = await this.analyzeRepository(repo);
    return analysis.socialShareContent[language];
  }

  async translateContent(content: string, fromLang: Language, toLang: Language): Promise<string> {
    if (fromLang === toLang) return content;
    
    const prompt = `请将以下${fromLang === 'zh' ? '中文' : '英文'}内容翻译成${toLang === 'zh' ? '中文' : '英文'}，保持专业性和技术准确性：\n\n${content}`;
    
    const response = await this.makeRequest<string>(prompt);
    
    if (!response.success) {
      return content; // Return original if translation fails
    }
    
    return response.data;
  }
}

export default GeminiAnalyzer;