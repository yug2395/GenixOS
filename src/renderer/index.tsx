console.log('=== index.tsx: Script file loaded and executing! ===');
console.log('window exists?', typeof window !== 'undefined');
console.log('document exists?', typeof document !== 'undefined');

import './polyfills';

import React from 'react';
console.log('React imported');

import ReactDOM from 'react-dom/client';
console.log('ReactDOM imported');

import App from './App';
console.log('App imported');

import './index.css';
console.log('CSS imported');

// Error boundary for better debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const errorDiv = document.getElementById('error-display');
  if (errorDiv) {
    errorDiv.style.display = 'block';
    errorDiv.innerHTML = '<strong>Error:</strong> ' + (event.error ? event.error.message : event.message) + 
      '<br><small>' + (event.error ? event.error.stack : '') + '</small>';
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('About to find root element...');
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red; background: white;">Error: Root element not found!</div>';
} else {
  console.log('Root element found!');
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering App component...');
  try {
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(App, null)
      )
    );
    console.log('=== App rendered successfully! ===');
  } catch (error: any) {
    console.error('Error rendering app:', error);
    const errorMessage = error?.message || String(error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red; background: white;">Error rendering app: ${errorMessage}<br><pre>${error?.stack || ''}</pre></div>`;
    
    const errorDiv = document.getElementById('error-display');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.innerHTML = '<strong>Render Error:</strong> ' + errorMessage;
    }
  }
}

console.log('=== index.tsx: Script finished executing ===');
