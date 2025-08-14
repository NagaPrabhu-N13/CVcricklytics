import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaRegCopyright } from 'react-icons/fa';
import logo from '../assets/sophita/HomePage/picture3_2.png';
import backButton from '../assets/kumar/right-chevron.png';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function TeamDetails() {
  const [activeTab, setActiveTab] = useState('myteam');
  const [followedTeams, setFollowedTeams] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setTeams([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setTeams([]);
      return;
    }

    const q = query(collection(db, 'clubTeams'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTeams = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (activeTab === 'myteam') {
          setTeams(fetchedTeams.filter(team => team.createdBy === currentUserId));
        } else if (activeTab === 'opponent') {
          setTeams(fetchedTeams.filter(team => team.createdBy !== currentUserId));
        }
      },
      (error) => {
        console.error('Error fetching teams: ', error);
      }
    );

    return () => unsubscribe();
  }, [currentUserId, activeTab]);

  return (
    <div className="min-h-screen p-4" style={{
      backgroundImage: 'linear-gradient(140deg,#080006 15%,#FF0077)',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className="flex flex-col mt-0">
        <div className="flex items-start">
          <img src={logo} alt="Cricklytics Logo" className="h-7 w-7 md:h-10 object-contain block select-none" />
          <span className="p-2 text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">Cricklytics</span>
        </div>
      </div>

      <div className="md:absolute flex items-center gap-4">
        <img
          src={backButton}
          alt="Back"
          className="h-8 w-8 cursor-pointer -scale-x-100"
          onClick={() => window.history.back()}
        />
      </div>

      <div className="flex justify-center space-x-12 text-white text-lg font-semibold border-b-4 border-white pb-2 mb-6">
        {['myteam', 'opponent', 'following'].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`cursor-pointer ${activeTab === tab ? 'border-b-2 border-white text-blue-500' : ''}`}
          >
            {tab === 'myteam' ? 'My Team' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>

      <div className="max-w-xl mx-auto space-y-4 text-center">
        {activeTab === 'following' ? (
          <div>
            <h2 className="text-white text-xl mb-4">Following Teams</h2>
            {followedTeams.length === 0 ? (
              <p className="text-white">You are not following any teams yet.</p>
            ) : (
              followedTeams.map((teamName, idx) => (
                <div key={idx} className="rounded-xl p-4 shadow-md shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                  <span className="text-lg font-semibold text-black">{teamName}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          teams.length === 0 ? (
            <p className="text-white">
              {activeTab === 'myteam' ? 'You have not created any teams yet.' : 'No opponent teams available.'}
            </p>
          ) : (
            teams.map((team, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-white/5 backdrop-blur flex justify-between items-center"
              >
                <div className="flex items-center">
                  {team.image ? (
                    <img
                      src={team.image}
                      alt="team"
                      className="aspect-square w-14 rounded-full mr-4 border-2 border-gray-300 object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-14 rounded-full mr-4 border-2 border-gray-300 bg-gray-700 text-white flex items-center justify-center text-xl font-bold">
                      {team.teamName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-lg font-semibold text-white">{team.teamName}</span>
                </div>

                <div className="text-right text-sm space-y-1 text-white">
                  <div className="flex items-center justify-end gap-2">
                    <FaMapMarkerAlt className="text-white" />
                    <span>{team.location}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <FaRegCopyright className="text-white" />
                    <span>{team.captain}</span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}