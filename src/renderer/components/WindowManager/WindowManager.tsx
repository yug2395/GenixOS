import React from 'react';
import Window from './Window';
import { Window as WindowType } from '../../types/window';

interface WindowManagerProps {
  windows: WindowType[];
  onClose: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WindowType>) => void;
  onFocus: (id: string) => void;
}

const WindowManager: React.FC<WindowManagerProps> = ({
  windows,
  onClose,
  onUpdate,
  onFocus,
}) => {
  return (
    <>
      {windows.map((window) => (
        <Window
          key={window.id}
          window={window}
          onClose={onClose}
          onUpdate={onUpdate}
          onFocus={onFocus}
        />
      ))}
    </>
  );
};

export default WindowManager;

