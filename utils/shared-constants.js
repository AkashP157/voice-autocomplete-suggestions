/**
 * Shared Constants and Configuration
 * Common constants, configuration values, and settings used across both V1 and V2 interfaces
 */

const SharedConstants = {
    // Application metadata
    APP: {
        NAME: 'Voice Autocomplete Suggestions',
        VERSION: '2.0.0',
        DESCRIPTION: 'Revolutionary real-time voice autocomplete powered by AI'
    },

    // Default configuration values
    DEFAULTS: {
        SPEECH: {
            LANGUAGE: 'en-US',
            CONTINUOUS: true,
            INTERIM_RESULTS: true,
            MAX_ALTERNATIVES: 1,
            MAX_DURATION: 30000, // 30 seconds
            SILENCE_TIMEOUT: 3000 // 3 seconds
        },
        
        LLM: {
            PROVIDER: 'azure',
            MODEL: 'gpt-4o-mini',
            MAX_TOKENS: 150,
            TEMPERATURE: 0.7,
            TIMEOUT: 10000, // 10 seconds
            MAX_REQUESTS_PER_MINUTE: 30
        },

        UI: {
            THEME: 'auto',
            ANIMATIONS: true,
            ACCESSIBILITY: true,
            AUTO_SAVE: true,
            MOBILE_BREAKPOINT: 768
        },

        CACHE: {
            MAX_SIZE: 50,
            TTL: 300000, // 5 minutes
            CLEANUP_INTERVAL: 60000 // 1 minute
        }
    },

    // API endpoints and URLs
    ENDPOINTS: {
        AZURE_OPENAI: {
            BASE_URL: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions',
            API_VERSION: '2024-02-15-preview'
        },
        OPENAI: {
            BASE_URL: 'https://api.openai.com/v1/chat/completions'
        },
        ANTHROPIC: {
            BASE_URL: 'https://api.anthropic.com/v1/messages'
        }
    },

    // Error types and messages
    ERRORS: {
        TYPES: {
            SPEECH_NOT_SUPPORTED: 'SPEECH_NOT_SUPPORTED',
            MICROPHONE_ACCESS_DENIED: 'MICROPHONE_ACCESS_DENIED',
            NO_SPEECH_DETECTED: 'NO_SPEECH_DETECTED',
            NETWORK_ERROR: 'NETWORK_ERROR',
            API_ERROR: 'API_ERROR',
            RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
            CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
        },

        MESSAGES: {
            SPEECH_NOT_SUPPORTED: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
            MICROPHONE_ACCESS_DENIED: 'Microphone access was denied. Please enable microphone permissions and try again.',
            NO_SPEECH_DETECTED: 'No speech was detected. Please speak clearly and try again.',
            NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
            API_ERROR: 'Service temporarily unavailable. Please try again later.',
            RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment before trying again.',
            CONFIGURATION_ERROR: 'Invalid configuration. Please check your settings.'
        }
    },

    // Status indicators
    STATUS: {
        READY: 'ready',
        LISTENING: 'listening',
        PROCESSING: 'processing',
        ERROR: 'error',
        OFFLINE: 'offline',
        CONNECTING: 'connecting'
    },

    // UI classes and selectors
    CSS_CLASSES: {
        // Status classes
        STATUS_READY: 'status-ready',
        STATUS_LISTENING: 'status-listening',
        STATUS_PROCESSING: 'status-processing',
        STATUS_ERROR: 'status-error',
        STATUS_OFFLINE: 'status-offline',

        // Highlight classes
        HIGHLIGHT_PROPER_NOUN: 'highlight-proper-noun',
        HIGHLIGHT_NUMBER: 'highlight-number',

        // Animation classes
        PULSE: 'pulse',
        FADE_IN: 'fade-in',
        FADE_OUT: 'fade-out',
        SLIDE_IN: 'slide-in',
        BOUNCE: 'bounce',

        // Component classes
        BUTTON_PRIMARY: 'btn-primary',
        BUTTON_SECONDARY: 'btn-secondary',
        BUTTON_DANGER: 'btn-danger',
        LOADING_CONTAINER: 'loading-container',
        LOADING_SPINNER: 'loading-spinner',
        TOAST: 'toast',
        MODAL: 'modal',
        TOOLTIP: 'tooltip'
    },

    // Event names
    EVENTS: {
        // Speech events
        SPEECH_START: 'speechStart',
        SPEECH_END: 'speechEnd',
        SPEECH_RESULT: 'speechResult',
        SPEECH_ERROR: 'speechError',

        // LLM events
        LLM_REQUEST_START: 'llmRequestStart',
        LLM_REQUEST_SUCCESS: 'llmRequestSuccess',
        LLM_REQUEST_ERROR: 'llmRequestError',

        // UI events
        CONFIG_CHANGED: 'configChanged',
        THEME_CHANGED: 'themeChanged',
        STATUS_CHANGED: 'statusChanged'
    },

    // Storage keys
    STORAGE_KEYS: {
        CONFIG: 'voice_autocomplete_config',
        CACHE: 'voice_autocomplete_cache',
        USER_PREFERENCES: 'voice_autocomplete_preferences',
        SESSION_DATA: 'voice_autocomplete_session'
    },

    // Regular expressions for text processing
    REGEX: {
        PROPER_NOUNS: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
        NUMBERS: /\b(?:\d+(?:,\d{3})*(?:\.\d+)?|\$\d+(?:,\d{3})*(?:\.\d{2})?|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}:\d{2}(?:\s*[APap][Mm])?)\b/g,
        EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        URL: /(https?:\/\/[^\s]+)/g,
        PHONE: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g
    },

    // Language support
    LANGUAGES: [
        { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
        { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
        { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
        { code: 'de-DE', name: 'German', flag: '🇩🇪' },
        { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
        { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
        { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
        { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
        { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' }
    ],

    // Performance thresholds
    PERFORMANCE: {
        THRESHOLDS: {
            BUNDLE_SIZE_WARNING: 500, // KB
            LOAD_TIME_WARNING: 2000, // ms
            MEMORY_WARNING: 50, // MB
            API_RESPONSE_WARNING: 5000, // ms
            CACHE_SIZE_WARNING: 40 // entries
        },

        OPTIMIZATION: {
            DEBOUNCE_DELAY: 300, // ms
            THROTTLE_DELAY: 100, // ms
            ANIMATION_DURATION: 300, // ms
            TOAST_DURATION: 3000, // ms
            CACHE_CLEANUP_INTERVAL: 60000 // ms
        }
    },

    // Browser compatibility
    BROWSER_SUPPORT: {
        SPEECH_RECOGNITION: ['Chrome', 'Edge', 'Safari'],
        WEB_AUDIO: ['Chrome', 'Firefox', 'Edge', 'Safari'],
        ES6_MODULES: ['Chrome', 'Firefox', 'Edge', 'Safari'],
        LOCAL_STORAGE: ['Chrome', 'Firefox', 'Edge', 'Safari', 'IE8+']
    },

    // Security settings
    SECURITY: {
        CSP_DIRECTIVES: {
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline'",
            'style-src': "'self' 'unsafe-inline'",
            'connect-src': "'self' https://api.openai.com https://*.openai.azure.com https://api.anthropic.com",
            'img-src': "'self' data: https:",
            'font-src': "'self' https:",
            'media-src': "'self'"
        },

        ALLOWED_ORIGINS: [
            'https://api.openai.com',
            'https://*.openai.azure.com',
            'https://api.anthropic.com'
        ]
    },

    // Feature flags
    FEATURES: {
        KEYWORD_HIGHLIGHTING: true,
        PERFORMANCE_MONITORING: true,
        ERROR_REPORTING: true,
        ANALYTICS: false,
        DARK_MODE: true,
        OFFLINE_MODE: false,
        VOICE_COMMANDS: false,
        MULTI_LANGUAGE: true
    },

    // Version comparison (V1 vs V2 features)
    VERSION_FEATURES: {
        V1: {
            analytics: true,
            advanced_config: true,
            performance_dashboard: true,
            cache_management: true,
            debug_mode: true
        },
        V2: {
            keyword_highlighting: true,
            conversational_ui: true,
            mobile_optimization: true,
            enhanced_animations: true,
            smart_prompts: true
        }
    }
};

// Utility functions for constants
SharedConstants.utils = {
    /**
     * Get error message by type
     */
    getErrorMessage(errorType) {
        return SharedConstants.ERRORS.MESSAGES[errorType] || 'An unknown error occurred.';
    },

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(featureName) {
        return SharedConstants.FEATURES[featureName] === true;
    },

    /**
     * Get language by code
     */
    getLanguage(code) {
        return SharedConstants.LANGUAGES.find(lang => lang.code === code);
    },

    /**
     * Check browser support for feature
     */
    isBrowserSupported(feature, userAgent = navigator.userAgent) {
        const supportedBrowsers = SharedConstants.BROWSER_SUPPORT[feature];
        if (!supportedBrowsers) return false;
        
        return supportedBrowsers.some(browser => 
            userAgent.includes(browser)
        );
    },

    /**
     * Get version-specific features
     */
    getVersionFeatures(version) {
        return SharedConstants.VERSION_FEATURES[version.toUpperCase()] || {};
    },

    /**
     * Build API endpoint URL
     */
    buildApiEndpoint(provider, config = {}) {
        const endpoints = SharedConstants.ENDPOINTS;
        
        switch (provider.toLowerCase()) {
            case 'azure':
                return endpoints.AZURE_OPENAI.BASE_URL
                    .replace('{resource}', config.resource || 'your-resource')
                    .replace('{deployment}', config.deployment || 'gpt-4o-mini') +
                    `?api-version=${endpoints.AZURE_OPENAI.API_VERSION}`;
            
            case 'openai':
                return endpoints.OPENAI.BASE_URL;
            
            case 'anthropic':
                return endpoints.ANTHROPIC.BASE_URL;
            
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }
};

// Export for both module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedConstants;
} else {
    window.SharedConstants = SharedConstants;
}