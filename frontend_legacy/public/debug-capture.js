/**
 * Debug Capture Script - Captures all console logs, errors, and network requests
 * Persists to localStorage so data survives page refreshes
 * 
 * Usage: Add this script to index.html before other scripts
 * View logs: Open console and type: debugCapture.show() or debugCapture.export()
 */

(function() {
    const MAX_LOGS = 500;
    const STORAGE_KEY = 'debug_capture_logs';
    
    // Initialize or load existing logs
    let logs = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            logs = JSON.parse(stored);
        }
    } catch (e) {
        logs = [];
    }
    
    // Add session marker
    logs.push({
        type: 'SESSION_START',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
    });
    
    function saveLogs() {
        try {
            // Keep only last MAX_LOGS entries
            if (logs.length > MAX_LOGS) {
                logs = logs.slice(-MAX_LOGS);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        } catch (e) {
            // Storage full - trim more aggressively
            logs = logs.slice(-100);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
            } catch (e2) {
                // Give up on storage
            }
        }
    }
    
    function addLog(type, data) {
        logs.push({
            type,
            timestamp: new Date().toISOString(),
            data,
            url: window.location.href
        });
        saveLogs();
    }
    
    // Capture console methods
    const originalConsole = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console),
        debug: console.debug.bind(console)
    };
    
    function stringify(args) {
        return Array.from(args).map(arg => {
            if (arg instanceof Error) {
                return { message: arg.message, stack: arg.stack, name: arg.name };
            }
            if (typeof arg === 'object') {
                try {
                    return JSON.parse(JSON.stringify(arg, (key, value) => {
                        if (typeof value === 'function') return '[Function]';
                        if (value instanceof Element) return '[Element]';
                        return value;
                    }));
                } catch (e) {
                    return String(arg);
                }
            }
            return arg;
        });
    }
    
    console.log = function(...args) {
        addLog('console.log', stringify(args));
        originalConsole.log(...args);
    };
    
    console.warn = function(...args) {
        addLog('console.warn', stringify(args));
        originalConsole.warn(...args);
    };
    
    console.error = function(...args) {
        addLog('console.error', stringify(args));
        originalConsole.error(...args);
    };
    
    console.info = function(...args) {
        addLog('console.info', stringify(args));
        originalConsole.info(...args);
    };
    
    console.debug = function(...args) {
        addLog('console.debug', stringify(args));
        originalConsole.debug(...args);
    };
    
    // Capture uncaught errors
    window.addEventListener('error', function(event) {
        addLog('window.error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? { 
                message: event.error.message, 
                stack: event.error.stack,
                name: event.error.name 
            } : null
        });
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        addLog('unhandledrejection', {
            reason: event.reason ? {
                message: event.reason.message || String(event.reason),
                stack: event.reason.stack,
                name: event.reason.name
            } : String(event.reason)
        });
    });
    
    // Capture fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        const requestInfo = {
            url: typeof url === 'string' ? url : url.url,
            method: options?.method || 'GET',
            headers: options?.headers || {}
        };
        
        const startTime = Date.now();
        
        return originalFetch.apply(this, arguments)
            .then(response => {
                addLog('fetch.response', {
                    ...requestInfo,
                    status: response.status,
                    statusText: response.statusText,
                    duration: Date.now() - startTime,
                    ok: response.ok
                });
                return response;
            })
            .catch(error => {
                addLog('fetch.error', {
                    ...requestInfo,
                    error: error.message,
                    duration: Date.now() - startTime
                });
                throw error;
            });
    };
    
    // Capture XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
        this._debugInfo = { method, url, startTime: null };
        return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
        if (this._debugInfo) {
            this._debugInfo.startTime = Date.now();
            
            this.addEventListener('load', () => {
                addLog('xhr.response', {
                    ...this._debugInfo,
                    status: this.status,
                    statusText: this.statusText,
                    duration: Date.now() - this._debugInfo.startTime
                });
            });
            
            this.addEventListener('error', () => {
                addLog('xhr.error', {
                    ...this._debugInfo,
                    error: 'Network error',
                    duration: Date.now() - this._debugInfo.startTime
                });
            });
        }
        return originalXHRSend.apply(this, arguments);
    };
    
    // Capture navigation
    window.addEventListener('beforeunload', function() {
        addLog('navigation.beforeunload', { from: window.location.href });
    });
    
    // Capture localStorage changes related to auth
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
        if (key.includes('auth') || key.includes('token') || key === 'auth-storage') {
            addLog('localStorage.set', { 
                key, 
                valuePreview: value?.substring?.(0, 200) || String(value).substring(0, 200)
            });
        }
        return originalSetItem(key, value);
    };
    
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    localStorage.removeItem = function(key) {
        if (key.includes('auth') || key.includes('token') || key === 'auth-storage') {
            addLog('localStorage.remove', { key });
        }
        return originalRemoveItem(key);
    };
    
    // Global debug interface
    window.debugCapture = {
        // Show all logs in console
        show: function(filter) {
            const filtered = filter 
                ? logs.filter(l => l.type.includes(filter) || JSON.stringify(l.data || {}).includes(filter))
                : logs;
            originalConsole.log('=== DEBUG CAPTURE LOGS ===');
            originalConsole.log('Total entries:', filtered.length);
            originalConsole.log('---');
            filtered.forEach((log, i) => {
                originalConsole.log(`[${i}] ${log.timestamp} [${log.type}]`, log.data || '');
            });
            return filtered;
        },
        
        // Show only errors
        errors: function() {
            return this.show('error');
        },
        
        // Show auth-related logs
        auth: function() {
            const authLogs = logs.filter(l => 
                l.type.includes('localStorage') ||
                l.type.includes('auth') ||
                (l.data && JSON.stringify(l.data).toLowerCase().includes('auth')) ||
                (l.data && JSON.stringify(l.data).toLowerCase().includes('login')) ||
                (l.data && JSON.stringify(l.data).toLowerCase().includes('token'))
            );
            originalConsole.log('=== AUTH RELATED LOGS ===');
            authLogs.forEach((log, i) => {
                originalConsole.log(`[${i}] ${log.timestamp} [${log.type}]`, log.data || '');
            });
            return authLogs;
        },
        
        // Export as JSON file
        export: function() {
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            originalConsole.log('Logs exported!');
        },
        
        // Get raw logs array
        raw: function() {
            return logs;
        },
        
        // Clear all logs
        clear: function() {
            logs = [];
            localStorage.removeItem(STORAGE_KEY);
            originalConsole.log('Debug logs cleared!');
        },
        
        // Show last N entries
        last: function(n = 20) {
            const recent = logs.slice(-n);
            originalConsole.log(`=== LAST ${n} LOG ENTRIES ===`);
            recent.forEach((log, i) => {
                originalConsole.log(`[${i}] ${log.timestamp} [${log.type}]`, log.data || '');
            });
            return recent;
        },
        
        // Copy to clipboard
        copy: function() {
            const text = JSON.stringify(logs, null, 2);
            navigator.clipboard.writeText(text).then(() => {
                originalConsole.log('Logs copied to clipboard!');
            }).catch(err => {
                originalConsole.error('Failed to copy:', err);
            });
        }
    };
    
    originalConsole.log('%c🔴 Debug Capture Active', 'color: red; font-weight: bold; font-size: 14px');
    originalConsole.log('%cCommands: debugCapture.show() | debugCapture.errors() | debugCapture.auth() | debugCapture.export() | debugCapture.last(20) | debugCapture.clear() | debugCapture.copy()', 'color: blue');
})();
