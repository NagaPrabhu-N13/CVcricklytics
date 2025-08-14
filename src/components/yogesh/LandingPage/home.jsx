import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiUsers, FiCalendar, FiStar, FiMail, FiGlobe } from 'react-icons/fi';
import { db, auth } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AddDetailsModal from './AddDetailsModal';
import { useClub } from './ClubContext'; // Import the context hook

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { setClubName } = useClub(); // Use context to set club name

  useEffect(() => {
    // Set up authentication listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchClubDetails(); // Fetch club details regardless of user login status
    });

    return () => unsubscribeAuth();
  }, [id, setClubName]);

  const fetchClubDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const clubDocRef = doc(db, 'clubs', id);
      const docSnap = await getDoc(clubDocRef);

      if (docSnap.exists()) {
        const clubData = { id: docSnap.id, ...docSnap.data() };
        setClub(clubData);
        setClubName(clubData.name); // Set club name in context
      } else {
        setError("Club not found.");
        setClub(null);
        setClubName('');
      }
    } catch (err) {
      console.error("Error fetching club details:", err);
      setError("Failed to load club details. Please try again.");
      setClub(null);
      setClubName('');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsAdded = (detailsData) => {
    setIsModalOpen(false);
    fetchClubDetails(); // Refresh club details after adding new details
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-700">Loading club details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-xl font-bold text-red-600 mb-4">{error}</p>
        <Link
          to="/Clubsmain"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Clubs
        </Link>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-800">Club not found</h1>
        <Link
          to="/Clubsmain"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-gray-700">
      <header className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-4 px-4">
        <div className="container mx-auto flex items-center">
          <button
            onClick={() => navigate('/Clubsmain')}
            className="mr-4 p-2 rounded-full hover:bg-gray-600 transition-colors"
            aria-label="Back to Clubs"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="overflow-hidden">
            <h1 className="text-xl md:text-2xl font-bold truncate">{club.name}</h1>
            <p className="text-gray-300 text-sm truncate">{club.category} Club</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 bg-gradient-to-r from-gray-800 to-gray-700">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg shadow-md overflow-hidden text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6">
            {/* Club Overview */}
            <div className="md:col-span-1">
              <div className="flex flex-col items-center mb-4 md:mb-6">
                <img
                  src={club.logo || 'https://via.placeholder.com/center'}
                  alt={`${club.name} logo`}
                  className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-full border-4 border-blue-100 mb-3 md:mb-4"
                />
                <div className="text-center">
                  <h2 className="text-lg md:text-xl font-bold">{club.name}</h2>
                  <p className="text-gray-600 text-sm md:text-base">{club.location}</p>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base">Club Information</h3>
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="flex items-center">
                      <FiUsers className="text-gray-500 mr-2" />
                      <span className="text-gray-500">{club.members} members</span>
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="text-gray-500 mr-2" />
                      <span className="text-gray-500">Established {club.established}</span>
                    </div>
                    {club.category === 'Premier' && (
                      <div className="flex items-center">
                        <FiStar className="text-yellow-500 mr-2" />
                        <span className="text-yellow-500">Premier Club</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {club.contact && (
                  <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base">Contact</h3>
                    <div className="space-y-2 text-sm md:text-base">
                      {club.contact.email && (
                        <div className="flex items-center">
                          <FiMail className="text-gray-500 mr-2" />
                          <a href={`mailto:${club.contact.email}`} className="text-blue-600 hover:underline truncate">
                            {club.contact.email}
                          </a>
                        </div>
                      )}
                      {club.contact.website && (
                        <div className="flex items-center">
                          <FiGlobe className="text-gray-500 mr-2" />
                          <a href={club.contact.website.startsWith('http') ? club.contact.website : `https://${club.contact.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {club.contact.website}
                          </a>
                        </div>
                      )}
                      {club.contact.phone && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="truncate text-blue-600">{club.contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Add Details Button (only for matching userId) */}
                {user && club.userId === user.uid && (
                  <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add About Details
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Club Details */}
            <div className="md:col-span-2 space-y-4 md:space-y-6">
              {club.description && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">About</h2>
                  <p className="text-gray-700 text-sm md:text-base">{club.description}</p>
                  <div className="mt-2 text-sm md:text-base">
                    <span className="font-medium text-gray-800">Club ID: </span>
                    <span className="text-gray-500">{club.tournamentId}</span>
                  </div>
                </div>
              )}

              {club.upcomingMatches && club.upcomingMatches.length > 0 && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Upcoming Matches</h2>
                  <div className="space-y-2 md:space-y-3">
                    {club.upcomingMatches.map((match, index) => (
                      <div key={index} className="bg-gray-50 p-2 md:p-3 rounded-md shadow-sm text-sm md:text-base">
                        <div className="font-medium">vs {match.opponent}</div>
                        <div className="text-gray-600">{match.date}</div>
                        <div className="text-gray-500 mt-1">
                          <FiMapPin className="inline mr-1" size={12} />
                          {match.venue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {club.facilities && club.facilities.length > 0 && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Facilities</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {club.facilities.map((facility, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded-md shadow-sm text-gray-500 text-xs md:text-sm">
                        {facility}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {club.achievements && club.achievements.length > 0 && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Achievements</h2>
                  <ul className="space-y-2">
                    {club.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-center text-sm md:text-base">
                        <FiStar className="text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-500">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Details Modal (only for matching userId) */}
      {isModalOpen && user && club.userId === user.uid && (
        <AddDetailsModal
          onClose={() => setIsModalOpen(false)}
          onDetailsAdded={handleDetailsAdded}
          currentDetails={null}
          currentUserId={user.uid}
          clubId={club.tournamentId}
          clubName={club.name}
        />
      )}
    </div>
  );
};

export default ClubDetail;