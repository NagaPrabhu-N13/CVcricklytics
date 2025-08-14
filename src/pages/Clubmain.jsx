import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiStar, FiMapPin, FiUsers, FiChevronDown, FiPlusCircle, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import backButton from '../assets/kumar/right-chevron.png';
import { v4 as uuidv4 } from 'uuid';
import { db, storage, serverTimestamp, auth } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

const Clubsmain = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    establishedAfter: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClubId, setEditingClubId] = useState(null);
  const [newClub, setNewClub] = useState({
    name: '',
    location: '',
    established: '',
    members: '',
    category: '',
    logoFile: null,
    logoUrl: '',
    description: '',
    upcomingMatchesText: '',
    facilitiesText: '',
    email: '',
    website: '',
    phone: '',
    achievementsText: '',
    tournamentId: uuidv4()
  });
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || null);
    });
    fetchClubs();
    return () => unsubscribeAuth();
  }, []);

  const fetchClubs = () => {
    setLoadingClubs(true);
    const q = query(collection(db, 'clubs'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clubsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClubs(clubsData);
      setLoadingClubs(false);
    }, (err) => {
      console.error("Error fetching clubs:", err);
      setError("Failed to load clubs. Please try again.");
      setLoadingClubs(false);
    });

    return () => unsubscribe();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClub(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewClub(prev => ({ ...prev, logoFile: e.target.files[0] }));
  };

  const handleAddOrUpdateClub = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentUserId) {
      setError("You must be logged in to add or edit a club.");
      return;
    }

    try {
      setUploadingLogo(true);
      let logoDownloadURL = newClub.logoUrl;
      if (newClub.logoFile) {
        const storageRef = ref(storage, `club_logos/${newClub.tournamentId}/${newClub.logoFile.name}`);
        const uploadTask = await uploadBytes(storageRef, newClub.logoFile);
        logoDownloadURL = await getDownloadURL(uploadTask.ref);
      } else if (!logoDownloadURL) {
        logoDownloadURL = "https://via.placeholder.com/60";
      }
      setUploadingLogo(false);

      const parseMatches = (text) => {
        return text.split(',').map(matchStr => {
          const parts = matchStr.trim().split('-').map(part => part.trim());
          if (parts.length >= 3) {
            return { opponent: parts[0], date: parts[1], venue: parts[2] };
          }
          return null;
        }).filter(match => match !== null);
      };

      const parseList = (text) => {
        return text.split(',').map(item => item.trim()).filter(item => item !== '');
      };

      const clubData = {
        name: newClub.name,
        location: newClub.location,
        established: parseInt(newClub.established),
        members: parseInt(newClub.members),
        category: newClub.category,
        logo: logoDownloadURL,
        description: newClub.description,
        upcomingMatches: parseMatches(newClub.upcomingMatchesText),
        facilities: parseList(newClub.facilitiesText),
        contact: {
          email: newClub.email,
          website: newClub.website,
          phone: newClub.phone
        },
        achievements: parseList(newClub.achievementsText),
        createdAt: isEditing ? newClub.createdAt : serverTimestamp(),
        tournamentId: newClub.tournamentId,
        createdBy: currentUserId,
        userId: currentUserId
      };

      if (isEditing) {
        await updateDoc(doc(db, 'clubs', editingClubId), clubData);
      } else {
        await addDoc(collection(db, 'clubs'), clubData);
      }

      setIsModalOpen(false);
      setIsEditing(false);
      setEditingClubId(null);
      setNewClub({
        name: '',
        location: '',
        established: '',
        members: '',
        category: '',
        logoFile: null,
        logoUrl: '',
        description: '',
        upcomingMatchesText: '',
        facilitiesText: '',
        email: '',
        website: '',
        phone: '',
        achievementsText: '',
        tournamentId: uuidv4()
      });
    } catch (err) {
      console.error("Error adding/updating club:", err);
      setError(`Failed to ${isEditing ? 'update' : 'add'} club. Please check your inputs and try again.`);
      setUploadingLogo(false);
    }
  };

  const handleEditClub = (club) => {
    setIsEditing(true);
    setEditingClubId(club.id);
    setNewClub({
      name: club.name,
      location: club.location,
      established: club.established.toString(),
      members: club.members.toString(),
      category: club.category,
      logoFile: null,
      logoUrl: club.logo,
      description: club.description,
      upcomingMatchesText: club.upcomingMatches.map(match => `${match.opponent} - ${match.date} - ${match.venue}`).join(', '),
      facilitiesText: club.facilities.join(', '),
      email: club.contact.email,
      website: club.contact.website,
      phone: club.contact.phone,
      achievementsText: club.achievements.join(', '),
      tournamentId: club.tournamentId,
      createdAt: club.createdAt
    });
    setIsModalOpen(true);
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm("Are you sure you want to delete this club?")) return;

    try {
      await deleteDoc(doc(db, 'clubs', clubId));
    } catch (err) {
      console.error("Error deleting club:", err);
      setError("Failed to delete club. Please try again.");
    }
  };

  const filterClubs = () => {
    return clubs.filter(club => {
      const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilters =
        (filters.location === '' || club.location === filters.location) &&
        (filters.category === '' || club.category === filters.category) &&
        (filters.establishedAfter === '' || club.established >= parseInt(filters.establishedAfter));

      return matchesSearch && matchesFilters;
    });
  };

  const locations = [...new Set(clubs.map(club => club.location))];
  const categories = [...new Set(clubs.map(club => club.category))];
  const filteredClubs = filterClubs();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-4 px-4 shadow-md sticky top-0 z-10"
      >
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/landingpage")}
              className="px-2 py-1 rounded-md text-sm md:text-base transition-colors"
            >
              <img
                src={backButton}
                alt="Back"
                className="h-7 w-7 md:h-10 w-10 mt-2 ml-1 cursor-pointer transform rotate-180"
              />
            </button>
            <h1 className="text-xl md:text-3xl font-bold">Cricket Association Clubs</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 md:px-4 md:py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm md:text-base font-medium transition-colors"
            onClick={() => navigate('/join')}
          >
            Join Now
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 flex flex-col md:flex-row gap-4 md:gap-8 items-start">
        {/* Video Column - hidden on small screens */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="hidden md:block w-full md:w-1/3 lg:w-1/4 bg-gray-800 p-4 md:p-6 rounded-lg shadow-md sticky top-20 h-fit border border-gray-700"
        >
          <motion.h2
            whileHover={{ scale: 1.02 }}
            className="text-xl font-bold text-blue-300 mb-4"
          >
            Cricket Clubs Network
          </motion.h2>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <DotLottieReact
              src="https://lottie.host/c7ff62dd-dbbc-445c-a0c4-ed4f9ad79b33/mkNWrGuTcw.lottie"
              loop
              autoplay
            />
          </motion.div>

          <div className="space-y-4 mt-4">
            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 bg-gray-750 rounded-lg border border-gray-600"
            >
              <h3 className="font-medium text-blue-400">Premier Clubs</h3>
              <p className="text-sm text-gray-300 mt-1">
                Our top-tier clubs with international standard facilities and players.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 bg-gray-700 rounded-lg border border-gray-600"
            >
              <h3 className="font-medium text-green-400">Regional Development</h3>
              <p className="text-sm text-gray-300 mt-1">
                Clubs across all regions promoting cricket at grassroots level.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              className="p-3 bg-gray-750 rounded-lg border border-gray-600"
            >
              <h3 className="font-medium text-yellow-400">Join a Club</h3>
              <p className="text-sm text-gray-300 mt-1">
                Find a club near you and start your cricket journey today.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Clubs List Column */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          {/* Search and Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-700"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <motion.div
                whileFocus={{ scale: 1.01 }}
                className="relative flex-grow"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search clubs..."
                  className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600 text-sm sm:text-base"
              >
                <FiFilter className="text-gray-300" />
                <span className="text-gray-300">Filters</span>
                {filterOpen ? <FiChevronDown className="transform rotate-180 text-gray-300" /> : <FiChevronDown className="text-gray-300" />}
              </motion.button>
              {currentUserId && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setNewClub({
                      name: '',
                      location: '',
                      established: '',
                      members: '',
                      category: '',
                      logoFile: null,
                      logoUrl: '',
                      description: '',
                      upcomingMatchesText: '',
                      facilitiesText: '',
                      email: '',
                      website: '',
                      phone: '',
                      achievementsText: '',
                      tournamentId: uuidv4()
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm sm:text-base"
                >
                  <FiPlusCircle /> Add Club
                </motion.button>
              )}
            </div>

            {/* Filter Dropdown */}
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-750">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                      >
                        <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                        <select
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm"
                          value={filters.location}
                          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        >
                          <option value="">All Locations</option>
                          {locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                      >
                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <select
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm"
                          value={filters.category}
                          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                          <option value="">All Categories</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="sm:col-span-2 md:col-span-1"
                      >
                        <label className="block text-sm font-medium text-gray-300 mb-1">Established After</label>
                        <select
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm"
                          value={filters.establishedAfter}
                          onChange={(e) => setFilters({ ...filters, establishedAfter: e.target.value })}
                        >
                          <option value="">Any Year</option>
                          <option value="2020">2020</option>
                          <option value="2010">2010</option>
                          <option value="2000">2000</option>
                          <option value="1990">1990</option>
                          <option value="1980">1980</option>
                        </select>
                      </motion.div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilters({ location: '', category: '', establishedAfter: '' })}
                        className="px-3 py-1 text-xs sm:text-sm text-gray-400 hover:text-gray-200"
                      >
                        Reset Filters
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Loading state */}
          {loadingClubs ? (
            <div className="text-center py-8">
              <DotLottieReact
                src="https://lottie.host/dd586414-b150-482a-89a1-02685710609b/z2Dk71rYjL.lottie"
                loop
                autoplay
                style={{ width: '100px', height: '100px', margin: 'auto' }}
              />
              <p className="text-gray-400 mt-2">Loading clubs...</p>
            </div>
          ) : (
            /* Clubs List */
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <AnimatePresence>
                {filteredClubs.length > 0 ? (
                  filteredClubs.map((club, index) => (
                    <motion.div
                      key={club.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <div className="flex items-center bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg hover:transform hover:-translate-y-1 border border-gray-700">
                        <Link
                          to={`/clubs/${club.id}`}
                          className="flex-grow"
                        >
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-3 sm:p-4 flex items-center"
                          >
                            <div className="flex-shrink-0 mr-3 sm:mr-4">
                              <motion.img
                                whileHover={{ rotate: 5, scale: 1.1 }}
                                src={club.logo || 'https://via.placeholder.com/60'}
                                alt={`${club.name} logo`}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full border-2 border-blue-400"
                              />
                            </div>
                            <div className="flex-grow overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                {/* Top Row: Club Name & Premier Tag */}
                                <div className="flex justify-between items-center w-full">
                                  <h2 className="text-sm sm:text-lg font-bold text-white truncate">{club.name}</h2>
                                  {club.category === 'Premier' && (
                                    <motion.span
                                      animate={{ scale: [1, 1.1, 1] }}
                                      transition={{ repeat: Infinity, duration: 2 }}
                                      className="flex items-center text-yellow-400 text-xs sm:text-sm"
                                    >
                                      <FiStar className="mr-1" /> Premier
                                    </motion.span>
                                  )}
                                </div>

                                {/* Bottom Row: Buttons (only for owner) */}
                                {currentUserId === club.createdBy && (
                                  <div className="flex flex-col sm:flex-row p-2 space-y-2 sm:space-y-0 sm:space-x-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleEditClub(club)}
                                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
                                    >
                                      <FiEdit />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDeleteClub(club.id)}
                                      className="p-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
                                    >
                                      <FiTrash2 />
                                    </motion.button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center text-xs sm:text-sm text-gray-400 mt-1 truncate">
                                <FiMapPin className="mr-1 flex-shrink-0" />
                                <span className="truncate">{club.location}</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-400 mt-1 truncate">
                                <FiUsers className="mr-1 flex-shrink-0" />
                                <span className="truncate">{club.members} members | Est. {club.established}</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-400 mt-1 truncate">
                                <span className="truncate">Tournament ID: {club.tournamentId}</span>
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-700"
                  >
                    <h3 className="text-base sm:text-lg font-medium text-gray-300">No clubs found matching your criteria</h3>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">Try adjusting your search or filters</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSearchTerm('');
                        setFilters({ location: '', category: '', establishedAfter: '' });
                      }}
                      className="mt-3 px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      Reset Search
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Club Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold text-white mb-4">{isEditing ? 'Edit Club' : 'Add New Club'}</h2>
              {error && (
                <div className="text-red-500 text-sm mb-4 flex justify-between items-center">
                  {error}
                  <button onClick={() => setError(null)} className="ml-2 text-gray-400 hover:text-gray-200">×</button>
                </div>
              )}
              <form onSubmit={handleAddOrUpdateClub} className="space-y-4">
                <div>
                  <label htmlFor="tournamentId" className="block text-sm font-medium text-gray-300">Tournament ID</label>
                  <input
                    type="text"
                    id="tournamentId"
                    name="tournamentId"
                    value={newClub.tournamentId}
                    readOnly
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">Club Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newClub.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={newClub.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="established" className="block text-sm font-medium text-gray-300">Established Year</label>
                    <input
                      type="number"
                      id="established"
                      name="established"
                      value={newClub.established}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="members" className="block text-sm font-medium text-gray-300">Members</label>
                    <input
                      type="number"
                      id="members"
                      name="members"
                      value={newClub.members}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={newClub.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Premier">Premier</option>
                    <option value="First Class">First Class</option>
                    <option value="Division I">Division I</option>
                    <option value="Division II">Division II</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="logoFile" className="block text-sm font-medium text-gray-300">Club Logo (Upload File)</label>
                  <input
                    type="file"
                    id="logoFile"
                    name="logoFile"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-300 mt-2">Or paste Logo URL</label>
                  <input
                    type="text"
                    id="logoUrl"
                    name="logoUrl"
                    value={newClub.logoUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {uploadingLogo && <p className="text-blue-300 text-sm mt-1">Uploading logo...</p>}
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newClub.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                {/* Contact Fields */}
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Contact Information</h3>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newClub.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-300">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={newClub.website}
                      onChange={handleInputChange}
                      placeholder="https://www.example.com"
                      className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={newClub.phone}
                      onChange={handleInputChange}
                      placeholder="+94 11 2345678"
                      className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Upcoming Matches Input */}
                <div>
                  <label htmlFor="upcomingMatchesText" className="block text-sm font-medium text-gray-300">Upcoming Matches (e.g., Lions CC - May 15 - R. Premadasa Stadium, Titans CC - May 22 - SSC Ground)</label>
                  <textarea
                    id="upcomingMatchesText"
                    name="upcomingMatchesText"
                    value={newClub.upcomingMatchesText}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                {/* Achievements Input */}
                <div>
                  <label htmlFor="achievementsText" className="block text-sm font-medium text-gray-300">Achievements (comma-separated)</label>
                  <textarea
                    id="achievementsText"
                    name="achievementsText"
                    value={newClub.achievementsText}
                    onChange={handleInputChange}
                    rows="2"
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="facilitiesText" className="block text-sm font-medium text-gray-300">Facilities (comma-separated)</label>
                  <input
                    type="text"
                    id="facilitiesText"
                    name="facilitiesText"
                    value={newClub.facilitiesText}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditing(false);
                      setEditingClubId(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Club' : 'Add Club')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clubsmain;