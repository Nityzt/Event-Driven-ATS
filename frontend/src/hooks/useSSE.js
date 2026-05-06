// src/hooks/useSSE.js
import { useEffect, useState, useRef } from 'react';

/**
 * Hook for Server-Sent Events (SSE) connection
 * @param {string} url - SSE endpoint URL
 * @param {object} options - Configuration options
 * @returns {object} - { data, error, isConnected }
 */
const useSSE = (url, options = {}) => {
  const {
    enabled = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  // Use refs for callbacks to avoid re-connecting on callback changes
  const onMessageRef = useRef(options.onMessage);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onMessageRef.current = options.onMessage;
    onErrorRef.current = options.onError;
  }, [options.onMessage, options.onError]);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const eventSourceRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled || !url) return;

    const connect = () => {
      try {
        // Add auth token to URL if available
        const token = localStorage.getItem('token');
        const urlWithAuth = token 
          ? `${url}${url.includes('?') ? '&' : '?'}token=${token}`
          : url;

        const eventSource = new EventSource(urlWithAuth);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('SSE connection established');
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
            if (onMessageRef.current) onMessageRef.current(parsedData);
          } catch (err) {
            console.error('Failed to parse SSE message:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE error:', err);
          setIsConnected(false);
          eventSource.close();

          const errorMessage = 'SSE connection failed';
          setError(errorMessage);
          if (onErrorRef.current) onErrorRef.current(errorMessage);

          // Attempt reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            console.log(`Attempting reconnect ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectInterval);
          } else {
            console.error('Max reconnection attempts reached');
          }
        };

      } catch (err) {
        console.error('Failed to create SSE connection:', err);
        setError(err.message);
      }
    };

    connect();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url, enabled, reconnectInterval, maxReconnectAttempts]);

  return { data, error, isConnected };
};

export default useSSE;