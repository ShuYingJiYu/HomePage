import type { Language, ProjectCategory, ServiceCategory, SocialPlatform } from '@/types'

// Language constants
export const LANGUAGES: Record<Language, string> = {
  zh: '中文',
  en: 'English'
} as const

export const DEFAULT_LANGUAGE: Language = 'zh'
export const SUPPORTED_LANGUAGES: Language[] = ['zh', 'en']

// Project category constants
export const PROJECT_CATEGORIES: Record<ProjectCategory, { zh: string; en: string }> = {
  'web-app': {
    zh: 'Web应用',
    en: 'Web Application'
  },
  'mobile-app': {
    zh: '移动应用',
    en: 'Mobile Application'
  },
  'open-source': {
    zh: '开源工具',
    en: 'Open Source Tool'
  },
  'library': {
    zh: '库/框架',
    en: 'Library/Framework'
  },
  'automation': {
    zh: '自动化脚本',
    en: 'Automation Script'
  },
  'other': {
    zh: '其他',
    en: 'Other'
  }
} as const

// Service category constants
export const SERVICE_CATEGORIES: Record<ServiceCategory, { zh: string; en: string }> = {
  'frontend': {
    zh: '前端开发',
    en: 'Frontend Development'
  },
  'backend': {
    zh: '后端开发',
    en: 'Backend Development'
  },
  'mobile': {
    zh: '移动开发',
    en: 'Mobile Development'
  },
  'devops': {
    zh: 'DevOps',
    en: 'DevOps'
  },
  'consulting': {
    zh: '技术咨询',
    en: 'Technical Consulting'
  }
} as const

// Social platform constants
export const SOCIAL_PLATFORMS: Record<SocialPlatform, { name: string; icon: string; color: string }> = {
  'twitter': {
    name: 'Twitter',
    icon: 'twitter',
    color: '#1DA1F2'
  },
  'linkedin': {
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0077B5'
  },
  'weibo': {
    name: '微博',
    icon: 'weibo',
    color: '#E6162D'
  },
  'wechat': {
    name: '微信',
    icon: 'wechat',
    color: '#07C160'
  },
  'facebook': {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2'
  },
  'telegram': {
    name: 'Telegram',
    icon: 'telegram',
    color: '#0088CC'
  },

} as const

// Programming language colors (GitHub style)
export const LANGUAGE_COLORS: Record<string, string> = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#2b7489',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'C#': '#239120',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Swift': '#ffac45',
  'Kotlin': '#F18E33',
  'Dart': '#00B4AB',
  'HTML': '#e34c26',
  'CSS': '#1572B6',
  'SCSS': '#c6538c',
  'Vue': '#2c3e50',
  'React': '#61dafb',
  'Angular': '#dd0031',
  'Svelte': '#ff3e00',
  'Shell': '#89e051',
  'PowerShell': '#012456',
  'Dockerfile': '#384d54',
  'YAML': '#cb171e',
  'JSON': '#292929',
  'Markdown': '#083fa1',
  'SQL': '#336791',
  'R': '#198CE7',
  'MATLAB': '#e16737',
  'Jupyter Notebook': '#DA5B0B',
  'Vim script': '#199f4b',
  'Lua': '#000080',
  'Perl': '#0298c3',
  'Haskell': '#5e5086',
  'Scala': '#c22d40',
  'Clojure': '#db5855',
  'Elixir': '#6e4a7e',
  'Erlang': '#B83998',
  'F#': '#b845fc',
  'OCaml': '#3be133',
  'Assembly': '#6E4C13',
  'Makefile': '#427819',
  'CMake': '#DA3434',
  'Nix': '#7e7eff',
  'Other': '#cccccc'
} as const

// Tech stack categories
export const TECH_STACK_CATEGORIES = {
  'programming': {
    zh: '编程语言',
    en: 'Programming Languages'
  },
  'frontend': {
    zh: '前端框架',
    en: 'Frontend Frameworks'
  },
  'backend': {
    zh: '后端框架',
    en: 'Backend Frameworks'
  },
  'database': {
    zh: '数据库',
    en: 'Databases'
  },
  'cloud': {
    zh: '云服务',
    en: 'Cloud Services'
  },
  'devops': {
    zh: 'DevOps工具',
    en: 'DevOps Tools'
  },
  'mobile': {
    zh: '移动开发',
    en: 'Mobile Development'
  },
  'testing': {
    zh: '测试工具',
    en: 'Testing Tools'
  },
  'design': {
    zh: '设计工具',
    en: 'Design Tools'
  },
  'other': {
    zh: '其他',
    en: 'Other'
  }
} as const

