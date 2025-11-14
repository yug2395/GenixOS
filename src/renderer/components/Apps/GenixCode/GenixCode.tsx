import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_WS_URL } from '../../../config';

const GenixCode: React.FC = () => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('// Welcome to GenixCode\n// Start coding in C or C++\n\n#include <stdio.h>\n\nint main() {\n    printf("Hello, GENIX!\\n");\n    return 0;\n}');
  const [output, setOutput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const pendingCompileRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'build') {
        if (data.action === 'compile') {
          if (data.success) {
            setOutput((prev) => prev + 'Compilation successful!\n');
            // Automatically run after successful compilation
            setTimeout(() => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: 'build',
                    action: 'run',
                    file: 'main.c',
                  })
                );
              }
            }, 100);
          } else {
            setOutput((prev) => prev + 'Compilation failed:\n' + (data.output || data.error || 'Unknown error') + '\n');
          }
        } else if (data.action === 'run') {
          if (data.success) {
            setOutput((prev) => prev + '\n--- Program Output ---\n' + (data.output || '') + '\n');
            if (data.error) {
              setOutput((prev) => prev + '--- Errors ---\n' + data.error + '\n');
            }
            if (data.exitCode !== undefined) {
              setOutput((prev) => prev + `Exit code: ${data.exitCode}\n`);
            }
          } else {
            setOutput((prev) => prev + '\n--- Run Failed ---\n' + (data.error || 'Unknown error') + '\n');
          }
        }
      } else if (data.type === 'file' && data.action === 'write') {
        // File saved successfully
        console.log('File saved successfully');
        // If there's a pending compile, trigger it now
        if (pendingCompileRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          pendingCompileRef.current = false;
          console.log('Triggering compilation after save');
          wsRef.current.send(
            JSON.stringify({
              type: 'build',
              action: 'compile',
              file: 'main.c',
            })
          );
        }
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSave = async () => {
    // Auto-save functionality
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('GenixCode: Saving file, content length:', content.length);
      console.log('GenixCode: First 100 chars:', content.substring(0, 100));
      wsRef.current.send(
        JSON.stringify({
          type: 'file',
          action: 'write',
          path: 'main.c',
          content: content,
        })
      );
    }
  };

  const handleRun = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Clear output and show we're starting
      setOutput('--- Saving and compiling... ---\n');
      
      // Set flag to compile after save completes
      pendingCompileRef.current = true;
      
      // Save file first - compilation will trigger automatically when save completes
      handleSave();
    }
  };

  useEffect(() => {
    // Auto-save every 3-5 seconds
    const interval = setInterval(handleSave, 4000);
    return () => clearInterval(interval);
  }, [content]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">main.c</span>
        </div>
        <button
          onClick={handleRun}
          className="px-4 py-1 bg-genix-yellow text-genix-blue rounded hover:bg-yellow-400 transition-colors text-sm font-medium"
        >
          Run
        </button>
      </div>
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm resize-none outline-none"
            spellCheck={false}
          />
        </div>
        <div className="w-1/2 border-l border-gray-700 flex flex-col">
          <div className="bg-gray-800 text-white px-4 py-2 border-b border-gray-700">
            <span className="text-sm font-medium">Output</span>
          </div>
          <div className="flex-1 p-4 bg-terminal-bg text-white font-mono text-sm overflow-y-auto">
            <pre className="whitespace-pre-wrap">{output || 'Output will appear here...'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenixCode;

