import React, { useState } from 'react';
import Wallpaper from './Wallpaper';
import Taskbar from './Taskbar';
import WindowManager from '../WindowManager/WindowManager';
import { Window } from '../../types/window';

const Desktop: React.FC = () => {
  const [windows, setWindows] = useState<Window[]>([]);

  const openWindow = (appId: string, title: string, component: React.ComponentType<any>) => {
    const taskbarHeight = 64;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 720;

    const defaultWidth = Math.min(900, viewportWidth - 120);
    const defaultHeight = Math.min(540, viewportHeight - taskbarHeight - 140);
    const xOffset = 80 + windows.length * 30;
    const yOffset = 60 + windows.length * 30;

    const clampedX = Math.max(16, Math.min(xOffset, viewportWidth - defaultWidth - 16));
    const clampedY = Math.max(16, Math.min(yOffset, viewportHeight - taskbarHeight - defaultHeight - 16));

    const newWindow: Window = {
      id: `window-${Date.now()}`,
      appId,
      title,
      component,
      x: clampedX,
      y: clampedY,
      width: defaultWidth,
      height: defaultHeight,
      minimized: false,
      maximized: false,
      zIndex: windows.length + 10,
    };
    setWindows([...windows, newWindow]);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter((w) => w.id !== id));
  };

  const updateWindow = (id: string, updates: Partial<Window>) => {
    setWindows(
      windows.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const toggleWindowMinimize = (id: string) => {
    const window = windows.find((w) => w.id === id);
    if (window) {
      updateWindow(id, { minimized: !window.minimized });
    }
  };

  const focusWindow = (id: string) => {
    const maxZ = Math.max(...windows.map((w) => w.zIndex), 0);
    updateWindow(id, { zIndex: maxZ + 1 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Wallpaper />
      <WindowManager
        windows={windows}
        onClose={closeWindow}
        onUpdate={updateWindow}
        onFocus={focusWindow}
      />
      <Taskbar
        onOpenApp={openWindow}
        windows={windows}
        onFocusWindow={focusWindow}
        onToggleMinimize={toggleWindowMinimize}
      />
    </div>
  );
};

export default Desktop;