// Common tech stacks mapping
export const TECH_STACK_MAPPING: Record<string, { category: keyof typeof TECH_STACK_CATEGORIES; displayName: string }> = {
  // Programming Languages
  'javascript': { category: 'programming', displayName: 'JavaScript' },
  'typescript': { category: 'programming', displayName: 'TypeScript' },
  'python': { category: 'programming', displayName: 'Python' },
  'java': { category: 'programming', displayName: 'Java' },
  'go': { category: 'programming', displayName: 'Go' },
  'rust': { category: 'programming', displayName: 'Rust' },
  'cpp': { category: 'programming', displayName: 'C++' },
  'csharp': { category: 'programming', displayName: 'C#' },
  'php': { category: 'programming', displayName: 'PHP' },
  'ruby': { category: 'programming', displayName: 'Ruby' },
  'swift': { category: 'programming', displayName: 'Swift' },
  'kotlin': { category: 'programming', displayName: 'Kotlin' },
  'dart': { category: 'programming', displayName: 'Dart' },
  
  // Frontend Frameworks
  'react': { category: 'frontend', displayName: 'React' },
  'vue': { category: 'frontend', displayName: 'Vue.js' },
  'angular': { category: 'frontend', displayName: 'Angular' },
  'svelte': { category: 'frontend', displayName: 'Svelte' },
  'nextjs': { category: 'frontend', displayName: 'Next.js' },
  'nuxtjs': { category: 'frontend', displayName: 'Nuxt.js' },
  'gatsby': { category: 'frontend', displayName: 'Gatsby' },
  'vite': { category: 'frontend', displayName: 'Vite' },
  'webpack': { category: 'frontend', displayName: 'Webpack' },
  'tailwindcss': { category: 'frontend', displayName: 'Tailwind CSS' },
  'bootstrap': { category: 'frontend', displayName: 'Bootstrap' },
  
  // Backend Frameworks
  'nodejs': { category: 'backend', displayName: 'Node.js' },
  'express': { category: 'backend', displayName: 'Express.js' },
  'fastapi': { category: 'backend', displayName: 'FastAPI' },
  'django': { category: 'backend', displayName: 'Django' },
  'flask': { category: 'backend', displayName: 'Flask' },
  'spring': { category: 'backend', displayName: 'Spring' },
  'gin': { category: 'backend', displayName: 'Gin' },
  'fiber': { category: 'backend', displayName: 'Fiber' },
  'laravel': { category: 'backend', displayName: 'Laravel' },
  'rails': { category: 'backend', displayName: 'Ruby on Rails' },
  
  // Databases
  'mongodb': { category: 'database', displayName: 'MongoDB' },
  'postgresql': { category: 'database', displayName: 'PostgreSQL' },
  'mysql': { category: 'database', displayName: 'MySQL' },
  'redis': { category: 'database', displayName: 'Redis' },
  'sqlite': { category: 'database', displayName: 'SQLite' },
  'elasticsearch': { category: 'database', displayName: 'Elasticsearch' },
  'cassandra': { category: 'database', displayName: 'Cassandra' },
  
  // Cloud Services
  'aws': { category: 'cloud', displayName: 'AWS' },
  'gcp': { category: 'cloud', displayName: 'Google Cloud' },
  'azure': { category: 'cloud', displayName: 'Microsoft Azure' },
  'vercel': { category: 'cloud', displayName: 'Vercel' },
  'netlify': { category: 'cloud', displayName: 'Netlify' },
  'heroku': { category: 'cloud', displayName: 'Heroku' },
  'digitalocean': { category: 'cloud', displayName: 'DigitalOcean' },
  
  // DevOps Tools
  'docker': { category: 'devops', displayName: 'Docker' },
  'kubernetes': { category: 'devops', displayName: 'Kubernetes' },
  'terraform': { category: 'devops', displayName: 'Terraform' },
  'ansible': { category: 'devops', displayName: 'Ansible' },
  'jenkins': { category: 'devops', displayName: 'Jenkins' },
  'github-actions': { category: 'devops', displayName: 'GitHub Actions' },
  'gitlab-ci': { category: 'devops', displayName: 'GitLab CI' },
  'nginx': { category: 'devops', displayName: 'Nginx' },
  
  // Mobile Development
  'react-native': { category: 'mobile', displayName: 'React Native' },
  'flutter': { category: 'mobile', displayName: 'Flutter' },
  'ionic': { category: 'mobile', displayName: 'Ionic' },
  'xamarin': { category: 'mobile', displayName: 'Xamarin' },
  
  // Testing Tools
  'jest': { category: 'testing', displayName: 'Jest' },
  'cypress': { category: 'testing', displayName: 'Cypress' },
  'playwright': { category: 'testing', displayName: 'Playwright' },
  'selenium': { category: 'testing', displayName: 'Selenium' },
  'vitest': { category: 'testing', displayName: 'Vitest' },
  'testing-library': { category: 'testing', displayName: 'Testing Library' },
  
  // Design Tools
  'figma': { category: 'design', displayName: 'Figma' },
  'sketch': { category: 'design', displayName: 'Sketch' },
  'adobe-xd': { category: 'design', displayName: 'Adobe XD' },
  'photoshop': { category: 'design', displayName: 'Photoshop' },
  'illustrator': { category: 'design', displayName: 'Illustrator' }
} as const

