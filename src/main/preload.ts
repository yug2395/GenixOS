import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  app: {
    close: () => ipcRenderer.invoke('app-close'),
    minimize: () => ipcRenderer.invoke('app-minimize'),
    maximize: () => ipcRenderer.invoke('app-maximize'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('open-external-url', url),
  },
});

