/**
 * Validation Utils Tests
 * Tests for validation utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  RepositorySchema,
  MemberSchema,
  LanguageSchema,
  ProjectCategorySchema,
  ServiceCategorySchema
} from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('Language Schema', () => {
    it('should validate valid languages', () => {
      expect(LanguageSchema.parse('zh')).toBe('zh');
      expect(LanguageSchema.parse('en')).toBe('en');
    });

    it('should reject invalid languages', () => {
      expect(() => LanguageSchema.parse('fr')).toThrow();
      expect(() => LanguageSchema.parse('')).toThrow();
      expect(() => LanguageSchema.parse(null)).toThrow();
    });
  });

  describe('Project Category Schema', () => {
    it('should validate valid project categories', () => {
      expect(ProjectCategorySchema.parse('web-app')).toBe('web-app');
      expect(ProjectCategorySchema.parse('mobile-app')).toBe('mobile-app');
      expect(ProjectCategorySchema.parse('open-source')).toBe('open-source');
      expect(ProjectCategorySchema.parse('library')).toBe('library');
      expect(ProjectCategorySchema.parse('automation')).toBe('automation');
      expect(ProjectCategorySchema.parse('other')).toBe('other');
    });

    it('should reject invalid project categories', () => {
      expect(() => ProjectCategorySchema.parse('invalid')).toThrow();
      expect(() => ProjectCategorySchema.parse('')).toThrow();
      expect(() => ProjectCategorySchema.parse(null)).toThrow();
    });
  });

  describe('Service Category Schema', () => {
    it('should validate valid service categories', () => {
      expect(ServiceCategorySchema.parse('frontend')).toBe('frontend');
      expect(ServiceCategorySchema.parse('backend')).toBe('backend');
      expect(ServiceCategorySchema.parse('mobile')).toBe('mobile');
      expect(ServiceCategorySchema.parse('devops')).toBe('devops');
      expect(ServiceCategorySchema.parse('consulting')).toBe('consulting');
    });

    it('should reject invalid service categories', () => {
      expect(() => ServiceCategorySchema.parse('invalid')).toThrow();
      expect(() => ServiceCategorySchema.parse('')).toThrow();
      expect(() => ServiceCategorySchema.parse(null)).toThrow();
    });
  });

  describe('Repository Schema', () => {
    it('should validate valid repository', () => {
      const validRepo = {
        id: '1',
        name: 'test-repo',
        fullName: 'testorg/test-repo',
        description: 'Test repository',
        language: 'TypeScript',
        topics: ['test', 'typescript'],
        stars: 10,
        forks: 5,
        watchers: 3,
        size: 1000,
        defaultBranch: 'main',
        isPrivate: false,
        isFork: false,
        isArchived: false,
        lastUpdated: new Date(),
        createdAt: new Date(),
        pushedAt: new Date(),
        owner: {
          login: 'testorg',
          id: 1,
          type: 'Organization' as const,
          avatarUrl: 'https://example.com/avatar.png',
          htmlUrl: 'https://github.com/testorg'
        },
        urls: {
          html: 'https://github.com/testorg/test-repo',
          git: 'https://github.com/testorg/test-repo.git',
          ssh: 'git@github.com:testorg/test-repo.git',
          clone: 'https://github.com/testorg/test-repo.git',
          api: 'https://api.github.com/repos/testorg/test-repo'
        }
      };

      const result = RepositorySchema.parse(validRepo);
      expect(result).toEqual(validRepo);
    });

    it('should reject invalid repository', () => {
      const invalidRepo = {
        id: -1, // Should be string
        name: '', // Should have min length
        fullName: '', // Should have min length
        stars: -1, // Should be >= 0
        forks: -1, // Should be >= 0
        owner: null, // Should be object
        urls: null // Should be object
      };

      expect(() => RepositorySchema.parse(invalidRepo)).toThrow();
    });

    it('should handle missing required fields', () => {
      const incompleteRepo = {
        name: 'test-repo'
        // Missing required fields
      };

      expect(() => RepositorySchema.parse(incompleteRepo)).toThrow();
    });
  });

  describe('Member Schema', () => {
    it('should validate valid member', () => {
      const validMember = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        role: {
          zh: '开发者',
          en: 'Developer'
        },
        avatar: 'https://example.com/avatar.png',
        githubUsername: 'testuser',
        bio: {
          zh: '测试用户',
          en: 'Test User'
        },
        skills: ['TypeScript', 'React'],
        contributions: {
          commits: 100,
          pullRequests: 20,
          issues: 15,
          reviews: 30,
          repositories: 10,
          totalContributions: 175,
          contributionCalendar: [
            {
              date: new Date(),
              count: 5,
              level: 3
            }
          ],
          topLanguages: [
            {
              language: 'TypeScript',
              commits: 50,
              percentage: 50,
              color: '#3178c6'
            }
          ],
          streak: {
            current: 7,
            longest: 30,
            currentStart: new Date(),
            currentEnd: new Date()
          }
        },
        socialLinks: {
          github: 'https://github.com/testuser',
          linkedin: 'https://linkedin.com/in/testuser'
        },
        joinDate: new Date(),
        isActive: true,
        featured: false
      };

      const result = MemberSchema.parse(validMember);
      expect(result).toEqual(validMember);
    });

    it('should reject invalid member', () => {
      const invalidMember = {
        id: -1, // Should be string
        name: '', // Should have min length
        username: '', // Should have min length
        contributions: 10 // Should be object
      };

      expect(() => MemberSchema.parse(invalidMember)).toThrow();
    });

    it('should handle missing required fields', () => {
      const incompleteMember = {
        name: 'Test User'
        // Missing required fields
      };

      expect(() => MemberSchema.parse(incompleteMember)).toThrow();
    });
  });
});