// API endpoints and URLs
export const API_ENDPOINTS = {
  GITHUB: {
    BASE: 'https://api.github.com',
    REPOS: '/repos',
    ORGS: '/orgs',
    USERS: '/users',
    SEARCH: '/search'
  },
  WORDPRESS: {
    POSTS: '/wp-json/wp/v2/posts',
    CATEGORIES: '/wp-json/wp/v2/categories',
    TAGS: '/wp-json/wp/v2/tags',
    AUTHORS: '/wp-json/wp/v2/users',
    MEDIA: '/wp-json/wp/v2/media'
  },
  GEMINI: {
    BASE: 'https://generativelanguage.googleapis.com/v1beta',
    GENERATE: '/models/gemini-pro:generateContent'
  }
} as const

// Cache configuration
export const CACHE_CONFIG = {
  TTL: {
    GITHUB_DATA: 6 * 60 * 60 * 1000, // 6 hours
    BLOG_POSTS: 1 * 60 * 60 * 1000,  // 1 hour
    AI_ANALYSIS: 24 * 60 * 60 * 1000, // 24 hours
    IMAGES: 7 * 24 * 60 * 60 * 1000,  // 7 days
    STATIC_DATA: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  KEYS: {
    REPOSITORIES: 'repositories',
    MEMBERS: 'members',
    BLOG_POSTS: 'blog-posts',
    AI_ANALYSIS: 'ai-analysis',
    TECH_STACK: 'tech-stack',
    SERVICE_STATUS: 'service-status',
    SEO_METADATA: 'seo-metadata',
    SOCIAL_CONTENT: 'social-content'
  }
} as const

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  CORE_WEB_VITALS: {
    LCP: {
      GOOD: 2500,
      NEEDS_IMPROVEMENT: 4000
    },
    FID: {
      GOOD: 100,
      NEEDS_IMPROVEMENT: 300
    },
    CLS: {
      GOOD: 0.1,
      NEEDS_IMPROVEMENT: 0.25
    }
  },
  BUNDLE_SIZE: {
    WARNING: 500 * 1024, // 500KB
    ERROR: 1024 * 1024   // 1MB
  },
  IMAGE_SIZE: {
    WARNING: 100 * 1024, // 100KB
    ERROR: 500 * 1024    // 500KB
  }
} as const

// SEO constants
export const SEO_LIMITS = {
  TITLE: {
    MIN: 30,
    MAX: 60
  },
  DESCRIPTION: {
    MIN: 120,
    MAX: 160
  },
  KEYWORDS: {
    MIN: 3,
    MAX: 10
  },
  ALT_TEXT: {
    MAX: 125
  }
} as const

