import React from 'react';

export default function WagonWheelModal({ isOpen, onClose, onDirectionSelect }) {
  const regions = [
    'Long Off', 'Cover', 'Point', 'Third Man',
    'Fine Leg', 'Mid Wicket', 'Long On', 'Straight'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-xl text-center">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">
            Select Shot Direction
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl md:text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {regions.map(region => (
            <button
              key={region}
              className="bg-green-600 text-white py-2 px-1 md:py-3 md:px-2 rounded-lg md:rounded-xl hover:bg-green-700 
                         transition-colors duration-200 text-sm sm:text-base md:text-lg"
              onClick={() => {
                onDirectionSelect(region);
                onClose();
              }}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}