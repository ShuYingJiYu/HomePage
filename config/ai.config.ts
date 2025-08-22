/**
 * AI configuration for Google Gemini API
 * Contains AI analysis settings, prompts, and error handling strategies
 */

import { config } from 'dotenv';
import type { AIConfig } from '@/types/config';

// Load environment variables from .env file
config();

export const aiConfig: AIConfig = {
  geminiApiKey: process.env.VITE_GEMINI_API_KEY || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '',
  
  // AI analysis prompts for different tasks
  analysisPrompts: {
    projectEvaluation: `
      作为一个专业的技术项目评估专家，请分析这个GitHub项目的展示价值。

      项目信息：
      - 名称：{name}
      - 描述：{description}
      - 主要语言：{language}
      - Stars：{stars}
      - Forks：{forks}
      - Topics：{topics}
      - README内容：{readme}

      请从以下维度进行评估（每项0-25分，总分100分）：

      1. **项目完整性** (0-25分)
         - README文档质量和完整性
         - 代码结构和组织
         - 测试覆盖率和质量
         - 文档和注释

      2. **技术复杂度和创新性** (0-25分)
         - 技术栈的先进性
         - 架构设计的合理性
         - 创新点和技术亮点
         - 解决问题的复杂度

      3. **实用性和商业价值** (0-25分)
         - 解决的实际问题
         - 目标用户群体
         - 市场需求和应用场景
         - 商业化潜力

      4. **代码质量和最佳实践** (0-25分)
         - 代码规范和风格
         - 性能优化
         - 安全性考虑
         - 可维护性

      请以JSON格式返回评估结果：
      {
        "score": 总分(0-100),
        "breakdown": {
          "completeness": 完整性得分,
          "complexity": 复杂度得分,
          "utility": 实用性得分,
          "quality": 质量得分
        },
        "shouldDisplay": 是否建议展示(boolean),
        "reasoning": "详细的评估理由",
        "category": "项目分类(web-app|mobile-app|open-source|library|automation|other)",
        "highlights": ["技术亮点1", "技术亮点2", "技术亮点3"]
      }
    `,
    
    descriptionGeneration: `
      作为一个专业的技术文案撰写专家，请为这个项目生成一个专业的描述。

      项目信息：
      - 名称：{name}
      - 原始描述：{description}
      - 主要语言：{language}
      - Topics：{topics}
      - README摘要：{readme}
      - AI评估结果：{analysis}

      要求：
      1. 描述应该简洁专业，适合展示给潜在客户
      2. 突出项目的核心功能和商业价值
      3. 强调使用的技术栈和技术亮点
      4. 说明适合的应用场景和目标用户
      5. 长度控制在100-200字之间

      请生成一个吸引人且专业的项目描述。
    `,
    
    categoryClassification: `
      请将这个项目分类到最合适的类别中：

      项目信息：
      - 名称：{name}
      - 描述：{description}
      - 主要语言：{language}
      - Topics：{topics}
      - README内容：{readme}

      可选类别：
      - web-app: Web应用程序（完整的网站或Web应用）
      - mobile-app: 移动应用程序（iOS/Android应用）
      - open-source: 开源工具/实用程序
      - library: 框架/库/SDK
      - automation: 自动化脚本/工具
      - other: 其他类型

      请只返回类别名称，不需要其他解释。
    `,
    
    multilingualGeneration: `
      作为一个专业的双语技术文案专家，请为这个项目生成中英文双语内容。

      项目信息：
      - 名称：{name}
      - 描述：{description}
      - 主要语言：{language}
      - Topics：{topics}
      - AI分析：{analysis}

      请以JSON格式返回：
      {
        "title": {
          "zh": "中文项目标题",
          "en": "English Project Title"
        },
        "description": {
          "zh": "中文项目描述（100-200字）",
          "en": "English project description (100-200 words)"
        },
        "highlights": {
          "zh": ["中文技术亮点1", "中文技术亮点2", "中文技术亮点3"],
          "en": ["English highlight 1", "English highlight 2", "English highlight 3"]
        },
        "seoKeywords": {
          "zh": ["中文关键词1", "中文关键词2", "中文关键词3"],
          "en": ["english keyword 1", "english keyword 2", "english keyword 3"]
        }
      }

      要求：
      1. 内容要专业且适合国际客户
      2. 突出技术优势和商业价值
      3. 中英文内容要对应但不是直译
      4. SEO关键词要有助于搜索引擎优化
    `
  },
  
  // Fallback strategy when AI analysis fails
  fallbackStrategy: 'use-cache',
  
  // Rate limiting configuration for Gemini API
  rateLimiting: {
    requestsPerMinute: 60, // Gemini API rate limit
    quotaLimit: 1000 // Daily quota limit
  },
  
  // Error handling strategies for AI API errors
  errorHandling: {
    // When quota is exceeded
    quotaExceededStrategy: 'use-fallback',
    
    // When network errors occur
    networkErrorStrategy: 'use-cache'
  }
};

/**
 * AI model configuration
 */
export const aiModelConfig = {
  model: 'models/gemini-1.5-flash', // Correct model name with models/ prefix
  temperature: 0.7, // Balance between creativity and consistency
  maxTokens: 2048,
  topP: 0.8,
  topK: 40
};

/**
 * Content quality thresholds
 */
export const qualityThresholds = {
  // Minimum score for a project to be displayed
  minDisplayScore: 60,
  
  // Minimum confidence score for AI analysis
  minConfidenceScore: 0.7,
  
  // Minimum README length (characters)
  minReadmeLength: 100,
  
  // Minimum description length (characters)
  minDescriptionLength: 20
};

/**
 * Fallback content for when AI analysis fails
 */
export const fallbackContent = {
  defaultDescription: {
    zh: '这是一个优秀的开源项目，展示了现代化的开发技术和最佳实践。',
    en: 'This is an excellent open-source project showcasing modern development technologies and best practices.'
  },
  
  defaultHighlights: {
    zh: ['现代化技术栈', '优秀的代码质量', '完善的文档'],
    en: ['Modern tech stack', 'Excellent code quality', 'Comprehensive documentation']
  },
  
  categoryMapping: {
    'javascript': 'web-app',
    'typescript': 'web-app',
    'react': 'web-app',
    'vue': 'web-app',
    'angular': 'web-app',
    'python': 'automation',
    'java': 'library',
    'go': 'automation',
    'rust': 'library',
    'swift': 'mobile-app',
    'kotlin': 'mobile-app',
    'dart': 'mobile-app'
  }
};

export default aiConfig;