import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div 
      className="w-screen h-screen flex items-center justify-center bg-genix-blue"
    >
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-lg p-8 shadow-2xl border border-white border-opacity-20">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">GENIX OS</h1>
          <p className="text-white text-opacity-80">The OS for Students, by Students</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-white text-sm font-medium mb-2">
              Enter your name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name..."
              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-genix-yellow focus:border-transparent"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-genix-yellow text-genix-blue font-semibold rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

