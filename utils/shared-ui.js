/**
 * Shared UI Utilities
 * Common UI functionality and helpers for both V1 and V2 interfaces
 */

class SharedUIHelpers {
    /**
     * Text processing and highlighting utilities
     */
    static textProcessing = {
        /**
         * Highlight keywords in text (for V2 interface)
         */
        highlightKeywords(text) {
            if (!text || typeof text !== 'string') return text;

            // Define patterns for highlighting
            const patterns = [
                {
                    // Proper nouns (capitalized words, but not at sentence start)
                    regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
                    className: 'highlight-proper-noun',
                    excludeAtStart: true
                },
                {
                    // Numbers, dates, times, monetary amounts
                    regex: /\b(?:\d+(?:,\d{3})*(?:\.\d+)?|\$\d+(?:,\d{3})*(?:\.\d{2})?|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}:\d{2}(?:\s*[APap][Mm])?)\b/g,
                    className: 'highlight-number'
                }
            ];

            let highlightedText = text;

            patterns.forEach(pattern => {
                highlightedText = highlightedText.replace(pattern.regex, (match, offset) => {
                    // Skip if it's at the beginning of a sentence and excludeAtStart is true
                    if (pattern.excludeAtStart && (offset === 0 || /[.!?]\s*$/.test(text.substring(0, offset)))) {
                        return match;
                    }

                    // Avoid highlighting common words
                    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'But', 'And', 'Or', 'So'];
                    if (commonWords.includes(match.trim())) {
                        return match;
                    }

                    return `<span class="${pattern.className}">${match}</span>`;
                });
            });

