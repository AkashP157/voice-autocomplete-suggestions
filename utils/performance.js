/**
 * Performance Monitoring and Optimization Utilities
 * Tracks application performance and provides optimization strategies
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.thresholds = {
            speechProcessing: 500, // ms
            llmResponse: 3000, // ms
            uiUpdate: 100, // ms
            cacheAccess: 50 // ms
        };
        this.setupObservers();
    }

    setupObservers() {
        // Performance Observer for measuring various metrics
        if ('PerformanceObserver' in window) {
            try {
                // Measure loading performance
                const loadObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        this.recordMetric(`load_${entry.name}`, entry.duration);
                    });
                });
                loadObserver.observe({ entryTypes: ['measure', 'navigation'] });

                // Measure resource loading
                const resourceObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        this.recordMetric(`resource_${entry.name}`, entry.duration);
                    });
                });
                resourceObserver.observe({ entryTypes: ['resource'] });

            } catch (e) {
                console.warn('Performance Observer not fully supported:', e);
            }
        }
    }

    startTiming(operation) {
        const startTime = performance.now();
        const timingId = `${operation}_${Date.now()}_${Math.random()}`;
        
        this.metrics.set(timingId, {
            operation,
            startTime,
            status: 'running'
        });
        
        return timingId;
    }

    endTiming(timingId) {
        const metric = this.metrics.get(timingId);
        if (!metric) {
            console.warn(`No timing found for ID: ${timingId}`);
            return null;
        }

        const endTime = performance.now();
        const duration = endTime - metric.startTime;

        // Update the metric
        metric.endTime = endTime;
        metric.duration = duration;
        metric.status = 'completed';

        // Check against thresholds
        const threshold = this.thresholds[metric.operation];
        if (threshold && duration > threshold) {
            this.recordSlowOperation(metric.operation, duration, threshold);
        }

        // Record for analytics
        this.recordMetric(metric.operation, duration);

        return {
            operation: metric.operation,
            duration,
            isSlowThreshold: threshold && duration > threshold
        };
    }

    recordMetric(name, value, metadata = {}) {
        const metricData = {
            name,
            value,
            timestamp: Date.now(),
            metadata
        };

        // Store in metrics history
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        const history = this.metrics.get(name);
        history.push(metricData);

        // Keep only last 100 entries per metric
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        // Log slow operations
        const threshold = this.thresholds[name];
        if (threshold && value > threshold) {
            console.warn(`Slow operation detected: ${name} took ${value}ms (threshold: ${threshold}ms)`);
        }
    }

    recordSlowOperation(operation, duration, threshold) {
        const slowOp = {
            operation,
            duration,
            threshold,
            timestamp: Date.now(),
            ratio: duration / threshold
        };

        if (!this.metrics.has('slowOperations')) {
            this.metrics.set('slowOperations', []);
        }

        this.metrics.get('slowOperations').push(slowOp);
    }

    getMetrics(name = null) {
        if (name) {
            return this.metrics.get(name) || [];
        }
        
        const result = {};
        this.metrics.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    getAverageMetric(name) {
        const history = this.metrics.get(name);
        if (!history || history.length === 0) {
            return null;
        }

        const sum = history.reduce((acc, metric) => acc + metric.value, 0);
        return {
            average: sum / history.length,
            count: history.length,
            min: Math.min(...history.map(m => m.value)),
            max: Math.max(...history.map(m => m.value))
        };
    }

    getPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {},
            slowOperations: this.metrics.get('slowOperations') || [],
            recommendations: []
        };

        // Calculate averages for known operations
        Object.keys(this.thresholds).forEach(operation => {
            const stats = this.getAverageMetric(operation);
            if (stats) {
                report.summary[operation] = {
                    ...stats,
                    threshold: this.thresholds[operation],
                    performanceRating: this.getPerformanceRating(stats.average, this.thresholds[operation])
                };
            }
        });

        // Generate recommendations
        report.recommendations = this.generateRecommendations(report.summary);

        return report;
    }

    getPerformanceRating(average, threshold) {
        const ratio = average / threshold;
        if (ratio <= 0.5) return 'excellent';
        if (ratio <= 0.8) return 'good';
        if (ratio <= 1.0) return 'acceptable';
        if (ratio <= 1.5) return 'poor';
        return 'critical';
    }

    generateRecommendations(summary) {
        const recommendations = [];

        Object.entries(summary).forEach(([operation, stats]) => {
            if (stats.performanceRating === 'poor' || stats.performanceRating === 'critical') {
                switch (operation) {
                    case 'speechProcessing':
                        recommendations.push({
                            type: 'performance',
                            operation,
                            message: 'Speech processing is slow. Consider reducing audio quality or optimizing recognition settings.',
                            priority: 'high'
                        });
                        break;
                    case 'llmResponse':
                        recommendations.push({
                            type: 'performance',
                            operation,
                            message: 'LLM responses are slow. Consider using a faster model or implementing response caching.',
                            priority: 'medium'
                        });
                        break;
                    case 'uiUpdate':
                        recommendations.push({
                            type: 'performance',
                            operation,
                            message: 'UI updates are slow. Consider debouncing updates or using virtual DOM techniques.',
                            priority: 'high'
                        });
                        break;
                }
            }
        });

        return recommendations;
    }

    // Memory usage monitoring
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                usagePercentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
            };
        }
        return null;
    }

    // Network performance
    async measureNetworkLatency(url = '/favicon.ico') {
        const startTime = performance.now();
        
        try {
            await fetch(url + '?t=' + Date.now(), { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            const latency = performance.now() - startTime;
            this.recordMetric('networkLatency', latency);
            return latency;
        } catch (error) {
            console.warn('Network latency test failed:', error);
            return null;
        }
    }

    // Clear old metrics to prevent memory leaks
    clearOldMetrics(maxAge = 3600000) { // 1 hour default
        const cutoff = Date.now() - maxAge;
        
        this.metrics.forEach((history, name) => {
            if (Array.isArray(history)) {
                const filtered = history.filter(metric => metric.timestamp > cutoff);
                this.metrics.set(name, filtered);
            }
        });
    }

    // Export performance data
    exportMetrics() {
        const data = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            metrics: this.getMetrics(),
            performanceReport: this.getPerformanceReport(),
            memoryUsage: this.getMemoryUsage()
        };

        return JSON.stringify(data, null, 2);
    }
}

/**
 * Cache Management System with performance optimization
 */
