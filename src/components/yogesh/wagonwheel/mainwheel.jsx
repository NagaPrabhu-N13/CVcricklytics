import React, { useState, useEffect, useRef } from 'react';
import WagonWheelModal from './WagonWheelModal.jsx';
import ShotTypeModal from './ShotTypeModal.jsx';
import WagonWheelResult from './WagonWheelResult.jsx';
import { db } from '../../../firebase'; // Adjust import to your Firebase config
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'; // Import for Firestore operations

export default function App({ run, player, tournamentId, setShowMainWheel, currentOver, wickets, totalRuns }) {
  const [showWheel, setShowWheel] = useState(true); // Start open by default
  const [showShotType, setShowShotType] = useState(false);
  const [finalData, setFinalData] = useState(null);
  const commentaryCountRef = useRef(0); // Ref for synchronous count tracking

  // Function to generate and store commentary (called after all selections)
  const saveCommentary = async (direction, shotType) => {
    let commentary;

    // Customize commentary based on run value
    if (run === 6) {
      commentary = `${player?.name || 'Player'} smashes a massive six towards ${direction} with a powerful ${shotType}!`;
    } else if (run === 4) {
      commentary = `${player?.name || 'Player'} drives elegantly for a boundary four to ${direction} using ${shotType}.`;
    } else if (run === 0) {
      commentary = `${player?.name || 'Player'} defends solidly, it's a dot ball towards ${direction} with a defensive ${shotType}.`;
    } else {
      commentary = `${player?.name || 'Player'} scored ${run} runs with a ${shotType} shot towards ${direction}.`;
    }
    
    try {
      // Save the normal commentary as its own document
      await addDoc(collection(db, 'liveCommentary'), {
        commentary,
        run,
        tournamentId: tournamentId,
        playerName: player?.name || 'Unknown',
        timestamp: new Date(),
        currentOver,
        wickets,
        totalRuns,
      });
      console.log('Commentary saved:', commentary);

      // Increment counter synchronously
      commentaryCountRef.current += 1;

      // Every 3 commentaries, update the summary in a dedicated document
      if (commentaryCountRef.current % 3 === 0) {
        const summaryDocRef = doc(db, 'liveCommentary', `summary_${tournamentId}`); // Fixed doc ID per tournament
        const summaryText = `Currently in over ${currentOver}, the score is ${totalRuns} for ${wickets} wicket${wickets !== 1 ? 's' : ''} down.`;
        
        await setDoc(summaryDocRef, {
          summary: summaryText, // Store in a 'summary' field
          tournamentId: tournamentId,
          currentOver,
          wickets,
          totalRuns,
          timestamp: new Date(),
        }, { merge: true }); // Merge to update without overwriting other fields
        console.log('Summary updated:', summaryText);
      }
    } catch (error) {
      console.error('Error saving commentary:', error);
    }
  };

  // Handle direction select (pass to next modal)
  const handleDirectionSelect = (direction) => {
    setFinalData((prev) => ({ ...prev, shotDirection: direction }));
    setShowShotType(true);
    setShowWheel(false);
  };

  // Handle shot type select (generate commentary and save)
  const handleShotTypeSelect = (shotType) => {
    setFinalData((prev) => ({ ...prev, shotType }));
    saveCommentary(finalData.shotDirection, shotType); // Save here after all inputs are selected
    setShowShotType(false);
    // Optionally close main wheel or proceed
  };

  return (
    <div className="mt-5 h-fit bg-gray-100 flex flex-col items-center">
      <WagonWheelModal
        isOpen={showWheel}
        onClose={() => setShowWheel(false)}
        onDirectionSelect={handleDirectionSelect}
        run={run}
        player={player}
        tournamentId={tournamentId}
        setShowMainWheel={setShowMainWheel}
      />

      <ShotTypeModal
        isOpen={showShotType}
        onClose={() => setShowShotType(false)}
        onSelect={handleShotTypeSelect}
        run={run}
        player={player}
        tournamentId={tournamentId}
        setShowMainWheel={setShowMainWheel}
      />

      {finalData?.shotDirection && (
        <WagonWheelResult
          data={finalData}
          run={run}
          player={player}
          tournamentId={tournamentId}
        />
      )}
    </div>
  );
}
