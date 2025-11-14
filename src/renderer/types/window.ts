import React from 'react';

export interface Window {
  id: string;
  appId: string;
  title: string;
  component: React.ComponentType<any>;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