class CacheManager {
    constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
        this.cache = new Map();
        this.accessTimes = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.hitCount = 0;
        this.missCount = 0;
    }

    set(key, value, customTTL = null) {
        const now = Date.now();
        const expiry = now + (customTTL || this.ttl);

        // Remove expired entries before adding new one
        this.cleanup();

        // If at max size, remove least recently used
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        this.cache.set(key, {
            value,
            created: now,
            expiry,
            accessed: now
        });

        this.accessTimes.set(key, now);
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.missCount++;
            return null;
        }

        const now = Date.now();
        
        // Check if expired
        if (now > item.expiry) {
            this.cache.delete(key);
            this.accessTimes.delete(key);
            this.missCount++;
            return null;
        }

        // Update access time
        item.accessed = now;
        this.accessTimes.set(key, now);
        this.hitCount++;

        return item.value;
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            this.accessTimes.delete(key);
            return false;
        }
        
        return true;
    }

    delete(key) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
    }

    clear() {
        this.cache.clear();
        this.accessTimes.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    cleanup() {
        const now = Date.now();
        const toDelete = [];

        this.cache.forEach((item, key) => {
            if (now > item.expiry) {
                toDelete.push(key);
            }
        });

        toDelete.forEach(key => {
            this.cache.delete(key);
            this.accessTimes.delete(key);
        });
    }

    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();

        this.accessTimes.forEach((time, key) => {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        });

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    getStats() {
        const total = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: total > 0 ? (this.hitCount / total) * 100 : 0,
            efficiency: this.cache.size > 0 ? (this.hitCount / this.cache.size) : 0
        };
    }
}

// Create global instances
const performanceMonitor = new PerformanceMonitor();
const suggestionCache = new CacheManager(100, 300000); // 5 minute TTL
const responseCache = new CacheManager(50, 600000); // 10 minute TTL

// Utility functions for easy integration
const performance_utils = {
    timer: (operation) => performanceMonitor.startTiming(operation),
    endTimer: (timingId) => performanceMonitor.endTiming(timingId),
    metric: (name, value, metadata) => performanceMonitor.recordMetric(name, value, metadata),
    cache: suggestionCache,
    responseCache: responseCache,
    monitor: performanceMonitor
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor, CacheManager, performanceMonitor, suggestionCache, responseCache, performance_utils };
}

// Make available globally
window.performanceMonitor = performanceMonitor;
window.suggestionCache = suggestionCache;
window.responseCache = responseCache;
window.performance_utils = performance_utils;