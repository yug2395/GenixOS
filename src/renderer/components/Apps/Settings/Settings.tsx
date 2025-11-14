import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<'v1' | 'v2'>('v1');

  return (
    <div className="w-full h-full bg-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-genix-blue">Settings</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Wallpaper</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setTheme('v1')}
              className={`px-4 py-2 rounded ${
                theme === 'v1'
                  ? 'bg-genix-blue text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Flat Blue (V1)
            </button>
            <button
              onClick={() => setTheme('v2')}
              className={`px-4 py-2 rounded ${
                theme === 'v2'
                  ? 'bg-genix-blue text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Premium Gradient (V2)
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Username"
              className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-genix-blue"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-genix-blue"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">About GENIX OS</h2>
          <div className="text-gray-600 space-y-2">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Slogan:</strong> The OS for Students, by Students</p>
            <p className="text-sm">
              GENIX OS is a university-themed desktop operating system simulation,
              developed to provide students with a real OS-like experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

