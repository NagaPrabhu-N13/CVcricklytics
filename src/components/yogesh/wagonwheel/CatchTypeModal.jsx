import React, { useState } from 'react';

export default function CatchTypeModal({ isOpen, onClose, catchTypes, fielders, onSubmit }) {
  const [catchType, setCatchType] = useState('');
  const [fielder, setFielder] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({ catchType, fielder });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-center">
        <h2 className="text-xl font-semibold mb-4">Select Catch Type & Fielder</h2>

        <select
          className="w-full mb-4 px-3 py-2 border rounded-md"
          value={catchType}
          onChange={(e) => setCatchType(e.target.value)}
        >
          <option value="">Select Catch Type</option>
          {catchTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          className="w-full mb-4 px-3 py-2 border rounded-md"
          value={fielder}
          onChange={(e) => setFielder(e.target.value)}
        >
          <option value="">Select Fielder</option>
          {fielders.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={!catchType || !fielder}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
