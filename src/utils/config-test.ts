/**
 * Configuration testing utilities
 * Provides functions to test and validate configuration setup
 */

import { getConfigManager } from './config-manager';
import { validateEnvironment } from './config-loader';
import type { ConfigValidationResult } from '../types/config';

/**
 * Test configuration setup
 */
export async function testConfiguration(): Promise<{
  success: boolean;
  results: {
    environment: ConfigValidationResult;
    configuration: ConfigValidationResult;
    features: Record<string, boolean>;
    apiConnections: Record<string, boolean>;
  };
  summary: string;
}> {
  console.log('🧪 Testing configuration setup...');
  
  const results = {
    environment: { isValid: false, errors: [], warnings: [] } as ConfigValidationResult,
    configuration: { isValid: false, errors: [], warnings: [] } as ConfigValidationResult,
    features: {} as Record<string, boolean>,
    apiConnections: {} as Record<string, boolean>
  };

  try {
    // Test environment variables
    console.log('📋 Validating environment variables...');
    results.environment = validateEnvironment();
    
    if (results.environment.isValid) {
      console.log('✅ Environment variables are valid');
    } else {
      console.warn('⚠️ Environment validation issues:', results.environment.errors);
    }

    // Test configuration loading
    console.log('⚙️ Loading configuration...');
    const configManager = getConfigManager();
    await configManager.initialize();
    
    results.configuration = configManager.validateConfig();
    
    if (results.configuration.isValid) {
      console.log('✅ Configuration loaded and validated successfully');
    } else {
      console.warn('⚠️ Configuration validation issues:', results.configuration.errors);
    }

    // Test features
    console.log('🔧 Testing feature availability...');
    const features = [
      'analytics',
      'monitoring', 
      'seo',
      'webVitals',
      'imageOptimization',
      'codeSplitting',
      'cookieConsent',
      'multiLanguage',
      'wordpress',
      'ai'
    ];

    for (const feature of features) {
      results.features[feature] = await configManager.isFeatureEnabled(feature);
      console.log(`${results.features[feature] ? '✅' : '❌'} ${feature}: ${results.features[feature] ? 'enabled' : 'disabled'}`);
    }

    // Test API configurations
    console.log('🔌 Testing API configurations...');
    const apis = ['github', 'gemini', 'wordpress', 'betterstack', 'analytics'] as const;
    
    for (const api of apis) {
      try {
        const apiConfig = await configManager.getApiConfig(api);
        results.apiConnections[api] = !!apiConfig && Object.values(apiConfig).some(value => !!value);
        console.log(`${results.apiConnections[api] ? '✅' : '❌'} ${api}: ${results.apiConnections[api] ? 'configured' : 'not configured'}`);
      } catch (error) {
        results.apiConnections[api] = false;
        console.log(`❌ ${api}: configuration error`);
      }
    }

    // Generate summary
    const enabledFeatures = Object.values(results.features).filter(Boolean).length;
    const configuredApis = Object.values(results.apiConnections).filter(Boolean).length;
    const totalIssues = results.environment.errors.length + results.configuration.errors.length;
    
    const success = results.environment.isValid && results.configuration.isValid && totalIssues === 0;
    
    const summary = `Configuration test completed: ${success ? 'SUCCESS' : 'ISSUES FOUND'}
- Environment: ${results.environment.isValid ? 'Valid' : `${results.environment.errors.length} errors`}
- Configuration: ${results.configuration.isValid ? 'Valid' : `${results.configuration.errors.length} errors`}
- Features enabled: ${enabledFeatures}/${features.length}
- APIs configured: ${configuredApis}/${apis.length}`;

    console.log('\n📊 Test Summary:');
    console.log(summary);

    return {
      success,
      results,
      summary
    };

  } catch (error) {
    const errorMessage = `Configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌', errorMessage);
    
    return {
      success: false,
      results,
      summary: errorMessage
    };
  }
}

/**
 * Test specific configuration section
 */
export async function testConfigSection(section: keyof import('../types/config').SiteConfig): Promise<boolean> {
  try {
    const configManager = getConfigManager();
    const sectionConfig = await configManager.getSection(section);
    
    console.log(`✅ ${section} configuration:`, sectionConfig);
    return true;
  } catch (error) {
    console.error(`❌ Failed to load ${section} configuration:`, error);
    return false;
  }
}

/**
 * Test environment variable availability
 */
export function testEnvironmentVariables(): Record<string, boolean> {
  const requiredVars = [
    'VITE_GITHUB_TOKEN',
    'VITE_GITHUB_ORG', 
    'VITE_GITHUB_USER',
    'VITE_GEMINI_API_KEY',
    'VITE_WORDPRESS_API_URL',
    'VITE_SITE_URL',
    'VITE_DEFAULT_LANGUAGE'
  ];

  const optionalVars = [
    'VITE_BETTERSTACK_API_KEY',
    'VITE_GA_MEASUREMENT_ID'
  ];

  const results: Record<string, boolean> = {};

  console.log('🔍 Checking environment variables...');
  
  // Check required variables
  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    results[varName] = !!value;
    console.log(`${results[varName] ? '✅' : '❌'} ${varName}: ${results[varName] ? 'set' : 'missing'}`);
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    const value = import.meta.env[varName];
    results[varName] = !!value;
    console.log(`${results[varName] ? '✅' : '⚠️'} ${varName}: ${results[varName] ? 'set' : 'optional - not set'}`);
  });

  return results;
}

/**
 * Generate configuration report
 */
export async function generateConfigReport(): Promise<string> {
  const testResult = await testConfiguration();
  const envVars = testEnvironmentVariables();
  
  const report = `
# Configuration Report

## Environment Variables
${Object.entries(envVars).map(([key, value]) => `- ${key}: ${value ? '✅ Set' : '❌ Missing'}`).join('\n')}

## Configuration Validation
- Environment Valid: ${testResult.results.environment.isValid ? '✅' : '❌'}
- Configuration Valid: ${testResult.results.configuration.isValid ? '✅' : '❌'}

## Features
${Object.entries(testResult.results.features).map(([key, value]) => `- ${key}: ${value ? '✅ Enabled' : '❌ Disabled'}`).join('\n')}

## API Connections
${Object.entries(testResult.results.apiConnections).map(([key, value]) => `- ${key}: ${value ? '✅ Configured' : '❌ Not Configured'}`).join('\n')}

## Issues
${testResult.results.environment.errors.length > 0 ? `
### Environment Errors
${testResult.results.environment.errors.map(e => `- ${e.field}: ${e.message}`).join('\n')}
` : ''}

${testResult.results.configuration.errors.length > 0 ? `
### Configuration Errors  
${testResult.results.configuration.errors.map(e => `- ${e.field}: ${e.message}`).join('\n')}
` : ''}

${testResult.results.environment.warnings.length > 0 || testResult.results.configuration.warnings.length > 0 ? `
### Warnings
${[...testResult.results.environment.warnings, ...testResult.results.configuration.warnings].map(w => `- ${w.field}: ${w.message}`).join('\n')}
` : ''}

## Summary
${testResult.summary}
`;

  return report;
}

export default testConfiguration;