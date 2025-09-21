/**
 * Shared Speech Recognition Utilities
 * Common functionality for speech recognition across V1 and V2 interfaces
 */

class SharedSpeechRecognition {
    constructor(config = {}) {
        this.config = {
            language: config.language || 'en-US',
            continuous: config.continuous !== false,
            interimResults: config.interimResults !== false,
            maxAlternatives: config.maxAlternatives || 1,
            ...config
        };

        this.recognition = null;
        this.isListening = false;
        this.callbacks = {
            onResult: null,
            onError: null,
            onStart: null,
            onEnd: null,
            onSpeechStart: null,
            onSpeechEnd: null
        };

        this.initializeRecognition();
    }

    /**
     * Initialize speech recognition with browser compatibility
     */
    initializeRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                throw new Error('Speech recognition not supported in this browser');
            }

            this.recognition = new SpeechRecognition();
            this.setupRecognitionEvents();
            this.configureRecognition();
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }

    /**
     * Configure recognition settings
     */
    configureRecognition() {
        if (!this.recognition) return;

        this.recognition.lang = this.config.language;
        this.recognition.continuous = this.config.continuous;
        this.recognition.interimResults = this.config.interimResults;
        this.recognition.maxAlternatives = this.config.maxAlternatives;
    }

    /**
     * Set up recognition event handlers
     */
    setupRecognitionEvents() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.callbacks.onStart) {
                this.callbacks.onStart();
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.callbacks.onEnd) {
                this.callbacks.onEnd();
            }
        };

        this.recognition.onspeechstart = () => {
            if (this.callbacks.onSpeechStart) {
                this.callbacks.onSpeechStart();
            }
        };

        this.recognition.onspeechend = () => {
            if (this.callbacks.onSpeechEnd) {
                this.callbacks.onSpeechEnd();
            }
        };

        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleError(event);
        };
    }

    /**
     * Handle speech recognition results
     */
    handleResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (this.callbacks.onResult) {
            this.callbacks.onResult({
                final: finalTranscript,
                interim: interimTranscript,
                confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0
            });
        }
    }

    /**
     * Handle speech recognition errors
     */
    handleError(event) {
        const errorMessages = {
            'no-speech': 'No speech was detected. Please try again.',
            'audio-capture': 'Audio capture failed. Please check your microphone.',
            'not-allowed': 'Microphone access was denied. Please enable microphone permissions.',
            'network': 'Network error occurred. Please check your connection.',
            'service-not-allowed': 'Speech recognition service is not allowed.',
            'bad-grammar': 'Grammar error in speech recognition.',
            'language-not-supported': 'Language not supported.'
        };

        const userFriendlyMessage = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
        
        if (this.callbacks.onError) {
            this.callbacks.onError({
                error: event.error,
                message: userFriendlyMessage,
                event: event
            });
        }
    }

    /**
     * Start speech recognition
     */
    start() {
        if (!this.recognition) {
            throw new Error('Speech recognition not initialized');
        }

        if (this.isListening) {
            console.warn('Speech recognition is already active');
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }

    /**
     * Stop speech recognition
     */
    stop() {
        if (!this.recognition) {
            return;
        }

        if (!this.isListening) {
            console.warn('Speech recognition is not active');
            return;
        }

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Failed to stop speech recognition:', error);
        }
    }

    /**
     * Abort speech recognition
     */
    abort() {
        if (!this.recognition) {
            return;
        }

        try {
            this.recognition.abort();
            this.isListening = false;
        } catch (error) {
            console.error('Failed to abort speech recognition:', error);
        }
    }

    /**
     * Set callback functions
     */
    setCallback(eventName, callback) {
        if (this.callbacks.hasOwnProperty(eventName)) {
            this.callbacks[eventName] = callback;
        } else {
            console.warn(`Unknown callback event: ${eventName}`);
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.configureRecognition();
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isListening: this.isListening,
            isSupported: !!this.recognition,
            config: this.config
        };
    }

    /**
     * Check browser compatibility
     */
    static isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * Get supported languages (basic list)
     */
    static getSupportedLanguages() {
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'es-ES', name: 'Spanish' },
            { code: 'fr-FR', name: 'French' },
            { code: 'de-DE', name: 'German' },
            { code: 'it-IT', name: 'Italian' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'ru-RU', name: 'Russian' },
            { code: 'ja-JP', name: 'Japanese' },
            { code: 'ko-KR', name: 'Korean' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' }
        ];
    }
}

// Export for both module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedSpeechRecognition;
} else {
    window.SharedSpeechRecognition = SharedSpeechRecognition;
}