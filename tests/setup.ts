/**
 * Test setup file
 * Global test configuration and mocks
 */

import { beforeAll, afterAll, vi } from 'vitest'
import { config } from 'dotenv'

// Load environment variables for tests
config()

// Global test setup
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  
  // Set up test environment variables if not provided
  if (!process.env.VITE_GITHUB_TOKEN) {
    process.env.VITE_GITHUB_TOKEN = 'test-token'
  }
  if (!process.env.VITE_GITHUB_ORG) {
    process.env.VITE_GITHUB_ORG = 'ShuYingJiYu'
  }
  if (!process.env.VITE_GITHUB_USER) {
    process.env.VITE_GITHUB_USER = 'SakuraPuare'
  }
})

// Global test cleanup
afterAll(() => {
  vi.restoreAllMocks()
})

// Mock fetch for tests that don't need real API calls
global.fetch = vi.fn()

// Mock import.meta.env for tests
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_GITHUB_TOKEN: process.env.VITE_GITHUB_TOKEN,
        VITE_GITHUB_ORG: process.env.VITE_GITHUB_ORG,
        VITE_GITHUB_USER: process.env.VITE_GITHUB_USER,
        DEV: true,
        PROD: false,
        MODE: 'test'
      }
    }
  },
  writable: true
})