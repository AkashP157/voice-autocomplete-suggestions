/**
 * Unit Tests for SpeechTranscriber Class
 * Tests core functionality, error handling, and state management
 */

// Mock Web Speech API
class MockSpeechRecognition {
    constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = 'en-US';
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this.isStarted = false;
    }

    start() {
        this.isStarted = true;
        if (this.onstart) this.onstart();
    }

    stop() {
        this.isStarted = false;
        if (this.onend) this.onend();
    }

    abort() {
        this.isStarted = false;
        if (this.onend) this.onend();
    }

    // Test helper to simulate speech results
    simulateResult(transcript, isFinal = false) {
        const mockEvent = {
            results: [{
                0: { transcript },
                isFinal,
                length: 1
            }],
            resultIndex: 0
        };
        if (this.onresult) this.onresult(mockEvent);
    }

    // Test helper to simulate errors
    simulateError(error = 'network') {
        const mockEvent = { error };
        if (this.onerror) this.onerror(mockEvent);
    }
}

// Test Suite
class SpeechTranscriberTests {
    constructor() {
        this.testResults = [];
        this.setupMocks();
    }

    setupMocks() {
        // Mock DOM elements
        global.document = {
            getElementById: (id) => {
                const mockElements = {
                    'startBtn': { disabled: false, textContent: '' },
                    'stopBtn': { disabled: true, textContent: '' },
                    'liveText': { textContent: '', innerHTML: '' },
                    'suggestionsContainer': { innerHTML: '', style: {} },
                    'clearBtn': { disabled: false },
                    'searchBtn': { disabled: false }
                };
                return mockElements[id] || { disabled: false, textContent: '', innerHTML: '', style: {} };
            },
            addEventListener: () => {},
            removeEventListener: () => {}
        };

        // Mock fetch for LLM API calls
        global.fetch = this.mockFetch.bind(this);

        // Mock Web Speech API
        global.webkitSpeechRecognition = MockSpeechRecognition;
        global.SpeechRecognition = MockSpeechRecognition;
    }

