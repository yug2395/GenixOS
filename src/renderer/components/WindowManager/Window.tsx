import React, { useState, useRef, useEffect } from 'react';
import { Window as WindowType } from '../../types/window';

interface WindowProps {
  window: WindowType;
  onClose: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WindowType>) => void;
  onFocus: (id: string) => void;
}

const Window: React.FC<WindowProps> = ({ window, onClose, onUpdate, onFocus }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.minimized) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate(window.id, {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
      if (isResizing) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          onUpdate(window.id, {
            width: e.clientX - rect.left,
            height: e.clientY - rect.top,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, window.id, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.window-header')) {
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      onFocus(window.id);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    onFocus(window.id);
  };

  const handleMinimize = () => {
    onUpdate(window.id, { minimized: !window.minimized });
  };

  const handleMaximize = () => {
    onUpdate(window.id, { maximized: !window.maximized });
  };

  if (window.minimized) {
    return null;
  }

  const WindowComponent = window.component;

  return (
    <div
      ref={windowRef}
      className="absolute bg-white rounded-window shadow-window flex flex-col overflow-hidden"
      style={{
        left: window.x,
        top: window.y,
        width: window.maximized ? '100%' : window.width,
        height: window.maximized ? 'calc(100% - 4rem)' : window.height,
        maxWidth: 'calc(100% - 2rem)',
        maxHeight: window.maximized ? 'calc(100% - 4rem)' : 'calc(100% - 6rem)',
        zIndex: window.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Window Header */}
      <div className="window-header bg-genix-blue text-white px-4 py-2 flex items-center justify-between cursor-move select-none">
        <div className="flex items-center space-x-3">
          {/* Window Controls (Left side - macOS style) */}
          <div className="flex space-x-2">
            <button
              onClick={() => onClose(window.id)}
              className="w-3 h-3 rounded-full bg-genix-yellow hover:bg-yellow-400 transition-colors"
              title="Close"
            />
            <button
              onClick={handleMinimize}
              className="w-3 h-3 rounded-full bg-genix-blue hover:bg-blue-600 transition-colors border border-white border-opacity-30"
              title="Minimize"
            />
            <button
              onClick={handleMaximize}
              className="w-3 h-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-colors"
              title="Maximize"
            />
          </div>
          <span className="text-sm font-medium">{window.title}</span>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden bg-white">
        <WindowComponent />
      </div>

      {/* Resize Handle */}
      {!window.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-transparent"
          onMouseDown={handleResizeMouseDown}
          style={{
            background: 'linear-gradient(135deg, transparent 0%, transparent 40%, #ccc 40%, #ccc 50%, transparent 50%, transparent 60%, #ccc 60%)',
          }}
        />
      )}
    </div>
  );
};

export default Window;

