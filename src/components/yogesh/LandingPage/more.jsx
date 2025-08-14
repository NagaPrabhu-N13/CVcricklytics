import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AddDetailsModal from './AddDetailsModal';
import { useClub } from './ClubContext';

const More = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [details, setDetails] = useState({
    id: '',
    heroTitle: '',
    heroSubtitle: '',
    storyText1: '',
    storyText2: '',
    storyImage: '',
    missionValue1: '',
    missionValue2: '',
    missionValue3: '',
    missionIcon1: '🏆',
    missionIcon2: '🤝',
    missionIcon3: '🌱',
    missionTitle1: 'Promoting Sportsmanship',
    missionTitle2: 'Corporate Networking',
    missionTitle3: 'Community Development',
    tournamentGrowth: [],
    matchesPlayed: '',
    corporatePlayers: '',
    seasonsCompleted: '',
    trophyImage: '',
    teamMembers: [],
  });
  const [noDetailsFound, setNoDetailsFound] = useState(false);
  const { clubName } = useClub();

  // Log clubName to verify it's passed
  useEffect(() => {
    console.log('Club Name in More.jsx:', clubName);
  }, [clubName]);

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setNoDetailsFound(true);
        setLoadingDetails(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch details from Firestore
  useEffect(() => {
    if (authLoading || !currentUserId || !clubName) {
      setLoadingDetails(false);
      setNoDetailsFound(true);
      return;
    }

    setLoadingDetails(true);
    setNoDetailsFound(false);

    const q = query(
      collection(db, 'aboutPage'),
      where('name', '==', clubName),
      where('userId', '==', currentUserId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0]; // Assume one document per club per user
        const data = docSnap.data();
        console.log('Fetched aboutPage data:', data); // Debug log
        setDetails({
          id: docSnap.id,
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || '',
          storyText1: data.storyText1 || '',
          storyText2: data.storyText2 || '',
          storyImage: data.storyImage || '',
          missionValue1: data.missionValue1 || '',
          missionValue2: data.missionValue2 || '',
          missionValue3: data.missionValue3 || '',
          missionIcon1: data.missionIcon1 || '🏆',
          missionIcon2: data.missionIcon2 || '🤝',
          missionIcon3: data.missionIcon3 || '🌱',
          missionTitle1: data.missionTitle1 || 'Promoting Sportsmanship',
          missionTitle2: data.missionTitle2 || 'Corporate Networking',
          missionTitle3: data.missionTitle3 || 'Community Development',
          tournamentGrowth: data.tournamentGrowth || [],
          matchesPlayed: data.matchesPlayed || '',
          corporatePlayers: data.corporatePlayers || '',
          seasonsCompleted: data.seasonsCompleted || '',
          trophyImage: data.trophyImage || '',
          teamMembers: data.teamMembers || [],
        });
      } else {
        console.log('No matching aboutPage document found for clubName:', clubName);
        setNoDetailsFound(true);
        setDetails({ // Reset to default
          id: '',
          heroTitle: '',
          heroSubtitle: '',
          storyText1: '',
          storyText2: '',
          storyImage: '',
          missionValue1: '',
          missionValue2: '',
          missionValue3: '',
          missionIcon1: '🏆',
          missionIcon2: '🤝',
          missionIcon3: '🌱',
          missionTitle1: 'Promoting Sportsmanship',
          missionTitle2: 'Corporate Networking',
          missionTitle3: 'Community Development',
          tournamentGrowth: [],
          matchesPlayed: '',
          corporatePlayers: '',
          seasonsCompleted: '',
          trophyImage: '',
          teamMembers: [],
        });
      }
      setLoadingDetails(false);
    }, (error) => {
      console.error("Error fetching about page details:", error);
      setNoDetailsFound(true);
      setLoadingDetails(false);
    });

    return () => unsubscribe();
  }, [authLoading, currentUserId, clubName]);

  const handleDetailsAdded = (newDetails) => {
    setDetails({ ...newDetails, id: newDetails.id || 'content' });
    setNoDetailsFound(false);
    setIsModalOpen(false);
  };

  if (authLoading || loadingDetails) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Please log in to view about page details.
      </div>
    );
  }

  if (!clubName) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        No club selected. Please view a club first.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gray-800 text-white">
        <div className="absolute inset-0 bg-black opacity-70"></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg py-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {details.heroTitle || `About ${clubName}`}
          </h1>
          <p className="mt-6 text-xl max-w-3xl mx-auto text-gray-300">
            {details.heroSubtitle || 'Enter subtitle via Add Details'}
          </p>
          {currentUserId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700"
            >
              Add/Edit Details
            </button>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {noDetailsFound && (
          <div className="text-center text-gray-300 text-xl mb-8">
            No details found for {clubName}. Click "Add/Edit Details" to create content.
          </div>
        )}

        {/* Our Story */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-12 border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Our Story</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-lg text-gray-300 mb-4">
                {details.storyText1 || 'Enter first paragraph via Add Details'}
              </p>
              <p className="text-lg text-gray-300 mb-4">
                {details.storyText2 || 'Enter second paragraph via Add Details'}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-center">
              <img
                src={details.storyImage || 'https://via.placeholder.com/500x300'}
                alt="Story image"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Mission and Values */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-12 border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Our Mission & Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
              <div className="text-indigo-400 text-4xl mb-4">{details.missionIcon1}</div>
              <h3 className="text-white text-xl font-bold mb-2">{details.missionTitle1}</h3>
              <p className="text-gray-300">
                {details.missionValue1 || 'Enter description via Add Details'}
              </p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
              <div className="text-amber-400 text-4xl mb-4">{details.missionIcon2}</div>
              <h3 className="text-white text-xl font-bold mb-2">{details.missionTitle2}</h3>
              <p className="text-gray-300">
                {details.missionValue1 || 'Enter description via Add Details'}
              </p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
              <div className="text-green-400 text-4xl mb-4">{details.missionIcon3}</div>
              <h3 className="text-white text-xl font-bold mb-2">{details.missionTitle3}</h3>
              <p className="text-gray-300">
                {details.missionValue3 || 'Enter description via Add Details'}
              </p>
            </div>
          </div>
        </div>

        {/* Tournament Highlights */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-12 border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Tournament Highlights</h2>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 bg-gray-700 rounded-lg p-4 flex items-center justify-center border border-gray-600">
                <img
                  src={details.trophyImage || 'https://via.placeholder.com/500x300'}
                  alt="Tournament trophy"
                  className="rounded-lg shadow-md"
                />
              </div>
              <div className="md:w-2/3">
                <h3 className="text-gray-300 text-xl font-bold mb-2">Growth Over Years</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  {details.tournamentGrowth.length > 0 ? (
                    details.tournamentGrowth.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>Enter growth milestones via Add Details</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <p className="text-4xl font-bold text-indigo-400">{details.matchesPlayed || '0'}</p>
                <p className="text-gray-300">Matches Played</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <p className="text-4xl font-bold text-indigo-400">{details.corporatePlayers || '0'}</p>
                <p className="text-gray-300">Corporate Players</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <p className="text-4xl font-bold text-indigo-400">{details.seasonsCompleted || '0'}</p>
                <p className="text-gray-300">Seasons Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Our Team</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {details.teamMembers.length > 0 ? (
              details.teamMembers.map((member, index) => (
                <div key={index} className="bg-gray-700 rounded-lg overflow-hidden shadow-sm border border-gray-600">
                  <img
                    src={member.img || 'https://via.placeholder.com/300x200'}
                    alt={member.name || 'Team member'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white">{member.name || 'Enter name via Add Details'}</h3>
                    <p className="text-indigo-400 font-medium mb-2">{member.role || 'Enter role via Add Details'}</p>
                    <p className="text-gray-300">{member.bio || 'Enter bio via Add Details'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-300">No team members added yet.</p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddDetailsModal
          onClose={() => setIsModalOpen(false)}
          onDetailsAdded={handleDetailsAdded}
          currentDetails={details}
          currentUserId={currentUserId}
          clubName={clubName}
        />
      )}
    </div>
  );
};

export default More;