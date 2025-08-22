// Common types and enums used across the application

export interface MultilingualContent {
  zh: string
  en: string
}

export interface MultilingualArray {
  zh: string[]
  en: string[]
}

export type Language = 'zh' | 'en'

export const ProjectCategory = {
  WEB_APPLICATION: 'web-app',
  MOBILE_APPLICATION: 'mobile-app',
  OPEN_SOURCE_TOOL: 'open-source',
  LIBRARY_FRAMEWORK: 'library',
  AUTOMATION_SCRIPT: 'automation',
  OTHER: 'other',
} as const

export type ProjectCategory =
  (typeof ProjectCategory)[keyof typeof ProjectCategory]

export const ServiceCategory = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  MOBILE: 'mobile',
  DEVOPS: 'devops',
  CONSULTING: 'consulting',
} as const

export type ServiceCategory =
  (typeof ServiceCategory)[keyof typeof ServiceCategory]

export interface DateRange {
  start: Date
  end: Date
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: Date
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CacheMetadata {
  lastUpdated: Date
  expiresAt: Date
  version: string
  source: string
}

export interface ErrorInfo {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: Date
}
