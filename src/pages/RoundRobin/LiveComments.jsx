// LiveComments.jsx (new file)
import React, { useState, useEffect } from "react";
import { db } from '../../firebase'; // Adjust path
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const LiveComments = ({ tournamentId }) => {
  const [commentary, setCommentary] = useState([]);
  console.log("Tournament ID in LiveComments:", tournamentId);

  useEffect(() => {
    if (!tournamentId) return;

    const q = query(
      collection(db, "liveCommentary"),
      where("tournamentId", "==", tournamentId),
      orderBy("timestamp", "desc") // Ensures most recent first
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const comments = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.commentary,
          runs: data.run,
          playerName: data.playerName,
          totalRuns: data.totalRuns || 0,
          wickets: data.wickets || 0,
          timestamp: data.timestamp ? (
            data.timestamp instanceof Date ? data.timestamp.toLocaleString() :
            data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() :
            ""
          ) : "",
          highlight: data.run >= 4 // Example: highlight 4s and 6s
        };
      });
      setCommentary(comments);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  return (
    <div className="bg-gradient-to-br from-purple-200 to-indigo-100 p-4 md:p-6 rounded-xl shadow-lg border border-purple-300">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-500/50">
        <h3 className="text-xl font-semibold flex items-center">
          <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          Live Commentary
        </h3>
        <span className="text-xs text-white bg-purple-700/50 px-2 py-1 rounded">
          Auto-updating
        </span>
      </div>
      
      <div className="h-[400px] overflow-y-auto pr-2 pl-2 commentary-scroll">
        {commentary.map((item) => (
          <div 
            key={item.id}
            className={`mb-3 pb-3 border-b border-purple-500/30 last:border-b-0 transition-all duration-300 ${
                item.highlight ? 'bg-purple-700/30 -mx-2 px-2 py-2 rounded-lg' : ''
            }`}
            >

            <div className="flex">
              <div className={`min-w-[3rem] flex flex-col items-center justify-center h-8 w-8 rounded-full mr-3 ${
                item.runs === 0 ? 'bg-gray-700' : 
                item.runs === 4 ? 'bg-blue-700' : 
                item.runs === 6 ? 'bg-purple-700' : 'bg-green-700'
              }`}>
                <p className="text-sm mb-1">{item.totalRuns}/{item.wickets}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm mb-1">{item.text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-black-400">{item.timestamp}</span>
                  {item.runs > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-700/50">
                      {item.runs} run{item.runs > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-purple-500/30">
        <div className="flex flex-wrap items-center text-xs text-gray-400 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-700 rounded-full mr-1"></div>
            <span>Dot ball</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-700 rounded-full mr-1"></div>
            <span>1-3 runs</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-700 rounded-full mr-1"></div>
            <span>Four</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-700 rounded-full mr-1"></div>
            <span>Six</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .commentary-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .commentary-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .commentary-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default LiveComments;
