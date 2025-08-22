/**
 * Configuration Manager Tests
 * Tests for the configuration management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../src/utils/config-manager';

// Mock the config loader and error handler
vi.mock('../../src/utils/config-loader', () => ({
  ConfigLoader: {
    getInstance: vi.fn(() => ({
      validateEnvironmentVariables: vi.fn(() => ({
        isValid: true,
        errors: [],
        warnings: []
      })),
      loadConfig: vi.fn(() => Promise.resolve({
        site: {
          name: { zh: '书樱寄语网络工作室', en: 'Shuying Studio' },
          description: { zh: '专业的网络开发工作室', en: 'Professional web development studio' },
          url: 'https://shuyingapp.cn',
          defaultLanguage: 'zh',
          supportedLanguages: ['zh', 'en']
        },
        github: {
          organization: 'ShuYingJiYu',
          personalAccount: 'SakuraPuare',
          accessToken: 'test-token',
          excludeRepositories: ['test-repo'],
          includeRepositories: undefined
        },
        wordpress: {
          apiUrl: 'https://blog.sakurapuare.com/wp-json/wp/v2',
          categories: undefined,
          multilingualSupport: false
        },
        ai: {
          geminiApiKey: '',
          analysisPrompts: {
            projectEvaluation: 'Evaluate this project',
            descriptionGeneration: 'Generate description',
            categoryClassification: 'Classify project',
            multilingualGeneration: 'Generate multilingual content'
          },
          fallbackStrategy: 'cache'
        },
        analytics: {
          googleAnalyticsId: undefined,
          enableCookieConsent: true,
          trackingEvents: []
        },
        social: {
          github: 'https://github.com/ShuYingJiYu',
          email: 'contact@shuyingapp.cn',
          shareButtons: ['twitter', 'linkedin']
        },
        monitoring: {
          enableStatusPage: false
        },
        seo: {
          enableSitemap: true,
          enableRobotsTxt: true,
          enableStructuredData: true,
          defaultKeywords: {
            zh: ['网络工作室', '开发'],
            en: ['web studio', 'development']
          }
        },
        performance: {
          enableWebVitals: true,
          enableImageOptimization: true,
          enableCodeSplitting: true,
          cacheStrategy: 'moderate'
        }
      })),
      reloadConfig: vi.fn(),
      validateConfig: vi.fn(() => ({
        isValid: true,
        errors: [],
        warnings: []
      })),
      isValid: vi.fn(() => true),
      getErrors: vi.fn(() => []),
      getWarnings: vi.fn(() => [])
    }))
  }
}));

vi.mock('../../src/utils/config-error-handler', () => ({
  ConfigErrorHandler: {
    getInstance: vi.fn(() => ({
      handleError: vi.fn(() => Promise.resolve(true)),
      saveToCache: vi.fn(),
      clearErrorLog: vi.fn(),
      isSystemHealthy: vi.fn(() => true),
      getErrorStats: vi.fn(() => ({
        recent: [],
        total: 0
      }))
    }))
  },
  createConfigError: {
    environment: vi.fn(),
    loading: vi.fn()
  }
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (ConfigManager as any).instance = undefined;
    configManager = ConfigManager.getInstance();
  });

  afterEach(() => {
    // Clean up after each test
    configManager.reset();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ConfigManager);
    });
  });

  describe('Initialization', () => {
    it('should initialize configuration successfully', async () => {
      await expect(configManager.initialize()).resolves.not.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      await configManager.initialize();
      
      // Second initialization should not throw
      await expect(configManager.initialize()).resolves.not.toThrow();
    });

    it('should get configuration after initialization', async () => {
      await configManager.initialize();
      
      const config = await configManager.getConfig();
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('site');
      expect(config).toHaveProperty('github');
      expect(config).toHaveProperty('wordpress');
      expect(config.site.name.zh).toBe('书樱寄语网络工作室');
      expect(config.github.organization).toBe('ShuYingJiYu');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration successfully', async () => {
      await configManager.initialize();
      
      const validation = configManager.validateConfig();
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation.isValid).toBe(true);
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should check if configuration is valid', async () => {
      await configManager.initialize();
      
      const isValid = configManager.isValid();
      expect(typeof isValid).toBe('boolean');
      expect(isValid).toBe(true);
    });

    it('should get configuration errors and warnings', async () => {
      await configManager.initialize();
      
      const errors = configManager.getErrors();
      const warnings = configManager.getWarnings();
      
      expect(Array.isArray(errors)).toBe(true);
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe('Feature Detection', () => {
    it('should detect analytics feature availability', async () => {
      await configManager.initialize();
      
      const analyticsEnabled = await configManager.isFeatureEnabled('analytics');
      expect(typeof analyticsEnabled).toBe('boolean');
      // Should be false since no GA ID is configured in mock
      expect(analyticsEnabled).toBe(false);
    });

    it('should detect SEO feature availability', async () => {
      await configManager.initialize();
      
      const seoEnabled = await configManager.isFeatureEnabled('seo');
      expect(typeof seoEnabled).toBe('boolean');
      // Should be true since sitemap and robots are enabled in mock
      expect(seoEnabled).toBe(true);
    });

    it('should detect multi-language feature availability', async () => {
      await configManager.initialize();
      
      const multiLangEnabled = await configManager.isFeatureEnabled('multiLanguage');
      expect(typeof multiLangEnabled).toBe('boolean');
      // Should be true since we have zh and en in supported languages
      expect(multiLangEnabled).toBe(true);
    });

    it('should detect WordPress feature availability', async () => {
      await configManager.initialize();
      
      const wordpressEnabled = await configManager.isFeatureEnabled('wordpress');
      expect(typeof wordpressEnabled).toBe('boolean');
      // Should be true since API URL is configured in mock
      expect(wordpressEnabled).toBe(true);
    });

    it('should detect AI feature availability', async () => {
      await configManager.initialize();
      
      const aiEnabled = await configManager.isFeatureEnabled('ai');
      expect(typeof aiEnabled).toBe('boolean');
      // Should be false since no Gemini API key is configured in mock
      expect(aiEnabled).toBe(false);
    });

    it('should handle unknown features gracefully', async () => {
      await configManager.initialize();
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const unknownFeature = await configManager.isFeatureEnabled('unknown-feature');
      expect(unknownFeature).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[ConfigManager] Unknown feature: unknown-feature');
      
      consoleSpy.mockRestore();
    });
  });

  describe('API Configuration', () => {
    it('should get GitHub API configuration', async () => {
      await configManager.initialize();
      
      const githubConfig = await configManager.getApiConfig('github');
      
      expect(githubConfig).toHaveProperty('token');
      expect(githubConfig).toHaveProperty('organization');
      expect(githubConfig).toHaveProperty('personalAccount');
      expect(githubConfig).toHaveProperty('excludeRepositories');
      expect(githubConfig.organization).toBe('ShuYingJiYu');
      expect(githubConfig.personalAccount).toBe('SakuraPuare');
      expect(Array.isArray(githubConfig.excludeRepositories)).toBe(true);
    });

    it('should get WordPress API configuration', async () => {
      await configManager.initialize();
      
      const wordpressConfig = await configManager.getApiConfig('wordpress');
      
      expect(wordpressConfig).toHaveProperty('apiUrl');
      expect(wordpressConfig).toHaveProperty('categories');
      expect(wordpressConfig).toHaveProperty('multilingualSupport');
      expect(wordpressConfig.apiUrl).toBe('https://blog.sakurapuare.com/wp-json/wp/v2');
      expect(typeof wordpressConfig.multilingualSupport).toBe('boolean');
    });

    it('should get Gemini AI API configuration', async () => {
      await configManager.initialize();
      
      const geminiConfig = await configManager.getApiConfig('gemini');
      
      expect(geminiConfig).toHaveProperty('apiKey');
      expect(geminiConfig).toHaveProperty('prompts');
      expect(geminiConfig).toHaveProperty('fallbackStrategy');
      expect(geminiConfig.fallbackStrategy).toBe('cache');
      expect(typeof geminiConfig.prompts).toBe('object');
    });

    it('should get analytics API configuration', async () => {
      await configManager.initialize();
      
      const analyticsConfig = await configManager.getApiConfig('analytics');
      
      expect(analyticsConfig).toHaveProperty('googleAnalyticsId');
      expect(analyticsConfig).toHaveProperty('enableCookieConsent');
      expect(analyticsConfig).toHaveProperty('trackingEvents');
      expect(typeof analyticsConfig.enableCookieConsent).toBe('boolean');
      expect(Array.isArray(analyticsConfig.trackingEvents)).toBe(true);
    });

    it('should throw error for unknown service', async () => {
      await configManager.initialize();
      
      await expect(
        configManager.getApiConfig('unknown-service' as any)
      ).rejects.toThrow('Unknown service: unknown-service');
    });
  });

  describe('Configuration Sections', () => {
    it('should get site configuration section', async () => {
      await configManager.initialize();
      
      const siteConfig = await configManager.getSection('site');
      
      expect(siteConfig).toHaveProperty('name');
      expect(siteConfig).toHaveProperty('description');
      expect(siteConfig).toHaveProperty('url');
      expect(siteConfig).toHaveProperty('defaultLanguage');
      expect(siteConfig).toHaveProperty('supportedLanguages');
      expect(siteConfig.defaultLanguage).toBe('zh');
      expect(Array.isArray(siteConfig.supportedLanguages)).toBe(true);
    });

    it('should get GitHub configuration section', async () => {
      await configManager.initialize();
      
      const githubConfig = await configManager.getSection('github');
      
      expect(githubConfig).toHaveProperty('organization');
      expect(githubConfig).toHaveProperty('personalAccount');
      expect(githubConfig).toHaveProperty('accessToken');
      expect(githubConfig).toHaveProperty('excludeRepositories');
      expect(githubConfig.organization).toBe('ShuYingJiYu');
    });
  });

  describe('System Health', () => {
    it('should get system health status', async () => {
      await configManager.initialize();
      
      const healthStatus = configManager.getHealthStatus();
      
      expect(healthStatus).toHaveProperty('isHealthy');
      expect(healthStatus).toHaveProperty('configValid');
      expect(healthStatus).toHaveProperty('errorsCount');
      expect(healthStatus).toHaveProperty('warningsCount');
      expect(typeof healthStatus.isHealthy).toBe('boolean');
      expect(typeof healthStatus.configValid).toBe('boolean');
      expect(typeof healthStatus.errorsCount).toBe('number');
      expect(typeof healthStatus.warningsCount).toBe('number');
    });

    it('should get configuration summary', async () => {
      await configManager.initialize();
      
      const summary = configManager.getConfigSummary();
      
      expect(summary).toHaveProperty('initialized');
      expect(summary).toHaveProperty('valid');
      expect(summary).toHaveProperty('features');
      expect(summary).toHaveProperty('errors');
      expect(summary).toHaveProperty('warnings');
      expect(typeof summary.initialized).toBe('boolean');
      expect(typeof summary.valid).toBe('boolean');
      expect(typeof summary.features).toBe('object');
      expect(typeof summary.errors).toBe('number');
      expect(typeof summary.warnings).toBe('number');
      
      // Check feature flags
      expect(summary.features).toHaveProperty('analytics');
      expect(summary.features).toHaveProperty('seo');
      expect(summary.features).toHaveProperty('multiLanguage');
      expect(summary.features).toHaveProperty('wordpress');
      expect(summary.features).toHaveProperty('ai');
    });
  });

  describe('Configuration Management', () => {
    it('should reload configuration', async () => {
      await configManager.initialize();
      
      // Mock the reload to return updated config
      const mockLoader = (configManager as any).loader;
      mockLoader.reloadConfig.mockResolvedValue({
        ...await configManager.getConfig(),
        site: {
          ...await configManager.getSection('site'),
          name: { zh: '更新的工作室', en: 'Updated Studio' }
        }
      });
      
      const reloadedConfig = await configManager.reloadConfig();
      
      expect(reloadedConfig).toBeDefined();
      expect(mockLoader.reloadConfig).toHaveBeenCalled();
    });

    it('should reset configuration manager', async () => {
      await configManager.initialize();
      
      // Verify it's initialized
      expect(configManager.getConfigSync()).toBeDefined();
      
      // Reset
      configManager.reset();
      
      // Verify it's reset
      expect(configManager.getConfigSync()).toBeNull();
    });

    it('should get configuration synchronously after initialization', async () => {
      // Before initialization
      expect(configManager.getConfigSync()).toBeNull();
      
      // After initialization
      await configManager.initialize();
      const config = configManager.getConfigSync();
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('site');
      expect(config).toHaveProperty('github');
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration loading errors gracefully', async () => {
      // Mock loader to throw error
      const mockLoader = (configManager as any).loader;
      mockLoader.loadConfig.mockRejectedValueOnce(new Error('Loading failed'));
      
      // Mock error handler to return recovery success
      const mockErrorHandler = (configManager as any).errorHandler;
      mockErrorHandler.handleError.mockResolvedValueOnce(true);
      
      // Should not throw due to error recovery
      await expect(configManager.initialize()).resolves.not.toThrow();
    });

    it('should throw error when configuration is not available', async () => {
      // Create a fresh instance that hasn't been initialized
      (ConfigManager as any).instance = undefined;
      const freshManager = ConfigManager.getInstance();
      
      // Mock the loader to return null config
      const mockLoader = (freshManager as any).loader;
      mockLoader.loadConfig.mockResolvedValueOnce(null);
      
      await expect(freshManager.getConfig()).rejects.toThrow('Configuration not available');
    });
  });
});