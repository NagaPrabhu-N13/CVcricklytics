import React, { useState, useEffect } from 'react';
import WagonWheelModal from './WagonWheelModal.jsx';
import ShotTypeModal from './ShotTypeModal.jsx';
import WagonWheelResult from './WagonWheelResult.jsx';

export default function App({setShowMainWheel}) {
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
    <div className="mt-5 h-[80vh] bg-gray-100 flex flex-col items-center">

      <WagonWheelModal
        isOpen={showWheel}
        onClose={() => setShowWheel(false)}
        onDirectionSelect={(dir) => {
          setFinalData((prev) => ({ ...prev, shotDirection: dir }));
          setShowShotType(true);
          
        }}
        setShowMainWheel={setShowMainWheel}
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

      {finalData?.shotDirection && (
        <WagonWheelResult data={finalData} />
      )}
    </div>
  );
}