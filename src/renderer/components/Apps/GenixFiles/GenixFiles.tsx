import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_WS_URL } from '../../../config';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
}

// Shared connection guard to prevent React StrictMode from creating duplicate connections
let globalWsConnection: WebSocket | null = null;

const GenixFiles: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]); // Track navigation history
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  const requestDirectory = (path: string) => {
    if (!wsRef.current) {
      console.log('GenixFiles: WebSocket ref is null');
      setError('Not connected');
      setLoading(false);
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('GenixFiles: WebSocket not open, state:', wsRef.current.readyState);
      setError('Connection not ready');
      setLoading(false);
      return;
    }

    // Clear any existing timeout
    if ((wsRef.current as any)._loadingTimeout) {
      clearTimeout((wsRef.current as any)._loadingTimeout);
      (wsRef.current as any)._loadingTimeout = null;
    }

    setLoading(true);
    setError('');
    // Send empty string or '.' for root, otherwise the path
    const requestPath = !path || path === '' ? '.' : path;
    console.log('GenixFiles: Requesting directory:', requestPath);
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      // Check if timeout is still set (means we haven't received response)
      if (wsRef.current && (wsRef.current as any)._loadingTimeout === loadingTimeout) {
        console.warn('GenixFiles: Request timeout after 5s');
        console.warn('GenixFiles: Current WebSocket state:', wsRef.current?.readyState);
        console.warn('GenixFiles: Request path was:', requestPath);
        setLoading(false);
        setError('Request timed out. The backend may not be responding.');
        // Clear the timeout reference
        (wsRef.current as any)._loadingTimeout = null;
      } else {
        console.log('GenixFiles: Timeout fired but response was already received');
      }
    }, 5000); // 5 second timeout (backend responds quickly)
    
    try {
      const message = JSON.stringify({
        type: 'file',
        action: 'list',
        path: requestPath,
      });
      console.log('GenixFiles: Sending message:', message);
      console.log('GenixFiles: WebSocket instance:', wsRef.current);
      console.log('GenixFiles: WebSocket URL:', wsRef.current?.url);
      console.log('GenixFiles: WebSocket readyState:', wsRef.current?.readyState);
      
      // Verify we're using the correct WebSocket instance
      if (wsRef.current !== wsRef.current) {
        console.error('GenixFiles: WebSocket ref mismatch!');
      }
      
      const wsInstance = wsRef.current;
      console.log('GenixFiles: WebSocket instance connection ID:', (wsInstance as any)?._connectionId);
      console.log('GenixFiles: onmessage handler attached:', typeof wsInstance.onmessage === 'function');
      console.log('GenixFiles: onopen handler attached:', typeof wsInstance.onopen === 'function');
      
      wsInstance.send(message);
      console.log('GenixFiles: Message sent successfully on connection:', (wsInstance as any)?._connectionId);
      
      // Store timeout ID to clear it when response arrives
      (wsInstance as any)._loadingTimeout = loadingTimeout;
      console.log('GenixFiles: Request sent, waiting for response...');
    } catch (err) {
      clearTimeout(loadingTimeout);
      console.error('GenixFiles: Error sending request:', err);
      setError('Failed to send request');
      setLoading(false);
    }
  };

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let isMounted = true;
    let connectionAttempted = false;
    const connectionId = Math.random().toString(36).substring(7);
    console.log('GenixFiles: useEffect mounted, connection ID:', connectionId);

    // Setup event handlers for a WebSocket connection
    const setupHandlers = (ws: WebSocket) => {
      ws.onopen = () => {
        console.log('GenixFiles: [', connectionId, '] WebSocket connected, readyState:', ws.readyState);
        if (isMounted && ws.readyState === WebSocket.OPEN) {
          setConnected(true);
          setError('');
          // Use requestDirectory to ensure timeout is set up properly
          console.log('GenixFiles: Connection open, requesting directory');
          // Small delay to ensure all handlers are set up
          setTimeout(() => {
            if (isMounted && wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
              requestDirectory(currentPath);
            }
          }, 100);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        console.log('GenixFiles: [', connectionId, '] Raw message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('GenixFiles: [', connectionId, '] Parsed message', data);
          if (data.type === 'file' && data.action === 'list') {
            // Clear any loading timeout
            if (wsRef.current && (wsRef.current as any)._loadingTimeout) {
              clearTimeout((wsRef.current as any)._loadingTimeout);
              (wsRef.current as any)._loadingTimeout = null;
            }
            console.log('GenixFiles: [', connectionId, '] File list received, items:', data.items?.length || 0);
            const fileItems = data.items || [];
            setFiles(fileItems);
            setLoading(false);
            setError('');
          } else if (data.type === 'error') {
            // Clear any loading timeout
            if (wsRef.current && (wsRef.current as any)._loadingTimeout) {
              clearTimeout((wsRef.current as any)._loadingTimeout);
              (wsRef.current as any)._loadingTimeout = null;
            }
            console.error('GenixFiles: [', connectionId, '] Error response:', data.message);
            setError(data.message || 'Unknown error');
            setLoading(false);
            setFiles([]);
          } else {
            console.log('GenixFiles: [', connectionId, '] Unknown message type:', data.type);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error parsing message:', err, 'Raw data:', event.data);
          setError('Error parsing server response');
          setLoading(false);
        }
      };

      ws.onerror = (error) => {
        console.error('GenixFiles: [', connectionId, '] WebSocket error:', error);
        console.error('WebSocket readyState:', ws.readyState);
        if (isMounted) {
          if (ws.readyState === WebSocket.CLOSED) {
            console.log('Connection failed, will be handled by onclose');
          } else {
            console.log('Error event but connection may still be establishing...');
          }
        }
      };

      ws.onclose = (event) => {
        console.log('GenixFiles: [', connectionId, '] WebSocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: BACKEND_WS_URL
        });
        connectionAttempted = false; // Reset so we can reconnect
        
        // Clear global connection if it's this one
        if (globalWsConnection === ws) {
          console.log('GenixFiles: [', connectionId, '] Clearing global connection');
          globalWsConnection = null;
        }
        
        // Clear any pending timeouts
        if (wsRef.current && (wsRef.current as any)._loadingTimeout) {
          clearTimeout((wsRef.current as any)._loadingTimeout);
          (wsRef.current as any)._loadingTimeout = null;
        }
        
        if (isMounted) {
          setConnected(false);
          setLoading(false);
          // Only clear ref if we're not going to reconnect
          if (event.code === 1000) {
            // Normal closure - don't auto-reconnect
            wsRef.current = null;
            setError('Connection closed');
          } else {
            // Abnormal closure or other errors - try to reconnect
            console.log(`Connection closed with code ${event.code} - will attempt reconnect`);
            setError('Connection lost. Reconnecting in 2 seconds...');
            // Don't clear ref yet - wait for reconnect
            reconnectTimeout = setTimeout(() => {
              if (isMounted) {
                console.log('Attempting to reconnect...');
                // Clear ref before reconnecting
                wsRef.current = null;
                connect();
              }
            }, 2000);
          }
        } else {
          wsRef.current = null;
        }
      };
    };

    const connect = () => {
      if (!isMounted) {
        console.log('GenixFiles: Component unmounted, not connecting');
        return;
      }
      
      // Check global connection first (prevents React StrictMode duplicates)
      if (globalWsConnection) {
        const state = globalWsConnection.readyState;
        if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) {
          console.log('GenixFiles: [', connectionId, '] Global connection exists and is active, reusing it');
          wsRef.current = globalWsConnection;
          // Reattach handlers to this instance (React StrictMode second instance needs its own handlers)
          setupHandlers(globalWsConnection);
          // Update connected state if it's open
          if (state === WebSocket.OPEN) {
            setConnected(true);
            setError('');
            // Request directory if we're reusing an existing connection
            setTimeout(() => requestDirectory(currentPath), 100);
          }
          return;
        } else {
          // Clean up closed global connection
          console.log('GenixFiles: Global connection is closed, cleaning up');
          globalWsConnection = null;
        }
      }
      
      // Check local ref
      if (wsRef.current) {
        const state = wsRef.current.readyState;
        if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) {
          console.log('GenixFiles: Local connection exists and is active, state:', state);
          return;
        }
        if (state === WebSocket.CLOSED || state === WebSocket.CLOSING) {
          wsRef.current = null;
        }
      }
      
      if (connectionAttempted) {
        console.log('GenixFiles: Connection already attempted in this effect, waiting...');
        return;
      }

      try {
        connectionAttempted = true;
        console.log('GenixFiles: [', connectionId, '] Connecting to', BACKEND_WS_URL);
        const ws = new WebSocket(BACKEND_WS_URL);
        (ws as any)._connectionId = connectionId; // Tag this connection
        wsRef.current = ws;
        globalWsConnection = ws; // Store globally
        console.log('GenixFiles: [', connectionId, '] WebSocket created, ref and global set');
        
        // Setup handlers
        setupHandlers(ws);
      } catch (err) {
        console.error('GenixFiles: Failed to create WebSocket', err);
        if (isMounted) {
          setError(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setConnected(false);
        }
      }
    };

    connect();

    return () => {
      console.log('GenixFiles: useEffect cleanup, connection ID:', connectionId);
      isMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      // Only close if this is our connection AND it's not the global one being used by another instance
      if (wsRef.current && (wsRef.current as any)._connectionId === connectionId) {
        // Don't close if this is the global connection (might be used by React StrictMode's second instance)
        if (globalWsConnection === wsRef.current) {
          console.log('GenixFiles: Not closing - this is the global connection, might be used by another instance');
          // Just clear our local ref, but keep the global connection alive
          wsRef.current = null;
        } else {
          console.log('GenixFiles: Closing our connection on cleanup');
          // Don't close if it's already closed or closing
          if (wsRef.current.readyState !== WebSocket.CLOSED && wsRef.current.readyState !== WebSocket.CLOSING) {
            wsRef.current.close();
          }
          wsRef.current = null;
        }
      } else {
        console.log('GenixFiles: Not closing connection - it belongs to a different effect instance');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only request if we have a stable connection
    if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('GenixFiles: Path changed to:', currentPath, '- requesting directory');
      requestDirectory(currentPath);
    } else if (currentPath !== '') {
      // If path changed but not connected, wait a bit and try again
      console.log('GenixFiles: Path changed but not connected yet, will retry');
      const timeout = setTimeout(() => {
        if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
          requestDirectory(currentPath);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPath, connected]);

  const handleItemClick = (item: FileItem) => {
    console.log('GenixFiles: Item clicked:', item.name, 'type:', item.type, 'currentPath:', currentPath);
    if (item.type === 'directory') {
      const newPath = currentPath === '' || currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
      console.log('GenixFiles: Navigating to directory, new path:', newPath);
      // Add current path to history before navigating
      if (currentPath !== '' && currentPath !== '.') {
        setPathHistory(prev => [...prev, currentPath]);
      }
      // Force update by clearing files first, then setting new path
      setFiles([]);
      setCurrentPath(newPath);
      // Also manually trigger request if connected
      setTimeout(() => {
        if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('GenixFiles: Manually requesting directory after navigation');
          requestDirectory(newPath);
        }
      }, 100);
    } else {
      console.log('GenixFiles: File clicked (not a directory, no action)');
    }
  };

  const basePathLabel = 'GenixFiles';
  const displayPath = currentPath === '.' || currentPath === '' ? basePathLabel : `${basePathLabel}/${currentPath}`;

  const handleRefresh = () => {
    console.log('GenixFiles: Refresh clicked');
    console.log('GenixFiles: Connection state - connected:', connected);
    console.log('GenixFiles: WebSocket ref exists:', !!wsRef.current);
    console.log('GenixFiles: WebSocket readyState:', wsRef.current?.readyState);
    console.log('GenixFiles: Current path:', currentPath);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('GenixFiles: WebSocket is open, refreshing directory');
      requestDirectory(currentPath);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      console.log('GenixFiles: WebSocket is connecting, waiting...');
      setError('Connection establishing, please wait...');
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          requestDirectory(currentPath);
        } else {
          setError('Connection failed to establish');
        }
      }, 2000);
    } else {
      // Force reconnect
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Trigger reconnection by updating state
      setConnected(false);
      setError('Reconnecting...');
      setTimeout(() => {
        const ws = new WebSocket(BACKEND_WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          setConnected(true);
          setError('');
          requestDirectory(currentPath);
        };
        ws.onerror = () => {
          setError('Connection failed. Check if backend is running.');
          setConnected(false);
        };
        ws.onclose = () => {
          setConnected(false);
        };
      }, 100);
    }
  };

  const handleGoUp = () => {
    if (currentPath && currentPath !== '' && currentPath !== '.') {
      const parts = currentPath.split('/');
      parts.pop();
      const newPath = parts.length === 0 ? '' : parts.join('/');
      console.log('GenixFiles: Going up, new path:', newPath);
      setFiles([]);
      setCurrentPath(newPath);
      // Manually trigger request
      setTimeout(() => {
        if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
          const requestPath = newPath === '' ? '.' : newPath;
          console.log('GenixFiles: Requesting directory after going up:', requestPath);
          requestDirectory(requestPath);
        }
      }, 100);
    }
  };

  const handleBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      console.log('GenixFiles: Going back to:', previousPath);
      setPathHistory(prev => prev.slice(0, -1)); // Remove last item from history
      setFiles([]);
      setCurrentPath(previousPath);
      // Manually trigger request
      setTimeout(() => {
        if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
          const requestPath = previousPath === '' ? '.' : previousPath;
          console.log('GenixFiles: Requesting directory after going back:', requestPath);
          requestDirectory(requestPath);
        }
      }, 100);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {pathHistory.length > 0 && (
            <button
              onClick={handleBack}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Go back"
            >
              ← Back
            </button>
          )}
          {currentPath && currentPath !== '' && currentPath !== '.' && (
            <button
              onClick={handleGoUp}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Go up"
            >
              ↑ Up
            </button>
          )}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Path:</span> {displayPath}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!connected && (
            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
              Not connected
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 bg-genix-blue text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            title={connected ? "Refresh" : "Reconnect"}
          >
            {connected ? '🔄 Refresh' : '🔌 Reconnect'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="text-center text-red-600 bg-red-50 p-4 rounded">
            <div className="font-medium mb-1">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-center text-gray-500">
            <div className="mb-2">No files found</div>
            <div className="text-xs text-gray-400">
              Files will appear here once you create them
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleItemClick(file);
                }}
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 active:bg-gray-200 flex items-center space-x-2 transition-colors ${
                  file.type === 'directory' ? 'font-medium' : ''
                }`}
                title={file.type === 'directory' ? `Double-click to open ${file.name}` : file.name}
              >
                <span>{file.type === 'directory' ? '📁' : '📄'}</span>
                <span className="text-gray-900">{file.name}</span>
                {file.type === 'directory' && (
                  <span className="text-xs text-gray-400 ml-auto">→</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenixFiles;