// Error codes
export const ERROR_CODES = {
  // GitHub API errors
  GITHUB_RATE_LIMIT: 'GITHUB_RATE_LIMIT',
  GITHUB_NOT_FOUND: 'GITHUB_NOT_FOUND',
  GITHUB_UNAUTHORIZED: 'GITHUB_UNAUTHORIZED',
  GITHUB_NETWORK_ERROR: 'GITHUB_NETWORK_ERROR',
  
  // AI API errors
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_INVALID_REQUEST: 'AI_INVALID_REQUEST',
  AI_NETWORK_ERROR: 'AI_NETWORK_ERROR',
  AI_PROCESSING_ERROR: 'AI_PROCESSING_ERROR',
  
  // WordPress API errors
  WORDPRESS_NOT_FOUND: 'WORDPRESS_NOT_FOUND',
  WORDPRESS_NETWORK_ERROR: 'WORDPRESS_NETWORK_ERROR',
  WORDPRESS_PARSE_ERROR: 'WORDPRESS_PARSE_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SCHEMA_ERROR: 'SCHEMA_ERROR',
  TYPE_ERROR: 'TYPE_ERROR',
  
  // Cache errors
  CACHE_READ_ERROR: 'CACHE_READ_ERROR',
  CACHE_WRITE_ERROR: 'CACHE_WRITE_ERROR',
  CACHE_EXPIRED: 'CACHE_EXPIRED',
  
  // Build errors
  BUILD_ERROR: 'BUILD_ERROR',
  DEPLOYMENT_ERROR: 'DEPLOYMENT_ERROR',
  
  // Generic errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

// Retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_FACTOR: 2,
  RETRYABLE_CODES: [
    ERROR_CODES.GITHUB_RATE_LIMIT,
    ERROR_CODES.GITHUB_NETWORK_ERROR,
    ERROR_CODES.AI_NETWORK_ERROR,
    ERROR_CODES.WORDPRESS_NETWORK_ERROR,
    ERROR_CODES.NETWORK_ERROR
  ]
} as const

// File paths
export const FILE_PATHS = {
  DATA: {
    REPOSITORIES: 'data/repositories.json',
    MEMBERS: 'data/members.json',
    BLOG_POSTS: 'data/blog-posts.json',
    AI_ANALYSIS: 'data/ai-analysis.json',
    TECH_STACK: 'data/tech-stack.json',
    SERVICE_STATUS: 'data/service-status.json',
    SEO_METADATA: 'data/seo-metadata.json',
    SOCIAL_CONTENT: 'data/social-content.json'
  },
  CONFIG: {
    SITE: 'config/site.config.ts',
    GITHUB: 'config/github.config.ts',
    AI: 'config/ai.config.ts'
  },
  BUILD: {
    DIST: 'dist',
    ASSETS: 'dist/assets',
    IMAGES: 'dist/images'
  }
} as const

// Image optimization settings
export const IMAGE_CONFIG = {
  FORMATS: ['webp', 'avif', 'jpeg'] as const,
  SIZES: [320, 640, 1024, 1920, 2560] as const,
  QUALITY: 80,
  PLACEHOLDER: {
    WIDTH: 20,
    HEIGHT: 20,
    BLUR: 10
  }
} as const

// Analytics events
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  PROJECT_VIEW: 'project_view',
  BLOG_POST_VIEW: 'blog_post_view',
  LANGUAGE_SWITCH: 'language_switch',
  CONTACT_CLICK: 'contact_click',
  SOCIAL_SHARE: 'social_share',
  SEARCH_QUERY: 'search_query',
  DOWNLOAD_CLICK: 'download_click',
  EXTERNAL_LINK_CLICK: 'external_link_click'
} as const

// Default values
export const DEFAULTS = {
  LANGUAGE: DEFAULT_LANGUAGE,
  PAGINATION: {
    PAGE_SIZE: 12,
    MAX_PAGES: 10
  },
  READING_SPEED: 200, // words per minute
  DEBOUNCE_DELAY: 300, // milliseconds
  THROTTLE_DELAY: 1000, // milliseconds
  ANIMATION_DURATION: 300, // milliseconds
  TOAST_DURATION: 5000 // milliseconds
} as const