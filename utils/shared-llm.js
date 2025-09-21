/**
 * Shared LLM Integration Utilities
 * Common functionality for LLM API integration across V1 and V2 interfaces
 */

class SharedLLMService {
    constructor(config = {}) {
        this.config = {
            provider: config.provider || 'azure',
            endpoint: config.endpoint || '',
            apiKey: config.apiKey || '',
            model: config.model || 'gpt-4o-mini',
            maxTokens: config.maxTokens || 150,
            temperature: config.temperature || 0.7,
            timeout: config.timeout || 10000,
            ...config
        };

        this.cache = new Map();
        this.rateLimiter = {
            requests: 0,
            lastReset: Date.now(),
            maxRequestsPerMinute: 30
        };
    }

    /**
     * Generate suggestions based on input text
     */
    async generateSuggestions(inputText, context = {}) {
        try {
            // Check rate limiting
            if (!this.checkRateLimit()) {
                throw new Error('Rate limit exceeded. Please wait before making more requests.');
            }

            // Check cache first
            const cacheKey = this.getCacheKey(inputText, context);
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Prepare the prompt
            const prompt = this.buildPrompt(inputText, context);

            // Make API request
            const response = await this.makeAPIRequest(prompt);
            
            // Process and format response
            const suggestions = this.processSuggestions(response);

            // Cache the result
            this.cacheResult(cacheKey, suggestions);

            return suggestions;

        } catch (error) {
            console.error('LLM API error:', error);
            return this.getErrorFallback(inputText, error);
        }
    }

    /**
     * Build appropriate prompt based on interface version
     */
    buildPrompt(inputText, context = {}) {
        const { version = 'v1', style = 'professional' } = context;

        if (version === 'v2' || style === 'conversational') {
            return this.buildConversationalPrompt(inputText, context);
        } else {
            return this.buildProfessionalPrompt(inputText, context);
        }
    }

    /**
     * Build conversational prompt for V2 mobile interface
     */
    buildConversationalPrompt(inputText, context) {
        const basePrompt = `You are a helpful friend providing natural autocomplete suggestions. The user said: "${inputText}"\n\n`;
        
        const instructions = `Complete their thought naturally, as if you're finishing their sentence in conversation. Provide 3-5 short, helpful suggestions that feel like natural continuations. Be friendly, conversational, and helpful.\n\nSuggestions:`;

        return basePrompt + instructions;
    }

    /**
     * Build professional prompt for V1 desktop interface
     */
    buildProfessionalPrompt(inputText, context) {
        const basePrompt = `Provide intelligent autocomplete suggestions for: "${inputText}"\n\n`;
        
        const instructions = `Generate 3-5 concise, relevant suggestions that complete or enhance the input. Focus on practical, actionable completions. Be precise and professional.\n\nSuggestions:`;

        return basePrompt + instructions;
    }

    /**
     * Make API request to LLM service
     */
    async makeAPIRequest(prompt) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const requestBody = this.buildRequestBody(prompt);
            const headers = this.buildRequestHeaders();

            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }
            
            throw error;
        }
    }

    /**
     * Build request body based on provider
     */
    buildRequestBody(prompt) {
        const baseBody = {
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature
        };

        // Provider-specific configurations
        switch (this.config.provider) {
            case 'azure':
                return {
                    ...baseBody,
                    model: this.config.model
                };
            case 'openai':
                return {
                    ...baseBody,
                    model: this.config.model
                };
            case 'anthropic':
                return {
                    model: this.config.model,
                    max_tokens: this.config.maxTokens,
                    messages: baseBody.messages
                };
            default:
                return baseBody;
        }
    }

    /**
     * Build request headers based on provider
     */
    buildRequestHeaders() {
        const baseHeaders = {
            'Content-Type': 'application/json'
        };

        switch (this.config.provider) {
            case 'azure':
                return {
                    ...baseHeaders,
                    'api-key': this.config.apiKey
                };
            case 'openai':
                return {
                    ...baseHeaders,
                    'Authorization': `Bearer ${this.config.apiKey}`
                };
            case 'anthropic':
                return {
                    ...baseHeaders,
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01'
                };
            default:
                return {
                    ...baseHeaders,
                    'Authorization': `Bearer ${this.config.apiKey}`
                };
        }
    }

    /**
     * Process API response into suggestions
     */
    processSuggestions(response) {
        try {
            let content = '';

            // Extract content based on provider response format
            if (response.choices && response.choices[0]?.message?.content) {
                content = response.choices[0].message.content;
            } else if (response.content && response.content[0]?.text) {
                content = response.content[0].text;
            } else if (typeof response === 'string') {
                content = response;
            } else {
                throw new Error('Unknown response format');
            }

            // Parse suggestions from content
            const suggestions = this.parseSuggestions(content);
            
            return {
                suggestions: suggestions,
                timestamp: Date.now(),
                source: 'llm'
            };

        } catch (error) {
            console.error('Error processing suggestions:', error);
            return {
                suggestions: ['Error processing suggestions'],
                timestamp: Date.now(),
                source: 'error'
            };
        }
    }

    /**
     * Parse suggestions from LLM response text
     */
    parseSuggestions(content) {
        // Remove common prefixes and clean up
        let cleaned = content
            .replace(/^(Suggestions?:?\s*)/i, '')
            .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
            .replace(/^-\s*/gm, '')     // Remove dashes
            .replace(/^•\s*/gm, '')     // Remove bullets
            .trim();

        // Split into individual suggestions
        let suggestions = cleaned
            .split(/\n+/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && s.length < 200) // Filter reasonable length
            .slice(0, 5); // Limit to 5 suggestions

        // Fallback if no suggestions found
        if (suggestions.length === 0) {
            suggestions = [cleaned.slice(0, 100)]; // Take first 100 chars as fallback
        }

        return suggestions;
    }

    /**
     * Check rate limiting
     */
    checkRateLimit() {
        const now = Date.now();
        const timeSinceReset = now - this.rateLimiter.lastReset;

        // Reset counter every minute
        if (timeSinceReset >= 60000) {
            this.rateLimiter.requests = 0;
            this.rateLimiter.lastReset = now;
        }

        // Check if within rate limit
        if (this.rateLimiter.requests >= this.rateLimiter.maxRequestsPerMinute) {
            return false;
        }

        this.rateLimiter.requests++;
        return true;
    }

    /**
     * Generate cache key
     */
    getCacheKey(inputText, context) {
        const contextString = JSON.stringify(context);
        return `${inputText}_${contextString}`.replace(/\s+/g, '_').toLowerCase();
    }

    /**
     * Cache API result
     */
    cacheResult(key, result) {
        // Simple LRU cache - remove oldest if cache is too large
        if (this.cache.size >= 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, result);
    }

    /**
     * Get error fallback suggestions
     */
    getErrorFallback(inputText, error) {
        const fallbackSuggestions = [
            `${inputText} - please continue`,
            `${inputText} and more details`,
            `${inputText} with additional context`,
            'Please try again'
        ];

        return {
            suggestions: fallbackSuggestions,
            timestamp: Date.now(),
            source: 'fallback',
            error: error.message
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            config: this.config,
            cacheSize: this.cache.size,
            rateLimitStatus: {
                requests: this.rateLimiter.requests,
                limit: this.rateLimiter.maxRequestsPerMinute,
                resetTime: this.rateLimiter.lastReset + 60000
            }
        };
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await this.generateSuggestions('test', { timeout: 5000 });
            return {
                success: true,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for both module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedLLMService;
} else {
    window.SharedLLMService = SharedLLMService;
}