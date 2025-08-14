import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiStar, FiMessageSquare, FiUser, FiCalendar, FiMapPin, FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';
import cuslogo from "../../assets/yogesh/communityimg/cuslogo.png";
import { useNavigate } from 'react-router-dom';
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth } from "../../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const CommentatorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCommentator, setSelectedCommentator] = useState(null);
  const navigate = useNavigate();
  const [commentatorsData, setCommentatorsData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    matches: '',
    rating: '',
    reviews: '',
    languages: [],
    image: '',
    featured: false,
    bio: '',
    available: true,
    experience: '',
    imageSource: 'url',
    imageFile: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const languageOptions = ['English', 'Hindi', 'Urdu', 'Kannada', 'Tamil', 'Telugu', 'Spanish', 'French'];

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'Commentators'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(entry => entry.userId === auth.currentUser.uid);
      setCommentatorsData(data);
    }, (error) => {
      console.error("Error fetching commentators:", error);
    });

    return () => unsubscribe();
  }, []);

  const filteredCommentators = commentatorsData.filter(commentator => {
    const matchesSearch = commentator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commentator.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'featured') return matchesSearch && commentator.featured;
    if (activeTab === 'available') return matchesSearch && commentator.available;
    return matchesSearch;
  });

  const calculateCommunityStats = () => {
    const totalCommentators = commentatorsData.length;
    const availableCommentators = commentatorsData.filter(c => c.available).length;
    const totalMatches = commentatorsData.reduce((acc, c) => acc + (c.matches || 0), 0);
    const languagesCovered = new Set(commentatorsData.flatMap(c => c.languages || [])).size;

    return { totalCommentators, availableCommentators, totalMatches, languagesCovered };
  };

  const { totalCommentators, availableCommentators, totalMatches, languagesCovered } = calculateCommunityStats();

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

  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.matches || !formData.rating || !formData.reviews || !formData.languages.length || !formData.bio.trim() || !formData.experience.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.matches) || formData.matches < 0) {
      alert("Matches must be a non-negative number!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (isNaN(formData.reviews) || formData.reviews < 0) {
      alert("Reviews must be a non-negative number!");
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
        location: formData.location,
        matches: parseInt(formData.matches),
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        languages: formData.languages,
        image: formData.image || cuslogo,
        featured: formData.featured,
        bio: formData.bio,
        available: formData.available,
        experience: formData.experience,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'Commentators', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Commentators'), entryData);
      }

      setFormData({
        name: '',
        location: '',
        matches: '',
        rating: '',
        reviews: '',
        languages: [],
        image: '',
        featured: false,
        bio: '',
        available: true,
        experience: '',
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

  const handleDeleteData = async (id) => {
    if (!window.confirm("Are you sure you want to delete this commentator?")) return;

    try {
      await deleteDoc(doc(db, 'Commentators', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  const handleEditData = (commentator) => {
    setFormData({
      name: commentator.name,
      location: commentator.location,
      matches: commentator.matches.toString(),
      rating: commentator.rating.toString(),
      reviews: commentator.reviews.toString(),
      languages: commentator.languages,
      image: commentator.image === cuslogo ? '' : commentator.image,
      featured: commentator.featured,
      bio: commentator.bio,
      available: commentator.available,
      experience: commentator.experience,
      imageSource: 'url',
      imageFile: null,
    });
    setEditingId(commentator.id);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 relative">
          <div className="md:absolute flex items-center gap-4">
            <img
              src={backButton}
              alt="Back"
              className="h-8 w-8 cursor-pointer -scale-x-100"
              onClick={() => window.history.back()}
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Cricket Commentators</h1>
            <p className="text-blue-300">Find and connect with professional cricket commentators worldwide</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search commentators by name or location..."
              className="w-full pl-10 pr-4 py-2 bg-[#0b1a3b] border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-blue-400" />
            <select
              className="bg-[#0b1a3b] border border-blue-600/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="all">All Commentators</option>
              <option value="featured">Featured</option>
              <option value="available">Available Now</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFormData({
                name: '',
                location: '',
                matches: '',
                rating: '',
                reviews: '',
                languages: [],
                image: '',
                featured: false,
                bio: '',
                available: true,
                experience: '',
                imageSource: 'url',
                imageFile: null,
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Commentator
          </button>
        </div>

        {selectedCommentator ? (
          <div className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-6 shadow-lg">
            <button
              onClick={() => setSelectedCommentator(null)}
              className="mb-4 flex items-center text-red-400 hover:text-red-300 transition-colors"
            >
              <FiArrowLeft className="mr-2" /> Back to all commentators
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img
                  src={selectedCommentator.image}
                  alt={selectedCommentator.name}
                  className="w-full h-auto rounded-lg object-cover"
                  onError={(e) => { e.target.src = cuslogo; }}
                />
                <div className="mt-4 flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${selectedCommentator.available ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {selectedCommentator.available ? 'Available' : 'Not Available'}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <FiStar className="mr-1" />
                    <span>{selectedCommentator.rating}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCommentator.languages.map(lang => (
                      <span key={lang} className="bg-[#0b1a3b] border border-blue-600/30 text-blue-300 px-2 py-1 rounded-full text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:w-2/3">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold">{selectedCommentator.name}</h2>
                  <div className="flex gap-2">
                    <FiEdit
                      className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                      onClick={() => handleEditData(selectedCommentator)}
                    />
                    <FiTrash2
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDeleteData(selectedCommentator.id)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center text-blue-300">
                    <FiMapPin className="mr-2" />
                    <span>{selectedCommentator.location}</span>
                  </div>
                  <div className="flex items-center text-blue-300">
                    <FiCalendar className="mr-2" />
                    <span>{selectedCommentator.experience} experience</span>
                  </div>
                  <div className="flex items-center text-blue-300">
                    <FiUser className="mr-2" />
                    <span>{selectedCommentator.matches} matches commented</span>
                  </div>
                </div>

                <p className="text-gray-300 mb-6">{selectedCommentator.bio}</p>

                <div className="flex flex-wrap gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center transition-colors">
                    <FiMessageSquare className="mr-2" />
                    Send Message
                  </button>
                  <button className="border border-blue-500 text-blue-400 hover:bg-blue-900/50 px-6 py-2 rounded-lg transition-colors">
                    View Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommentators.length > 0 ? filteredCommentators.map(commentator => (
              <div
                key={commentator.id}
                className="relative bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg"
                onClick={() => setSelectedCommentator(commentator)}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={commentator.image}
                    alt={commentator.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                    onError={(e) => { e.target.src = cuslogo; }}
                  />
                  <div>
                    <h3 className="font-bold">{commentator.name}</h3>
                    <div className="flex items-center text-yellow-400 text-sm">
                      <FiStar className="mr-1" />
                      <span>{commentator.rating}</span>
                    </div>
                    <div className="flex items-center text-blue-300 text-sm mt-1">
                      <FiMapPin className="mr-1" />
                      <span>{commentator.location}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{commentator.matches} matches</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${commentator.available ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {commentator.available ? 'Available' : 'Booked'}
                  </span>
                </div>
                {commentator.featured && (
                  <div className="mt-2 flex justify-end">
                    <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full flex items-center">
                      <FiStar className="mr-1" /> Featured
                    </span>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteData(commentator.id);
                  }}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-600 transition"
                  aria-label="Delete Commentator"
                  title="Delete Commentator"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            )) : (
              <p className="text-center text-gray-400 col-span-3">No commentators found. Add a commentator to get started!</p>
            )}
          </div>
        )}

        {!selectedCommentator && (
          <div className="mt-12 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Commentary Community Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalCommentators}+</p>
                <p className="text-gray-400">Professional Commentators</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{availableCommentators}</p>
                <p className="text-gray-400">Available Now</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalMatches}+</p>
                <p className="text-gray-400">Matches Commented</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{languagesCovered}</p>
                <p className="text-gray-400">Languages Covered</p>
              </div>
            </div>
          </div>
        )}

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
                {editingId ? 'Edit Commentator' : 'Add Commentator'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter commentator name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="Enter location (e.g., Mumbai, India)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="matches">
                Matches Commented
              </label>
              <input
                id="matches"
                type="number"
                placeholder="Enter matches commented"
                value={formData.matches}
                onChange={(e) => setFormData({ ...formData, matches: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
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
              <label className="block mb-1 text-white font-semibold" htmlFor="reviews">
                Reviews
              </label>
              <input
                id="reviews"
                type="number"
                placeholder="Enter number of reviews"
                value={formData.reviews}
                onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="languages">
                Languages
              </label>
              <select
                id="languages"
                multiple
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: Array.from(e.target.selectedOptions, option => option.value) })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              >
                {languageOptions.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
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
              <label className="block mb-1 text-white font-semibold" htmlFor="featured">
                Featured
              </label>
              <input
                id="featured"
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="mb-4"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Enter commentator bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={3}
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="available">
                Available
              </label>
              <input
                id="available"
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="mb-4"
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
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      location: '',
                      matches: '',
                      rating: '',
                      reviews: '',
                      languages: [],
                      image: '',
                      featured: false,
                      bio: '',
                      available: true,
                      experience: '',
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

export default CommentatorsPage;