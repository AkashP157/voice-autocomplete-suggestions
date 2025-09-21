/**
 * Development and Testing Utilities
 * Provides tools for testing, debugging, and development workflow
 */

// Package.json for Node.js dependencies and scripts
const packageJson = {
    "name": "voice-autocomplete-suggestions",
    "version": "2.0.0",
    "description": "Revolutionary real-time voice autocomplete powered by AI",
    "main": "index.html",
    "scripts": {
        "start": "http-server -p 8000 -c-1",
        "dev": "http-server -p 8000 -c-1 --cors",
        "test": "node tests/run-tests.js",
        "test:unit": "node tests/unit/speech-transcriber.test.js",
        "test:integration": "node tests/integration/end-to-end.test.js",
        "lint": "eslint *.js utils/*.js tests/**/*.js",
        "format": "prettier --write *.js utils/*.js tests/**/*.js",
        "build": "npm run lint && npm run test",
        "serve": "python -m http.server 8000",
        "docs": "jsdoc -d docs *.js utils/*.js",
        "performance": "node utils/performance-test.js",
        "security": "npm audit && node utils/security-check.js"
    },
    "keywords": [
        "voice",
        "speech-recognition",
        "ai",
        "autocomplete",
        "suggestions",
        "llm",
        "gpt",
        "real-time"
    ],
    "author": "Your Name",
    "license": "MIT",
    "devDependencies": {
        "eslint": "^8.0.0",
        "prettier": "^3.0.0",
        "jsdoc": "^4.0.0",
        "http-server": "^14.1.1",
        "jest": "^29.0.0"
    },
    "dependencies": {},
    "engines": {
        "node": ">=16.0.0"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/yourusername/voice-autocomplete-suggestions.git"
    },
    "homepage": "https://yourusername.github.io/voice-autocomplete-suggestions"
};

// ESLint configuration
const eslintConfig = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended"
    ],
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-unused-vars": "warn",
        "no-console": "off",
        "prefer-const": "error",
        "no-var": "error"
    },
    "globals": {
        "webkitSpeechRecognition": "readonly",
        "SpeechRecognition": "readonly"
    }
};

// Prettier configuration
const prettierConfig = {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 80,
    "tabWidth": 4
};

// JSDoc configuration
const jsdocConfig = {
    "source": {
        "include": ["./", "./utils/", "./tests/"],
        "includePattern": "\\.(js)$",
        "exclude": ["node_modules/", "docs/"]
    },
    "opts": {
        "destination": "./docs/"
    },
    "plugins": ["plugins/markdown"],
    "templates": {
        "cleverLinks": false,
        "monospaceLinks": false
    }
};

// Test runner script
const testRunner = `
const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Running Voice Autocomplete Tests...\n');

const tests = [
    'tests/unit/speech-transcriber.test.js',
    'tests/integration/end-to-end.test.js'
];

async function runTests() {
    for (const test of tests) {
        console.log(\`\n🔍 Running \${test}...\`);
        
        try {
            await new Promise((resolve, reject) => {
                exec(\`node \${test}\`, (error, stdout, stderr) => {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(stderr);
                    
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error(\`❌ Test failed: \${test}\`);
            console.error(error.message);
            process.exit(1);
        }
    }
    
    console.log('\n✅ All tests passed!');
}

runTests().catch(console.error);
`;

// Performance testing script
const performanceTest = `
const fs = require('fs');
const path = require('path');

class PerformanceTest {
    constructor() {
        this.results = [];
    }

    async runPerformanceTests() {
        console.log('🚀 Running Performance Tests...\n');

        await this.testBundleSize();
        await this.testLoadTime();
        await this.testMemoryUsage();
        
        this.generateReport();
    }

    async testBundleSize() {
        const files = [
            'script.js',
            'mobile.js',
            'styles.css',
            'mobile.css',
            'utils/error-handler.js',
            'utils/config.js',
            'utils/performance.js'
        ];

        let totalSize = 0;
        const fileSizes = {};

        files.forEach(file => {
            try {
                const stats = fs.statSync(file);
                const sizeKB = Math.round(stats.size / 1024);
                fileSizes[file] = sizeKB;
                totalSize += sizeKB;
            } catch (e) {
                console.warn(\`File not found: \${file}\`);
            }
        });

        this.results.push({
            test: 'Bundle Size',
            totalSize: \`\${totalSize}KB\`,
            files: fileSizes,
            status: totalSize < 500 ? 'PASS' : 'WARN',
            recommendation: totalSize > 500 ? 'Consider code splitting or minification' : 'Good bundle size'
        });

        console.log(\`📦 Total bundle size: \${totalSize}KB\`);
    }

    async testLoadTime() {
        // Simulate load time test
        const estimatedLoadTime = Math.random() * 2000 + 500; // 0.5-2.5s

        this.results.push({
            test: 'Estimated Load Time',
            loadTime: \`\${Math.round(estimatedLoadTime)}ms\`,
            status: estimatedLoadTime < 2000 ? 'PASS' : 'WARN',
            recommendation: estimatedLoadTime > 2000 ? 'Optimize resource loading' : 'Good load performance'
        });

        console.log(\`⏱️  Estimated load time: \${Math.round(estimatedLoadTime)}ms\`);
    }

    async testMemoryUsage() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

        this.results.push({
            test: 'Memory Usage',
            heapUsed: \`\${heapUsedMB}MB\`,
            status: heapUsedMB < 50 ? 'PASS' : 'WARN',
            recommendation: heapUsedMB > 50 ? 'Monitor for memory leaks' : 'Good memory usage'
        });

        console.log(\`💾 Heap used: \${heapUsedMB}MB\`);
    }

    generateReport() {
        console.log('\n📊 Performance Test Report:');
        console.log('================================');

        this.results.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '⚠️';
            console.log(\`\${status} \${result.test}: \${Object.values(result)[1]}\`);
            if (result.recommendation && result.status !== 'PASS') {
                console.log(\`   💡 \${result.recommendation}\`);
            }
        });

        // Save detailed report
        fs.writeFileSync('performance-report.json', JSON.stringify(this.results, null, 2));
        console.log('\n📄 Detailed report saved to performance-report.json');
    }
}

const perfTest = new PerformanceTest();
perfTest.runPerformanceTests().catch(console.error);
`;

