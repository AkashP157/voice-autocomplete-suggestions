// Mobile Version JavaScript - Adapted from core script.js
class MobileSpeechTranscriber {
    constructor() {
        // Core functionality from original script
        this.recognition = null;
        this.isListening = false;
        
        // Pause detection and LLM integration
        this.pauseTimer = null;
        this.pauseDelay = 1000; // 1 second configurable pause
        this.isProcessingLLM = false;
        this.lastInterimText = '';
        
        // Persistent transcript across pauses
        this.persistentTranscript = ''; // Accumulates text across sessions
        this.currentSessionTranscript = ''; // Current recognition session text
        
        // Persistent suggestion state
        this.lastValidSuggestions = null;
        this.lastSuggestionContext = '';
        this.autoHideTimer = null;
        
        // Latency tracking (console only)
        this.apiCallStartTime = null;
        this.lastApiLatency = null;
        this.latencyHistory = [];
        this.maxLatencyHistory = 10;
        
        // Prefetch cache system
        this.suggestionCache = new Map();
        this.activePrefetchCalls = new Map();
        this.cacheMaxAge = 10000; // 10 seconds cache validity
        this.maxCacheSize = 20;
        this.prefetchDebounceTimer = null;
        this.prefetchDebounceDelay = 200;
        
        // Dynamic LLM configuration
        this.llmConfig = {
            endpoint: '',
            apiKey: '',
            modelName: '',
            deploymentName: '',
            apiVersion: '2024-12-01-preview',
            isConfigured: false,
            isConnected: false
        };
        
        // Mobile DOM elements
        this.recordBtn = document.getElementById('recordBtn');
        this.recordIcon = document.getElementById('recordIcon');
        this.clearBtn = document.getElementById('clearBtn');
        this.searchBtn = document.getElementById('searchBtn');
        this.liveText = document.getElementById('liveText');
        this.suggestionsContainer = document.getElementById('suggestionsContainer');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeBtn = document.getElementById('closeBtn');
        
        // Mobile Config Modal elements
        this.mobileConfigPanel = document.getElementById('mobileConfigPanel');
        this.closeMobileConfigBtn = document.getElementById('closeMobileConfigBtn');
        this.mobileTestBtn = document.getElementById('mobileTestBtn');
        this.mobileSaveBtn = document.getElementById('mobileSaveBtn');
        this.mobileConnectionStatus = document.getElementById('mobileConnectionStatus');
        
        this.init();
    }
    
    init() {
        this.checkBrowserSupport();
        this.setupEventListeners();
        this.setupSpeechRecognition();
        this.loadLLMConfig();
        console.log('🎤 Mobile Voice Suggestions v2.0 initialized');
    }
    
    checkBrowserSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.showError('Speech recognition not supported in this browser');
            return false;
        }
        
        console.log('✅ Speech recognition supported');
        return true;
    }
    
    setupEventListeners() {
        // Control buttons
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.clearBtn.addEventListener('click', () => this.clearText());
        this.searchBtn.addEventListener('click', () => this.performSearch());
        
        // Settings and navigation
        this.settingsBtn.addEventListener('click', () => this.openMobileConfigPanel());
        this.closeBtn.addEventListener('click', () => this.goToDesktopVersion());
        
        // Config modal
        this.closeMobileConfigBtn.addEventListener('click', () => this.closeMobileConfigPanel());
        this.mobileTestBtn.addEventListener('click', () => this.testMobileLLMConnection());
        this.mobileSaveBtn.addEventListener('click', () => this.saveMobileLLMConfiguration());
        
        // Keyboard shortcuts (mobile-friendly)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.toggleRecording();
            } else if (e.key === 'Enter' && !e.repeat) {
                e.preventDefault();
                this.performSearch();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && e.ctrlKey) {
                e.preventDefault();
                this.clearText();
            }
        });
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
        this.recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            this.currentSessionTranscript = ''; // Reset current session
            this.updateRecordingState(true);
        };
        
        this.recognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateRecordingState(false);
            this.showError(`Speech recognition error: ${event.error}`);
        };
        
        this.recognition.onend = () => {
            console.log('🛑 Speech recognition ended');
            
            // Move current session transcript to persistent transcript
            if (this.currentSessionTranscript.trim()) {
                this.persistentTranscript = (this.persistentTranscript + ' ' + this.currentSessionTranscript).trim();
                console.log('💾 Session saved to persistent transcript:', this.persistentTranscript);
            }
            
            this.updateRecordingState(false);
        };
    }
    
    toggleRecording() {
        if (this.isListening) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        if (!this.recognition) {
            this.showError('Speech recognition not available');
            return;
        }
        
        try {
            this.recognition.start();
            this.isListening = true;
            console.log('▶️ Recording started');
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.showError('Failed to start recording');
        }
    }
    
    stopRecording() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            console.log('⏹️ Recording stopped');
        }
    }
    
    updateRecordingState(isRecording) {
        this.isListening = isRecording;
        
        if (isRecording) {
            this.recordBtn.classList.add('recording');
            this.recordIcon.textContent = '⏹️'; // Stop icon
            this.liveText.classList.add('recording');
        } else {
            this.recordBtn.classList.remove('recording');
            this.recordIcon.textContent = '🎤'; // Microphone icon
            this.liveText.classList.remove('recording');
        }
    }
    
    clearText() {
        // Clear the text display
        this.liveText.innerHTML = '<p class="placeholder">Tap the microphone to start speaking...</p>';
        this.liveText.classList.remove('recording');
        
        // Clear all transcript data
        this.persistentTranscript = '';
        this.currentSessionTranscript = '';
        this.lastInterimText = '';
        
        // Hide all suggestions
        this.hideSuggestions();
        
        // Clear timers
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
        
        console.log('🧹 All text and suggestions cleared');
    }
    
    performSearch() {
        // Get the current text from the live text display
        const searchText = this.extractTextFromDisplay();
        
        if (!searchText || searchText.trim().length === 0) {
            console.log('⚠️ No text to search for');
            return;
        }
        
        // Clear suggestions when performing search
        this.hideSuggestions();
        this.lastValidSuggestions = null;
        this.lastSuggestionContext = '';
        
        // Open Bing search in new tab
        const searchQuery = encodeURIComponent(searchText.trim());
        const bingUrl = `https://www.bing.com/search?q=${searchQuery}`;
        
        console.log(`🔍 Searching for: "${searchText.trim()}" -> ${bingUrl}`);
        
        // Open in new tab
        window.open(bingUrl, '_blank');
        
        // Clear the text after search (optional - you can remove this if you want to keep text)
        this.persistentTranscript = '';
        this.currentSessionTranscript = '';
        this.liveText.innerHTML = '<p class="placeholder">Search completed. Tap microphone to start again...</p>';
        
        console.log('🧹 Text cleared after search');
    }
    
    extractTextFromDisplay() {
        // Return the combined persistent and current session transcript
        const fullText = (this.persistentTranscript + ' ' + this.currentSessionTranscript).trim();
        
        if (fullText) {
            return fullText;
        }
        
        // Fallback to extracting from DOM if transcripts are empty
        const textElement = this.liveText;
        const placeholder = textElement.querySelector('.placeholder');
        
        if (placeholder && !placeholder.hidden) {
            return ''; // Placeholder is visible, no real text
        }
        
        // Clone the element to avoid modifying the original
        const clone = textElement.cloneNode(true);
        const placeholderInClone = clone.querySelector('.placeholder');
        if (placeholderInClone) {
            placeholderInClone.remove();
        }
        
        return clone.textContent || clone.innerText || '';
    }
    
    hideSuggestions() {
        const pills = this.suggestionsContainer.querySelectorAll('.suggestion-pill');
        pills.forEach(pill => {
            pill.classList.remove('visible');
            pill.querySelector('span').textContent = pill.id.replace('suggestion', 'Suggestion ');
        });
    }
    
    handleSpeechResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Process all results from the current recognition session
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update current session transcript with final results
        if (finalTranscript) {
            this.currentSessionTranscript += finalTranscript;
            console.log('📝 Final transcript added:', finalTranscript);
        }
        
        // Combine persistent transcript with current session and interim text
        const fullText = (this.persistentTranscript + ' ' + this.currentSessionTranscript + ' ' + interimTranscript).trim();
        
        // Update display with full accumulated text
        this.updateTextDisplay(fullText);
        
        // Handle LLM suggestions with word count validation
        const textForLLM = this.persistentTranscript + ' ' + this.currentSessionTranscript;
        if (finalTranscript && textForLLM.trim()) {
            this.lastInterimText = textForLLM.trim();
            this.triggerLLMSuggestions(textForLLM.trim());
        } else if (interimTranscript && this.wordCount(fullText) >= 3) {
            // Only prefetch if we have enough words in total
            this.debouncedPrefetch(fullText);
        }
        
        // Reset pause timer
        this.resetPauseTimer();
    }
    
    updateTextDisplay(text) {
        if (text.trim()) {
            this.liveText.innerHTML = `<p>${text}</p>`;
        } else {
            this.liveText.innerHTML = '<p class="placeholder">Tap the microphone to start speaking...</p>';
        }
    }
    
    updateLLMStatus() {
        const settingsBtn = document.querySelector('.settings-btn');
        
        // Remove existing status classes
        settingsBtn.classList.remove('llm-offline', 'llm-ready');
        
        // Add appropriate status class
        if (this.llmConfig.isConfigured) {
            settingsBtn.classList.add('llm-ready');
        } else {
            settingsBtn.classList.add('llm-offline');
        }
    }
    
    wordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    resetPauseTimer() {
        if (this.pauseTimer) {
            clearTimeout(this.pauseTimer);
        }
        
        this.pauseTimer = setTimeout(() => {
            if (this.lastInterimText && this.wordCount(this.lastInterimText) >= 3) {
                this.triggerLLMSuggestions(this.lastInterimText);
            }
        }, this.pauseDelay);
    }
    
    debouncedPrefetch(text) {
        if (this.prefetchDebounceTimer) {
            clearTimeout(this.prefetchDebounceTimer);
        }
        
        this.prefetchDebounceTimer = setTimeout(() => {
            if (this.wordCount(text) >= 3) {
                this.prefetchSuggestions(text);
            }
        }, this.prefetchDebounceDelay);
    }
    
    async triggerLLMSuggestions(text) {
        if (!text.trim() || this.wordCount(text) < 3) {
            console.log('⚠️ Skipping LLM call - insufficient words:', this.wordCount(text));
            return;
        }
        
        if (this.isProcessingLLM) {
            console.log('⚠️ LLM call already in progress, skipping');
            return;
        }
        
        console.log('🤖 Triggering LLM suggestions for:', text);
        
        // Check cache first
        if (this.suggestionCache.has(text)) {
            const cached = this.suggestionCache.get(text);
            if (Date.now() - cached.timestamp < this.cacheMaxAge) {
                console.log('📋 Using cached suggestions');
                this.displaySuggestions(cached.suggestions, 'cached');
                return;
            }
        }
        
        // Make API call
        try {
            this.isProcessingLLM = true;
            this.apiCallStartTime = Date.now();
            
            const suggestions = await this.getLLMSuggestions(text);
            
            if (suggestions && suggestions.length > 0) {
                this.displaySuggestions(suggestions, 'fresh');
                this.cacheSuggestions(text, suggestions);
            }
        } catch (error) {
            console.error('❌ LLM API error:', error);
            // Show persistent suggestions if available
            if (this.lastValidSuggestions) {
                this.displaySuggestions(this.lastValidSuggestions, 'fallback');
            }
        } finally {
            this.isProcessingLLM = false;
        }
    }
    
    async prefetchSuggestions(text) {
        if (!text.trim() || this.wordCount(text) < 3) return;
        if (this.activePrefetchCalls.has(text)) return;
        if (this.suggestionCache.has(text)) return;
        
        console.log('🔄 Prefetching suggestions for:', text);
        
        const prefetchPromise = this.getLLMSuggestions(text);
        this.activePrefetchCalls.set(text, prefetchPromise);
        
        try {
            const suggestions = await prefetchPromise;
            if (suggestions && suggestions.length > 0) {
                this.cacheSuggestions(text, suggestions);
            }
        } catch (error) {
            console.error('❌ Prefetch error:', error);
        } finally {
            this.activePrefetchCalls.delete(text);
        }
    }
    
    cacheSuggestions(text, suggestions) {
        const latency = this.apiCallStartTime ? Date.now() - this.apiCallStartTime : 0;
        
        this.suggestionCache.set(text, {
            suggestions,
            timestamp: Date.now(),
            latency
        });
        
        // Update latency tracking
        if (latency > 0) {
            this.latencyHistory.push(latency);
            if (this.latencyHistory.length > this.maxLatencyHistory) {
                this.latencyHistory.shift();
            }
            this.lastApiLatency = latency;
            
            const avgLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
            console.log(`⚡ API Latency: ${latency}ms (avg: ${Math.round(avgLatency)}ms)`);
        }
        
        // Cleanup old cache entries
        if (this.suggestionCache.size > this.maxCacheSize) {
            const oldestKey = this.suggestionCache.keys().next().value;
            this.suggestionCache.delete(oldestKey);
        }
    }
    
    displaySuggestions(suggestions, source = 'fresh') {
        console.log(`💡 Displaying ${source} suggestions:`, suggestions);
        
        // Store as last valid suggestions
        this.lastValidSuggestions = suggestions;
        this.lastSuggestionContext = this.lastInterimText;
        
        // Update suggestion pills
        const pills = this.suggestionsContainer.querySelectorAll('.suggestion-pill');
        
        pills.forEach((pill, index) => {
            pill.classList.remove('visible');
            
            setTimeout(() => {
                if (suggestions[index]) {
                    pill.querySelector('span').textContent = suggestions[index];
                    pill.classList.add('visible');
                } else {
                    pill.querySelector('span').textContent = `Suggestion ${index + 1}`;
                }
            }, index * 100);
        });
    }
    
    async getLLMSuggestions(text) {
        if (!this.llmConfig.isConfigured) {
            console.log('⚠️ LLM not configured');
            return null;
        }
        
        const prompt = `The user is building a voice prompt and said: "${text}"

Your job is to help them create a comprehensive, detailed prompt by suggesting what important details they should add next. Analyze what they've already mentioned and suggest 3 specific gaps or details that would make their prompt much better and more complete.

Focus on:
- What key information is missing that would improve the quality of their request
- Specific details that would help get better results (like budget, timeframe, preferences, constraints)
- Avoid repeating what they already mentioned
- Make suggestions actionable and scannable while speaking

Provide exactly 3 short suggestions (max 4-5 words each) that guide them to add valuable missing details. Format as brief questions or prompts.`;
        
        const requestBody = {
            messages: [
                { role: 'system', content: 'You are an expert at helping users build comprehensive, detailed prompts by identifying what important information is missing. Focus on practical gaps that would significantly improve their request quality.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 120,
            temperature: 0.7
        };
        
        const headers = {
            'Content-Type': 'application/json',
            'api-key': this.llmConfig.apiKey
        };
        
        const url = `${this.llmConfig.endpoint}/openai/deployments/${this.llmConfig.deploymentName}/chat/completions?api-version=${this.llmConfig.apiVersion}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
            return content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .slice(0, 3);
        }
        
        return null;
    }
    
    // Mobile Configuration Methods
    openMobileConfigPanel() {
        this.loadMobileConfigFields();
        this.mobileConfigPanel.classList.add('active');
    }
    
    closeMobileConfigPanel() {
        this.mobileConfigPanel.classList.remove('active');
    }
    
    loadMobileConfigFields() {
        document.getElementById('mobileEndpoint').value = this.llmConfig.endpoint || '';
        document.getElementById('mobileApiKey').value = this.llmConfig.apiKey || '';
        document.getElementById('mobileModel').value = this.llmConfig.modelName || '';
        document.getElementById('mobileDeployment').value = this.llmConfig.deploymentName || '';
    }
    
    async testMobileLLMConnection() {
        const endpoint = document.getElementById('mobileEndpoint').value.trim();
        const apiKey = document.getElementById('mobileApiKey').value.trim();
        const modelName = document.getElementById('mobileModel').value.trim();
        const deploymentName = document.getElementById('mobileDeployment').value.trim();
        
        if (!endpoint || !apiKey || !modelName || !deploymentName) {
            this.showMobileConnectionStatus('Please fill in all fields', 'error');
            return;
        }
        
        this.showMobileConnectionStatus('Testing connection...', 'info');
        
        try {
            const testUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${this.llmConfig.apiVersion}`;
            
            const response = await fetch(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 5
                })
            });
            
            if (response.ok) {
                this.showMobileConnectionStatus('✅ Connection successful!', 'success');
            } else {
                this.showMobileConnectionStatus(`❌ Connection failed: ${response.status}`, 'error');
            }
        } catch (error) {
            this.showMobileConnectionStatus(`❌ Connection failed: ${error.message}`, 'error');
        }
    }
    
    saveMobileLLMConfiguration() {
        const endpoint = document.getElementById('mobileEndpoint').value.trim();
        const apiKey = document.getElementById('mobileApiKey').value.trim();
        const modelName = document.getElementById('mobileModel').value.trim();
        const deploymentName = document.getElementById('mobileDeployment').value.trim();
        
        if (!endpoint || !apiKey || !modelName || !deploymentName) {
            this.showMobileConnectionStatus('Please fill in all fields', 'error');
            return;
        }
        
        this.llmConfig.endpoint = endpoint;
        this.llmConfig.apiKey = apiKey;
        this.llmConfig.modelName = modelName;
        this.llmConfig.deploymentName = deploymentName;
        this.llmConfig.isConfigured = true;
        
        // Update status indicator
        this.updateLLMStatus();
        
        // Save to localStorage (excluding sensitive data)
        const configToSave = {
            endpoint: this.llmConfig.endpoint,
            modelName: this.llmConfig.modelName,
            deploymentName: this.llmConfig.deploymentName,
            isConfigured: true
        };
        
        localStorage.setItem('mobileLLMConfig', JSON.stringify(configToSave));
        
        this.showMobileConnectionStatus('✅ Configuration saved!', 'success');
        console.log('🔧 Mobile LLM configuration saved');
        
        setTimeout(() => {
            this.closeMobileConfigPanel();
        }, 1500);
    }
    
    loadLLMConfig() {
        try {
            const saved = localStorage.getItem('mobileLLMConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.llmConfig = { ...this.llmConfig, ...config };
                console.log('📋 Mobile LLM configuration loaded');
            }
        } catch (error) {
            console.error('Error loading mobile LLM config:', error);
        }
        
        // Update status indicator after loading config
        this.updateLLMStatus();
    }
    
    showMobileConnectionStatus(message, type) {
        this.mobileConnectionStatus.textContent = message;
        this.mobileConnectionStatus.className = `mobile-connection-status ${type}`;
    }
    
    goToDesktopVersion() {
        window.location.href = 'index.html';
    }
    
    showError(message) {
        console.error('❌', message);
        // Could add a toast notification here
    }
}

// Initialize mobile app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mobileApp = new MobileSpeechTranscriber();
    
    // Make globally accessible for debugging
    window.mobileApp = mobileApp;
    
    console.log('🚀 Mobile Voice Suggestions v2.0 ready!');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.mobileApp) {
        window.mobileApp.stopRecording();
    }
});