import React from 'react';

export default function ShotTypeModal({ isOpen, onClose, onSelect }) {
  const shotTypes = [
    'Drive', 'Pull', 'Hook', 'Punch',
    'Inside Out', 'Switch Hit', 'Backfoot Punch', 'Defence',
    'None of the above'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-center">
        <h2 className="text-xl font-semibold mb-4">Select Shot Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {shotTypes.map(type => (
            <button
              key={type}
              className="bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700"
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
