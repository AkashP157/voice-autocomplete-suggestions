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
        
        // Feature flag system
        this.featureFlags = {
            suggestionStyle: 'default' // 'default' or 'keywords'
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
        this.loadFeatureFlags();
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
        
        // Feature flag listeners
        document.querySelectorAll('input[name="suggestionStyle"]').forEach(radio => {
            radio.addEventListener('change', () => this.saveFeatureFlags());
        });
        
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
            this.recordBtn.classList.add('recording', 'listening');
            this.recordIcon.textContent = '⏹️'; // Stop icon
            this.liveText.classList.add('recording');
        } else {
            this.recordBtn.classList.remove('recording', 'listening');
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
        
        // Open Bing Copilot search for AI answers in new tab
        const searchQuery = encodeURIComponent(searchText.trim());
        const bingCopilotUrl = `https://www.bing.com/copilotsearch?q=${searchQuery}&FORM=CSSCOP`;
        
        console.log(`🤖 AI Search for: "${searchText.trim()}" -> ${bingCopilotUrl}`);
        
        // Open in new tab
        window.open(bingCopilotUrl, '_blank');
        
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
        pills.forEach((pill, index) => {
            setTimeout(() => {
                pill.classList.remove('visible', 'thinking');
                pill.querySelector('span').textContent = pill.id.replace('suggestion', 'Suggestion ');
            }, index * 50); // Staggered hiding
        });
    }
    
    showThinkingAnimation() {
        const pills = this.suggestionsContainer.querySelectorAll('.suggestion-pill');
        pills.forEach((pill, index) => {
            setTimeout(() => {
                pill.classList.remove('visible');
                pill.classList.add('thinking');
            }, index * 100); // Staggered thinking animation
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
            // Apply keyword highlighting using a safer approach
            this.liveText.innerHTML = `<p>${this.highlightKeywords(text)}</p>`;
        } else {
            this.liveText.innerHTML = '<p class="placeholder">Tap the microphone to start speaking...</p>';
        }
    }
    
    highlightKeywords(text) {
        // Clean the text first - remove any existing HTML markup
        const cleanText = text.replace(/<[^>]*>/g, '');
        
        // Escape HTML characters
        let escapedText = cleanText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        
        // Define keyword patterns
        const patterns = [
            // Numbers, dates, times, money (coral highlighting)
            {
                regex: /\b(\d+(?:\.\d+)?(?:\s*(?:dollars?|euros?|pounds?|₹|rs|rupees?))?|\$\d+(?:\.\d+)?|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+|\d+[\/\-]\d+[\/\-]\d+|\d+:\d+(?:\s*(?:am|pm))?)\b/gi,
                className: 'keyword-number'
            }
        ];
        
        // Apply number/date highlights first
        patterns.forEach(pattern => {
            escapedText = escapedText.replace(pattern.regex, `<span class="${pattern.className}">$&</span>`);
        });
        
        // Apply proper noun highlighting (avoiding common false positives)
        const commonWords = /^(I|The|A|An|This|That|These|Those|My|Your|His|Her|Its|Our|Their|Some|Any|All|Each|Every|Many|Much|Few|Little|More|Most|Less|Least|First|Last|Next|Previous|Same|Different|Other|Another)$/i;
        
        escapedText = escapedText.replace(/\b[A-Z][a-z]{2,}\b/g, (match) => {
            // Skip if it's already highlighted or is a common word
            if (match.includes('<span') || commonWords.test(match)) {
                return match;
            }
            return `<span class="keyword-important">${match}</span>`;
        });
        
        return escapedText;
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
        
        // Show thinking animation
        this.showThinkingAnimation();
        
        // Make API call
        try {
            this.isProcessingLLM = true;
            this.apiCallStartTime = Date.now();
            
            const suggestions = await this.getLLMSuggestions(text);
            
            if (suggestions && suggestions.length > 0) {
                this.displaySuggestions(suggestions, 'fresh');
                this.cacheSuggestions(text, suggestions);
            } else {
                // Hide thinking animation if no suggestions
                this.hideSuggestions();
            }
        } catch (error) {
            console.error('❌ LLM API error:', error);
            // Show persistent suggestions if available, otherwise hide thinking
            if (this.lastValidSuggestions) {
                this.displaySuggestions(this.lastValidSuggestions, 'fallback');
            } else {
                this.hideSuggestions();
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
        
        // Update suggestion pills with enhanced animation
        const pills = this.suggestionsContainer.querySelectorAll('.suggestion-pill');
        
        // First, hide thinking animation
        pills.forEach(pill => {
            pill.classList.remove('thinking');
        });
        
        // Then show suggestions with staggered reveal
        pills.forEach((pill, index) => {
            pill.classList.remove('visible');
            
            setTimeout(() => {
                if (suggestions[index]) {
                    pill.querySelector('span').textContent = suggestions[index];
                    pill.classList.add('visible');
                } else {
                    pill.querySelector('span').textContent = `Suggestion ${index + 1}`;
                }
            }, index * 120); // Slightly slower stagger for better effect
        });
    }
    
    async getLLMSuggestions(text) {
        if (!this.llmConfig.isConfigured) {
            console.log('⚠️ LLM not configured');
            return null;
        }
        
        // Get the appropriate prompt template based on feature flags
        const promptTemplate = this.getPromptTemplate(text);
        const currentStyle = this.featureFlags.suggestionStyle || 'default';
        console.log(`🎯 Using suggestion style: ${currentStyle}`);
        
        const requestBody = {
            messages: [
                { role: 'system', content: promptTemplate.systemMessage },
                { role: 'user', content: promptTemplate.userPrompt }
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
    
    // Feature Flag Management
    loadFeatureFlags() {
        try {
            const saved = localStorage.getItem('mobileFeatureFlags');
            if (saved) {
                const flags = JSON.parse(saved);
                this.featureFlags = { ...this.featureFlags, ...flags };
                
                // Update UI to reflect loaded flags
                const selectedStyle = this.featureFlags.suggestionStyle || 'default';
                const radio = document.getElementById(`${selectedStyle}Style`);
                if (radio) {
                    radio.checked = true;
                }
                
                console.log('🏁 Feature flags loaded:', this.featureFlags);
            }
        } catch (error) {
            console.error('Error loading feature flags:', error);
            // Reset to defaults on error
            this.featureFlags = { suggestionStyle: 'default' };
        }
    }
    
    saveFeatureFlags() {
        try {
            // Get selected suggestion style
            const selectedStyleRadio = document.querySelector('input[name="suggestionStyle"]:checked');
            if (selectedStyleRadio) {
                this.featureFlags.suggestionStyle = selectedStyleRadio.value;
            }
            
            // Save to localStorage
            localStorage.setItem('mobileFeatureFlags', JSON.stringify(this.featureFlags));
            console.log('🏁 Feature flags saved:', this.featureFlags);
            
        } catch (error) {
            console.error('Error saving feature flags:', error);
        }
    }
    
    // Get appropriate prompt template based on current feature flags
    getPromptTemplate(text) {
        const style = this.featureFlags.suggestionStyle || 'default';
        
        if (style === 'keywords') {
            return {
                systemMessage: 'You are a helpful assistant that provides short, keyword-style follow-up questions. Be concise and direct - each suggestion should be 1-2 words maximum, asking the most essential next question.',
                userPrompt: `Someone just said: "${text}"

Provide 3 short, keyword-style follow-up questions (1-2 words each) that ask for the most essential missing information. Think like essential form fields.

Examples:
- If they mention travel: "Where?" "When?" "Duration?"
- If they mention food: "Cuisine?" "Budget?" "Location?"
- If they mention work: "Role?" "Company?" "Timeline?"

Be direct and focused - no explanations, just the essential questions as short keywords.`
            };
        }
        
        // Default style (current behavior)
        return {
            systemMessage: 'You are a helpful friend having a natural conversation. Your job is to ask the most logical, natural follow-up questions that continue the conversation in a flowing way. Be direct and focused - no pleasantries, excitement, or filler words. Just ask the essential questions that would naturally come next.',
            userPrompt: `You are having a natural, helpful conversation with someone. They just told you: "${text}"

Think like a helpful friend - what would you naturally ask next to continue this conversation in a flowing, logical way? 

Consider:
- What's the most immediate next thing you'd want to know?
- What would make this feel like talking to a real person?
- What single detail would be most helpful to understand next?

Provide 3 natural, conversational follow-up questions (4-5 words each) that flow logically from what they just said. Be direct and focused - no pleasantries or filler words, just the essential questions.`
        };
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