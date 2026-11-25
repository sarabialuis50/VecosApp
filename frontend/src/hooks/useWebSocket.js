import { useState, useEffect, useCallback, useRef } from 'react';

const getBackendWsUrl = (negocioId) => {
  const envUrl = (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL));

  let baseUrl = '';
  if (envUrl && envUrl.startsWith('http')) {
    baseUrl = envUrl.replace(/^http/, 'ws');
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    baseUrl = `${protocol}//${window.location.host}${envUrl || '/api'}`;
  }

  baseUrl = baseUrl.replace(/\/$/, '');
  return `${baseUrl}/ws/${negocioId}`;
};

/**
 * useWebSocket — connects to one or more negocio WebSocket channels.
 *
 * @param {string | string[]} negocioIds - A single ID or an array of IDs (for super admin multi-branch).
 *
 * For the super admin, pass all child sede IDs plus the parent ID so that
 * any order event from any branch triggers a kitchen refresh.
 */
export const useWebSocket = (negocioIds) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRefs = useRef([]);
  const reconnectTimeoutsRef = useRef([]);

  // Normalize to array
  const ids = Array.isArray(negocioIds)
    ? negocioIds.filter(Boolean)
    : negocioIds ? [negocioIds] : [];

  const connectAll = useCallback(() => {
    if (ids.length === 0) return;

    ids.forEach((id) => {
      // Avoid duplicate connections
      if (wsRefs.current.find(ws => ws.__id === id && ws.readyState === WebSocket.OPEN)) return;

      try {
        const ws = new WebSocket(getBackendWsUrl(id));
        ws.__id = id;

        ws.onopen = () => {
          setIsConnected(true);
          console.log(`WebSocket connected [${id}]`);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          // Mark disconnected only if ALL sockets are closed
          const anyOpen = wsRefs.current.some(s => s.readyState === WebSocket.OPEN && s.__id !== id);
          if (!anyOpen) setIsConnected(false);
          console.log(`WebSocket disconnected [${id}]`);
          // Reconnect after 3 seconds
          const t = setTimeout(() => connectAll(), 3000);
          reconnectTimeoutsRef.current.push(t);
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error [${id}]:`, error);
        };

        wsRefs.current = [...wsRefs.current.filter(s => s.__id !== id), ws];
      } catch (error) {
        console.error(`Failed to create WebSocket for [${id}]:`, error);
      }
    });
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnectAll = useCallback(() => {
    reconnectTimeoutsRef.current.forEach(clearTimeout);
    reconnectTimeoutsRef.current = [];
    wsRefs.current.forEach(ws => ws.close());
    wsRefs.current = [];
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connectAll();
    return () => disconnectAll();
  }, [connectAll, disconnectAll]);

  return { isConnected, lastMessage };
};

export default useWebSocket;
