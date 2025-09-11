import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, HelpCircle, X } from "lucide-react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase"; // Adjust this import to match your Firebase config file


// 🔢 Win Probability Calculation Logic
function calculateWinProbability(battingRuns, battingBalls, bowlingRuns, maxOvers) {
  const totalBalls = maxOvers * 6;
  const ballsLeft = Math.max(totalBalls - battingBalls, 0);
  const runsToWin = Math.max(bowlingRuns + 1 - battingRuns, 0);

  if (runsToWin === 0) return { winA: 100, winB: 0 };
  if (ballsLeft === 0) return { winA: 0, winB: 100 };

  // Special handling for ballsLeft <= 6 (1 over or less)
  if (ballsLeft <= 6) {
    const maxRunsPossible = ballsLeft * 6;
    if (runsToWin > maxRunsPossible) {
      return { winA: 0, winB: 100 };
    } else {
      // Linear formula: probability higher if runsToWin is less
      const prob = (maxRunsPossible - runsToWin + 1) / maxRunsPossible;
      const winA = Math.round(Math.max(prob, 0.02) * 100); // minimum 2% nonzero if possible
      return { winA, winB: 100 - winA };
    }
  }

  // For regular cases, use run rate model
  const currRR = battingBalls > 0 ? battingRuns / (battingBalls / 6) : 0;
  const reqRR = runsToWin / (ballsLeft / 6);
  const rrDiff = currRR - reqRR;
  const probBat = 1 / (1 + Math.exp(-3 * rrDiff));
  const winA = Math.round(probBat * 100);
  return { winA, winB: 100 - winA };
}



export default function AIMatchCompanionModal({ isOpen, onClose, predictionData, tournamentId , maxOvers, battingBalls}) {
  const [displayData, setDisplayData] = useState(predictionData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Extract the actual document ID if tournamentId is an object
  let safeTournamentId = null;
  if (typeof tournamentId === 'object' && tournamentId !== null && tournamentId.tournamentId) {
    safeTournamentId = String(tournamentId.tournamentId);
  } else if (typeof tournamentId === 'string') {
    safeTournamentId = tournamentId;
  }


  // Function to update Firestore with predictionData
  const updateFirestore = async (data) => {
    if (!safeTournamentId || !data) return;
    try {
      const docRef = doc(db, "AIMatchCompanion", safeTournamentId);
      await setDoc(docRef, data, { merge: true });
      console.log("Document updated for tournamentId:", safeTournamentId);
    } catch (err) {
      console.error("Error updating Firestore:", err);
      setError("Failed to update match data.");
    }
  };


  // Update Firestore whenever predictionData changes
  useEffect(() => {
    if (predictionData && safeTournamentId) {
      setDisplayData(predictionData);
      updateFirestore(predictionData);
    }
  }, [predictionData, safeTournamentId]);


  // Real-time listener for fetching from Firestore if no predictionData is provided
  useEffect(() => {
    if (!isOpen || predictionData || !safeTournamentId) return;


    setLoading(true);
    setError(null);


    const docRef = doc(db, "AIMatchCompanion", safeTournamentId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDisplayData(docSnap.data());
        setError(null);
      } else {
        setError("No match data found for this tournament.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error in real-time Firestore listener:", err);
      setError("Failed to fetch match data.");
      setLoading(false);
    });


    // Cleanup listener on unmount or when dependencies change
    return () => unsubscribe();
  }, [isOpen, predictionData, safeTournamentId]);


  if (!isOpen) return null;


  const data = displayData || {};
  const {
    battingTeam,
    bowlingTeam,
    battingScore,
    bowlingScore,
    overNumber,
    nextOverProjection,
    alternateOutcome,
  } = data;


const { winA, winB } = calculateWinProbability(
  battingScore,           // current runs for batting team
  battingBalls,           // balls faced by batting team, e.g. over*6 + balls
  bowlingScore,           // target (first innings total)
  maxOvers,               // max overs for the match
);


  let probableWinner = null;
  if (typeof battingScore === "number" && typeof bowlingScore === "number") {
    if (winA > winB) {
      probableWinner = battingTeam;
    } else if (winB > winA) {
      probableWinner = bowlingTeam;
    } else {
      probableWinner = "It's a tie";
    }
  }


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full flex justify-center mt-8 px-4"
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="bg-[#121212] text-white w-full max-w-3xl p-6 rounded-2xl relative shadow-xl border border-gray-700"
        >
          {/* Close Button (add your onClose logic here if needed) */}
          {/* <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-gray-400" /></button> */}


          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">AI Match Companion</h2>
          </div>


          {loading ? (
            <p className="text-sm text-gray-500 italic">Loading match insights…</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : displayData ? (
            <div className="space-y-6">
              {/* Current Scores */}
              <div>
                <div className="text-sm font-medium text-gray-300 mb-2">Current Scores</div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>
                    {battingTeam}{" "}
                    {typeof battingScore === "number" ? `(${battingScore} runs)` : ""}
                  </span>
                  <span>Ov-{overNumber}</span>
                  <span>
                    {bowlingTeam}{" "}
                    {typeof bowlingScore === "number" ? `(${bowlingScore} runs)` : ""}
                  </span>
                </div>
              </div>


              {/* Probable Winner */}
              <div className="text-sm font-medium text-gray-300 mb-2">
                Probable Winner:{" "}
                <span className="text-white font-semibold">
                  {probableWinner || "Insufficient data"}
                </span>
              </div>


              {/* Win Probability */}
              <div>
                <div className="text-sm font-medium text-gray-300 mb-2">Win Probability</div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>
                    {battingTeam}:{" "}
                    <span className={`${winA === 0 ? "text-gray-500" : "text-green-400"} font-semibold`}>
                      {winA}%
                    </span>
                  </span>
                  <span>
                    {bowlingTeam}:{" "}
                    <span className={`${winB === 0 ? "text-gray-500" : "text-red-400"} font-semibold`}>
                      {winB}%
                    </span>
                  </span>
                </div>


                {/* Probability Bar */}
                <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${winA}%` }}
                    title={`${battingTeam}: ${winA}%`}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${winB}%` }}
                    title={`${bowlingTeam}: ${winB}%`}
                  />
                </div>
              </div>


              {/* Next Over Impact */}
              {nextOverProjection && (
                <div>
                  <div className="flex items-center gap-2 mb-1 text-sm font-medium text-white">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Next Over Impact</span>
                  </div>
                  <p className="text-sm text-gray-400">{nextOverProjection}</p>
                </div>
              )}


              {/* What If Scenario */}
              {alternateOutcome && (
                <div>
                  <div className="flex items-center gap-2 mb-1 text-sm font-medium text-white">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>What If?</span>
                  </div>
                  <p className="text-sm text-gray-400">{alternateOutcome}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Live match insights will appear here…</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
