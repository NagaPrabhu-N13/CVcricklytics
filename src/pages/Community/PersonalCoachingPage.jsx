import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaRegStar, FaUserTie, FaVideo, FaChartLine, FaCalendarAlt, FaComments, FaPhoneAlt, FaArrowLeft, FaPhone, FaEnvelope } from 'react-icons/fa';
import { Edit, Trash2 } from 'lucide-react';
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase"; // Adjust path as needed
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PersonalCoachingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    experience: '',
    rating: '',
    sessions: '',
    image: '',
    bio: '',
    category: '',
    sessionTypes: [],
    phone: '',
    email: '',
    imageSource: 'url',
    imageFile: null
  });
  const [editingId, setEditingId] = useState(null);

  const categories = ['batting', 'bowling', 'fielding', 'fitness', 'Counsellor'];

  // Fetch all coach data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'PersonalCoaches'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoaches(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching coaches:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle saving or updating coach data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.specialty.trim() || !formData.experience.trim() || 
        !formData.rating || !formData.sessions || !formData.bio.trim() || !formData.category) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (isNaN(formData.sessions) || formData.sessions < 0) {
      alert("Number of sessions must be a non-negative number!");
      return;
    }
    if (!categories.includes(formData.category)) {
      alert("Please select a valid category!");
      return;
    }
    if (formData.imageSource === 'url' && formData.image && !formData.image.match(/\.(jpg|jpeg|png|gif)$/i)) {
      alert("Please provide a valid image URL (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.imageSource === 'file' && !formData.imageFile) {
      alert("Please select an image file!");
      return;
    }
    if (formData.imageSource === 'file' && formData.imageFile && !formData.imageFile.type.match(/image\/(jpg|jpeg|png|gif)/i)) {
      alert("Please select a valid image file (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.sessionTypes.length === 0) {
      alert("Please add at least one session type!");
      return;
    }

    // Check add limit for current user
    const userCoachesCount = coaches.filter(coach => coach.userId === auth.currentUser.uid).length;
    if (!editingId && userCoachesCount >= 4) {
      alert("You have reached the maximum limit of 4 coaches.");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = formData.image;
      if (formData.imageSource === 'file' && formData.imageFile) {
        const storageRef = ref(storage, `personal-coaches/${auth.currentUser.uid}/${formData.imageFile.name}`);
        await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        name: formData.name,
        specialty: formData.specialty,
        experience: formData.experience,
        rating: parseFloat(formData.rating),
        sessions: parseInt(formData.sessions),
        image: imageUrl || '',
        bio: formData.bio,
        category: formData.category,
        sessionTypes: formData.sessionTypes.map(session => ({
          id: session.id || Date.now() + Math.random().toString(36).substr(2, 9),
          name: session.name,
          description: session.description,
          price: parseInt(session.price)
        })),
        phone: formData.phone,
        email: formData.email,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'PersonalCoaches', editingId), entryData);
      } else {
        await addDoc(collection(db, 'PersonalCoaches'), entryData);
      }

      setFormData({
        name: '',
        specialty: '',
        experience: '',
        rating: '',
        sessions: '',
        image: '',
        bio: '',
        category: '',
        sessionTypes: [],
        phone: '',
        email: '',
        imageSource: 'url',
        imageFile: null
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

  // Handle deleting coach data
  const handleDeleteData = async (id) => {
    const coach = coaches.find(c => c.id === id);
    if (coach.userId !== auth.currentUser.uid) {
      alert("You can only delete your own coaches.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this coach?")) return;

    try {
      await deleteDoc(doc(db, 'PersonalCoaches', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing coach data
  const handleEditData = (coach) => {
    if (coach.userId !== auth.currentUser.uid) {
      alert("You can only edit your own coaches.");
      return;
    }

    setFormData({
      name: coach.name,
      specialty: coach.specialty,
      experience: coach.experience,
      rating: coach.rating.toString(),
      sessions: coach.sessions.toString(),
      image: coach.image,
      bio: coach.bio,
      category: coach.category,
      sessionTypes: coach.sessionTypes || [],
      phone: coach.phone || '',
      email: coach.email || '',
      imageSource: coach.image ? 'url' : 'none',
      imageFile: null
    });
    setEditingId(coach.id);
    setIsModalOpen(true);
  };

  // Add session type
  const addSessionType = () => {
    const name = prompt("Enter session type name (e.g., 1-Hour Technical Session):");
    const description = prompt("Enter session description (e.g., In-person or virtual):");
    const price = prompt("Enter session price (e.g., 1500):");
    if (name && description && price && !isNaN(price) && price > 0) {
      setFormData({
        ...formData,
        sessionTypes: [...formData.sessionTypes, { name, description, price: parseInt(price) }]
      });
    } else {
      alert("Invalid session details! Ensure name and description are provided, and price is a positive number.");
    }
  };

  // Remove session type
  const removeSessionType = (index) => {
    setFormData({ ...formData, sessionTypes: formData.sessionTypes.filter((_, i) => i !== index) });
  };

  const renderStars = (rating) => (
    Array(5)
      .fill(0)
      .map((_, i) => (
        i < Math.floor(rating) ? (
          <FaStar key={i} className="text-yellow-500" />
        ) : (
          <FaRegStar key={i} className="text-gray-300" />
        )
      ))
  );

  const filteredCoaches = activeTab === 'all' 
    ? coaches 
    : coaches.filter(coach => coach.category === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e]">
      {/* Coaching Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {/* Centered Title */}
          <div className="flex justify-between items-center mb-8">
            <img
              src={backButton}
              alt="Back"
              className="h-8 w-8 cursor-pointer -scale-x-100"
              onClick={() => window.history.back()}
            />
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold text-white">Specialized Coaching Areas</h2>
              <p className="text-blue-300 mt-2">Find expert coaches for every aspect of your game</p>
            </div>
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  specialty: '',
                  experience: '',
                  rating: '',
                  sessions: '',
                  image: '',
                  bio: '',
                  category: '',
                  sessionTypes: [],
                  phone: '',
                  email: '',
                  imageSource: 'url',
                  imageFile: null
                });
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Coach
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center mb-8 border-b border-gray-700">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium ${activeTab === 'all' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-300'}`}
            >
              All Coaches
            </button>
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-6 py-3 font-medium ${activeTab === category ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-300'}`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Coaches Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCoaches.map(coach => (
                <div 
                  key={coach.id} 
                  className="bg-[#0b1a3b] border border-blue-600/30 rounded-xl shadow-md overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    {coach.userId === auth.currentUser.uid && (
                      <>
                        <Edit
                          className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditData(coach);
                          }}
                        />
                        <Trash2
                          className="text-red-500 cursor-pointer hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteData(coach.id);
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div className="relative">
                    <img 
                      src={coach.image || 'https://via.placeholder.com/150'} 
                      alt={coach.name} 
                      className="w-full h-48 object-contain"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h3 className="text-white text-xl font-bold">{coach.name}</h3>
                      <p className="text-blue-300">{coach.specialty}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        {renderStars(coach.rating)}
                        <span className="ml-2 text-gray-300">{coach.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-400">{coach.sessions}+ sessions</span>
                    </div>
                    <p className="text-gray-400 mb-4">{coach.experience} experience</p>
                    <button 
                      onClick={() => setSelectedCoach(coach)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredCoaches.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-400 mb-2">No coaches found</h3>
              <p className="text-sm text-gray-500">Try selecting a different category</p>
            </div>
          )}
        </div>
      </section>

      {/* Coach Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
          <div
            className="w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
              {editingId ? 'Edit Coach' : 'Add Coach'}
            </h2>
            <label className="block mb-1 text-white font-semibold">Name</label>
            <input
              type="text"
              placeholder="Enter coach name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isLoading}
            />
            <label className="block mb-1 text-white font-semibold">Specialty</label>
            <input
              type="text"
              placeholder="Enter specialty (e.g., Batting Technique)"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isLoading}
            />
            <label className="block mb-1 text-white font-semibold">Experience</label>
            <input
              type="text"
              placeholder="Enter experience (e.g., 10+ years)"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isLoading}
            />
            <label className="block mb-1 text-white font-semibold">Rating (0-5)</label>
            <input
              type="number"
              placeholder="Enter rating"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              min="0"
              max="5"
              step="0.1"
              disabled={isLoading}
            />
            <label className="block mb-1 text-white font-semibold">Sessions</label>
            <input
              type="number"
              placeholder="Enter number of sessions"
              value={formData.sessions}
              onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              min="0"
              disabled={isLoading}
            />
            <label className="block mb-1 text-white font-semibold">Image Source</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="imageSource"
                  value="url"
                  checked={formData.imageSource === 'url'}
                  onChange={(e) => setFormData({ ...formData, imageSource: e.target.value, image: '', imageFile: null })}
                  className="mr-2"
                  disabled={isLoading}
                />
                URL
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="imageSource"
                  value="file"
                  checked={formData.imageSource === 'file'}
                  onChange={(e) => setFormData({ ...formData, imageSource: e.target.value, image: '', imageFile: null })}
                  className="mr-2"
                  disabled={isLoading}
                />
                Local File
              </label>
            </div>
            {formData.imageSource === 'url' ? (
              <>
                <label className="block mb-1 text-white font-semibold">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter image URL"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={isLoading}
                />
              </>
            ) : (
              <>
                <label className="block mb-1 text-white font-semibold">Image File (Optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
                  className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={isLoading}
                />
              </>
            )}
            <label className="block mb-1 text-white font-semibold">Bio</label>
            <textarea
              placeholder="Enter coach bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows="4"
              disabled={isLoading}
            />
            <label className="block mb-1 text-white font-semibold">Category</label>
           <select
  id="categories"
  value={formData.category}
  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
  className="w-full mb-3 p-2 rounded border border-white-600 bg-transparent text-white focus:outline-none focus:ring-white"
  disabled={isLoading}
>
  {categories.map((category) => (
    <option
      key={category}
      value={category}
      className="bg-white text-gray-700"
    >
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </option>
  ))}
</select>
           <label className="block mb-1 text-white font-semibold">Session Types</label>
<div className="mb-3">
  {formData.sessionTypes.map((session, index) => (
    <div key={index} className="flex items-center gap-2 mb-1">
      <span className="text-gray-300">
        {session.name} ({session.description}) - ₹{session.price}
      </span>
                  <button
                    onClick={() => removeSessionType(index)}
                    className="text-red-500 hover:text-red-600"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addSessionType}
                className="text-blue-400 hover:text-blue-500 text-sm"
                disabled={isLoading}
              >
                + Add Session Type
              </button>
            </div>
            <label className="block mb-1 text-white font-semibold">Phone</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isLoading}
            />
            <label className="block mb-1 text-white font-semibold">Email</label>
            <input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isLoading}
            />
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    specialty: '',
                    experience: '',
                    rating: '',
                    sessions: '',
                    image: '',
                    bio: '',
                    category: '',
                    sessionTypes: [],
                    phone: '',
                    email: '',
                    imageSource: 'url',
                    imageFile: null
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

      {/* Coach Profile Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img 
                src={selectedCoach.image || 'https://via.placeholder.com/150'} 
                alt={selectedCoach.name} 
                className="w-full h-64 object-contain"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
              />
              <button 
                onClick={() => {
                  setSelectedCoach(null);
                  setShowContact(false);
                }}
                className="absolute top-4 right-4 bg-[#0b1a3b] rounded-full p-2 shadow-md hover:bg-[#0b1a3b]/80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCoach.name}</h2>
                  <p className="text-blue-400 font-medium">{selectedCoach.specialty}</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center">
                  {renderStars(selectedCoach.rating)}
                  <span className="ml-2 text-gray-300">{selectedCoach.rating.toFixed(1)} ({selectedCoach.sessions}+ sessions)</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-white">About Coach</h3>
                <p className="text-gray-300">{selectedCoach.bio}</p>
                <p className="text-gray-400 mt-2">{selectedCoach.experience} experience</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0b1a3b]/50 border border-blue-600/30 p-4 rounded-lg">
                  <FaChartLine className="text-blue-400 text-2xl mb-2" />
                  <h4 className="font-semibold text-white">Performance Analysis</h4>
                  <p className="text-sm text-gray-400">Detailed technical assessment</p>
                </div>
                <div className="bg-[#0b1a3b]/50 border border-blue-600/30 p-4 rounded-lg">
                  <FaVideo className="text-blue-400 text-2xl mb-2" />
                  <h4 className="font-semibold text-white">Video Sessions</h4>
                  <p className="text-sm text-gray-400">Frame-by-frame breakdown</p>
                </div>
                <div className="bg-[#0b1a3b]/50 border border-blue-600/30 p-4 rounded-lg">
                  <FaCalendarAlt className="text-blue-400 text-2xl mb-2" />
                  <h4 className="font-semibold text-white">Custom Plans</h4>
                  <p className="text-sm text-gray-400">Tailored to your needs</p>
                </div>
                <div className="bg-[#0b1a3b]/50 border border-blue-600/30 p-4 rounded-lg">
                  <FaComments className="text-blue-400 text-2xl mb-2" />
                  <h4 className="font-semibold text-white">Ongoing Support</h4>
                  <p className="text-sm text-gray-400">Between sessions</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Session Types</h3>
                <div className="space-y-3">
                  {selectedCoach.sessionTypes.map((session, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border border-blue-600/30 rounded-lg bg-[#0b1a3b]/50">
                      <div>
                        <h4 className="font-medium text-white">{session.name}</h4>
                        <p className="text-sm text-gray-400">{session.description}</p>
                      </div>
                      <span className="font-bold text-white">₹{session.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center">
                  <FaCalendarAlt className="mr-2" /> Book Session
                </button>
                <button 
                  onClick={() => setShowContact(!showContact)}
                  className="flex-1 bg-[#0b1a3b] hover:bg-[#0b1a3b]/80 text-white border border-blue-600/30 py-3 rounded-lg font-bold flex items-center justify-center"
                >
                  <FaPhoneAlt className="mr-2" /> Contact Coach
                </button>
              </div>
              {showContact && (
                <div className="mt-4 p-4 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-lg">
                  <p className="flex items-center mb-2 text-white"><FaPhone className="mr-2 text-blue-400" /> {selectedCoach.phone}</p>
                  <p className="flex items-center text-white"><FaEnvelope className="mr-2 text-blue-400" /> {selectedCoach.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalCoachingPage;
