import React from 'react';
import { Window } from '../../types/window';
import GenixShell from '../Apps/GenixShell/GenixShell';
import GenixCode from '../Apps/GenixCode/GenixCode';
import GenixCom from '../Apps/GenixCom/GenixCom';
import GenixFiles from '../Apps/GenixFiles/GenixFiles';
import GenixNotepad from '../Apps/GenixNotepad/GenixNotepad';
import Settings from '../Apps/Settings/Settings';
import GenixCalculator from '../Apps/GenixCalculator/GenixCalculator';
import GenixCalendar from '../Apps/GenixCalendar/GenixCalendar';
import GenixPkgInstaller from '../Apps/GenixPkgInstaller/GenixPkgInstaller';
import GenixBot from '../Apps/GenixBot/GenixBot';

interface TaskbarProps {
  onOpenApp: (appId: string, title: string, component: React.ComponentType<any>) => void;
  windows: Window[];
  onFocusWindow: (id: string) => void;
  onToggleMinimize: (id: string) => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ onOpenApp, windows, onFocusWindow, onToggleMinimize }) => {
  const apps = [
    { id: 'genix-shell', title: 'GenixShell', icon: '💻', component: GenixShell },
    { id: 'genix-bot', title: 'GenixBot', icon: '🤖', component: GenixBot },
    { id: 'genix-code', title: 'GenixCode', icon: '📝', component: GenixCode },
    { id: 'genix-notepad', title: 'GenixNotepad', icon: '📄', component: GenixNotepad },
    { id: 'genix-com', title: 'GenixCom', icon: '🌐', component: GenixCom },
    { id: 'genix-files', title: 'GenixFiles', icon: '📁', component: GenixFiles },
    { id: 'genix-calculator', title: 'Calculator', icon: '🧮', component: GenixCalculator },
    { id: 'genix-calendar', title: 'Calendar', icon: '📆', component: GenixCalendar },
    { id: 'genix-pkg', title: 'Pkg Installer', icon: '📦', component: GenixPkgInstaller },
    { id: 'genix-settings', title: 'Settings', icon: '⚙️', component: Settings },
  ];

  const handleAppClick = (app: typeof apps[0]) => {
    // Check if window is already open
    const existingWindow = windows.find((w) => w.appId === app.id);
    if (existingWindow) {
      if (existingWindow.minimized) {
        onToggleMinimize(existingWindow.id);
      }
      onFocusWindow(existingWindow.id);
    } else {
      onOpenApp(app.id, app.title, app.component);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-black bg-opacity-50 backdrop-blur-md border-t border-white border-opacity-10 flex items-center px-4 z-50">
      {/* App Icons */}
      <div className="flex items-center space-x-3">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => handleAppClick(app)}
            className="w-12 h-12 rounded-lg bg-genix-blue hover:bg-opacity-80 flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110"
            title={app.title}
          >
            {app.icon}
          </button>
        ))}
      </div>

      {/* Window Indicators */}
      <div className="flex-1 flex items-center justify-end space-x-2">
        {windows.map((window) => (
          <button
            key={window.id}
            onClick={() => onFocusWindow(window.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !window.minimized
                ? 'bg-genix-yellow text-genix-blue'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            {window.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Taskbar;