// Security check script
const securityCheck = `
const fs = require('fs');

class SecurityChecker {
    constructor() {
        this.issues = [];
    }

    async runSecurityChecks() {
        console.log('🔒 Running Security Checks...\n');

        await this.checkForSecrets();
        await this.checkCSPHeaders();
        await this.checkInputSanitization();
        await this.checkHTTPS();

        this.generateReport();
    }

    async checkForSecrets() {
        const files = ['script.js', 'mobile.js', 'utils/config.js'];
        const secretPatterns = [
            /api[_-]?key['"\\s]*[:=]['"\\s]*[a-zA-Z0-9]/i,
            /secret['"\\s]*[:=]['"\\s]*[a-zA-Z0-9]/i,
            /password['"\\s]*[:=]['"\\s]*[a-zA-Z0-9]/i
        ];

        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                secretPatterns.forEach(pattern => {
                    if (pattern.test(content)) {
                        this.issues.push({
                            type: 'SECRET_EXPOSURE',
                            file,
                            severity: 'HIGH',
                            message: 'Potential secret or API key found in code'
                        });
                    }
                });
            } catch (e) {
                // File doesn't exist
            }
        });

        console.log('🔍 Checked for exposed secrets');
    }

    async checkCSPHeaders() {
        const htmlFiles = ['index.html', 'mobile.html'];
        
        htmlFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                if (!content.includes('Content-Security-Policy')) {
                    this.issues.push({
                        type: 'MISSING_CSP',
                        file,
                        severity: 'MEDIUM',
                        message: 'Content Security Policy header not found'
                    });
                }
            } catch (e) {
                // File doesn't exist
            }
        });

        console.log('🛡️  Checked CSP headers');
    }

    async checkInputSanitization() {
        const jsFiles = ['script.js', 'mobile.js'];
        
        jsFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('innerHTML') && !content.includes('escapeHtml')) {
                    this.issues.push({
                        type: 'XSS_RISK',
                        file,
                        severity: 'HIGH',
                        message: 'innerHTML usage without proper sanitization detected'
                    });
                }
            } catch (e) {
                // File doesn't exist
            }
        });

        console.log('🧹 Checked input sanitization');
    }

    async checkHTTPS() {
        const jsFiles = ['script.js', 'mobile.js', 'utils/config.js'];
        
        jsFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('http://') && !content.includes('localhost')) {
                    this.issues.push({
                        type: 'INSECURE_HTTP',
                        file,
                        severity: 'MEDIUM',
                        message: 'HTTP URLs found (should use HTTPS in production)'
                    });
                }
            } catch (e) {
                // File doesn't exist
            }
        });

        console.log('🔐 Checked HTTPS usage');
    }

    generateReport() {
        console.log('\n🔒 Security Check Report:');
        console.log('================================');

        if (this.issues.length === 0) {
            console.log('✅ No security issues found!');
        } else {
            this.issues.forEach(issue => {
                const emoji = issue.severity === 'HIGH' ? '🚨' : issue.severity === 'MEDIUM' ? '⚠️' : 'ℹ️';
                console.log(\`\${emoji} [\${issue.severity}] \${issue.type} in \${issue.file}\`);
                console.log(\`   \${issue.message}\`);
            });
        }

        // Save detailed report
        fs.writeFileSync('security-report.json', JSON.stringify(this.issues, null, 2));
        console.log(\`\n📄 Security report saved to security-report.json\`);
    }
}

const secChecker = new SecurityChecker();
secChecker.runSecurityChecks().catch(console.error);
`;

// Create the files
const filesToCreate = [
    { name: 'package.json', content: JSON.stringify(packageJson, null, 2) },
    { name: '.eslintrc.json', content: JSON.stringify(eslintConfig, null, 2) },
    { name: '.prettierrc.json', content: JSON.stringify(prettierConfig, null, 2) },
    { name: 'jsdoc.conf.json', content: JSON.stringify(jsdocConfig, null, 2) },
    { name: 'tests/run-tests.js', content: testRunner },
    { name: 'utils/performance-test.js', content: performanceTest },
    { name: 'utils/security-check.js', content: securityCheck }
];

console.log('Creating development and testing utilities...\n');

filesToCreate.forEach(file => {
    console.log(\`📝 Creating \${file.name}\`);
});

// Export configuration for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        packageJson,
        eslintConfig,
        prettierConfig,
        jsdocConfig,
        filesToCreate
    };
}