import React, { useEffect, useRef, useState } from 'react';
import { BACKEND_WS_URL } from '../../../config';

const GenixShell: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatus('connected');
      inputRef.current?.focus();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'output' && terminalRef.current) {
        // TODO: Integrate with xterm.js for proper terminal emulation
        const output = document.createElement('div');
        output.textContent = data.output;
        output.className = 'text-white font-mono text-sm';
        terminalRef.current.appendChild(output);
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('disconnected');
    };

    ws.onclose = () => {
      setConnected(false);
      setStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const appendOutput = (text: string, className = 'text-white font-mono text-sm') => {
    if (terminalRef.current) {
      const line = document.createElement('div');
      line.textContent = text;
      line.className = className;
      terminalRef.current.appendChild(line);
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  const sendCommand = (raw: string | undefined | null) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) {
      return;
    }

    appendOutput(`user@genixos $ ${trimmed}`, 'text-green-400 font-mono text-sm');

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      appendOutput('Connection not ready. Please reopen GenixShell.', 'text-red-400 font-mono text-sm');
      return;
    }

    // Parse command: split into action and path/argument
    const parts = trimmed.split(/\s+/);
    const action = parts[0];
    const path = parts.length > 1 ? parts.slice(1).join(' ') : '.';

    wsRef.current.send(
      JSON.stringify({
        type: 'command',
        action: action,
        path: path,
      })
    );
  };

  return (
    <div className="w-full h-full bg-terminal-bg text-white font-mono flex flex-col">
      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto"
        style={{ backgroundColor: '#1E1E1E' }}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-green-400">
          user@genixos:/c-engine$ Welcome to GenixShell
        </div>
        {status === 'connecting' && (
          <div className="text-yellow-400">Connecting to backend...</div>
        )}
        {status === 'disconnected' && (
          <div className="text-red-400">
            Connection lost. Close the app and reopen GenixShell to reconnect.
          </div>
        )}
      </div>
      <div className="border-t border-gray-700 p-2">
        <input
          ref={inputRef}
          type="text"
          autoFocus
          className="w-full bg-transparent text-white outline-none"
          placeholder="Enter command..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const command = inputRef.current?.value;
              if (inputRef.current) {
                inputRef.current.value = '';
              }
              sendCommand(command);
            }
          }}
        />
      </div>
    </div>
  );
};

export default GenixShell;

