import { Ban } from 'lucide-react';
import React from 'react'

const BlockedUserPopup = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-lg max-w-md m-5 w-full p-6 border border-gray-700">
          <div className="flex items-center justify-center mb-4 text-red-500">
            <Ban className="h-12 w-12" />
          </div>
          
          <h3 className="text-xl font-bold text-white text-center mb-3">
            Cannot Send Message
          </h3>
          
          <p className="text-gray-300 text-center mb-6">
            You cannot send messages to this contact because you have been blocked.
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

export default BlockedUserPopup