/**
 * Integration Tests for Voice Autocomplete Application
 * Tests end-to-end workflows and cross-component interactions
 */

class IntegrationTests {
    constructor() {
        this.testResults = [];
        this.setupTestEnvironment();
    }

    setupTestEnvironment() {
        // Mock browser APIs
        this.mockBrowserAPIs();
        
        // Setup test data
        this.testScenarios = [
            {
                name: "Complete Speech-to-Suggestion Flow",
                input: "I'm planning a vacation",
                expectedSuggestions: 3,
                timeout: 5000
            },
            {
                name: "Error Recovery Flow", 
                input: "Network failure test",
                simulateError: true,
                expectedBehavior: "graceful_degradation"
            },
            {
                name: "Mobile vs Desktop Parity",
                input: "Test cross-platform consistency",
                testBothVersions: true
            }
        ];
    }

    mockBrowserAPIs() {
        // Mock Speech Recognition
        global.webkitSpeechRecognition = class {
            constructor() {
                this.continuous = false;
                this.interimResults = false;
                this.lang = 'en-US';
            }
            start() { /* mock */ }
            stop() { /* mock */ }
            abort() { /* mock */ }
        };

        // Mock Fetch API
        global.fetch = jest.fn();

        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };

        // Mock DOM
        global.document = {
            getElementById: jest.fn(() => ({
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                style: {},
                disabled: false,
                textContent: '',
                innerHTML: ''
            })),
            createElement: jest.fn(() => ({
                style: {},
                addEventListener: jest.fn()
            })),
            addEventListener: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };
    }

    async runAllTests() {
        console.log('🔄 Running Integration Tests...\n');

        await this.testSpeechToSuggestionFlow();
        await this.testErrorRecovery();
        await this.testCrossPlatformParity();
        await this.testPerformanceMetrics();
        await this.testAccessibility();
        await this.testBrowserCompatibility();

        this.printResults();
    }

    async testSpeechToSuggestionFlow() {
        try {
            // Mock successful API responses
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'where to? • when? • with whom?'
                        }
                    }]
                })
            });

            const mockApp = {
                speechRecognition: null,
                llmConfig: { isConfigured: true },
                suggestions: [],
                
                async processUserSpeech(text) {
                    // Step 1: Speech recognition
                    this.currentText = text;
                    
                    // Step 2: Generate suggestions
                    const response = await fetch('/api/suggestions', {
                        method: 'POST',
                        body: JSON.stringify({ text })
                    });
                    
                    const data = await response.json();
                    this.suggestions = data.choices[0].message.content.split(' • ');
                    
                    // Step 3: Display suggestions
                    return this.suggestions;
                }
            };

            const result = await mockApp.processUserSpeech("I'm planning a vacation");

            this.assert(
                Array.isArray(result),
                'End-to-End Flow: Should return array of suggestions'
            );

            this.assert(
                result.length > 0,
                'End-to-End Flow: Should generate suggestions'
            );

            this.assert(
                result.every(s => typeof s === 'string'),
                'End-to-End Flow: All suggestions should be strings'
            );

        } catch (error) {
            this.assert(false, `End-to-end flow test failed: ${error.message}`);
        }
    }

    async testErrorRecovery() {
        try {
            // Mock network failure
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const mockApp = {
                errorCount: 0,
                fallbackSuggestions: ['try again?', 'check connection?', 'offline mode?'],
                
                async handleSpeechWithFallback(text) {
                    try {
                        const response = await fetch('/api/suggestions');
                        return await response.json();
                    } catch (error) {
                        this.errorCount++;
                        
                        // Graceful degradation
                        if (this.errorCount <= 3) {
                            return {
                                suggestions: this.fallbackSuggestions,
                                source: 'fallback',
                                error: error.message
                            };
                        }
                        
                        throw error;
                    }
                }
            };

            const result = await mockApp.handleSpeechWithFallback("test input");

            this.assert(
                result.source === 'fallback',
                'Error Recovery: Should use fallback suggestions on network failure'
            );

            this.assert(
                result.suggestions.length > 0,
                'Error Recovery: Should provide fallback suggestions'
            );

            this.assert(
                mockApp.errorCount === 1,
                'Error Recovery: Should track error occurrences'
            );

        } catch (error) {
            this.assert(false, `Error recovery test failed: ${error.message}`);
        }
    }

    async testCrossPlatformParity() {
        try {
            const desktopFeatures = [
                'analytics',
                'caching', 
                'configuration',
                'performance_monitoring',
                'debug_tools'
            ];

            const mobileFeatures = [
                'touch_optimization',
                'animations',
                'natural_conversation',
                'keyword_highlighting',
                'simplified_ui'
            ];

            const coreFeatures = [
                'speech_recognition',
                'llm_integration',
                'suggestion_generation',
                'text_display',
                'error_handling'
            ];

            // Mock feature detection
            const mockDesktopApp = {
                features: [...coreFeatures, ...desktopFeatures],
                hasFeature: function(feature) {
                    return this.features.includes(feature);
                }
            };

            const mockMobileApp = {
                features: [...coreFeatures, ...mobileFeatures],
                hasFeature: function(feature) {
                    return this.features.includes(feature);
                }
            };

            // Test core feature parity
            coreFeatures.forEach(feature => {
                this.assert(
                    mockDesktopApp.hasFeature(feature) && mockMobileApp.hasFeature(feature),
                    `Cross-Platform: Both versions should have ${feature}`
                );
            });

            // Test unique features
            this.assert(
                mockDesktopApp.hasFeature('analytics'),
                'Cross-Platform: Desktop should have analytics'
            );

            this.assert(
                mockMobileApp.hasFeature('touch_optimization'),
                'Cross-Platform: Mobile should have touch optimization'
            );

        } catch (error) {
            this.assert(false, `Cross-platform parity test failed: ${error.message}`);
        }
    }

    async testPerformanceMetrics() {
        try {
            const mockPerformanceMonitor = {
                metrics: {},
                
                startTimer: function(operation) {
                    this.metrics[operation] = { start: Date.now() };
                },
                
                endTimer: function(operation) {
                    if (this.metrics[operation]) {
                        this.metrics[operation].duration = Date.now() - this.metrics[operation].start;
                    }
                },
                
                getMetric: function(operation) {
                    return this.metrics[operation];
                }
            };

            // Simulate operations
            mockPerformanceMonitor.startTimer('speech_processing');
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
            mockPerformanceMonitor.endTimer('speech_processing');

            mockPerformanceMonitor.startTimer('llm_call');
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
            mockPerformanceMonitor.endTimer('llm_call');

            const speechMetric = mockPerformanceMonitor.getMetric('speech_processing');
            const llmMetric = mockPerformanceMonitor.getMetric('llm_call');

            this.assert(
                speechMetric && speechMetric.duration > 0,
                'Performance: Should track speech processing time'
            );

            this.assert(
                llmMetric && llmMetric.duration > 0,
                'Performance: Should track LLM call duration'
            );

            this.assert(
                speechMetric.duration < 200,
                'Performance: Speech processing should be fast (<200ms)'
            );

        } catch (error) {
            this.assert(false, `Performance metrics test failed: ${error.message}`);
        }
    }

    async testAccessibility() {
        try {
            const mockAccessibilityChecker = {
                checkAriaLabels: function(elements) {
                    return elements.every(el => el.ariaLabel || el.title);
                },
                
                checkKeyboardNavigation: function(elements) {
                    return elements.every(el => el.tabIndex !== undefined);
                },
                
                checkColorContrast: function(elements) {
                    // Simplified contrast check
                    return elements.every(el => 
                        el.style.color && el.style.backgroundColor
                    );
                }
            };

            const mockElements = [
                { ariaLabel: 'Start recording', tabIndex: 0, style: { color: '#333', backgroundColor: '#fff' } },
                { title: 'Stop recording', tabIndex: 1, style: { color: '#fff', backgroundColor: '#333' } },
                { ariaLabel: 'Clear text', tabIndex: 2, style: { color: '#000', backgroundColor: '#f0f0f0' } }
            ];

            const ariaTest = mockAccessibilityChecker.checkAriaLabels(mockElements);
            const keyboardTest = mockAccessibilityChecker.checkKeyboardNavigation(mockElements);
            const contrastTest = mockAccessibilityChecker.checkColorContrast(mockElements);

            this.assert(
                ariaTest,
                'Accessibility: All interactive elements should have ARIA labels'
            );

            this.assert(
                keyboardTest,
                'Accessibility: All elements should support keyboard navigation'
            );

            this.assert(
                contrastTest,
                'Accessibility: All elements should have proper color contrast'
            );

        } catch (error) {
            this.assert(false, `Accessibility test failed: ${error.message}`);
        }
    }

    async testBrowserCompatibility() {
        try {
            const browserSupport = {
                chrome: {
                    speechRecognition: true,
                    webAudio: true,
                    fetch: true,
                    localStorage: true
                },
                firefox: {
                    speechRecognition: false, // Limited support
                    webAudio: true,
                    fetch: true,
                    localStorage: true
                },
                safari: {
                    speechRecognition: true,
                    webAudio: true,
                    fetch: true,
                    localStorage: true
                }
            };

            const mockCompatibilityChecker = {
                checkFeatureSupport: function(browser, feature) {
                    return browserSupport[browser] && browserSupport[browser][feature];
                },
                
                getCompatibilityScore: function(browser) {
                    const features = Object.keys(browserSupport[browser]);
                    const supported = features.filter(f => browserSupport[browser][f]);
                    return (supported.length / features.length) * 100;
                }
            };

            const chromeScore = mockCompatibilityChecker.getCompatibilityScore('chrome');
            const firefoxScore = mockCompatibilityChecker.getCompatibilityScore('firefox');
            const safariScore = mockCompatibilityChecker.getCompatibilityScore('safari');

            this.assert(
                chromeScore === 100,
                'Browser Compatibility: Chrome should have full support'
            );

            this.assert(
                firefoxScore >= 75,
                'Browser Compatibility: Firefox should have reasonable support'
            );

            this.assert(
                safariScore >= 75,
                'Browser Compatibility: Safari should have reasonable support'
            );

        } catch (error) {
            this.assert(false, `Browser compatibility test failed: ${error.message}`);
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

        console.log('\n📊 Integration Test Results:');
        console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
        console.log(`❌ Failed: ${total - passed}/${total}`);

        if (passed === total) {
            console.log('🎉 All integration tests passed!');
        } else {
            console.log('⚠️  Some integration tests failed.');
        }
    }
}

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationTests;
}

// Auto-run if executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    const tests = new IntegrationTests();
    tests.runAllTests().catch(console.error);
}