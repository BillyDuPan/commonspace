import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen = true }) => {
  const containerClasses = fullScreen 
    ? "flex justify-center items-center min-h-screen"
    : "flex justify-center items-center min-h-[200px]";

  return (
    <div className={containerClasses}>
      <div className="text-2xl font-bold text-primary">Loading...</div>
    </div>
  );
}; 