/**
 * Enhanced Error Handling and Logging System
 * Provides robust error management, logging, and graceful degradation
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.fallbackStrategies = new Map();
        this.setupFallbackStrategies();
    }

    setupFallbackStrategies() {
        // Define fallback strategies for different error types
        this.fallbackStrategies.set('speech_recognition_error', {
            strategy: 'manual_input',
            message: 'Speech recognition unavailable. Please type your message.',
            action: () => this.enableManualInput()
        });

        this.fallbackStrategies.set('llm_api_error', {
            strategy: 'cached_suggestions',
            message: 'AI suggestions temporarily unavailable. Using cached responses.',
            action: () => this.useCachedSuggestions()
        });

        this.fallbackStrategies.set('network_error', {
            strategy: 'offline_mode',
            message: 'Network connection lost. Operating in offline mode.',
            action: () => this.enableOfflineMode()
        });

        this.fallbackStrategies.set('permission_error', {
            strategy: 'alternative_input',
            message: 'Microphone access denied. Please enable microphone permissions.',
            action: () => this.showPermissionHelp()
        });
    }

    /**
     * Main error handling method
     * @param {Error} error - The error object
     * @param {string} context - Context where error occurred
     * @param {Object} metadata - Additional error metadata
     */
    handleError(error, context = 'unknown', metadata = {}) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context,
            metadata,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log the error
        this.logError(errorInfo);

        // Determine error type and apply fallback strategy
        const errorType = this.categorizeError(error, context);
        return this.applyFallbackStrategy(errorType, errorInfo);
    }

    /**
     * Categorize error type for appropriate handling
     */
    categorizeError(error, context) {
        if (context.includes('speech') || error.name === 'SpeechRecognitionError') {
            return 'speech_recognition_error';
        }
        
        if (context.includes('llm') || context.includes('api')) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
                return 'network_error';
            }
            return 'llm_api_error';
        }
        
        if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
            return 'permission_error';
        }
        
        if (error.message.includes('network') || !navigator.onLine) {
            return 'network_error';
        }
        
        return 'general_error';
    }

    /**
     * Apply appropriate fallback strategy
     */
    applyFallbackStrategy(errorType, errorInfo) {
        const strategy = this.fallbackStrategies.get(errorType);
        
        if (strategy) {
            console.warn(`Applying fallback strategy: ${strategy.strategy}`);
            
            // Execute fallback action
            const fallbackResult = strategy.action();
            
            // Show user-friendly message
            this.showUserMessage(strategy.message, 'warning');
            
            return {
                success: true,
                strategy: strategy.strategy,
                message: strategy.message,
                fallbackResult
            };
        }
        
        // No specific strategy available, use general fallback
        return this.generalFallback(errorInfo);
    }

    /**
     * Log error to internal system and optionally to external service
     */
    logError(errorInfo) {
        // Add to internal log
        this.errorLog.push(errorInfo);
        
        // Maintain log size limit
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
        
        // Console logging for development
        console.error('Error logged:', errorInfo);
        
        // Optional: Send to external error tracking service
        this.sendToErrorService(errorInfo);
    }

    /**
     * Send error to external monitoring service (optional)
     */
    async sendToErrorService(errorInfo) {
        try {
            // Example: Send to error tracking service
            // Uncomment and configure for production use
            /*
            await fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorInfo)
            });
            */
        } catch (e) {
            console.warn('Failed to send error to tracking service:', e);
        }
    }

    /**
     * Fallback strategies implementation
     */
    enableManualInput() {
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.placeholder = 'Type your message here...';
        textInput.className = 'fallback-text-input';
        
        const container = document.getElementById('liveText');
        if (container) {
            container.appendChild(textInput);
            textInput.focus();
        }
        
        return { mode: 'manual_input', element: textInput };
    }

    useCachedSuggestions() {
        const cachedSuggestions = [
            'what happened?',
            'tell me more?',
            'how did that feel?',
            'what next?',
            'any details?'
        ];
        
        return {
            mode: 'cached_suggestions',
            suggestions: cachedSuggestions
        };
    }

    enableOfflineMode() {
        const offlineIndicator = document.createElement('div');
        offlineIndicator.className = 'offline-indicator';
        offlineIndicator.textContent = '📡 Offline Mode';
        
        document.body.appendChild(offlineIndicator);
        
        return {
            mode: 'offline',
            features: ['basic_speech_recognition', 'cached_responses']
        };
    }

    showPermissionHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'permission-help-modal';
        helpModal.innerHTML = `
            <div class="modal-content">
                <h3>🎤 Microphone Access Required</h3>
                <p>To use voice features, please:</p>
                <ol>
                    <li>Click the microphone icon in your browser's address bar</li>
                    <li>Select "Allow" for microphone access</li>
                    <li>Refresh the page</li>
                </ol>
                <button onclick="this.parentElement.parentElement.remove()">Got it</button>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        return { mode: 'permission_help', modal: helpModal };
    }

    /**
     * General fallback when no specific strategy is available
     */
    generalFallback(errorInfo) {
        console.error('General error fallback activated:', errorInfo);
        
        this.showUserMessage(
            'Something went wrong. Please refresh the page and try again.',
            'error'
        );
        
        return {
            success: false,
            strategy: 'general_fallback',
            errorInfo
        };
    }

    /**
     * Show user-friendly messages
     */
    showUserMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `user-message message-${type}`;
        messageEl.textContent = message;
        
        // Style the message
        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffa726' : '#4fc3f7',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            zIndex: '10000',
            maxWidth: '300px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        });
        
        document.body.appendChild(messageEl);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorsByType: {},
            errorsByContext: {},
            recentErrors: this.errorLog.slice(-10)
        };
        
        this.errorLog.forEach(error => {
            // Count by error type
            const errorType = error.error.name;
            stats.errorsByType[errorType] = (stats.errorsByType[errorType] || 0) + 1;
            
            // Count by context
            stats.errorsByContext[error.context] = (stats.errorsByContext[error.context] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Clear error log (for privacy/storage management)
     */
    clearErrorLog() {
        this.errorLog = [];
        console.log('Error log cleared');
    }

    /**
     * Export error log for analysis
     */
    exportErrorLog() {
        return JSON.stringify(this.errorLog, null, 2);
    }
}

/**
 * Enhanced Logger class for detailed application logging
 */
class Logger {
    constructor() {
        this.logLevel = 'info'; // debug, info, warn, error
        this.logs = [];
        this.maxLogs = 500;
    }

    debug(message, data = {}) {
        this.log('debug', message, data);
    }

    info(message, data = {}) {
        this.log('info', message, data);
    }

    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    error(message, data = {}) {
        this.log('error', message, data);
    }

    log(level, message, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logs.push(logEntry);

        // Maintain log size
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Console output
        const consoleMethod = console[level] || console.log;
        consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
    }

    getLogs(level = null) {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    }

    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}

// Create global instances
const errorHandler = new ErrorHandler();
const logger = new Logger();

// Global error handler
window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, 'global_error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, 'unhandled_promise', {
        promise: event.promise
    });
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, Logger, errorHandler, logger };
}

// Make available globally
window.errorHandler = errorHandler;
window.logger = logger;