import React, { useState } from 'react';
import Desktop from './components/Desktop/Desktop';
import Login from './components/Login/Login';
import Loading from './components/Loading/Loading';

type AppState = 'login' | 'loading' | 'desktop';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [username, setUsername] = useState('');

  const handleLogin = (name: string) => {
    setUsername(name);
    setAppState('loading');
  };

  const handleLoadingComplete = () => {
    setAppState('desktop');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-genix-blue text-white font-sans">
      {appState === 'login' && <Login onLogin={handleLogin} />}
      {appState === 'loading' && <Loading username={username} onComplete={handleLoadingComplete} />}
      {appState === 'desktop' && <Desktop />}
    </div>
  );
};

export default App;
