import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm bg-black/30">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-white font-medium">Fetching weather data...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;