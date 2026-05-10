import { useEffect, useState, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws';
const API_URL = 'http://localhost:8000';

/**
 * WebSocket hook for real-time telemetry streaming
 */
export const useTelemetry = () => {
    const [telemetry, setTelemetry] = useState(null);
    const [audit, setAudit] = useState([]);
    const [tempHistory, setTempHistory] = useState([]);
    const [pressureHistory, setPressureHistory] = useState([]);
    const [status, setStatus] = useState('DISCONNECTED');
    const ws = useRef(null);

    useEffect(() => {
        const connect = () => {
            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => setStatus('CONNECTED');
            ws.current.onclose = () => {
                setStatus('DISCONNECTED');
                setTimeout(connect, 3000); // Reconnect after 3s
            };
            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('ERROR');
            };
            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Backend sends {telemetry: {...}, audit: [...]}
                    setTelemetry(data.telemetry || data);

                    if (Array.isArray(data.audit)) {
                        setAudit(data.audit);
                    }

                    // Track temperature history
                    const tempValue = data?.telemetry?.temp ?? data?.temp;
                    if (typeof tempValue === 'number') {
                        setTempHistory((prev) => {
                            const next = [...prev, tempValue];
                            return next.slice(-60); // Keep last 60 samples
                        });
                    }

                    // Track pressure history
                    const pressureValue = data?.telemetry?.pressure ?? data?.pressure;
                    if (typeof pressureValue === 'number') {
                        setPressureHistory((prev) => {
                            const next = [...prev, pressureValue];
                            return next.slice(-60);
                        });
                    }
                } catch (e) {
                    console.error('Error parsing telemetry:', e);
                }
            };
        };

        connect();
        return () => ws.current?.close();
    }, []);

    const sendControl = useCallback((command) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(command));
        } else {
            console.warn('WebSocket not connected, command not sent:', command);
        }
    }, []);

    return {
        telemetry,
        audit,
        tempHistory,
        pressureHistory,
        status,
        sendControl
    };
};


/**
 * REST API functions for batch reports and data retrieval
 */
export const api = {
    // Get current reactor status
    getStatus: async () => {
        const response = await fetch(`${API_URL}/api/status`);
        return response.json();
    },

    // Get detailed recipe status
    getRecipeStatus: async () => {
        const response = await fetch(`${API_URL}/api/recipe/status`);
        return response.json();
    },

    // Get recipe steps
    getRecipeSteps: async () => {
        const response = await fetch(`${API_URL}/api/recipe/steps`);
        return response.json();
    },

    // Start recipe
    startRecipe: async () => {
        const response = await fetch(`${API_URL}/api/recipe/start`, { method: 'POST' });
        return response.json();
    },

    // Stop recipe
    stopRecipe: async () => {
        const response = await fetch(`${API_URL}/api/recipe/stop`, { method: 'POST' });
        return response.json();
    },

    // Reset recipe
    resetRecipe: async () => {
        const response = await fetch(`${API_URL}/api/recipe/reset`, { method: 'POST' });
        return response.json();
    },

    // Get batch summary
    getBatchSummary: async () => {
        const response = await fetch(`${API_URL}/api/batch/summary`);
        return response.json();
    },

    // Generate and download batch report
    downloadBatchReport: async () => {
        const response = await fetch(`${API_URL}/api/batch/report`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `batch_report_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return true;
        }
        return false;
    },

    // List all batch reports
    listBatchReports: async () => {
        const response = await fetch(`${API_URL}/api/batch/reports`);
        return response.json();
    },

    // Download specific batch report
    downloadReport: async (filename) => {
        const response = await fetch(`${API_URL}/api/batch/report/${filename}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return true;
        }
        return false;
    },

    // Get telemetry history
    getTelemetryHistory: async () => {
        const response = await fetch(`${API_URL}/api/telemetry/history`);
        return response.json();
    },

    // Get events log
    getEvents: async () => {
        const response = await fetch(`${API_URL}/api/events`);
        return response.json();
    },

    // Get control actions log
    getControlActions: async () => {
        const response = await fetch(`${API_URL}/api/control-actions`);
        return response.json();
    },

    // Send control command
    sendControl: async (command) => {
        const response = await fetch(`${API_URL}/api/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });
        return response.json();
    },

    // Get faults status
    getFaults: async () => {
        const response = await fetch(`${API_URL}/api/faults`);
        return response.json();
    },

    // Toggle fault
    toggleFault: async (faultName) => {
        const response = await fetch(`${API_URL}/api/fault/${faultName}/toggle`, { method: 'POST' });
        return response.json();
    },

    // Get interlock status
    getInterlocks: async () => {
        const response = await fetch(`${API_URL}/api/interlocks`);
        return response.json();
    }
};


/**
 * Hook for batch report management
 */
export const useBatchReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.listBatchReports();
            setReports(data.reports || []);
            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const downloadReport = useCallback(async (filename) => {
        return api.downloadReport(filename);
    }, []);

    const generateReport = useCallback(async () => {
        const success = await api.downloadBatchReport();
        if (success) {
            await fetchReports(); // Refresh list
        }
        return success;
    }, [fetchReports]);

    return {
        reports,
        loading,
        error,
        fetchReports,
        downloadReport,
        generateReport
    };
};
