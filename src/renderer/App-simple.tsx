// Simplified App for debugging
import React from 'react';

const App: React.FC = () => {
  console.log('Simple App rendering...');
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#00659D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>GENIX OS</h1>
      <p style={{ fontSize: '24px' }}>React is working!</p>
      <p style={{ fontSize: '16px', marginTop: '20px' }}>The OS for Students, by Students</p>
    </div>
  );
};

export default App;

