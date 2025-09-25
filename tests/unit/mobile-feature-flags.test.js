/**
 * Unit Tests for Mobile Feature Flags System
 * Tests feature flag management, prompt templates, and local storage
 */

// Mock localStorage for testing
class MockLocalStorage {
    constructor() {
        this.storage = {};
    }

    getItem(key) {
        return this.storage[key] || null;
    }

    setItem(key, value) {
        this.storage[key] = value;
    }

    removeItem(key) {
        delete this.storage[key];
    }

    clear() {
        this.storage = {};
    }
}

// Mock DOM elements for testing
class MockDocument {
    constructor() {
        this.elements = new Map();
        this.eventListeners = new Map();
    }

    getElementById(id) {
        return this.elements.get(id) || {
            checked: false,
            value: '',
            addEventListener: (event, handler) => {
                this.eventListeners.set(`${id}-${event}`, handler);
            }
        };
    }

    querySelector(selector) {
        if (selector === 'input[name="suggestionStyle"]:checked') {
            return { value: 'default' };
        }
        return null;
    }

    querySelectorAll(selector) {
        if (selector === 'input[name="suggestionStyle"]') {
            return [{
                addEventListener: (event, handler) => {
                    this.eventListeners.set(`suggestionStyle-${event}`, handler);
                }
            }];
        }
        return [];
    }
}

// Mock MobileSpeechTranscriber class for testing feature flags
class MockMobileSpeechTranscriber {
    constructor() {
        this.featureFlags = {
            suggestionStyle: 'default'
        };
        
        // Mock localStorage and document
        global.localStorage = new MockLocalStorage();
        global.document = new MockDocument();
    }

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
}

// Test Suite
describe('Mobile Feature Flags System', () => {
    let mobileApp;

    beforeEach(() => {
        mobileApp = new MockMobileSpeechTranscriber();
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('Feature Flag Initialization', () => {
        test('should initialize with default suggestion style', () => {
            expect(mobileApp.featureFlags.suggestionStyle).toBe('default');
        });

        test('should load saved feature flags from localStorage', () => {
            const testFlags = { suggestionStyle: 'keywords' };
            localStorage.setItem('mobileFeatureFlags', JSON.stringify(testFlags));
            
            mobileApp.loadFeatureFlags();
            
            expect(mobileApp.featureFlags.suggestionStyle).toBe('keywords');
        });

        test('should handle corrupted localStorage data gracefully', () => {
            localStorage.setItem('mobileFeatureFlags', 'invalid-json');
            
            mobileApp.loadFeatureFlags();
            
            expect(mobileApp.featureFlags.suggestionStyle).toBe('default');
        });
    });

    describe('Feature Flag Management', () => {
        test('should save feature flags to localStorage', () => {
            mobileApp.featureFlags.suggestionStyle = 'keywords';
            
            mobileApp.saveFeatureFlags();
            
            const saved = JSON.parse(localStorage.getItem('mobileFeatureFlags'));
            expect(saved.suggestionStyle).toBe('keywords');
        });

        test('should update feature flags from UI selection', () => {
            // Mock selected radio button
            document.querySelector = jest.fn().mockReturnValue({ value: 'keywords' });
            
            mobileApp.saveFeatureFlags();
            
            expect(mobileApp.featureFlags.suggestionStyle).toBe('keywords');
        });
    });

    describe('Prompt Template System', () => {
        test('should return default prompt template for default style', () => {
            mobileApp.featureFlags.suggestionStyle = 'default';
            
            const template = mobileApp.getPromptTemplate('I want to plan a trip');
            
            expect(template.systemMessage).toContain('helpful friend having a natural conversation');
            expect(template.userPrompt).toContain('natural, conversational follow-up questions');
        });

        test('should return keywords prompt template for keywords style', () => {
            mobileApp.featureFlags.suggestionStyle = 'keywords';
            
            const template = mobileApp.getPromptTemplate('I want to plan a trip');
            
            expect(template.systemMessage).toContain('keyword-style follow-up questions');
            expect(template.userPrompt).toContain('short, keyword-style follow-up questions');
        });

        test('should fallback to default style for unknown styles', () => {
            mobileApp.featureFlags.suggestionStyle = 'unknown-style';
            
            const template = mobileApp.getPromptTemplate('I want to plan a trip');
            
            expect(template.systemMessage).toContain('helpful friend having a natural conversation');
        });

        test('should include user text in prompt template', () => {
            const testText = 'I want to book a restaurant';
            
            const template = mobileApp.getPromptTemplate(testText);
            
            expect(template.userPrompt).toContain(testText);
        });
    });

    describe('Feature Flag Persistence', () => {
        test('should persist feature flags across app restarts', () => {
            // Set and save flags in first "session"
            mobileApp.featureFlags.suggestionStyle = 'keywords';
            mobileApp.saveFeatureFlags();
            
            // Create new instance (simulate app restart)
            const newMobileApp = new MockMobileSpeechTranscriber();
            newMobileApp.loadFeatureFlags();
            
            expect(newMobileApp.featureFlags.suggestionStyle).toBe('keywords');
        });

        test('should handle missing localStorage gracefully', () => {
            // Clear localStorage
            localStorage.clear();
            
            mobileApp.loadFeatureFlags();
            
            expect(mobileApp.featureFlags.suggestionStyle).toBe('default');
        });
    });

    describe('Prompt Template Content Quality', () => {
        test('default template should encourage natural conversation', () => {
            const template = mobileApp.getPromptTemplate('I need help with work');
            
            expect(template.systemMessage).toContain('natural conversation');
            expect(template.userPrompt).toContain('helpful friend');
            expect(template.userPrompt).toContain('4-5 words each');
        });

        test('keywords template should encourage short responses', () => {
            mobileApp.featureFlags.suggestionStyle = 'keywords';
            
            const template = mobileApp.getPromptTemplate('I need help with work');
            
            expect(template.systemMessage).toContain('1-2 words maximum');
            expect(template.userPrompt).toContain('1-2 words each');
            expect(template.userPrompt).toContain('essential form fields');
        });

        test('templates should include relevant examples', () => {
            mobileApp.featureFlags.suggestionStyle = 'keywords';
            
            const template = mobileApp.getPromptTemplate('I want to travel');
            
            expect(template.userPrompt).toContain('If they mention travel: "Where?" "When?" "Duration?"');
        });
    });
});

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MockMobileSpeechTranscriber };
}