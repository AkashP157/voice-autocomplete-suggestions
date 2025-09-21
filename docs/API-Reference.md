# Voice Autocomplete Suggestions - API Reference

## Overview
This document provides comprehensive API documentation for the Voice Autocomplete Suggestions application, including both V1 (Desktop) and V2 (Mobile) interfaces.

## Table of Contents
- [Core Classes](#core-classes)
- [Utility Modules](#utility-modules)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Events](#events)
- [Type Definitions](#type-definitions)

## Core Classes

### SharedSpeechRecognition
Main class for speech recognition functionality across both V1 and V2 interfaces.

#### Constructor
```javascript
new SharedSpeechRecognition(config)
```

**Parameters:**
- `config` (Object) - Configuration object
  - `language` (string, optional) - Language code (default: 'en-US')
  - `continuous` (boolean, optional) - Enable continuous recognition (default: true)
  - `interimResults` (boolean, optional) - Enable interim results (default: true)
  - `maxAlternatives` (number, optional) - Maximum alternatives (default: 1)

**Example:**
```javascript
const speechRecognizer = new SharedSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true
});
```

#### Methods

##### start()
Starts speech recognition.
```javascript
speechRecognizer.start();
```

##### stop()
Stops speech recognition.
```javascript
speechRecognizer.stop();
```

##### setCallback(eventName, callback)
Sets callback functions for speech events.
```javascript
speechRecognizer.setCallback('onResult', (result) => {
    console.log('Final:', result.final);
    console.log('Interim:', result.interim);
});
```

#### Static Methods

##### isSupported()
Checks if speech recognition is supported in the current browser.
```javascript
if (SharedSpeechRecognition.isSupported()) {
    // Initialize speech recognition
}
```

### SharedLLMService
Handles LLM API integration for generating autocomplete suggestions.

#### Constructor
```javascript
new SharedLLMService(config)
```

**Parameters:**
- `config` (Object) - Configuration object
  - `provider` (string) - API provider ('azure', 'openai', 'anthropic')
  - `endpoint` (string) - API endpoint URL
  - `apiKey` (string) - API authentication key
  - `model` (string, optional) - Model name (default: 'gpt-4o-mini')
  - `maxTokens` (number, optional) - Maximum tokens (default: 150)
  - `temperature` (number, optional) - Temperature setting (default: 0.7)

#### Methods

##### async generateSuggestions(inputText, context)
Generates AI-powered suggestions based on input text.

**Parameters:**
- `inputText` (string) - The input text to process
- `context` (Object, optional) - Additional context
  - `version` (string) - Interface version ('v1' or 'v2')
  - `style` (string) - Response style ('professional' or 'conversational')

**Returns:** Promise<Object>
- `suggestions` (Array<string>) - Array of suggestion strings
- `timestamp` (number) - Generation timestamp
- `source` (string) - Source type ('llm', 'cache', 'fallback')

**Example:**
```javascript
const llmService = new SharedLLMService({
    provider: 'azure',
    endpoint: 'https://your-resource.openai.azure.com/...',
    apiKey: 'your-api-key'
});

const result = await llmService.generateSuggestions('Hello world', {
    version: 'v2',
    style: 'conversational'
});
console.log(result.suggestions);
```

## Utility Modules

### SharedUIHelpers
Collection of UI utility functions and helpers.

#### Text Processing
```javascript
// Highlight keywords in text (V2 feature)
const highlighted = SharedUIHelpers.textProcessing.highlightKeywords(text);

// Clean and format text
const cleaned = SharedUIHelpers.textProcessing.cleanText(text);

// Escape HTML to prevent XSS
const safe = SharedUIHelpers.textProcessing.escapeHtml(userInput);
```

#### Animations
```javascript
// Pulse animation for recording state
SharedUIHelpers.animations.pulseElement(button, {
    duration: 1000,
    intensity: 0.8,
    color: '#007bff'
});

// Fade in/out animations
SharedUIHelpers.animations.fadeIn(element, 300);
SharedUIHelpers.animations.fadeOut(element, 300);
```

#### Status Indicators
```javascript
// Update status with color coding
SharedUIHelpers.statusIndicators.updateStatus(element, 'listening', 'Listening...');

// Create status indicator
const indicator = SharedUIHelpers.statusIndicators.createStatusIndicator('ready', 'Ready');
```

#### Feedback Systems
```javascript
// Show toast notification
SharedUIHelpers.feedback.showToast('Settings saved!', 'success', 3000);

// Show loading spinner
const spinner = SharedUIHelpers.feedback.showLoading(container, 'Processing...');

// Show confirmation dialog
SharedUIHelpers.feedback.showConfirmation(
    'Are you sure?',
    () => console.log('Confirmed'),
    () => console.log('Cancelled')
);
```

### ErrorHandler
Advanced error handling with categorization and fallbacks.

#### Constructor
```javascript
const errorHandler = new ErrorHandler();
```

#### Methods
```javascript
// Handle different types of errors
errorHandler.handleSpeechError(error);
errorHandler.handleAPIError(error);
errorHandler.handleNetworkError(error);

// Add custom error handlers
errorHandler.addHandler('CUSTOM_ERROR', (error) => {
    console.log('Custom error:', error);
});
```

### ConfigManager
Centralized configuration management with environment detection.

#### Usage
```javascript
const configManager = new ConfigManager();

// Get configuration values
const speechConfig = configManager.get('speech');
const apiKey = configManager.get('llm.apiKey');

// Set configuration values
configManager.set('speech.language', 'es-ES');
configManager.set('ui.theme', 'dark');

// Load from environment
configManager.loadFromEnvironment();

// Validate configuration
const isValid = configManager.validate();
```

### PerformanceMonitor
Real-time performance monitoring and optimization suggestions.

#### Usage
```javascript
const perfMonitor = new PerformanceMonitor();

// Start timing an operation
const timerId = perfMonitor.startTiming('api_request');

// End timing
perfMonitor.endTiming(timerId);

// Track memory usage
perfMonitor.trackMemoryUsage();

// Get performance report
const report = perfMonitor.generateReport();
```

## Configuration

### Default Configuration Object
```javascript
const defaultConfig = {
    speech: {
        language: 'en-US',
        continuous: true,
        interimResults: true,
        maxDuration: 30000
    },
    llm: {
        provider: 'azure',
        model: 'gpt-4o-mini',
        maxTokens: 150,
        temperature: 0.7,
        timeout: 10000
    },
    ui: {
        theme: 'auto',
        animations: true,
        accessibility: true
    }
};
```

### Environment Variables
```javascript
// Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/...
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini

// OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

// Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Error Handling

### Error Types
```javascript
const ErrorTypes = {
    SPEECH_NOT_SUPPORTED: 'Speech recognition not supported',
    MICROPHONE_ACCESS_DENIED: 'Microphone access denied',
    NO_SPEECH_DETECTED: 'No speech detected',
    NETWORK_ERROR: 'Network connection error',
    API_ERROR: 'API service error',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    CONFIGURATION_ERROR: 'Invalid configuration'
};
```

### Error Handling Example
```javascript
try {
    const result = await llmService.generateSuggestions(text);
} catch (error) {
    errorHandler.handle(error, {
        context: 'suggestion_generation',
        fallback: () => ['Please try again'],
        userMessage: 'Unable to generate suggestions'
    });
}
```

## Events

### Speech Recognition Events
```javascript
speechRecognizer.setCallback('onResult', (result) => {
    // Handle speech recognition result
    console.log('Final:', result.final);
    console.log('Interim:', result.interim);
    console.log('Confidence:', result.confidence);
});

speechRecognizer.setCallback('onError', (error) => {
    // Handle speech recognition error
    console.error('Speech error:', error.message);
});

speechRecognizer.setCallback('onStart', () => {
    console.log('Speech recognition started');
});

speechRecognizer.setCallback('onEnd', () => {
    console.log('Speech recognition ended');
});
```

### Custom Events
```javascript
// Dispatch custom events
document.dispatchEvent(new CustomEvent('configChanged', {
    detail: { config: newConfig }
}));

// Listen for custom events
document.addEventListener('configChanged', (event) => {
    console.log('Config updated:', event.detail.config);
});
```

## Type Definitions

### SpeechResult
```typescript
interface SpeechResult {
    final: string;           // Final transcription text
    interim: string;         // Interim transcription text
    confidence: number;      // Confidence score (0-1)
    timestamp: number;       // Timestamp when result was generated
}
```

### LLMResponse
```typescript
interface LLMResponse {
    suggestions: string[];   // Array of suggestion strings
    timestamp: number;       // Response timestamp
    source: string;         // Source type ('llm', 'cache', 'fallback')
    error?: string;         // Error message if applicable
}
```

### ConfigObject
```typescript
interface ConfigObject {
    speech: {
        language: string;
        continuous: boolean;
        interimResults: boolean;
        maxDuration: number;
    };
    llm: {
        provider: string;
        endpoint: string;
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    ui: {
        theme: string;
        animations: boolean;
        accessibility: boolean;
    };
}
```

## Browser Compatibility

### Speech Recognition Support
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ❌ Firefox (limited support)

### Feature Detection
```javascript
// Check speech recognition support
if (SharedSpeechRecognition.isSupported()) {
    // Initialize speech features
} else {
    // Provide fallback interface
}

// Check other features
if ('speechSynthesis' in window) {
    // Text-to-speech available
}

if ('localStorage' in window) {
    // Local storage available
}
```

## Development and Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Generate documentation
npm run docs
```

### Performance Testing
```bash
# Run performance tests
npm run performance

# Security audit
npm run security
```

### Development Server
```bash
# Start development server
npm start

# Development mode with live reload
npm run dev
```

## Examples

### Complete Integration Example
```javascript
// Initialize components
const speechRecognizer = new SharedSpeechRecognition({
    language: 'en-US',
    continuous: true
});

const llmService = new SharedLLMService({
    provider: 'azure',
    endpoint: 'your-endpoint',
    apiKey: 'your-key'
});

const errorHandler = new ErrorHandler();

// Set up speech recognition
speechRecognizer.setCallback('onResult', async (result) => {
    if (result.final) {
        try {
            const suggestions = await llmService.generateSuggestions(result.final, {
                version: 'v2',
                style: 'conversational'
            });
            
            displaySuggestions(suggestions.suggestions);
        } catch (error) {
            errorHandler.handleAPIError(error);
        }
    } else {
        displayInterimText(result.interim);
    }
});

speechRecognizer.setCallback('onError', (error) => {
    errorHandler.handleSpeechError(error);
});

// Start recognition
speechRecognizer.start();
```

### V2 Mobile Interface Example
```javascript
// V2-specific features
const text = "Visit Paris in 6 months for $2500";
const highlighted = SharedUIHelpers.textProcessing.highlightKeywords(text);
// Result: "Visit <span class="highlight-proper-noun">Paris</span> in <span class="highlight-number">6 months</span> for <span class="highlight-number">$2500</span>"

// Mobile-optimized animations
SharedUIHelpers.animations.pulseElement(recordButton, {
    duration: 1000,
    intensity: 0.8,
    color: '#007bff'
});

// Conversational prompts
const suggestions = await llmService.generateSuggestions("I want to travel", {
    version: 'v2',
    style: 'conversational'
});
```

---

For more detailed examples and advanced usage, see the individual module documentation and test files in the `/tests` directory.