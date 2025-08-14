import React, { useState, useEffect } from 'react';
import WagonWheelModal from './WagonWheelModal.jsx';
import ShotTypeModal from './ShotTypeModal.jsx';
import CatchTypeModal from './CatchTypeModal.jsx';
import WagonWheelResult from './WagonWheelResult.jsx';

export default function App() {
  const [showWheel, setShowWheel] = useState(true); // Start open by default
  const [showShotType, setShowShotType] = useState(false);
  const [showCatchType, setShowCatchType] = useState(false);
  const [finalData, setFinalData] = useState(null);

  const fielders = ['Rohit Sharma', 'Virat Kohli', 'Ravindra Jadeja'];
  const catchTypes = ['Diving', 'Running', 'Overhead', 'One-handed'];

  // Detect modal state changes
  useEffect(() => {
    console.log(`WagonWheel modal is now ${showWheel ? 'OPEN' : 'CLOSED'}`);
  }, [showWheel]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-4 md:py-10 px-2 sm:px-4">
      {/* Main content container with responsive sizing */}
      <div className="w-full max-w-4xl mx-auto">
        {/* Modals with responsive sizing */}
        <WagonWheelModal
          isOpen={showWheel}
          onClose={() => setShowWheel(false)}
          onDirectionSelect={(dir) => {
            setFinalData((prev) => ({ ...prev, shotDirection: dir }));
            setShowShotType(true);
          }}
        />

        <ShotTypeModal
          isOpen={showShotType}
          onClose={() => setShowShotType(false)}
          onSelect={(type) => {
            setFinalData((prev) => ({ ...prev, shotType: type }));
            setShowCatchType(true);
          }}
        />

        {/* <CatchTypeModal
          isOpen={showCatchType}
          onClose={() => setShowCatchType(false)}
          catchTypes={catchTypes}
          fielders={fielders}
          onSubmit={(data) => {
            const fullLog = { ...finalData, ...data };
            setFinalData(fullLog);
            setShowCatchType(false);
            setShowShotType(false);
            setShowWheel(false);
          }}
        /> */}

        {/* Result display with responsive sizing */}
        {finalData?.shotDirection && (
          <div className="mt-6 w-full md:w-3/4 lg:w-2/3 mx-auto">
            <WagonWheelResult data={finalData} />
          </div>
        )}

        {/* Debug/control buttons (optional) */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <button 
            onClick={() => setShowWheel(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm md:text-base"
          >
            Show Wagon Wheel
          </button>
          <button 
            onClick={() => setShowShotType(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm md:text-base"
          >
            Show Shot Type
          </button>
          {/* <button 
            onClick={() => setShowCatchType(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition text-sm md:text-base"
          >
            Show Catch Type
          </button> */}
        </div>
      </div>
    </div>
  );
}