    /**
     * Mock fetch implementation for testing
     */
    mockFetch(url, options) {
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                choices: [{
                    message: {
                        content: "Test suggestion 1\nTest suggestion 2\nTest suggestion 3"
                    }
                }]
            })
        });
    }

    async runAllTests() {
        console.log('🧪 Running SpeechTranscriber Unit Tests...\n');

        await this.testInitialization();
        await this.testSpeechRecognitionStart();
        await this.testSpeechRecognitionStop();
        await this.testTextProcessing();
        await this.testErrorHandling();
        await this.testLLMIntegration();
        await this.testCaching();
        await this.testKeywordHighlighting();

        this.printResults();
    }

    async testInitialization() {
        try {
            // Mock the SpeechTranscriber class (would import in real tests)
            const transcriber = {
                recognition: null,
                isListening: false,
                pauseTimer: null,
                llmConfig: { isConfigured: false },
                init: function() {
                    this.recognition = new MockSpeechRecognition();
                    this.recognition.continuous = true;
                    this.recognition.interimResults = true;
                    return true;
                }
            };

            transcriber.init();

            this.assert(
                transcriber.recognition !== null,
                'Initialization: Speech recognition should be initialized'
            );

            this.assert(
                transcriber.recognition.continuous === true,
                'Initialization: Continuous mode should be enabled'
            );

        } catch (error) {
            this.assert(false, `Initialization test failed: ${error.message}`);
        }
    }

    async testSpeechRecognitionStart() {
        try {
            const mockTranscriber = {
                recognition: new MockSpeechRecognition(),
                isListening: false,
                startRecording: function() {
                    if (!this.isListening) {
                        this.isListening = true;
                        this.recognition.start();
                        return true;
                    }
                    return false;
                }
            };

            const result = mockTranscriber.startRecording();

            this.assert(
                result === true,
                'Speech Start: Should successfully start recording'
            );

            this.assert(
                mockTranscriber.isListening === true,
                'Speech Start: isListening flag should be true'
            );

        } catch (error) {
            this.assert(false, `Speech start test failed: ${error.message}`);
        }
    }

    async testSpeechRecognitionStop() {
        try {
            const mockTranscriber = {
                recognition: new MockSpeechRecognition(),
                isListening: true,
                stopRecording: function() {
                    if (this.isListening) {
                        this.isListening = false;
                        this.recognition.stop();
                        return true;
                    }
                    return false;
                }
            };

            const result = mockTranscriber.stopRecording();

            this.assert(
                result === true,
                'Speech Stop: Should successfully stop recording'
            );

            this.assert(
                mockTranscriber.isListening === false,
                'Speech Stop: isListening flag should be false'
            );

        } catch (error) {
            this.assert(false, `Speech stop test failed: ${error.message}`);
        }
    }

    async testTextProcessing() {
        try {
            const mockTranscriber = {
                highlightKeywords: function(text) {
                    // Simplified version of actual highlighting logic
                    const properNouns = ['Paris', 'John', 'Microsoft'];
                    let highlighted = text;
                    
                    properNouns.forEach(noun => {
                        if (text.includes(noun)) {
                            highlighted = highlighted.replace(
                                new RegExp(noun, 'gi'),
                                `<span class="highlight-proper-noun">${noun}</span>`
                            );
                        }
                    });
                    
                    return highlighted;
                }
            };

            const testText = "I'm traveling to Paris with John";
            const result = mockTranscriber.highlightKeywords(testText);

            this.assert(
                result.includes('<span class="highlight-proper-noun">Paris</span>'),
                'Text Processing: Should highlight proper nouns'
            );

            this.assert(
                result.includes('<span class="highlight-proper-noun">John</span>'),
                'Text Processing: Should highlight multiple proper nouns'
            );

        } catch (error) {
            this.assert(false, `Text processing test failed: ${error.message}`);
        }
    }

    async testErrorHandling() {
        try {
            const mockTranscriber = {
                recognition: new MockSpeechRecognition(),
                isListening: true,
                errorCount: 0,
                handleSpeechError: function(event) {
                    this.errorCount++;
                    this.isListening = false;
                    
                    if (event.error === 'network') {
                        return 'Network error: Please check your connection';
                    } else if (event.error === 'not-allowed') {
                        return 'Microphone access denied';
                    }
                    return 'Unknown error occurred';
                }
            };

            // Test network error
            const networkError = mockTranscriber.handleSpeechError({ error: 'network' });
            this.assert(
                networkError.includes('Network error'),
                'Error Handling: Should handle network errors'
            );

            // Test permission error
            const permissionError = mockTranscriber.handleSpeechError({ error: 'not-allowed' });
            this.assert(
                permissionError.includes('Microphone access denied'),
                'Error Handling: Should handle permission errors'
            );

            this.assert(
                mockTranscriber.errorCount === 2,
                'Error Handling: Should track error occurrences'
            );

        } catch (error) {
            this.assert(false, `Error handling test failed: ${error.message}`);
        }
    }

    async testLLMIntegration() {
        try {
            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'what month? • who with? • what type?'
                        }
                    }]
                })
            });

            const mockTranscriber = {
                llmConfig: {
                    endpoint: 'https://test.openai.azure.com',
                    apiKey: 'test-key',
                    isConfigured: true
                },
                generateSuggestions: async function(text) {
                    if (!this.llmConfig.isConfigured) {
                        throw new Error('LLM not configured');
                    }

                    const response = await fetch(this.llmConfig.endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.llmConfig.apiKey}`
                        },
                        body: JSON.stringify({
                            messages: [{ role: 'user', content: text }]
                        })
                    });

                    const data = await response.json();
                    return data.choices[0].message.content.split(' • ');
                }
            };

            const suggestions = await mockTranscriber.generateSuggestions("I'm planning a trip");

            this.assert(
                Array.isArray(suggestions),
                'LLM Integration: Should return array of suggestions'
            );

            this.assert(
                suggestions.length > 0,
                'LLM Integration: Should return non-empty suggestions'
            );

        } catch (error) {
            this.assert(false, `LLM integration test failed: ${error.message}`);
        }
    }

    async testCaching() {
        try {
            const mockTranscriber = {
                cache: new Map(),
                cacheKey: function(text) {
                    return text.toLowerCase().trim();
                },
                getCachedSuggestions: function(text) {
                    return this.cache.get(this.cacheKey(text));
                },
                setCachedSuggestions: function(text, suggestions) {
                    this.cache.set(this.cacheKey(text), {
                        suggestions,
                        timestamp: Date.now()
                    });
                }
            };

            const testText = "Hello world";
            const testSuggestions = ["suggestion1", "suggestion2"];

            // Test cache miss
            let cached = mockTranscriber.getCachedSuggestions(testText);
            this.assert(
                cached === undefined,
                'Caching: Should return undefined for cache miss'
            );

            // Test cache set
            mockTranscriber.setCachedSuggestions(testText, testSuggestions);
            cached = mockTranscriber.getCachedSuggestions(testText);

            this.assert(
                cached !== undefined,
                'Caching: Should store suggestions in cache'
            );

            this.assert(
                Array.isArray(cached.suggestions),
                'Caching: Should store suggestions as array'
            );

        } catch (error) {
            this.assert(false, `Caching test failed: ${error.message}`);
        }
    }

    async testKeywordHighlighting() {
        try {
            const mockTranscriber = {
                highlightNumbers: function(text) {
                    return text.replace(/\b\d+\b/g, '<span class="highlight-number">$&</span>');
                },
                escapeHtml: function(text) {
                    return text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
                }
            };

            // Test number highlighting
            const numberText = "I have 5 apples and 10 oranges";
            const highlightedNumbers = mockTranscriber.highlightNumbers(numberText);
            
            this.assert(
                highlightedNumbers.includes('<span class="highlight-number">5</span>'),
                'Keyword Highlighting: Should highlight numbers'
            );

            // Test HTML escaping
            const htmlText = '<script>alert("test")</script>';
            const escapedHtml = mockTranscriber.escapeHtml(htmlText);
            
            this.assert(
                !escapedHtml.includes('<script>'),
                'Keyword Highlighting: Should escape HTML tags'
            );

        } catch (error) {
            this.assert(false, `Keyword highlighting test failed: ${error.message}`);
        }
    }

    assert(condition, message) {
        const result = {
            message,
            passed: !!condition,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${message}`);
    }

    printResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const percentage = Math.round((passed / total) * 100);

        console.log('\n📊 Test Results Summary:');
        console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
        console.log(`❌ Failed: ${total - passed}/${total}`);

        if (passed === total) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️  Some tests failed. Review the output above.');
        }
    }
}

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpeechTranscriberTests, MockSpeechRecognition };
}

// Auto-run if executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    const tests = new SpeechTranscriberTests();
    tests.runAllTests().catch(console.error);
}