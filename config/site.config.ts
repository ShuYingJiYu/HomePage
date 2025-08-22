/**
 * Main site configuration
 * Contains all the core settings for the Shuying Studio homepage
 */

import type { SiteConfig } from '@/types/config';

export const siteConfig: SiteConfig = {
  site: {
    name: {
      zh: '书樱寄语网络工作室',
      en: 'Shuying Studio'
    },
    description: {
      zh: '专业的网络开发工作室，提供现代化的Web应用开发、移动应用开发和技术咨询服务',
      en: 'Professional web development studio providing modern web applications, mobile development, and technical consulting services'
    },
    url: import.meta.env.VITE_SITE_URL || 'https://shuyingapp.cn',
    defaultLanguage: (import.meta.env.VITE_DEFAULT_LANGUAGE as 'zh' | 'en') || 'zh',
    supportedLanguages: ['zh', 'en'],
    logo: '/logo.svg',
    favicon: '/favicon.ico'
  },
  
  github: {
    organization: import.meta.env.VITE_GITHUB_ORG || '',
    personalAccount: import.meta.env.VITE_GITHUB_USER || '',
    accessToken: import.meta.env.VITE_GITHUB_TOKEN || '',
    excludeRepositories: [
      'dotfiles',
      'private-notes',
      '.github'
    ],
    includeRepositories: undefined // If undefined, include all except excluded
  },
  
  wordpress: {
    apiUrl: import.meta.env.VITE_WORDPRESS_API_URL || '',
    categories: ['技术分享', 'Tech Insights', '项目案例', 'Case Studies'],
    multilingualSupport: true
  },
  
  ai: {
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    analysisPrompts: {
      projectEvaluation: `
        请分析这个GitHub项目的展示价值。考虑以下因素：
        1. 项目完整性（README、文档、代码质量）
        2. 技术复杂度和创新性
        3. 实用性和商业价值
        4. 代码质量和最佳实践
        请给出0-100的评分，并说明理由。
      `,
      descriptionGeneration: `
        为这个项目生成一个专业的中文描述，突出：
        1. 项目的核心功能和价值
        2. 使用的技术栈和亮点
        3. 适合的应用场景
        描述应该简洁专业，适合展示给潜在客户。
      `,
      categoryClassification: `
        请将这个项目分类到以下类别之一：
        - web-app: Web应用程序
        - mobile-app: 移动应用程序
        - open-source: 开源工具/库
        - library: 框架/库
        - automation: 自动化脚本
        - other: 其他
      `,
      multilingualGeneration: `
        请为这个项目生成中英文双语内容，包括：
        1. 项目标题（中英文）
        2. 项目描述（中英文）
        3. 技术亮点（中英文）
        确保内容专业且适合国际客户。
      `
    },
    fallbackStrategy: 'use-cache'
  },
  
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    enableCookieConsent: true,
    trackingEvents: [
      'project_view',
      'contact_click',
      'language_switch',
      'social_share',
      'blog_read'
    ]
  },
  
  social: {
    github: `https://github.com/${  import.meta.env.VITE_GITHUB_ORG || import.meta.env.VITE_GITHUB_USER || ''}`,
    twitter: undefined,
    linkedin: undefined,
    weibo: undefined,
    wechat: undefined,
    email: 'contact@shuying.studio',
    shareButtons: ['twitter', 'linkedin', 'weibo', 'wechat']
  },
  
  monitoring: {
    betterStackApiKey: import.meta.env.VITE_BETTERSTACK_API_KEY,
    statusPageUrl: undefined,
    enableStatusPage: !!import.meta.env.VITE_BETTERSTACK_API_KEY
  },
  
  seo: {
    enableSitemap: true,
    enableRobotsTxt: true,
    enableStructuredData: true,
    defaultKeywords: {
      zh: [
        '网络工作室',
        'Web开发',
        '移动应用开发',
        'React开发',
        'TypeScript',
        '前端开发',
        '技术咨询',
        '书樱寄语'
      ],
      en: [
        'web development studio',
        'web development',
        'mobile app development',
        'React development',
        'TypeScript',
        'frontend development',
        'technical consulting',
        'Shuying Studio'
      ]
    }
  },
  
  performance: {
    enableWebVitals: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    cacheStrategy: 'moderate'
  }
};

export default siteConfig;