import React from 'react';

export default function ShotTypeModal({ isOpen, onClose, onSelect }) {
  const shotTypes = [
    'Drive', 'Pull', 'Hook', 'Punch',
    'Inside Out', 'Switch Hit', 'Backfoot Punch', 'Defence',
    'None of the above'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md shadow-xl text-center">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Select Shot Type</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl md:text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {shotTypes.map(type => (
            <button
              key={type}
              className="bg-purple-600 text-white py-2 px-1 md:py-3 md:px-2 rounded-lg md:rounded-xl hover:bg-purple-700 
                         transition-colors duration-200 text-sm sm:text-base"
              onClick={() => {
                onSelect(type);
                onClose();
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}