// Speech Recognition API implementation
class SpeechTranscriber {
    constructor() {
        // Enhanced constructor with persistent suggestions
        this.recognition = null;
        this.isListening = false;
        
        // Pause detection and LLM integration
        this.pauseTimer = null;
        this.pauseDelay = 1000; // 1 second configurable pause
        this.isProcessingLLM = false;
        this.lastInterimText = '';
        
        // Persistent suggestion state
        this.lastValidSuggestions = null; // Store last valid suggestions
        this.lastSuggestionContext = ''; // Context that generated the suggestions
        this.autoHideTimer = null; // Timer for auto-hiding suggestions
        
        // Latency tracking
        this.apiCallStartTime = null;
        this.lastApiLatency = null;
        this.latencyHistory = [];
        this.maxLatencyHistory = 10; // Keep last 10 latencies for average
        
        // Prefetch cache system
        this.suggestionCache = new Map(); // Map<text, {suggestions, source, timestamp, latency}>
        this.activePrefetchCalls = new Map(); // Map<text, Promise> to track ongoing calls
        this.cacheMaxAge = 10000; // 10 seconds cache validity
        this.maxCacheSize = 20; // Maximum cached entries
        this.prefetchDebounceTimer = null;
        this.prefetchDebounceDelay = 200; // 200ms debounce for prefetch calls
        
        // Dynamic LLM configuration - no hardcoded credentials
        this.llmConfig = {
            endpoint: '',
            apiKey: '',
            modelName: '',
            deploymentName: '',
            apiVersion: '2024-12-01-preview',
            isConfigured: false,
            isConnected: false
        };
        
        // DOM elements
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.statusText = document.getElementById('statusText');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.livePreview = document.getElementById('livePreview');
        this.searchBtn = document.getElementById('searchBtn');
        this.supportInfo = document.getElementById('supportInfo');
        this.suggestionsContainer = null; // Will be created dynamically
        
        // LLM Configuration UI elements
        this.llmConfigPanel = document.getElementById('llmConfigPanel');
        this.openLLMConfigBtn = document.getElementById('openLLMConfigBtn');
        this.closeLLMConfigBtn = document.getElementById('closeConfigBtn');
        this.testConnectionBtn = document.getElementById('testConnectionBtn');
        this.saveLLMConfigBtn = document.getElementById('saveLLMConfigBtn');
        this.llmStatus = document.getElementById('llmStatus');
        this.connectionStatus = document.getElementById('connectionStatus');
        
        this.init();
    }
    
    init() {
        this.checkBrowserSupport();
        this.setupEventListeners();
        this.setupSpeechRecognition();
        this.createSuggestionsUI();
        this.loadLLMConfig(); // Load LLM config after everything is set up
    }
    
    checkBrowserSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.supportInfo.textContent = '✅ Your browser supports speech recognition!';
            this.supportInfo.classList.add('support-yes');
        } else {
            this.supportInfo.textContent = '❌ Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.';
            this.supportInfo.classList.add('support-no');
            this.startBtn.disabled = true;
            this.statusText.textContent = 'Speech recognition not supported';
        }
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.clearBtn.addEventListener('click', () => this.clearTranscription());
        
        // Search functionality
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        // Keyboard support for search
        this.livePreview.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.performSearch();
            }
        });
        
        // Make live preview focusable for keyboard events
        this.livePreview.setAttribute('tabindex', '0');
        
        // LLM Configuration event listeners
        if (this.openLLMConfigBtn) {
            this.openLLMConfigBtn.addEventListener('click', () => {
                this.openLLMConfigPanel();
            });
        } else {
            console.error('openLLMConfigBtn not found!');
        }
        
        if (this.closeLLMConfigBtn) {
            this.closeLLMConfigBtn.addEventListener('click', () => this.closeLLMConfigPanel());
        }
        if (this.testConnectionBtn) {
            this.testConnectionBtn.addEventListener('click', () => this.testLLMConnection());
        }
        if (this.saveLLMConfigBtn) {
            this.saveLLMConfigBtn.addEventListener('click', () => this.saveLLMConfiguration());
        }
        
        // Settings event listeners
        const pauseDelaySlider = document.getElementById('pauseDelaySlider');
        const pauseDelayValue = document.getElementById('pauseDelayValue');
        
        if (pauseDelaySlider && pauseDelayValue) {
            pauseDelaySlider.addEventListener('input', (e) => {
                this.pauseDelay = parseInt(e.target.value);
                pauseDelayValue.textContent = (this.pauseDelay / 1000).toFixed(1) + 's';
            });
        }
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            return;
        }
        
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        // Event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();
    }
    
    startRecording() {
        if (!this.recognition) {
            this.showError('Speech recognition not available');
            return;
        }
        
        try {
            this.recognition.start();
            this.isListening = true;
            this.updateUI('listening');
        } catch (error) {
            this.showError('Failed to start recording: ' + error.message);
        }
    }
    
    stopRecording() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateUI('stopping');
        }
    }
    
    onRecognitionStart() {
        this.statusText.textContent = '🎤 Listening... Speak now!';
        this.statusIndicator.classList.add('listening');
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        document.body.classList.add('recording');
    }
    
    onRecognitionResult(event) {
        let fullText = '';
        
        // Build complete text from all results
        for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                fullText += ' ';
            }
        }
        
        this.updateLivePreview(fullText);
        
        // Trigger prefetch for partial transcripts
        this.triggerPrefetch(fullText);
        
        // Still handle pause detection for instant display
        this.handlePauseDetection(fullText);
    }
    
    onRecognitionError(event) {
        let errorMessage = 'Recognition error: ';
        
        switch (event.error) {
            case 'no-speech':
                errorMessage += 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage += 'Microphone not accessible. Please check permissions.';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone permission denied. Please allow microphone access.';
                break;
            case 'network':
                errorMessage += 'Network error. Please check your connection.';
                break;
            case 'language-not-supported':
                errorMessage += 'Language not supported.';
                break;
            default:
                errorMessage += event.error;
                break;
        }
        
        this.showError(errorMessage);
        this.updateUI('error');
    }
    
    onRecognitionEnd() {
        this.isListening = false;
        this.updateUI('stopped');
        document.body.classList.remove('recording');
        
        // Remove speaking animation from live preview
        this.livePreview.classList.remove('speaking');
        
        // DON'T hide suggestions when recording ends - keep them persistent
        // this.hideSuggestions(); // REMOVED: Let suggestions persist
        
        // Clear pause timer and prefetch timer
        if (this.pauseTimer) {
            clearTimeout(this.pauseTimer);
            this.pauseTimer = null;
        }
        
        if (this.prefetchDebounceTimer) {
            clearTimeout(this.prefetchDebounceTimer);
            this.prefetchDebounceTimer = null;
        }
        
        // Clear auto-hide timer but keep suggestions visible
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
        
        // Clean up cache when session ends
        this.cleanupCache();
    }
    
    updateUI(state) {
        switch (state) {
            case 'listening':
                this.statusText.textContent = '🎤 Listening... Speak now!';
                this.statusIndicator.classList.remove('error');
                this.statusIndicator.classList.add('listening');
                this.startBtn.disabled = true;
                this.stopBtn.disabled = false;
                break;
                
            case 'stopping':
                this.statusText.textContent = '⏹️ Stopping...';
                this.statusIndicator.classList.remove('listening', 'error');
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
                break;
                
            case 'stopped':
                this.statusText.textContent = '✅ Recording stopped. Ready to start again.';
                this.statusIndicator.classList.remove('listening', 'error');
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
                break;
                
            case 'error':
                this.statusIndicator.classList.remove('listening');
                this.statusIndicator.classList.add('error');
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
                break;
        }
    }
    
    updateTranscriptionOutput() {
        // This method is no longer needed - keeping for compatibility
    }
    
    updateInterimResults(interimText) {
        // This method is no longer needed - keeping for compatibility
    }
    
    updateLivePreview(text) {
        if (text.trim()) {
            this.livePreview.textContent = text;
            this.livePreview.classList.add('speaking');
        } else {
            this.livePreview.innerHTML = '<p class="placeholder">Start speaking and your words will appear here in real-time...</p>';
            this.livePreview.classList.remove('speaking');
        }
    }
    
    clearTranscription() {
        this.livePreview.innerHTML = '<p class="placeholder">Start speaking and your words will appear here in real-time...</p>';
        this.livePreview.classList.remove('speaking');
        this.statusText.textContent = 'Live preview cleared. Ready to start recording.';
        this.statusIndicator.classList.remove('listening', 'error');
        
        // Hide suggestions and clear timers
        this.hideSuggestions();
        if (this.pauseTimer) {
            clearTimeout(this.pauseTimer);
            this.pauseTimer = null;
        }
        
        if (this.prefetchDebounceTimer) {
            clearTimeout(this.prefetchDebounceTimer);
            this.prefetchDebounceTimer = null;
        }
        
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
        
        // Clear persistent suggestions state
        this.lastValidSuggestions = null;
        this.lastSuggestionContext = '';
        
        // Clear cache when manually clearing
        this.suggestionCache.clear();
        this.activePrefetchCalls.clear();
    }
    
    performSearch() {
        // Get the current text from the live preview
        const searchText = this.extractTextFromPreview();
        
        if (!searchText || searchText.trim().length === 0) {
            this.statusText.textContent = '⚠️ No text to search for. Please speak something first.';
            return;
        }
        
        // Clear suggestions when performing search
        this.hideSuggestions();
        this.lastValidSuggestions = null;
        this.lastSuggestionContext = '';
        
        // Open Bing Copilot search for AI answers in new tab
        const searchQuery = encodeURIComponent(searchText.trim());
        const bingCopilotUrl = `https://www.bing.com/copilotsearch?q=${searchQuery}&FORM=CSSCOP`;
        
        // Update status
        this.statusText.textContent = `🤖 AI Search for: "${searchText.trim()}"`;
        
        // Open in new tab
        window.open(bingCopilotUrl, '_blank');
        
        console.log(`AI Search executed: "${searchText.trim()}" -> ${bingCopilotUrl}`);
    }
    
    extractTextFromPreview() {
        // Get text content, excluding the placeholder
        const previewElement = this.livePreview;
        const placeholder = previewElement.querySelector('.placeholder');
        
        if (placeholder && placeholder.style.display !== 'none' && !placeholder.hidden) {
            return ''; // Placeholder is visible, no real text
        }
        
        // Clone the element to avoid modifying the original
        const clone = previewElement.cloneNode(true);
        const placeholderInClone = clone.querySelector('.placeholder');
        if (placeholderInClone) {
            placeholderInClone.remove();
        }
        
        return clone.textContent || clone.innerText || '';
    }
    
    showError(message) {
        this.statusText.textContent = '❌ ' + message;
        console.error('Speech Recognition Error:', message);
        
        // Auto-clear error message after 5 seconds
        setTimeout(() => {
            if (this.statusText.textContent.includes('❌')) {
                this.statusText.textContent = 'Ready to start transcription';
                this.statusIndicator.classList.remove('error');
            }
        }, 5000);
    }
    
    // === LLM INTEGRATION METHODS ===
    
    createSuggestionsUI() {
        // Create suggestions container at the bottom of main
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'suggestions-container';
        this.suggestionsContainer.innerHTML = `
            <div class="suggestions-header">
                <h4>💡 Suggestions <span id="suggestionsSource" class="suggestions-source"></span></h4>
                <div id="latencyDisplay" class="latency-display"></div>
            </div>
            <div id="suggestionsChips" class="suggestions-chips"></div>
        `;
        
        const main = document.querySelector('main');
        main.appendChild(this.suggestionsContainer);
        
        this.suggestionsChips = document.getElementById('suggestionsChips');
        this.suggestionsSource = document.getElementById('suggestionsSource');
        this.latencyDisplay = document.getElementById('latencyDisplay');
    }
    
    handlePauseDetection(currentText) {
        // Clear existing timer
        if (this.pauseTimer) {
            clearTimeout(this.pauseTimer);
        }
        
        // Only trigger if we have some text and it's different from last time
        if (currentText.trim() && currentText !== this.lastInterimText) {
            this.lastInterimText = currentText;
            
            // Set new timer for pause detection - now this will show cached suggestions instantly
            this.pauseTimer = setTimeout(() => {
                this.showCachedSuggestions(currentText);
            }, this.pauseDelay);
        }
    }
    
    triggerPrefetch(currentText) {
        if (!currentText.trim() || currentText.length < 3) {
            return; // Don't prefetch for very short text
        }
        
        // Clear existing debounce timer
        if (this.prefetchDebounceTimer) {
            clearTimeout(this.prefetchDebounceTimer);
        }
        
        // Debounce prefetch calls to avoid overwhelming the API
        this.prefetchDebounceTimer = setTimeout(() => {
            this.prefetchSuggestions(currentText);
        }, this.prefetchDebounceDelay);
    }
    
    async triggerLLMSuggestions(incompleteText) {
        if (this.isProcessingLLM || !incompleteText.trim()) {
            return;
        }
        
        // Check if user has spoken at least 3 words before triggering LLM
        const wordCount = incompleteText.trim().split(/\s+/).length;
        if (wordCount < 3) {
            console.log(`Only ${wordCount} word(s) spoken, need at least 3 for LLM suggestions`);
            return;
        }
        
        this.isProcessingLLM = true;
        this.apiCallStartTime = performance.now();
        this.showLoadingSuggestions();
        
        try {
            const suggestions = await this.callLLMAPI(incompleteText);
            this.lastApiLatency = performance.now() - this.apiCallStartTime;
            this.updateLatencyHistory(this.lastApiLatency);
            this.displaySuggestions(suggestions, 'llm');
        } catch (error) {
            console.error('LLM API Error:', error);
            this.lastApiLatency = performance.now() - this.apiCallStartTime;
            this.updateLatencyHistory(this.lastApiLatency);
            const fallbackSuggestions = this.getFallbackSuggestions(incompleteText);
            this.displaySuggestions(fallbackSuggestions, 'fallback');
        } finally {
            this.isProcessingLLM = false;
        }
    }
    
    // Enhanced LLM prompt strategy: "Thinking Buddy" approach
    // Transforms from completion-based to curiosity-driven suggestions
    // Focus: Fast, intelligent, casual questions that encourage depth
    async callLLMAPI(incompleteText) {
        if (!this.llmConfig.isConfigured) {
            throw new Error('LLM not configured. Please configure your LLM settings.');
        }

        const url = `${this.llmConfig.endpoint}openai/deployments/${this.llmConfig.deploymentName}/chat/completions?api-version=${this.llmConfig.apiVersion}`;
        
        const prompt = `The user just said: "${incompleteText}" and paused. What 3 casual, friendly questions would help them think of more details to add? Think like their inner voice encouraging them to elaborate naturally.`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.llmConfig.apiKey
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You're like a thoughtful friend helping someone think through what they're saying. When they pause, suggest 3 casual, conversational questions that would naturally help them add more interesting details. Keep questions short (2-5 words), friendly, and focused on going deeper into what they mentioned. Use casual language like 'what kind?', 'with who?', 'how come?', 'when exactly?'. Format as three separate questions, each ending with '?'. Example format: what kind?, with who?, when exactly?"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 50,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Enhanced parsing for question-based suggestions
        // Handle both comma-separated and question mark separated formats
        let suggestions;
        if (content.includes('?')) {
            // Split by question marks and clean up
            suggestions = content.split('?')
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .map(s => s + '?') // Re-add question marks
                .slice(0, 3);
        } else {
            // Fallback to comma separation
            suggestions = content.split(',').map(s => s.trim()).slice(0, 3);
        }
        
        return suggestions;
    }
    
    getFallbackSuggestions(incompleteText) {
        // Simple fallback suggestions based on common patterns
        const fallbacks = [
            ['and then', 'because', 'however'],
            ['specifically', 'for example', 'in particular'],
            ['therefore', 'meanwhile', 'additionally'],
            ['such as', 'including', 'like'],
            ['in order to', 'so that', 'which means']
        ];
        
        // Return a random set of fallback suggestions
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
    
    showLoadingSuggestions() {
        this.suggestionsChips.innerHTML = `
            <div class="suggestion-chip loading">
                <span class="loading-dots">●●●</span> Loading suggestions...
            </div>
        `;
        this.suggestionsSource.textContent = '';
        this.latencyDisplay.textContent = '⏱️ Processing...';
        this.latencyDisplay.className = 'latency-display loading-latency';
        this.suggestionsContainer.style.display = 'block';
    }
    
    displaySuggestions(suggestions, source, latency = null, isFromCache = false) {
        if (!suggestions || suggestions.length === 0) {
            // Don't hide immediately, try to show last valid suggestions
            this.showLastValidSuggestions();
            return;
        }
        
        // Store as last valid suggestions for persistence
        this.lastValidSuggestions = {
            suggestions: [...suggestions],
            source: source,
            latency: latency,
            isFromCache: isFromCache,
            context: this.livePreview.textContent || ''
        };
        
        this.suggestionsChips.innerHTML = '';
        
        suggestions.forEach((suggestion, index) => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.onclick = () => this.applySuggestion(suggestion);
            
            // Add keyboard shortcut hint for first 3 suggestions
            if (index < 3) {
                chip.title = `Click or press ${index + 1} to apply`;
            }
            
            this.suggestionsChips.appendChild(chip);
        });
        
        // Update source indicator and latency
        if (source === 'llm') {
            this.suggestionsSource.textContent = isFromCache ? '(AI Cached)' : '(AI Powered)';
            this.suggestionsSource.className = isFromCache ? 'suggestions-source llm-cached-source' : 'suggestions-source llm-source';
            
            if (latency !== null) {
                const avgLatency = this.getAverageLatency();
                let latencyText = isFromCache ? `⚡ Instant` : `⚡ ${latency.toFixed(0)}ms`;
                if (avgLatency && this.latencyHistory.length > 1 && !isFromCache) {
                    latencyText += ` (avg: ${avgLatency.toFixed(0)}ms)`;
                }
                this.latencyDisplay.textContent = latencyText;
                this.latencyDisplay.className = isFromCache ? 'latency-display cached-latency' : 'latency-display llm-latency';
            }
        } else {
            this.suggestionsSource.textContent = '(Fallback)';
            this.suggestionsSource.className = 'suggestions-source fallback-source';
            
            if (latency !== null) {
                this.latencyDisplay.textContent = `⚠️ Failed (${latency.toFixed(0)}ms)`;
                this.latencyDisplay.className = 'latency-display fallback-latency';
            } else {
                this.latencyDisplay.textContent = `⚡ <1ms`;
                this.latencyDisplay.className = 'latency-display fallback-latency';
            }
        }
        
        this.suggestionsContainer.style.display = 'block';
        
        // Clear any existing auto-hide timer
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }
        
        // Extended auto-hide timer - 20 seconds for better persistence
        this.autoHideTimer = setTimeout(() => {
            this.hideSuggestions();
        }, 20000);
    }
    
    // New method to show last valid suggestions when current ones fail
    showLastValidSuggestions() {
        if (this.lastValidSuggestions && this.lastValidSuggestions.suggestions.length > 0) {
            const { suggestions, source, latency, isFromCache } = this.lastValidSuggestions;
            
            this.suggestionsChips.innerHTML = '';
            
            suggestions.forEach((suggestion, index) => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip persistent';
                chip.textContent = suggestion;
                chip.onclick = () => this.applySuggestion(suggestion);
                
                if (index < 3) {
                    chip.title = `Click or press ${index + 1} to apply`;
                }
                
                this.suggestionsChips.appendChild(chip);
            });
            
            // Update indicators to show these are persistent suggestions
            this.suggestionsSource.textContent = '(Previous Suggestions)';
            this.suggestionsSource.className = 'suggestions-source persistent-source';
            
            if (this.latencyDisplay) {
                this.latencyDisplay.textContent = '💾 Persistent';
                this.latencyDisplay.className = 'latency-display persistent-latency';
            }
            
            this.suggestionsContainer.style.display = 'block';
        }
    }
    
    applySuggestion(suggestion) {
        // Get current text and add the suggestion
        const currentText = this.livePreview.textContent || '';
        const newText = currentText.replace(/Start speaking.*$/, '').trim() + ' ' + suggestion + ' ';
        
        this.updateLivePreview(newText);
        this.hideSuggestions();
        
        // Update the last interim text to prevent immediate re-triggering
        this.lastInterimText = newText;
    }
    
    hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.style.display = 'none';
        }
    }
    
    updateLatencyHistory(latency) {
        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > this.maxLatencyHistory) {
            this.latencyHistory.shift(); // Remove oldest entry
        }
    }
    
    getAverageLatency() {
        if (this.latencyHistory.length === 0) return null;
        const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
        return sum / this.latencyHistory.length;
    }
    
    // === PREFETCH CACHE METHODS ===
    
    async prefetchSuggestions(text) {
        const cacheKey = text.trim().toLowerCase();
        
        // Check if we have enough words for meaningful suggestions
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount < 3) {
            return; // Not enough words for quality suggestions
        }
        
        // Check if we already have a fresh cached result
        if (this.isCacheValid(cacheKey)) {
            return; // Already have fresh suggestions
        }
        
        // Check if we already have an ongoing call for this text
        if (this.activePrefetchCalls.has(cacheKey)) {
            return; // Already fetching
        }
        
        // Start prefetch call
        const prefetchPromise = this.performPrefetch(text, cacheKey);
        this.activePrefetchCalls.set(cacheKey, prefetchPromise);
        
        try {
            await prefetchPromise;
        } catch (error) {
            console.error('Prefetch error:', error);
        } finally {
            this.activePrefetchCalls.delete(cacheKey);
        }
    }
    
    async performPrefetch(text, cacheKey) {
        const startTime = performance.now();
        
        try {
            const suggestions = await this.callLLMAPI(text);
            const latency = performance.now() - startTime;
            
            // Cache the successful result
            this.cacheResult(cacheKey, {
                suggestions,
                source: 'llm',
                timestamp: Date.now(),
                latency
            });
            
            // If this is the most recent text and suggestions are currently showing, update them
            this.maybeUpdateDisplayedSuggestions(text, suggestions, 'llm', latency);
            
        } catch (error) {
            const latency = performance.now() - startTime;
            
            // Cache fallback suggestions
            const fallbackSuggestions = this.getFallbackSuggestions(text);
            this.cacheResult(cacheKey, {
                suggestions: fallbackSuggestions,
                source: 'fallback',
                timestamp: Date.now(),
                latency
            });
            
            this.maybeUpdateDisplayedSuggestions(text, fallbackSuggestions, 'fallback', latency);
        }
    }
    
    showCachedSuggestions(text) {
        const cacheKey = text.trim().toLowerCase();
        const cached = this.suggestionCache.get(cacheKey);
        
        if (cached && this.isCacheValid(cacheKey)) {
            // Show cached suggestions instantly
            this.displaySuggestions(cached.suggestions, cached.source, cached.latency, true);
        } else {
            // Check if we have enough words for meaningful suggestions
            const wordCount = text.trim().split(/\s+/).length;
            if (wordCount >= 3) {
                // No cache available but we have meaningful text
                // Show last valid suggestions if available, otherwise trigger new LLM call
                if (this.lastValidSuggestions && this.lastValidSuggestions.suggestions.length > 0) {
                    this.showLastValidSuggestions();
                } else {
                    this.triggerLLMSuggestions(text);
                }
            }
            // If less than 3 words, do nothing - no suggestions shown
        }
    }
    
    maybeUpdateDisplayedSuggestions(text, suggestions, source, latency) {
        // Only update if suggestions are currently visible and this matches the current text
        if (this.suggestionsContainer && 
            this.suggestionsContainer.style.display === 'block' &&
            text.trim().toLowerCase() === this.lastInterimText.trim().toLowerCase()) {
            
            // Quietly update the displayed suggestions
            this.displaySuggestions(suggestions, source, latency, false);
        }
    }
    
    cacheResult(cacheKey, result) {
        this.suggestionCache.set(cacheKey, result);
        this.cleanupCache();
    }
    
    isCacheValid(cacheKey) {
        const cached = this.suggestionCache.get(cacheKey);
        if (!cached) return false;
        
        const age = Date.now() - cached.timestamp;
        return age < this.cacheMaxAge;
    }
    
    cleanupCache() {
        // Remove old entries
        const now = Date.now();
        for (const [key, value] of this.suggestionCache.entries()) {
            if (now - value.timestamp > this.cacheMaxAge) {
                this.suggestionCache.delete(key);
            }
        }
        
        // Limit cache size
        if (this.suggestionCache.size > this.maxCacheSize) {
            const entries = Array.from(this.suggestionCache.entries());
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp); // Sort by timestamp, newest first
            
            // Keep only the newest entries
            this.suggestionCache.clear();
            for (let i = 0; i < this.maxCacheSize; i++) {
                this.suggestionCache.set(entries[i][0], entries[i][1]);
            }
        }
    }
    
    // === LLM CONFIGURATION METHODS ===
    
    loadLLMConfig() {
        const saved = localStorage.getItem('llmConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.llmConfig = { ...this.llmConfig, ...config };
                this.updateLLMStatus();
            } catch (error) {
                console.warn('Failed to load LLM config:', error);
            }
        }
        this.updateLLMStatus();
    }
    
    saveLLMConfiguration() {
        const endpoint = document.getElementById('llmEndpoint').value.trim();
        const apiKey = document.getElementById('llmApiKey').value.trim();
        const modelName = document.getElementById('llmModel').value.trim();
        const deploymentName = document.getElementById('llmDeployment').value.trim();
        
        if (!endpoint || !apiKey || !modelName || !deploymentName) {
            this.showConnectionStatus('Please fill in all fields', 'error');
            return;
        }
        
        this.llmConfig.endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
        this.llmConfig.apiKey = apiKey;
        this.llmConfig.modelName = modelName;
        this.llmConfig.deploymentName = deploymentName;
        this.llmConfig.isConfigured = true;
        
        // Save to localStorage (without sensitive data in production)
        const configToSave = {
            endpoint: this.llmConfig.endpoint,
            modelName: this.llmConfig.modelName,
            deploymentName: this.llmConfig.deploymentName,
            isConfigured: true
        };
        
        localStorage.setItem('llmConfig', JSON.stringify(configToSave));
        
        this.showConnectionStatus('Configuration saved successfully!', 'success');
        this.updateLLMStatus();
        
        setTimeout(() => {
            this.closeLLMConfigPanel();
        }, 1500);
    }
    
    async testLLMConnection() {
        const endpoint = document.getElementById('llmEndpoint').value.trim();
        const apiKey = document.getElementById('llmApiKey').value.trim();
        const modelName = document.getElementById('llmModel').value.trim();
        const deploymentName = document.getElementById('llmDeployment').value.trim();
        
        if (!endpoint || !apiKey || !modelName || !deploymentName) {
            this.showConnectionStatus('Please fill in all fields', 'error');
            return;
        }
        
        this.showConnectionStatus('Testing connection...', 'testing');
        
        try {
            const testEndpoint = (endpoint.endsWith('/') ? endpoint : endpoint + '/') + 
                                 `openai/deployments/${deploymentName}/chat/completions?api-version=${this.llmConfig.apiVersion}`;
            
            const response = await fetch(testEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content: "Hello, this is a connection test."
                        }
                    ],
                    max_tokens: 5,
                    temperature: 0.1
                })
            });
            
            if (response.ok) {
                this.showConnectionStatus('✅ Connection successful!', 'success');
                this.llmConfig.isConnected = true;
            } else {
                const errorText = await response.text();
                this.showConnectionStatus(`❌ Connection failed: ${response.status} ${response.statusText}`, 'error');
                this.llmConfig.isConnected = false;
            }
        } catch (error) {
            this.showConnectionStatus(`❌ Connection error: ${error.message}`, 'error');
            this.llmConfig.isConnected = false;
        }
    }
    
    openLLMConfigPanel() {
        // Populate fields with current config
        document.getElementById('llmEndpoint').value = this.llmConfig.endpoint || '';
        document.getElementById('llmApiKey').value = this.llmConfig.apiKey || '';
        document.getElementById('llmModel').value = this.llmConfig.modelName || '';
        document.getElementById('llmDeployment').value = this.llmConfig.deploymentName || '';
        
        if (this.llmConfigPanel) {
            this.llmConfigPanel.style.display = 'block';
        } else {
            console.error('llmConfigPanel not found!');
        }
        
        if (this.connectionStatus) {
            this.connectionStatus.style.display = 'none';
        }
    }
    
    closeLLMConfigPanel() {
        this.llmConfigPanel.style.display = 'none';
    }
    
    showConnectionStatus(message, type) {
        this.connectionStatus.textContent = message;
        this.connectionStatus.className = `connection-status ${type}`;
        this.connectionStatus.style.display = 'block';
    }
    
    updateLLMStatus() {
        if (this.llmConfig.isConfigured && this.llmConfig.endpoint && this.llmConfig.apiKey) {
            this.llmStatus.textContent = 'Configured';
            this.llmStatus.className = 'llm-status configured';
        } else {
            this.llmStatus.textContent = 'Not Configured';
            this.llmStatus.className = 'llm-status not-configured';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const transcriber = new SpeechTranscriber();
    window.speechTranscriber = transcriber;
    
    // Add keyboard shortcuts for suggestions
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '3') {
            const suggestionIndex = parseInt(e.key) - 1;
            const chips = document.querySelectorAll('.suggestion-chip:not(.loading)');
            if (chips[suggestionIndex]) {
                chips[suggestionIndex].click();
            }
        }
    });
});

// Handle page visibility changes to stop recording when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.speechTranscriber && window.speechTranscriber.isListening) {
        window.speechTranscriber.stopRecording();
    }
});

// Make SpeechTranscriber globally accessible for debugging
window.SpeechTranscriber = SpeechTranscriber;