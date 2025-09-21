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
                console.log(`${emoji} [${issue.severity}] ${issue.type} in ${issue.file}`);
                console.log(`   ${issue.message}`);
            });
        }

        // Save detailed report
        fs.writeFileSync('security-report.json', JSON.stringify(this.issues, null, 2));
        console.log(`\n📄 Security report saved to security-report.json`);
    }
}

const secChecker = new SecurityChecker();
secChecker.runSecurityChecks().catch(console.error);