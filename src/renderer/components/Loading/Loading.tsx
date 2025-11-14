import React, { useEffect, useState } from 'react';

interface LoadingProps {
  username: string;
  onComplete: () => void;
}

const Loading: React.FC<LoadingProps> = ({ username, onComplete }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    const timer = setTimeout(() => {
      clearInterval(interval);
      onComplete();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div 
      className="w-screen h-screen flex flex-col items-center justify-center bg-genix-blue text-white"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 animate-pulse">
          Hello {username}
        </h2>
        <p className="text-xl text-white text-opacity-90">
          Genix OS is loading{dots}
        </p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-genix-yellow rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-genix-yellow rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-genix-yellow rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;

