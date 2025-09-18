import React from 'react';

export default function WagonWheelModal({ isOpen, onClose, onDirectionSelect, setShowMainWheel, run, player, tournamentId }) {
  const regions = [
    'Long Off', 'Cover', 'Point', 'Third Man',
    'Fine Leg', 'Mid Wicket', 'Long On', 'Straight'
  ];

  if (!isOpen) return null;

  // Optional: Log props for debugging
  console.log('WagonWheelModal received:', { run, player, tournamentId });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-xl text-center">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">
            Select Shot Direction
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {regions.map(region => (
            <button
              key={region}
              className="bg-green-600 text-white py-2 px-1 md:py-3 md:px-2 rounded-lg md:rounded-xl hover:bg-green-700 
                         transition-colors duration-200 text-sm sm:text-base md:text-lg"
              onClick={() => {
                onDirectionSelect(region); // This will trigger the parent handler
                onClose();
              }}
            >
              {region}
            </button>
          ))}
        </div>
        {/* Skip button */}
        <button
          className="mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          onClick={() => {
            setShowMainWheel(false);  // Close main wheel completely
            onClose();                // Close this modal
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
