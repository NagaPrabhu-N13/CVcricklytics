import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaTrashAlt } from 'react-icons/fa';
import logo from '../assets/sophita/HomePage/picture3_2.png';
import backButton from '../assets/kumar/right-chevron.png';
import { db, auth } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import PitchAnalyzer from '../components/sophita/HomePage/PitchAnalyzer';

export default function TournamentList() {
  const [activeTab, setActiveTab] = useState('myTournament');
  const [tournamentList, setTournamentList] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [showPitchAnalyzer, setShowPitchAnalyzer] = useState(false);
  const [selectedForAnalyzer, setSelectedForAnalyzer] = useState(null);
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [pointsTableData, setPointsTableData] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'tournament'),
      (snapshot) => {
        const tournaments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTournamentList(tournaments);
      },
      (error) => {
        console.error("Error fetching tournaments:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteTournament = async (id) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      await deleteDoc(doc(db, 'tournament', id));
    }
  };

  const handleFollowToggle = async (tournament) => {
    const tournamentRef = doc(db, 'tournament', tournament.id);
    if (tournament.followers?.includes(auth.currentUser.uid)) {
      await updateDoc(tournamentRef, {
        followers: arrayRemove(auth.currentUser.uid)
      });
    } else {
      await updateDoc(tournamentRef, {
        followers: arrayUnion(auth.currentUser.uid)
      });
    }
    setIsModalOpen(false);
  };

  const handleCardClick = (tournament) => {
    setSelectedTournament(tournament);
    setIsModalOpen(true);
  };

  const fetchPointsTable = async (tournamentId) => {
    try {
      const docRef = doc(db, 'PointsTable', tournamentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sortedTeams = (data.teams || []).sort((a, b) => b.points - a.points || parseFloat(b.nrr) - parseFloat(a.nrr));
        setPointsTableData(sortedTeams);
      } else {
        setPointsTableData([]);
      }
    } catch (error) {
      console.error('Error fetching points table:', error);
    }
  };

  let tournamentsToShow = [];
  if (activeTab === 'myTournament') {
    tournamentsToShow = tournamentList.filter(t => t.userId === auth.currentUser.uid);
  } else if (activeTab === 'all') {
    tournamentsToShow = tournamentList.filter(t => t.userId !== auth.currentUser.uid);
  } else if (activeTab === 'following') {
    tournamentsToShow = tournamentList.filter(t => t.followers?.includes(auth.currentUser.uid));
  }

  const renderTournamentImage = (tournament) => {
    if (tournament.imageUrl && tournament.imageUrl.trim() !== '') {
      return (
        <img
          src={tournament.imageUrl}
          alt={tournament.name}
          className="aspect-square w-10 sm:w-14 rounded-full mr-2 sm:mr-4 border-2 border-gray-300 object-cover"
        />
      );
    } else {
      const firstLetter = tournament.name.charAt(0).toUpperCase();
      return (
        <div className="w-10 h-10 sm:w-14 sm:h-14 mr-2 sm:mr-4 rounded-full border-2 border-gray-300 flex items-center justify-center bg-pink-600 text-white font-bold text-lg sm:text-xl select-none">
          {firstLetter}
        </div>
      );
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'linear-gradient(140deg,#080006 15%,#FF0077)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-transparent">
        <div className="flex flex-col p-3 sm:p-4 pb-0">
          <div className="flex items-start">
            <img
              src={logo}
              alt="Cricklytics Logo"
              className="h-14 w-14 sm:h-20 sm:w-20 md:h-10 object-contain block select-none"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/Picture3 2.png";
              }}
            />
            <span className="p-2 text-xl sm:text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,1)]">
              Cricklytics
            </span>
          </div>
        </div>
        <div className="md:absolute flex items-center gap-2 sm:gap-4 p-3 sm:p-4 pt-0">
          <img
            src={backButton}
            alt="Back"
            className="h-6 w-6 sm:h-8 sm:w-8 cursor-pointer -scale-x-100"
            onClick={() => {navigate("/search-aft")}}
          />
        </div>

        {/* Tabs */}
        <div className="w-full flex justify-center space-x-4 sm:space-x-6 md:space-x-12 text-white text-xs sm:text-sm md:text-lg font-semibold border-b-2 sm:border-b-4 border-white pb-1 sm:pb-2 px-2 sm:px-4">
          <div
            onClick={() => setActiveTab('myTournament')}
            className={`cursor-pointer text-center px-1 sm:px-2 ${activeTab === 'myTournament' ? 'border-b-2 border-white text-blue-300' : ''}`}
          >
            My Tournament
          </div>
          <div
            onClick={() => setActiveTab('following')}
            className={`cursor-pointer text-center px-1 sm:px-2 ${activeTab === 'following' ? 'border-b-2 border-white text-blue-300' : ''}`}
          >
            Following
          </div>
          <div
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer text-center px-1 sm:px-2 ${activeTab === 'all' ? 'border-b-2 border-white text-blue-300' : ''}`}
          >
            All
          </div>
        </div>
      </div>

      {/* Scrollable Border Box */}
      <div className="w-full px-2 sm:px-4 pt-[130px] sm:pt-[140px]">
        <div
          className="border-2 border-white/40 rounded-lg overflow-y-auto"
          style={{
            maxHeight: "calc(100vh - 150px)",
          }}
        >
          <div className="space-y-3 sm:space-y-4 p-2 sm:p-4">
            {activeTab === 'following' && tournamentsToShow.length === 0 ? (
              <div className="text-white text-center py-8 sm:py-10">
                <p className="text-lg sm:text-2xl font-semibold">You haven't followed any tournaments yet! 😔</p>
              </div>
            ) : activeTab !== 'following' && tournamentsToShow.length === 0 ? (
              <div className="text-white text-center py-8 sm:py-10">
                <p className="text-base sm:text-xl font-semibold">No tournaments to show here.</p>
              </div>
            ) : (
              tournamentsToShow.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => handleCardClick(tournament)}
                  className="rounded-xl bg-white/5 border border-white/20 shadow-lg shadow-black/50 p-3 sm:p-4 backdrop-blur relative overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center">
                      {renderTournamentImage(tournament)}
                      <span className="text-sm sm:text-lg font-semibold text-white truncate max-w-[120px] sm:max-w-none">
                        {tournament.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="text-right text-xs sm:text-sm space-y-1 text-white">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <FaMapMarkerAlt className="text-white text-xs sm:text-sm" />
                          <span className="truncate max-w-[80px] sm:max-w-none">{tournament.location}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <span>{tournament.season || 'N/A'}</span>
                        </div>
                      </div>
                      {tournament.userId === auth.currentUser.uid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTournament(tournament.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition"
                          aria-label="Delete Tournament"
                          title="Delete Tournament"
                        >
                          <FaTrashAlt size={16} className="sm:text-lg" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tournament Details Modal */}
      {isModalOpen && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 px-2 sm:px-4">
          <div
            className="w-full max-w-md rounded-lg p-4 sm:p-6 shadow-lg border-2 border-white"
            style={{
              background: 'rgba(66, 21, 21, 0.85)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.75)',
            }}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white text-center">Tournament Details</h2>
            <div className="space-y-2 sm:space-y-3 text-white text-xs sm:text-sm md:text-base">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Name:</span>
                <span className="truncate">{selectedTournament.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-white text-xs sm:text-sm" />
                <span className="truncate">{selectedTournament.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Organizer:</span>
                <span className="truncate">{selectedTournament.organizer || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Season:</span>
                <span>{selectedTournament.season || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Teams:</span>
                <span>{selectedTournament.noOfTeams || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Matches:</span>
                <span>{selectedTournament.matches || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Current Stage:</span>
                <span>{selectedTournament.currentStage || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Duration:</span>
                <span className="text-xs sm:text-sm">
                  {selectedTournament.startDate && selectedTournament.endDate
                    ? `${selectedTournament.startDate} - ${selectedTournament.endDate}`
                    : 'N/A'}
                </span>
              </div>
              {selectedTournament.imageUrl && (
                <div className="mt-3 sm:mt-4">
                  <img
                    src={selectedTournament.imageUrl}
                    alt={selectedTournament.name}
                    className="w-full h-32 sm:h-40 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end mt-4 sm:mt-6 gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded transition text-xs sm:text-sm"
              >
                Close
              </button>
              {selectedTournament.userId === auth.currentUser.uid && (
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    const stage = selectedTournament.currentStage || 'N/A';
                    if (stage === 'RoundRobin') {
                    navigate("/selection2", { state: { information: "FromSidebar",tournamentId: selectedTournament.tournamentId,teams:selectedTournament.selectedTeams, noOfTeams: selectedTournament.teams, tournamentName: selectedTournament.name } })
                    }else if (stage == 'Knockout'){
                      navigate("/selection", {
                          state: {
                            information: "FromSidebar",
                            teams:selectedTournament.selectedTeams,
                            tournamentId: selectedTournament.tournamentId,
                            noOfTeams: selectedTournament.teams,
                            tournamentName: selectedTournament.name,
                          }
                        });
                    }
                  }}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded transition font-semibold text-xs sm:text-sm"
                >
                  Continue
                </button>
              )}
              {selectedTournament.userId !== auth.currentUser.uid && (
                <>
                  <button
                    onClick={() => handleFollowToggle(selectedTournament)}
                    className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded transition font-semibold text-xs sm:text-sm"
                  >
                    {selectedTournament.followers?.includes(auth.currentUser.uid) ? 'Unfollow' : 'Follow'}
                  </button>
                  <button
                    onClick={() => {
                      fetchPointsTable(selectedTournament.tournamentId);
                      setShowPointsTable(true);
                      setIsModalOpen(false);
                    }}
                    className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded transition font-semibold text-xs sm:text-sm"
                  >
                    PointsTable
                  </button>
                  <button
                    onClick={() => {
                      setSelectedForAnalyzer(selectedTournament);
                      setShowPitchAnalyzer(true);
                      setIsModalOpen(false);
                    }}
                    className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded transition font-semibold text-xs sm:text-sm"
                  >
                    View
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Pitch Analyzer Overlay */}
      {showPitchAnalyzer && selectedForAnalyzer && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 px-2">
          <div
            className="w-full max-w-4xl rounded-lg p-4 sm:p-6 shadow-lg border-2 border-white relative"
            style={{
              background: 'rgba(66, 21, 21, 0.85)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.75)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPitchAnalyzer(false)}
              className="absolute top-2 right-2 text-white text-2xl font-bold hover:text-gray-300"
            >
              &times;
            </button>
            
            {/* Render the PitchAnalyzer component with props */}
            <PitchAnalyzer
              tournament={selectedForAnalyzer}
              tournamentId={selectedForAnalyzer.tournamentId}
              noOfTeams={selectedForAnalyzer.noOfTeams}
              tournamentName={selectedForAnalyzer.name}
            />
          </div>
        </div>
      )}

      {/* Points Table Overlay */}
      {showPointsTable && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 px-2">
          <div
            className="w-full max-w-4xl rounded-lg p-4 sm:p-6 shadow-lg border-2 border-white relative"
            style={{
              background: 'rgba(66, 21, 21, 0.85)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.75)',
            }}
          >
            <button
              onClick={() => setShowPointsTable(false)}
              className="absolute top-2 right-2 text-white text-2xl font-bold hover:text-gray-300"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 text-center">Points Table</h2>
            {pointsTableData.length > 0 ? (
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-2">Team</th>
                    <th className="p-2">M</th>
                    <th className="p-2">W</th>
                    <th className="p-2">L</th>
                    <th className="p-2">D</th>
                    <th className="p-2">Pts</th>
                    <th className="p-2">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTableData.map((team, index) => (
                    <tr key={index} className="border-b border-gray-600">
                      <td className="p-2">{team.teamName}</td>
                      <td className="p-2">{team.matches}</td>
                      <td className="p-2">{team.wins}</td>
                      <td className="p-2">{team.losses}</td>
                      <td className="p-2">{team.draws}</td>
                      <td className="p-2">{team.points}</td>
                      <td className="p-2">{team.nrr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-white text-center">No points table data available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
