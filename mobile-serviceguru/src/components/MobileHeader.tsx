import React from 'react';
import { ArrowLeft, Menu, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    onClick: () => void;
  };
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  showBack = false, 
  onBack,
  rightAction 
}) => {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="mobile-header safe-top">
      <div className="flex items-center space-x-3">
        {showBack && (
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 active:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>
      </div>
      
      {rightAction && (
        <button 
          onClick={rightAction.onClick}
          className="p-2 -mr-2 text-gray-600 active:text-gray-800"
        >
          {rightAction.icon}
        </button>
      )}
    </div>
  );
};

export default MobileHeader;