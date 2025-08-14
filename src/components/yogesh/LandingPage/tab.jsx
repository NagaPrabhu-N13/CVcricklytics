import React, { useState } from 'react';
import Home from "./home";
import Tournaments from "./tournaments";
import Leaderboard from "./leaderboard";
import Matches from "./matches";
import Teams from "./teams";
import Players from "./players";
import LiveStreams from "./liveStreams";
import More from "./more";
import { ClubProvider } from './ClubContext'; // Import the context provider

const SportsAppNavigation = () => {
  const [activeTab, setActiveTab] = useState('home');

  // Tab configuration with components
  const tabs = [
    { key: 'home', label: 'HOME', component: <Home /> },
    { key: 'tournaments', label: 'TOURNAMENTS', component: <Tournaments /> },
    { key: 'leaderboard', label: 'LEADERBOARD', component: <Leaderboard /> },
    { key: 'matches', label: 'MATCHES', component: <Matches /> },
    { key: 'teams', label: 'TEAMS', component: <Teams /> },
    { key: 'players', label: 'PLAYERS', component: <Players /> },
    { key: 'liveStreams', label: 'LIVE STREAMS', component: <LiveStreams /> },
    { key: 'more', label: 'ABOUT US', component: <More /> }
  ];

  // Find the active tab's component
  const activeComponent = tabs.find(tab => tab.key === activeTab)?.component;

  return (
    <ClubProvider> {/* Wrap with ClubProvider */}
      <div className="bg-gray-900 text-indigo-50 min-h-screen">
        {/* Tab Navigation */}
        <div className="sticky top-0 z-10">
          <div className="flex overflow-x-auto border-b border-white scrollbar-hide bg-black">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`px-4 py-3 whitespace-nowrap font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-indigo-200 hover:text-amber-300'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-4">
          <div className="rounded-lg md:p-6">
            {activeComponent}
          </div>
        </div>
      </div>
    </ClubProvider>
  );
};

export default SportsAppNavigation;