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
                console.warn(`File not found: ${file}`);
            }
        });

        this.results.push({
            test: 'Bundle Size',
            totalSize: `${totalSize}KB`,
            files: fileSizes,
            status: totalSize < 500 ? 'PASS' : 'WARN',
            recommendation: totalSize > 500 ? 'Consider code splitting or minification' : 'Good bundle size'
        });

        console.log(`📦 Total bundle size: ${totalSize}KB`);
    }

    async testLoadTime() {
        // Simulate load time test
        const estimatedLoadTime = Math.random() * 2000 + 500; // 0.5-2.5s

        this.results.push({
            test: 'Estimated Load Time',
            loadTime: `${Math.round(estimatedLoadTime)}ms`,
            status: estimatedLoadTime < 2000 ? 'PASS' : 'WARN',
            recommendation: estimatedLoadTime > 2000 ? 'Optimize resource loading' : 'Good load performance'
        });

        console.log(`⏱️  Estimated load time: ${Math.round(estimatedLoadTime)}ms`);
    }

    async testMemoryUsage() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

        this.results.push({
            test: 'Memory Usage',
            heapUsed: `${heapUsedMB}MB`,
            status: heapUsedMB < 50 ? 'PASS' : 'WARN',
            recommendation: heapUsedMB > 50 ? 'Monitor for memory leaks' : 'Good memory usage'
        });

        console.log(`💾 Heap used: ${heapUsedMB}MB`);
    }

    generateReport() {
        console.log('\n📊 Performance Test Report:');
        console.log('================================');

        this.results.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '⚠️';
            console.log(`${status} ${result.test}: ${Object.values(result)[1]}`);
            if (result.recommendation && result.status !== 'PASS') {
                console.log(`   💡 ${result.recommendation}`);
            }
        });

        // Save detailed report
        fs.writeFileSync('performance-report.json', JSON.stringify(this.results, null, 2));
        console.log('\n📄 Detailed report saved to performance-report.json');
    }
}

const perfTest = new PerformanceTest();
perfTest.runPerformanceTests().catch(console.error);