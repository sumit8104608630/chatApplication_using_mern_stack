import React from 'react';

const CallRejectedPopup = ({ reason, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Call Failed</h2>
        <p>{reason}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CallRejectedPopup;