export {};

declare global {
  interface Window {
    global?: typeof globalThis;
    require?: (moduleId: string) => unknown;
    GENIX_BACKEND_WS_URL?: string;
  }
}

if (typeof window !== 'undefined') {
  if (!window.global) {
    window.global = window;
  }
}



