import React from 'react';

export default function WagonWheelModal({ isOpen, onClose, onDirectionSelect, setShowMainWheel  }) {
  const regions = [
    'Long Off', 'Cover', 'Point', 'Third Man',
    'Fine Leg', 'Mid Wicket', 'Long On', 'Straight'
  ];

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-center">
        <h2 className="text-xl font-semibold mb-4">Select Shot Direction</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {regions.map(region => (
            <button
              key={region}
              className="bg-green-600 text-white py-2 rounded-xl hover:bg-green-700"
              onClick={() => {
                onDirectionSelect(region);
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
