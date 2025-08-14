import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, HelpCircle, X } from "lucide-react";

// 🔢 Win Probability Calculation Logic
function calculateWinProbability(battingScore, bowlingScore) {
  if (battingScore === 0 && bowlingScore === 0) {
    return { winA: 50, winB: 50 };
  }

  if (battingScore > 0 && bowlingScore === 0) {
    return { winA: 100, winB: 0 };
  }

  if (bowlingScore > 0 && battingScore === 0) {
    return { winA: 0, winB: 100 };
  }

  const total = battingScore + bowlingScore;
  const winA = Math.round((battingScore / total) * 100);
  const winB = 100 - winA;

  return { winA, winB };
}

export default function AIMatchCompanionModal({ isOpen, onClose, predictionData }) {
  if (!isOpen) return null;

  const {
    battingTeam,
    bowlingTeam,
    battingScore,
    bowlingScore,
    overNumber,
    nextOverProjection,
    alternateOutcome,
  } = predictionData || {};

  const { winA, winB } = calculateWinProbability(battingScore, bowlingScore);

  let probableWinner = null;
  if (typeof battingScore === "number" && typeof bowlingScore === "number") {
    if (battingScore > bowlingScore) {
      probableWinner = battingTeam;
    } else if (bowlingScore > battingScore) {
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
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">AI Match Companion</h2>
          </div>

          {predictionData ? (
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
