#!/usr/bin/env tsx

/**
 * AI Analysis Script
 * Analyzes GitHub repositories using Google Gemini AI and generates content
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIDataManager } from '../src/services/ai-data-manager.js';
import type { Repository } from '../src/types/repository.js';
import type { RepositoryAnalysis } from '../src/types/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

interface AnalysisResults {
  analyses: RepositoryAnalysis[];
  summary: {
    totalRepositories: number;
    analyzedRepositories: number;
    approvedForDisplay: number;
    averageScore: number;
    processingTime: number;
  };
  errors: Array<{
    repositoryId: string;
    error: string;
  }>;
}

class AIAnalysisRunner {
  private aiManager: AIDataManager;
  private startTime: number;

  constructor() {
    this.aiManager = new AIDataManager();
    this.startTime = Date.now();
  }

  /**
   * Main analysis function
   */
  async run(): Promise<void> {
    try {
      console.log('🤖 Starting AI analysis of GitHub repositories...');
      
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      // Load cached analysis if available
      await this.aiManager.loadCacheFromFile();
      
      // Load repositories data
      const repositories = await this.loadRepositories();
      console.log(`📊 Found ${repositories.length} repositories to analyze`);
      
      if (repositories.length === 0) {
        console.log('⚠️  No repositories found. Please run data:fetch first.');
        return;
      }
      
      // Perform AI analysis
      const results = await this.analyzeRepositories(repositories);
      
      // Save results
      await this.saveResults(results);
      
      // Generate review report
      await this.generateReviewReport(results.analyses);
      
      // Save cache
      await this.aiManager.saveCacheToFile();
      
      // Print summary
      this.printSummary(results);
      
      console.log('✅ AI analysis completed successfully!');
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
      console.log('📁 Created data directory');
    }
  }

  /**
   * Load repositories from GitHub fetch results
   */
  private async loadRepositories(): Promise<Repository[]> {
    try {
      const fetchResultsPath = path.join(DATA_DIR, 'fetch-results.json');
      const data = await fs.readFile(fetchResultsPath, 'utf-8');
      const fetchResults = JSON.parse(data);
      
      return fetchResults.repositories || [];
    } catch (error) {
      console.warn('⚠️  Could not load repositories from fetch-results.json:', error);
      return [];
    }
  }

  /**
   * Analyze repositories using AI
   */
  private async analyzeRepositories(repositories: Repository[]): Promise<AnalysisResults> {
    const analyses: RepositoryAnalysis[] = [];
    const errors: Array<{ repositoryId: string; error: string }> = [];
    let processedCount = 0;
    
    console.log('🔍 Starting AI analysis...');
    
    for (const repo of repositories) {
      try {
        console.log(`  Analyzing ${repo.name} (${processedCount + 1}/${repositories.length})`);
        
        const analysis = await this.aiManager.analyzeRepositories([repo]);
        analyses.push(...analysis);
        
        processedCount++;
        
        // Add small delay to respect rate limits
        await this.delay(1000);
        
      } catch (error) {
        console.error(`    ❌ Failed to analyze ${repo.name}:`, error);
        errors.push({
          repositoryId: repo.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const approvedCount = analyses.filter(a => a.shouldDisplay).length;
    const totalScore = analyses.reduce((sum, a) => sum + a.score, 0);
    const averageScore = analyses.length > 0 ? totalScore / analyses.length : 0;
    const processingTime = Date.now() - this.startTime;
    
    return {
      analyses,
      summary: {
        totalRepositories: repositories.length,
        analyzedRepositories: analyses.length,
        approvedForDisplay: approvedCount,
        averageScore: Math.round(averageScore * 100) / 100,
        processingTime
      },
      errors
    };
  }

  /**
   * Save analysis results to file
   */
  private async saveResults(results: AnalysisResults): Promise<void> {
    const outputPath = path.join(DATA_DIR, 'ai-analysis-results.json');
    
    const output = {
      ...results,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`💾 Saved analysis results to ${outputPath}`);
    
    // Also save just the analyses for easier consumption
    const analysesPath = path.join(DATA_DIR, 'repository-analyses.json');
    await fs.writeFile(analysesPath, JSON.stringify(results.analyses, null, 2));
    console.log(`💾 Saved analyses to ${analysesPath}`);
  }

  /**
   * Generate review report
   */
  private async generateReviewReport(analyses: RepositoryAnalysis[]): Promise<void> {
    const reviewReport = this.aiManager.generateReviewReport(analyses);
    
    const reportPath = path.join(DATA_DIR, 'ai-review-report.json');
    await fs.writeFile(reportPath, JSON.stringify(reviewReport, null, 2));
    console.log(`📋 Generated review report: ${reportPath}`);
    
    // Generate human-readable summary
    const summaryPath = path.join(DATA_DIR, 'ai-analysis-summary.md');
    const summary = this.generateMarkdownSummary(reviewReport, analyses);
    await fs.writeFile(summaryPath, summary);
    console.log(`📄 Generated summary report: ${summaryPath}`);
  }

  /**
   * Generate markdown summary
   */
  private generateMarkdownSummary(reviewReport: any, analyses: RepositoryAnalysis[]): string {
    const { summary } = reviewReport;
    
    return `# AI Analysis Summary

Generated: ${new Date().toISOString()}

## Overview

- **Total Repositories**: ${analyses.length}
- **Approved for Display**: ${reviewReport.approvedProjects}
- **Average Quality Score**: ${summary?.averageScore || 'N/A'}
- **Processing Time**: ${Math.round((Date.now() - this.startTime) / 1000)}s

## Quality Distribution

${this.generateQualityDistribution(analyses)}

## Category Distribution

${this.generateCategoryDistribution(analyses)}

## Top Scoring Projects

${this.generateTopProjects(analyses)}

## Recommendations

${this.generateRecommendations(reviewReport)}

---

*This report was generated automatically by the AI analysis system.*
`;
  }

  /**
   * Generate quality distribution section
   */
  private generateQualityDistribution(analyses: RepositoryAnalysis[]): string {
    const excellent = analyses.filter(a => a.score >= 90).length;
    const good = analyses.filter(a => a.score >= 70 && a.score < 90).length;
    const fair = analyses.filter(a => a.score >= 50 && a.score < 70).length;
    const poor = analyses.filter(a => a.score < 50).length;
    
    return `
- **Excellent (90-100)**: ${excellent} projects
- **Good (70-89)**: ${good} projects
- **Fair (50-69)**: ${fair} projects
- **Poor (0-49)**: ${poor} projects
`;
  }

  /**
   * Generate category distribution section
   */
  private generateCategoryDistribution(analyses: RepositoryAnalysis[]): string {
    const categories = analyses.reduce((dist, analysis) => {
      dist[analysis.category] = (dist[analysis.category] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    return Object.entries(categories)
      .map(([category, count]) => `- **${category}**: ${count} projects`)
      .join('\n');
  }

  /**
   * Generate top projects section
   */
  private generateTopProjects(analyses: RepositoryAnalysis[]): string {
    const topProjects = analyses
      .filter(a => a.shouldDisplay)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return topProjects
      .map((analysis, index) => {
        return `${index + 1}. **${analysis.socialShareContent.en.title}** (Score: ${analysis.score})
   - Category: ${analysis.category}
   - Tech Stack: ${analysis.techStack.join(', ')}
   - Confidence: ${Math.round(analysis.confidence * 100)}%`;
      })
      .join('\n\n');
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendations(reviewReport: any): string {
    const actions = reviewReport.recommendedActions || [];
    
    if (actions.length === 0) {
      return 'No specific recommendations at this time.';
    }
    
    return actions
      .map((action: any) => `- **${action.type}**: ${action.reason} (Priority: ${action.priority})`)
      .join('\n');
  }

  /**
   * Print summary to console
   */
  private printSummary(results: AnalysisResults): void {
    const { summary, errors } = results;
    
    console.log('\n📊 Analysis Summary:');
    console.log(`   Total repositories: ${summary.totalRepositories}`);
    console.log(`   Successfully analyzed: ${summary.analyzedRepositories}`);
    console.log(`   Approved for display: ${summary.approvedForDisplay}`);
    console.log(`   Average quality score: ${summary.averageScore}`);
    console.log(`   Processing time: ${Math.round(summary.processingTime / 1000)}s`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${errors.length}`);
      errors.forEach(error => {
        console.log(`   - ${error.repositoryId}: ${error.error}`);
      });
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the analysis if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new AIAnalysisRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { AIAnalysisRunner };