// Simple test to verify React works
import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('Test script loaded');

const TestApp = () => {
  console.log('TestApp rendering');
  return (
    <div style={{ padding: '20px', color: 'white', background: '#00659D', height: '100vh' }}>
      <h1>React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Mounting test app...');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<TestApp />);
  console.log('Test app mounted');
} else {
  console.error('Root element not found');
}

