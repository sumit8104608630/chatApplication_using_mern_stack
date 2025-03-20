import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const SuccessAlert = ({ message, duration = 5000, onClose, isVisible = true }) => {
  const [visible, setVisible] = useState(isVisible);

  // Handle automatic dismissal
  useEffect(() => {
    if (visible && duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  // Handle manual dismissal
  const handleDismiss = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 rounded-md border border-teal-400 bg-teal-500 shadow-lg transition-all duration-300 ease-in-out max-w-md"
      role="alert"
    >
      <div className="flex items-center p-4">
        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-white" />
        <div className="flex-1 text-white">
          {message}
        </div>
        <button 
          onClick={handleDismiss}
          className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded"
          aria-label="Close alert"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default SuccessAlert