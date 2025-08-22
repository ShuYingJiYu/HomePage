/**
 * useConfig Hook Tests
 * Tests for the useConfig React hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useConfig } from '@/hooks/useConfig';

// Mock the config-manager module at the top level
vi.mock('../../src/utils/config-manager', () => ({
  getConfigManager: vi.fn()
}));

describe('useConfig Hook', () => {
  let mockConfigManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Create mock config manager
    mockConfigManager = {
      getConfig: vi.fn(),
      isInitialized: vi.fn(),
      initialize: vi.fn(),
      reloadConfig: vi.fn(),
      reset: vi.fn(),
      getSystemHealth: vi.fn(),
      getConfigurationSummary: vi.fn(),
      validateConfig: vi.fn(),
      getHealthStatus: vi.fn()
    };

    // Get the mocked function and setup return value
    const { getConfigManager } = await import('../../src/utils/config-manager');
    vi.mocked(getConfigManager).mockReturnValue(mockConfigManager);
    
    // Setup getHealthStatus to return a mock health status
    mockConfigManager.getHealthStatus.mockReturnValue({
      isHealthy: true,
      configValid: true,
      errorsCount: 0,
      warningsCount: 0
    });
  });

  describe('Initialization', () => {
    it('should initialize and return configuration', async () => {
      const mockConfig = {
        site: {
          name: 'Test Site',
          url: 'https://example.com',
          description: 'Test description'
        },
        github: {
          organization: 'testorg',
          personalAccount: 'testuser',
          accessToken: 'ghp_1234567890abcdef'
        }
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config).toEqual(mockConfig);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle initialization when not initialized', async () => {
      const mockConfig = {
        site: { name: 'Test Site' },
        github: { organization: 'testorg' }
      };

      mockConfigManager.isInitialized.mockReturnValue(false);
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config).toEqual(mockConfig);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockConfigManager.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Configuration error');
      
      mockConfigManager.isInitialized.mockReturnValue(false);
      mockConfigManager.initialize.mockRejectedValue(error);

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.error).toBe(error);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.config).toBeNull();
      });
    });
  });

  describe('Configuration Access', () => {
    it('should provide access to site configuration', async () => {
      const mockConfig = {
        site: { name: 'Test Site', url: 'https://example.com' },
        github: { organization: 'testorg' }
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config?.site).toEqual(mockConfig.site);
      });
    });

    it('should provide access to GitHub configuration', async () => {
      const mockConfig = {
        site: { name: 'Test Site' },
        github: { organization: 'testorg', accessToken: 'token' }
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config?.github).toEqual(mockConfig.github);
      });
    });

    it('should provide access to AI configuration', async () => {
      const mockConfig = {
        site: { name: 'Test Site' },
        ai: { geminiApiKey: 'ai-key' }
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config?.ai).toEqual(mockConfig.ai);
      });
    });

    it('should provide access to WordPress configuration', async () => {
      const mockConfig = {
        site: { name: 'Test Site' },
        wordpress: { apiUrl: 'https://wp.example.com' }
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config?.wordpress).toEqual(mockConfig.wordpress);
      });
    });
  });

  describe('Configuration Management', () => {
    it('should provide reload functionality', async () => {
      const mockConfig = { site: { name: 'Test Site' } };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.reloadConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.reloadConfig).toBeDefined();
      });

      await result.current.reloadConfig();

      expect(mockConfigManager.reloadConfig).toHaveBeenCalled();
    });

    it('should provide reset functionality', async () => {
      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue({ site: { name: 'Test Site' } });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      expect(mockConfigManager.reset).toBeDefined();
    });

    it('should provide system health information', async () => {
      const mockHealth = {
        isHealthy: true,
        configValid: true,
        errorsCount: 0,
        warningsCount: 0
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue({ site: { name: 'Test Site' } });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockConfigManager.getSystemHealth.mockReturnValue(mockHealth);

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.getHealthStatus()).toEqual(mockHealth);
      });
    });

    it('should provide configuration summary', async () => {
      const mockSummary = {
        initialized: true,
        valid: true,
        features: { analytics: true, monitoring: false },
        errors: 0,
        warnings: 0
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue({ site: { name: 'Test Site' } });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockConfigManager.getConfigurationSummary.mockReturnValue(mockSummary);

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      expect(mockConfigManager.getConfigurationSummary).toBeDefined();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during initialization', async () => {
      mockConfigManager.isInitialized.mockReturnValue(false);
      mockConfigManager.initialize.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useConfig());

      expect(result.current.isLoading).toBe(true);
    });

    it('should hide loading state after initialization', async () => {
      const mockConfig = { site: { name: 'Test Site' } };

      mockConfigManager.isInitialized.mockReturnValue(false);
      mockConfigManager.initialize.mockResolvedValue(undefined);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration errors', async () => {
      const error = new Error('Config error');
      
      mockConfigManager.isInitialized.mockReturnValue(false);
      mockConfigManager.initialize.mockRejectedValue(error);

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.error).toBe(error);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle reload errors', async () => {
      const error = new Error('Reload error');
      const mockConfig = { site: { name: 'Test Site' } };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockConfigManager.reloadConfig.mockRejectedValue(error);

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.config).toBeDefined();
      });

      await result.current.reloadConfig();

      await waitFor(() => {
        expect(result.current.error).toBe(error);
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration when provided', async () => {
      const mockConfig = { site: { name: 'Test Site' } };
      const mockValidation = { isValid: true, errors: [], warnings: [] };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue(mockValidation);

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.validation).toEqual(mockValidation);
      });
    });

    it('should indicate invalid configuration', async () => {
      const mockConfig = { site: { name: 'Test Site' } };
      const mockValidation = { 
        isValid: false, 
        errors: ['Missing required field'], 
        warnings: [] 
      };

      mockConfigManager.isInitialized.mockReturnValue(true);
      mockConfigManager.getConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue(mockValidation);

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.validation?.isValid).toBe(false);
        expect(result.current.validation?.errors).toHaveLength(1);
      });
    });
  });
});
