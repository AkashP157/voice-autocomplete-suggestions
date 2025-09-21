/**
 * Configuration Management System
 * Centralizes all application configuration with environment support
 */

class ConfigManager {
    constructor() {
        this.config = {};
        this.environment = this.detectEnvironment();
        this.loadConfiguration();
    }

    detectEnvironment() {
        // Detect environment based on hostname
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    loadConfiguration() {
        // Base configuration
        this.config = {
            // Application settings
            app: {
                name: 'Voice Autocomplete Suggestions',
                version: '2.0.0',
                maxSuggestions: 3,
                pauseDelay: 1000,
                cacheTimeout: 300000, // 5 minutes
                maxCacheSize: 100
            },

            // Speech Recognition settings
            speech: {
                language: 'en-US',
                continuous: true,
                interimResults: true,
                maxAlternatives: 1,
                grammars: [],
                serviceURI: null
            },

            // LLM/API settings
            llm: {
                endpoint: this.getEnvVar('LLM_ENDPOINT', ''),
                apiKey: this.getEnvVar('LLM_API_KEY', ''),
                modelName: this.getEnvVar('LLM_MODEL', 'gpt-4o-mini'),
                deploymentName: this.getEnvVar('LLM_DEPLOYMENT', ''),
                maxTokens: 150,
                temperature: 0.7,
                timeout: 10000, // 10 seconds
                retryAttempts: 3,
                retryDelay: 1000
            },

            // UI settings
            ui: {
                theme: 'default',
                animationDuration: 300,
                showPerformanceMetrics: this.environment === 'development',
                enableDebugMode: this.environment === 'development',
                autoHideSuggestions: true,
                suggestionTimeout: 10000
            },

            // Feature flags
            features: {
                keywordHighlighting: true,
                properNounDetection: true,
                numberHighlighting: true,
                caching: true,
                analytics: this.environment !== 'production', // Disable in prod for privacy
                errorReporting: true,
                offlineMode: false,
                experimentalFeatures: this.environment === 'development'
            },

            // Performance settings
            performance: {
                enablePrefetch: true,
                maxConcurrentRequests: 3,
                enableServiceWorker: this.environment === 'production',
                enableGzip: true,
                enableCDN: this.environment === 'production'
            },

            // Security settings
            security: {
                enableCSP: this.environment === 'production',
                allowedOrigins: this.getAllowedOrigins(),
                enableCORS: true,
                sanitizeInput: true,
                enableRateLimit: true,
                maxRequestsPerMinute: 60
            },

            // Accessibility settings
            accessibility: {
                enableScreenReader: true,
                enableKeyboardNavigation: true,
                enableHighContrast: false,
                enableReducedMotion: false,
                announceChanges: true
            }
        };

        // Environment-specific overrides
        this.applyEnvironmentOverrides();

        // Load user preferences from localStorage
        this.loadUserPreferences();
    }

    applyEnvironmentOverrides() {
        const overrides = {
            development: {
                llm: {
                    timeout: 30000, // Longer timeout for debugging
                    retryAttempts: 1 // Fewer retries to speed up development
                },
                ui: {
                    showPerformanceMetrics: true,
                    enableDebugMode: true
                },
                features: {
                    analytics: true,
                    experimentalFeatures: true
                }
            },

            staging: {
                llm: {
                    timeout: 15000,
                    retryAttempts: 2
                },
                features: {
                    analytics: true,
                    experimentalFeatures: false
                },
                security: {
                    enableRateLimit: false // Easier testing
                }
            },

            production: {
                ui: {
                    showPerformanceMetrics: false,
                    enableDebugMode: false
                },
                features: {
                    analytics: false, // Privacy
                    experimentalFeatures: false
                },
                performance: {
                    enableServiceWorker: true,
                    enableCDN: true
                },
                security: {
                    enableCSP: true,
                    enableRateLimit: true
                }
            }
        };

        const envConfig = overrides[this.environment];
        if (envConfig) {
            this.config = this.deepMerge(this.config, envConfig);
        }
    }

    getAllowedOrigins() {
        switch (this.environment) {
            case 'development':
                return ['http://localhost:*', 'http://127.0.0.1:*'];
            case 'staging':
                return ['https://staging.yourapp.com'];
            case 'production':
                return ['https://yourapp.com'];
            default:
                return ['*'];
        }
    }

    getEnvVar(key, defaultValue = null) {
        // Try to get from various sources
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key] || defaultValue;
        }
        
        // Try to get from meta tags (for client-side)
        const metaTag = document.querySelector(`meta[name="env-${key.toLowerCase()}"]`);
        if (metaTag) {
            return metaTag.getAttribute('content') || defaultValue;
        }

        // Try to get from localStorage (for user overrides)
        const storedValue = localStorage.getItem(`ENV_${key}`);
        if (storedValue) {
            return storedValue;
        }

        return defaultValue;
    }

    loadUserPreferences() {
        try {
            const stored = localStorage.getItem('voiceApp_userPreferences');
            if (stored) {
                const preferences = JSON.parse(stored);
                this.config = this.deepMerge(this.config, { user: preferences });
            }
        } catch (e) {
            console.warn('Failed to load user preferences:', e);
        }
    }

    saveUserPreferences(preferences) {
        try {
            localStorage.setItem('voiceApp_userPreferences', JSON.stringify(preferences));
            this.config.user = { ...this.config.user, ...preferences };
        } catch (e) {
            console.warn('Failed to save user preferences:', e);
        }
    }

    get(path, defaultValue = null) {
        return this.getNestedValue(this.config, path, defaultValue);
    }

    set(path, value) {
        this.setNestedValue(this.config, path, value);
    }

    getNestedValue(obj, path, defaultValue = null) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // Validation methods
    validateConfig() {
        const errors = [];

        // Validate required LLM settings
        if (!this.get('llm.endpoint')) {
            errors.push('LLM endpoint is required');
        }

        if (!this.get('llm.apiKey')) {
            errors.push('LLM API key is required');
        }

        // Validate numeric values
        if (this.get('app.pauseDelay') < 100) {
            errors.push('Pause delay must be at least 100ms');
        }

        if (this.get('llm.maxTokens') < 1 || this.get('llm.maxTokens') > 1000) {
            errors.push('LLM max tokens must be between 1 and 1000');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Feature flag helpers
    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`, false);
    }

    enableFeature(feature) {
        this.set(`features.${feature}`, true);
    }

    disableFeature(feature) {
        this.set(`features.${feature}`, false);
    }

    // Environment helpers
    isDevelopment() {
        return this.environment === 'development';
    }

    isProduction() {
        return this.environment === 'production';
    }

    isStaging() {
        return this.environment === 'staging';
    }

    // Debug helpers
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }

    getConfigSummary() {
        return {
            environment: this.environment,
            version: this.get('app.version'),
            features: Object.keys(this.config.features).filter(f => this.isFeatureEnabled(f)),
            llmConfigured: !!(this.get('llm.endpoint') && this.get('llm.apiKey'))
        };
    }
}

// Create global configuration instance
const config = new ConfigManager();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager, config };
}

// Make available globally
window.config = config;