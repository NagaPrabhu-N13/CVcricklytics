import React, { useState, useEffect } from 'react';
import { FiStar, FiMessageSquare, FiUser, FiCalendar, FiMapPin, FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import cuslogo from "../../assets/yogesh/communityimg/cuslogo.png";
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth } from "../../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const UmpiresPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUmpire, setSelectedUmpire] = useState(null);
  const [umpiresData, setUmpiresData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    matches: '',
    location: '',
    experience: '',
    image: '',
    bio: '',
    availability: 'Available',
    imageSource: 'url',
    imageFile: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch umpire data from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'Umpires'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(entry => entry.userId === auth.currentUser.uid);
      setUmpiresData(data);
    }, (error) => {
      console.error("Error fetching umpires:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filter umpires based on search and active tab
  const filteredUmpires = umpiresData.filter(umpire => {
    const matchesSearch = umpire.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'available') return matchesSearch && (umpire.availability === 'Available' || umpire.availability === 'Booked');
    if (activeTab === 'elite') return matchesSearch && umpire.rating >= 4.7;
    return matchesSearch;
  });

  // Calculate community stats
  const calculateCommunityStats = () => {
    const totalUmpires = umpiresData.length;
    const availableUmpires = umpiresData.filter(u => u.availability === 'Available' || u.availability === 'Booked').length;
    const totalMatches = umpiresData.reduce((acc, umpire) => acc + (umpire.matches || 0), 0);
    const countries = [...new Set(umpiresData.map(u => u.location.split(',').pop().trim()))].length;

    return { totalUmpires, availableUmpires, totalMatches, countries };
  };

  const { totalUmpires, availableUmpires, totalMatches, countries } = calculateCommunityStats();

  // Handle image file change
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result, imageFile: file });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle saving or updating umpire data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.rating || !formData.matches || !formData.location.trim() || !formData.experience.trim() || !formData.bio.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (isNaN(formData.matches) || formData.matches < 0) {
      alert("Matches must be a non-negative number!");
      return;
    }
    if (formData.imageSource === 'url' && formData.image && !formData.image.match(/\.(jpg|jpeg|png|gif)$/i)) {
      alert("Please provide a valid image URL (jpg, jpeg, png, gif)!");
      return;
    }

    setIsLoading(true);
    try {
      const entryData = {
        name: formData.name,
        rating: parseFloat(formData.rating),
        matches: parseInt(formData.matches),
        location: formData.location,
        experience: formData.experience,
        image: formData.image || cuslogo,
        bio: formData.bio,
        availability: formData.availability,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'Umpires', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Umpires'), entryData);
      }

      setFormData({
        name: '',
        rating: '',
        matches: '',
        location: '',
        experience: '',
        image: '',
        bio: '',
        availability: 'Available',
        imageSource: 'url',
        imageFile: null,
      });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Failed to save data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting umpire data
  const handleDeleteData = async (id) => {
    if (!window.confirm("Are you sure you want to delete this umpire?")) return;

    try {
      await deleteDoc(doc(db, 'Umpires', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing umpire data
  const handleEditData = async (umpire) => {
    setFormData({
      name: umpire.name,
      rating: umpire.rating.toString(),
      matches: umpire.matches.toString(),
      location: umpire.location,
      experience: umpire.experience,
      image: umpire.image === cuslogo ? '' : umpire.image,
      bio: umpire.bio,
      availability: umpire.availability,
      imageSource: 'url',
      imageFile: null,
    });
    setEditingId(umpire.id);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white p-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div className="md:absolute flex items-center gap-4">
            <img
              src={backButton}
              alt="Back"
              className="h-8 w-8 cursor-pointer -scale-x-100"
              onClick={() => window.history.back()}
            />
          </div>
          <div className="text-center flex-grow">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Umpires</h1>
            <p className="text-blue-300">Find and connect with professional cricket umpires worldwide</p>
          </div>
          <div className="w-24 md:w-32">
            {/* Spacer to keep title centered */}
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search umpires by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 bg-[#0b1a3b] border border-blue-600/50 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === 'all' ? 'bg-blue-600' : 'bg-[#0b1a3b] border border-blue-600/50'} hover:bg-blue-700 transition-colors`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === 'available' ? 'bg-blue-600' : 'bg-[#0b1a3b] border border-blue-600/50'} hover:bg-blue-700 transition-colors`}
              onClick={() => setActiveTab('available')}
            >
              Available
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === 'elite' ? 'bg-blue-600' : 'bg-[#0b1a3b] border border-blue-600/50'} hover:bg-blue-700 transition-colors`}
              onClick={() => setActiveTab('elite')}
            >
              Elite
            </button>
          </div>
          <button
            onClick={() => {
              setFormData({
                name: '',
                rating: '',
                matches: '',
                location: '',
                experience: '',
                image: '',
                bio: '',
                availability: 'Available',
                imageSource: 'url',
                imageFile: null,
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Umpire
          </button>
        </div>

        {selectedUmpire ? (
          <div className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-6 shadow-lg">
            <button
              onClick={() => setSelectedUmpire(null)}
              className="mb-4 flex items-center text-blue-400 hover:text-blue-300"
            >
              <FiArrowLeft className="mr-2" /> Back to all umpires
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img
                  src={selectedUmpire.image}
                  alt={selectedUmpire.name}
                  className="w-full h-auto rounded-lg object-cover"
                  onError={(e) => { e.target.src = cuslogo; }}
                />
                <div className="mt-4 flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${selectedUmpire.availability === 'Available' || selectedUmpire.availability === 'Booked' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {selectedUmpire.availability}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <FiStar className="mr-1" />
                    <span>{selectedUmpire.rating}</span>
                  </div>
                </div>
              </div>

              <div className="md:w-2/3">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold">{selectedUmpire.name}</h2>
                  <div className="flex gap-2">
                    <FiEdit
                      className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                      onClick={() => handleEditData(selectedUmpire)}
                    />
                    <FiTrash2
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDeleteData(selectedUmpire.id)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center text-blue-300">
                    <FiMapPin className="mr-2" />
                    <span>{selectedUmpire.location}</span>
                  </div>
                  <div className="flex items-center text-blue-300">
                    <FiCalendar className="mr-2" />
                    <span>{selectedUmpire.experience} experience</span>
                  </div>
                  <div className="flex items-center text-blue-300">
                    <FiUser className="mr-2" />
                    <span>{selectedUmpire.matches} matches officiated</span>
                  </div>
                </div>

                <p className="text-gray-300 mb-6">{selectedUmpire.bio}</p>

                <div className="flex flex-wrap gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center transition-colors">
                    <FiMessageSquare className="mr-2" />
                    Send Message
                  </button>
                  <button className="border border-blue-500 text-blue-400 hover:bg-blue-900/50 px-6 py-2 eligible rounded-lg transition-colors">
                    View Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUmpires.length > 0 ? filteredUmpires.map(umpire => (
              <div
                key={umpire.id}
                className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg relative"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={umpire.image}
                    alt={umpire.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                    onError={(e) => { e.target.src = cuslogo; }}
                  />
                  <div>
                    <h3 className="font-bold">{umpire.name}</h3>
                    <div className="flex items-center text-yellow-400 text-sm">
                      <FiStar className="mr-1" />
                      <span>{umpire.rating}</span>
                    </div>
                    <div className="flex items-center text-blue-300 text-sm mt-1">
                      <FiMapPin className="mr-1" />
                      <span>{umpire.location}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{umpire.matches} matches</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${umpire.availability === 'Available' || umpire.availability === 'Booked' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {umpire.availability}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteData(umpire.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-600 transition"
                  aria-label="Delete Umpire"
                  title="Delete Umpire"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            )) : (
              <p className="text-center text-gray-400 col-span-3">No umpires found. Add an umpire to get started!</p>
            )}
          </div>
        )}

        {!selectedUmpire && (
          <div className="mt-12 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Umpiring Community Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalUmpires}+</p>
                <p className="text-gray-400">Registered Umpires</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{availableUmpires}</p>
                <p className="text-gray-400">Available Now</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalMatches}+</p>
                <p className="text-gray-400">Matches Officiated</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{countries}+</p>
                <p className="text-gray-400">Countries</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Adding/Editing Umpire */}
        {isModalOpen && (
          <div className="border-2 border-white fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
            <div
              className="w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.75)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center">
                {editingId ? 'Edit Umpire' : 'Add Umpire'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter umpire name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="rating">
                Rating (0-5)
              </label>
              <input
                id="rating"
                type="number"
                placeholder="Enter rating"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                max="5"
                step="0.1"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="matches">
                Matches Officiated
              </label>
              <input
                id="matches"
                type="number"
                placeholder="Enter matches officiated"
                value={formData.matches}
                onChange={(e) => setFormData({ ...formData, matches: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="Enter location (e.g., London, UK)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="experience">
                Experience
              </label>
              <input
                id="experience"
                type="text"
                placeholder="Enter experience (e.g., 15 years)"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <div className="mb-4">
                <label className="block mb-1 text-white font-semibold">Image Source</label>
                <div className="flex gap-4">
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="imageSource"
                      value="url"
                      checked={formData.imageSource === 'url'}
                      onChange={() => setFormData({ ...formData, imageSource: 'url', image: '', imageFile: null })}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    URL
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="imageSource"
                      value="local"
                      checked={formData.imageSource === 'local'}
                      onChange={() => setFormData({ ...formData, imageSource: 'local', image: '', imageFile: null })}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    Local File
                  </label>
                </div>
              </div>
              {formData.imageSource === 'url' ? (
                <>
                  <label className="block mb-1 text-white font-semibold" htmlFor="image">
                    Image URL (Optional)
                  </label>
                  <input
                    id="image"
                    type="text"
                    placeholder="Enter image URL"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              ) : (
                <>
                  <label className="block mb-1 text-white font-semibold" htmlFor="imageFile">
                    Upload Image (Optional)
                  </label>
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              )}
              <label className="block mb-1 text-white font-semibold" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Enter umpire bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={3}
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="availability">
                Availability
              </label>
              <select
                id="availability"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              >
                <option className='text-black' value="Available">Available</option>
                <option className='text-black' value="Not Available">Not Available</option>
                <option className='text-black' value="Booked">Booked</option>
              </select>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      rating: '',
                      matches: '',
                      location: '',
                      experience: '',
                      image: '',
                      bio: '',
                      availability: 'Available',
                      imageSource: 'url',
                      imageFile: null,
                    });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveData}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UmpiresPage;