            return highlightedText;
        },

        /**
         * Clean and format text for display
         */
        cleanText(text) {
            if (!text) return '';
            
            return text
                .trim()
                .replace(/\s+/g, ' ') // Normalize whitespace
                .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Ensure space after punctuation
                .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase
        },

        /**
         * Truncate text with ellipsis
         */
        truncateText(text, maxLength = 100) {
            if (!text || text.length <= maxLength) return text;
            
            return text.substring(0, maxLength - 3) + '...';
        },

        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(text) {
            if (!text) return '';
            
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    /**
     * Animation utilities
     */
    static animations = {
        /**
         * Pulse animation for recording state
         */
        pulseElement(element, options = {}) {
            if (!element) return;

            const {
                duration = 1000,
                intensity = 0.8,
                color = '#007bff'
            } = options;

            element.style.transition = `all ${duration / 2}ms ease-in-out`;
            element.style.transform = `scale(${1 + intensity * 0.1})`;
            element.style.boxShadow = `0 0 20px ${color}`;

            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.boxShadow = 'none';
            }, duration / 2);
        },

        /**
         * Fade in animation
         */
        fadeIn(element, duration = 300) {
            if (!element) return;

            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
        },

        /**
         * Fade out animation
         */
        fadeOut(element, duration = 300) {
            if (!element) return;

            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        },

        /**
         * Slide in from bottom
         */
        slideInFromBottom(element, duration = 300) {
            if (!element) return;

            element.style.transform = 'translateY(100%)';
            element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
            });
        },

        /**
         * Bounce animation
         */
        bounce(element, options = {}) {
            if (!element) return;

            const { intensity = 0.2, duration = 600 } = options;
            
            element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
            element.style.transform = `scale(${1 + intensity})`;
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, duration / 2);
        }
    };

    /**
     * Status indicator utilities
     */
    static statusIndicators = {
        /**
         * Update status with color coding
         */
        updateStatus(element, status, message = '') {
            if (!element) return;

            const statusClasses = {
                'ready': 'status-ready',
                'listening': 'status-listening',
                'processing': 'status-processing',
                'error': 'status-error',
                'offline': 'status-offline'
            };

            // Remove all status classes
            Object.values(statusClasses).forEach(cls => {
                element.classList.remove(cls);
            });

            // Add current status class
            if (statusClasses[status]) {
                element.classList.add(statusClasses[status]);
            }

            // Update text if provided
            if (message) {
                element.textContent = message;
            }
        },

        /**
         * Create status indicator element
         */
        createStatusIndicator(status, message) {
            const indicator = document.createElement('div');
            indicator.className = 'status-indicator';
            
            const dot = document.createElement('span');
            dot.className = 'status-dot';
            
            const text = document.createElement('span');
            text.className = 'status-text';
            text.textContent = message;

            indicator.appendChild(dot);
            indicator.appendChild(text);

            this.updateStatus(indicator, status);
            
            return indicator;
        }
    };

    /**
     * Loading and feedback utilities
     */
    static feedback = {
        /**
         * Show loading spinner
         */
        showLoading(container, message = 'Loading...') {
            if (!container) return;

            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-container';
            loadingDiv.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            `;

            container.appendChild(loadingDiv);
            return loadingDiv;
        },

        /**
         * Hide loading spinner
         */
        hideLoading(container) {
            if (!container) return;

            const loadingElement = container.querySelector('.loading-container');
            if (loadingElement) {
                loadingElement.remove();
            }
        },

        /**
         * Show toast notification
         */
        showToast(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;

            // Add to page
            document.body.appendChild(toast);

            // Animate in
            requestAnimationFrame(() => {
                toast.classList.add('toast-show');
            });

            // Remove after duration
            setTimeout(() => {
                toast.classList.remove('toast-show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);

            return toast;
        },

        /**
         * Show confirmation dialog
         */
        showConfirmation(message, onConfirm, onCancel) {
            const overlay = document.createElement('div');
            overlay.className = 'confirmation-overlay';
            
            overlay.innerHTML = `
                <div class="confirmation-dialog">
                    <div class="confirmation-message">${message}</div>
                    <div class="confirmation-buttons">
                        <button class="btn-confirm">Confirm</button>
                        <button class="btn-cancel">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Event handlers
            overlay.querySelector('.btn-confirm').onclick = () => {
                overlay.remove();
                if (onConfirm) onConfirm();
            };

            overlay.querySelector('.btn-cancel').onclick = () => {
                overlay.remove();
                if (onCancel) onCancel();
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    if (onCancel) onCancel();
                }
            };

            return overlay;
        }
    };

    /**
     * Accessibility utilities
     */
    static accessibility = {
        /**
         * Announce text to screen readers
         */
        announce(message, priority = 'polite') {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', priority);
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;

            document.body.appendChild(announcement);

            // Remove after announcement
            setTimeout(() => {
                if (announcement.parentNode) {
                    announcement.parentNode.removeChild(announcement);
                }
            }, 1000);
        },

        /**
         * Set ARIA attributes for dynamic content
         */
        setAriaAttributes(element, attributes) {
            if (!element) return;

            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(`aria-${key}`, value);
            });
        },

        /**
         * Focus management
         */
        trapFocus(container) {
            if (!container) return;

            const focusableElements = container.querySelectorAll(
                'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleTabKey = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            };

            container.addEventListener('keydown', handleTabKey);
            
            // Return cleanup function
            return () => {
                container.removeEventListener('keydown', handleTabKey);
            };
        }
    };

    /**
     * Storage utilities
     */
    static storage = {
        /**
         * Save to localStorage with error handling
         */
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
                return false;
            }
        },

        /**
         * Load from localStorage with error handling
         */
        load(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Failed to load from localStorage:', error);
                return defaultValue;
            }
        },

        /**
         * Remove from localStorage
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Failed to remove from localStorage:', error);
                return false;
            }
        },

        /**
         * Clear all localStorage
         */
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
                return false;
            }
        }
    };

    /**
     * Utility functions
     */
    static utils = {
        /**
         * Debounce function calls
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Throttle function calls
         */
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Format timestamp
         */
        formatTimestamp(timestamp, format = 'short') {
            const date = new Date(timestamp);
            
            if (format === 'short') {
                return date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else if (format === 'long') {
                return date.toLocaleString();
            } else if (format === 'relative') {
                const now = Date.now();
                const diff = now - timestamp;
                
                if (diff < 60000) return 'Just now';
                if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
                if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
                return `${Math.floor(diff / 86400000)} days ago`;
            }
            
            return date.toString();
        },

        /**
         * Generate unique ID
         */
        generateId(prefix = 'id') {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    };
}

// Export for both module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedUIHelpers;
} else {
    window.SharedUIHelpers = SharedUIHelpers;
}