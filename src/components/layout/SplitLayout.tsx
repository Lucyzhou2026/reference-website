import React from 'react';

interface SplitLayoutProps {
  left: React.ReactNode;
  right?: React.ReactNode;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({ left, right }) => {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-row h-full">
        <div className={`${right ? 'w-3/5 border-r border-gray-200' : 'w-full'} h-full bg-white overflow-hidden relative transition-all duration-300`}>
           {left}
        </div>
        {right && (
          <div className="w-2/5 h-full bg-gray-50 overflow-hidden relative transition-all duration-300">
             {right}
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitLayout;
