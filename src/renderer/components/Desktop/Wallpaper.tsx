import React from 'react';
import logo from '../../assets/logo.png';

const Wallpaper: React.FC = () => {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${logo})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0b61a4',
      }}
    />
  );
};

export default Wallpaper;

