import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_WS_URL } from '../../../config';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
}

const GenixNotepad: React.FC = () => {
  const [content, setContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [showFilePicker, setShowFilePicker] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // Load available files when connected
      loadFileList();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'file') {
        if (data.action === 'write' || data.action === 'create') {
          setIsSaving(false);
          setSaveStatus('Saved successfully!');
          setCurrentFileName(saveFileName || data.path || '');
          setShowSaveDialog(false);
          setSaveFileName('');
          setTimeout(() => setSaveStatus(''), 2000);
          // Refresh file list after saving
          loadFileList();
        } else if (data.action === 'read') {
          setContent(data.content || '');
          setIsLoading(false);
          setShowFilePicker(false);
        } else if (data.action === 'list') {
          // Filter to show only .txt files
          const txtFiles = (data.items || []).filter((item: FileItem) => 
            item.type === 'file' && (item.name.endsWith('.txt') || item.name.endsWith('.md') || item.name.endsWith('.log'))
          );
          setAvailableFiles(txtFiles);
        }
      } else if (data.type === 'error') {
        setIsSaving(false);
        setIsLoading(false);
        setSaveStatus(`Error: ${data.message}`);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setSaveStatus('Connection error');
    };

    return () => {
      ws.close();
    };
  }, [saveFileName]);

  const loadFileList = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Load files from notes directory
    wsRef.current.send(
      JSON.stringify({
        type: 'file',
        action: 'list',
        path: 'notes',
      })
    );
  };

  const handleSave = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setSaveStatus('Not connected to backend');
      return;
    }

    // Show save dialog
    setShowSaveDialog(true);
    setSaveFileName(currentFileName || '');
    setTimeout(() => saveInputRef.current?.focus(), 100);
  };

  const handleSaveConfirm = () => {
    if (!saveFileName.trim()) {
      setSaveStatus('Please enter a filename');
      return;
    }

    // Ensure .txt extension
    const fileName = saveFileName.endsWith('.txt') ? saveFileName : `${saveFileName}.txt`;
    // Save to notes directory
    const filePath = `notes/${fileName}`;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setSaveStatus('Not connected to backend');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving...');

    wsRef.current.send(
      JSON.stringify({
        type: 'file',
        action: 'write',
        path: filePath,
        content: content,
      })
    );
  };

  const handleLoad = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setSaveStatus('Not connected to backend');
      return;
    }

    // Show file picker
    loadFileList();
    setShowFilePicker(true);
  };

  const handleFileSelect = (fileName: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setSaveStatus('Not connected to backend');
      return;
    }

    setIsLoading(true);
    setSaveStatus('Loading...');
    setCurrentFileName(fileName);

    // Load from notes directory
    wsRef.current.send(
      JSON.stringify({
        type: 'file',
        action: 'read',
        path: `notes/${fileName}`,
      })
    );
  };

  const handleNew = () => {
    setContent('');
    setCurrentFileName('');
    setSaveStatus('');
    setShowFilePicker(false);
    setShowSaveDialog(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full h-full flex flex-col bg-white relative">
      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Save File</h3>
            <input
              ref={saveInputRef}
              type="text"
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 text-gray-900"
              placeholder="Enter filename (e.g., notes.txt)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveConfirm();
                } else if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                disabled={isSaving}
                className="px-4 py-2 bg-genix-yellow text-genix-blue rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Picker Modal */}
      {showFilePicker && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4 max-h-96 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Select File to Load</h3>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded mb-4">
              {availableFiles.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No .txt files found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {availableFiles.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => handleFileSelect(file.name)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <span className="text-xl">📄</span>
                      <span className="text-gray-900">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowFilePicker(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleNew}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium transition-colors"
            title="New"
          >
            New
          </button>
          <button
            onClick={handleLoad}
            disabled={isLoading}
            className="px-3 py-1 bg-genix-blue text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            title="Load"
          >
            {isLoading ? 'Loading...' : 'Load'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 bg-genix-yellow text-genix-blue rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            title="Save"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {currentFileName && (
            <span className="text-sm text-gray-600 px-2 py-1 bg-gray-200 rounded">
              {currentFileName}
            </span>
          )}
          {saveStatus && (
            <span className={`text-xs px-2 py-1 rounded ${
              saveStatus.includes('Error') || saveStatus.includes('Not connected')
                ? 'bg-red-100 text-red-700'
                : saveStatus.includes('Saved')
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {saveStatus}
            </span>
          )}
        </div>
      </div>

      {/* Text Editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 p-4 font-mono text-sm resize-none outline-none border-none text-gray-900 bg-white"
        placeholder="Start typing... (Click Save to save to file system)"
        spellCheck={false}
        autoFocus
        style={{ color: '#111827' }}
      />
    </div>
  );
};

export default GenixNotepad;
