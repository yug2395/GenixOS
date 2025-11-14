export interface ElectronAPI {
  app: {
    close: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    GENIX_BACKEND_WS_URL?: string;
    GENIX_BOT_URL?: string;
  }
}

