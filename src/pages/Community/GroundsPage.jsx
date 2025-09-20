import React, { useState, useEffect } from 'react';
import { MapPin, Users, CalendarCheck, Info, ArrowLeft, Edit, Trash2, Phone, Mail, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const GroundsPage = () => {
  const [joined, setJoined] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedGround, setSelectedGround] = useState(null);
  const [groundsData, setGroundsData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    players: '',
    matches: '',
    image: '',
    bio: '',
    facilities: [],
    featured: false,
    imageSource: 'url',
    imageFile: null,
    phone: '',
    email: '',
    website: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'Grounds'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroundsData(data);
    }, (error) => {
      console.error("Error fetching grounds:", error);
    });

    return () => unsubscribe();
  }, []);

  const calculateStats = () => {
    const totalGrounds = groundsData.length;
    const featuredVenues = groundsData.filter(g => g.featured).length;
    const totalMatches = groundsData.reduce((acc, g) => acc + (parseInt(g.matches) || 0), 0);
    const totalPlayerCapacity = groundsData.reduce((acc, g) => acc + (parseInt(g.players) || 0), 0);

    return {
      totalGrounds,
      featuredVenues,
      totalMatches,
      totalPlayerCapacity
    };
  };

  const { totalGrounds, featuredVenues, totalMatches, totalPlayerCapacity } = calculateStats();

  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.players || !formData.matches || !formData.bio.trim() ||
        !formData.phone.trim() || !formData.email.trim() || !formData.website.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.players) || formData.players < 0) {
      alert("Players must be a non-negative number!");
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
    if (formData.imageSource === 'file' && !formData.imageFile) {
      alert("Please select an image file!");
      return;
    }
    if (formData.imageSource === 'file' && formData.imageFile && !formData.imageFile.type.match(/image\/(jpg|jpeg|png|gif)/i)) {
      alert("Please select a valid image file (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.facilities.length === 0) {
      alert("Please add at least one facility!");
      return;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Please provide a valid email address!");
      return;
    }
    if (!formData.website.match(/^https?:\/\/[^\s$.?#].[^\s]*$/)) {
      alert("Please provide a valid website URL!");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = formData.image;
      if (formData.imageSource === 'file' && formData.imageFile) {
        const storageRef = ref(storage, `grounds/${auth.currentUser.uid}/${formData.imageFile.name}`);
        await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        name: formData.name,
        location: formData.location,
        players: parseInt(formData.players),
        matches: parseInt(formData.matches),
        image: imageUrl || '',
        bio: formData.bio,
        facilities: formData.facilities,
        featured: formData.featured,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
        phone: formData.phone,
        email: formData.email,
        website: formData.website
      };

      if (editingId) {
        await updateDoc(doc(db, 'Grounds', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Grounds'), entryData);
      }

      setFormData({
        name: '',
        location: '',
        players: '',
        matches: '',
        image: '',
        bio: '',
        facilities: [],
        featured: false,
        imageSource: 'url',
        imageFile: null,
        phone: '',
        email: '',
        website: ''
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
    const ground = groundsData.find(g => g.id === id);
    if (!ground || ground.userId !== auth.currentUser.uid) {
      alert("You can only delete your own grounds.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this ground?")) return;

    try {
      await deleteDoc(doc(db, 'Grounds', id));
      if (selectedGround && selectedGround.id === id) {
        setSelectedGround(null);
      }
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  const handleEditData = (ground) => {
    if (ground.userId !== auth.currentUser.uid) {
      alert("You can only edit your own grounds.");
      return;
    }

    setFormData({
      name: ground.name,
      location: ground.location,
      players: ground.players.toString(),
      matches: ground.matches.toString(),
      image: ground.image,
      bio: ground.bio,
      facilities: ground.facilities,
      featured: ground.featured,
      imageSource: ground.image ? 'url' : 'none',
      imageFile: null,
      phone: ground.phone || '',
      email: ground.email || '',
      website: ground.website || ''
    });
    setEditingId(ground.id);
    setIsModalOpen(true);
  };

  const addFacility = () => {
    const newFacility = prompt("Enter facility (e.g., floodlights, pavilion):");
    if (newFacility && newFacility.trim()) {
      setFormData({ ...formData, facilities: [...formData.facilities, newFacility.trim()] });
    }
  };

  const removeFacility = (index) => {
    setFormData({ ...formData, facilities: formData.facilities.filter((_, i) => i !== index) });
  };

  const toggleJoin = (id) => {
    setJoined((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGrounds = groundsData.filter(ground => {
    const matchesSearch = ground.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ground.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'featured') return matchesSearch && ground.featured;
    return matchesSearch;
  });

  const getFacilityIcon = (facility) => {
    switch (facility) {
      case 'floodlights': return '💡';
      case 'pavilion': return '🏛️';
      case 'media-box': return '🎥';
      case 'dressing-rooms': return '👕';
      case 'practice-nets': return '🏏';
      case 'food-court': return '🍔';
      default: return '✅';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => window.history.back()}
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Cricket Grounds</h1>
            <p className="text-blue-300">Find and book premium cricket grounds for your matches</p>
          </div>
          <div className="w-24"></div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <MapPin className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search grounds by name or location..."
              className="w-full pl-10 pr-4 py-2 bg-[#0b1a3b] border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="text-blue-400" />
            <select 
              className="bg-[#0b1a3b] border border-blue-600/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="all">All Grounds</option>
              <option value="featured">Featured</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFormData({
                name: '',
                location: '',
                players: '',
                matches: '',
                image: '',
                bio: '',
                facilities: [],
                featured: false,
                imageSource: 'url',
                imageFile: null,
                phone: '',
                email: '',
                website: ''
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Ground
          </button>
        </div>

        {selectedGround ? (
          <div className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setSelectedGround(null)}
                className="flex items-center text-blue-400 hover:text-blue-300"
              >
                <ArrowLeft className="mr-2" /> Back to all grounds
              </button>
              {selectedGround.userId === auth.currentUser.uid && (
                <div className="flex gap-2">
                  <Edit
                    className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                    onClick={() => handleEditData(selectedGround)}
                  />
                  <Trash2
                    className="text-red-500 cursor-pointer hover:text-red-600"
                    onClick={() => handleDeleteData(selectedGround.id)}
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img 
                  src={selectedGround.image || 'https://via.placeholder.com/150'} 
                  alt={selectedGround.name} 
                  className="w-full h-auto rounded-lg object-cover border-2 border-blue-500"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                />
                <div className="mt-4 flex justify-between items-center">
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-300">
                    {selectedGround.players} players capacity
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <Info className="mr-1" />
                    <span>{selectedGround.matches} matches</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-bold text-blue-400 mb-2">Facilities:</h3>
                  <div className="space-y-2">
                    {selectedGround.facilities.map((facility, index) => (
                      <div key={index} className="flex items-center">
                        <span className="mr-2">{getFacilityIcon(facility)}</span>
                        <span className="capitalize">
                          {facility.split('-').join(' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedGround.phone || selectedGround.email || selectedGround.website) && (
                  <div className="mt-4 bg-[#1a2342] p-4 rounded-lg border border-blue-600/30">
                    <h3 className="font-bold text-blue-400 mb-2">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedGround.phone && (
                        <div className="flex items-center">
                          <Phone className="text-blue-400 mr-2" size={20} />
                          <div>
                            <p className="text-sm text-gray-400">Phone</p>
                            <p className="text-white font-medium">{selectedGround.phone}</p>
                          </div>
                        </div>
                      )}
                      {selectedGround.email && (
                        <div className="flex items-center">
                          <Mail className="text-blue-400 mr-2" size={20} />
                          <div>
                            <p className="text-sm text-gray-400">Email</p>
                            <p className="text-white font-medium">{selectedGround.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedGround.website && (
                        <div className="flex items-center">
                          <Globe className="text-blue-400 mr-2" size={20} />
                          <div>
                            <p className="text-sm text-gray-400">Website</p>
                            <a href={selectedGround.website} target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:underline">
                              {selectedGround.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-2">{selectedGround.name}</h2>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center text-blue-300">
                    <MapPin className="mr-2" />
                    <span>{selectedGround.location}</span>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">{selectedGround.bio}</p>
                
                <div className="flex flex-wrap gap-4">
                  <button className="border border-blue-500 text-blue-400 hover:bg-blue-900/50 px-6 py-2 rounded-lg transition-colors">
                    View Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGrounds.map(ground => (
              <div 
                key={ground.id} 
                className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg group relative"
                onClick={() => setSelectedGround(ground)}
              >
                {ground.userId === auth.currentUser.uid && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    <Edit
                      className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditData(ground);
                      }}
                    />
                    <Trash2
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteData(ground.id);
                      }}
                    />
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <img 
                    src={ground.image || 'https://via.placeholder.com/150'} 
                    alt={ground.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 group-hover:border-blue-300 transition-colors"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                  />
                  <div>
                    <h3 className="font-bold">{ground.name}</h3>
                    <div className="flex items-center text-blue-300 text-sm">
                      <MapPin className="mr-1" />
                      <span>{ground.location}</span>
                    </div>
                    <div className="flex items-center text-yellow-400 text-sm mt-1">
                      <Users className="mr-1" />
                      <span>{ground.players} players capacity</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ground.facilities.slice(0, 2).map((facility, index) => (
                        <span key={index} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded capitalize">
                          {facility.split('-').join(' ')}
                        </span>
                      ))}
                      {ground.facilities.length > 2 && (
                        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">
                          +{ground.facilities.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{ground.matches} matches</span>
                  {ground.featured && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-900 text-yellow-300">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div
              className="w-full max-w-md sm:w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
                {editingId ? 'Edit Ground' : 'Add Ground'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter ground name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="players">
                Players Capacity
              </label>
              <input
                id="players"
                type="number"
                placeholder="Enter players capacity"
                value={formData.players}
                onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="matches">
                Matches
              </label>
              <input
                id="matches"
                type="number"
                placeholder="Enter number of matches"
                value={formData.matches}
                onChange={(e) => setFormData({ ...formData, matches: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                type="url"
                placeholder="Enter website URL"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  <label className="block mb-1 text-white font-semibold" htmlFor="image">
                    Image URL (Optional)
                  </label>
                  <input
                    id="image"
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
                  <label className="block mb-1 text-white font-semibold" htmlFor="imageFile">
                    Image File (Optional)
                  </label>
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              )}
              <label className="block mb-1 text-white font-semibold" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Enter ground bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="4"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Facilities</label>
              <div className="mb-3">
                {formData.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="text-gray-300">{facility}</span>
                    <button
                      onClick={() => removeFacility(index)}
                      className="text-red-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFacility}
                  className="text-blue-400 hover:text-blue-500 text-sm"
                  disabled={isLoading}
                >
                  + Add Facility
                </button>
              </div>
              <label className="block mb-1 text-white font-semibold" htmlFor="featured">
                Featured
              </label>
              <input
                id="featured"
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="mb-3"
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
                      players: '',
                      matches: '',
                      image: '',
                      bio: '',
                      facilities: [],
                      featured: false,
                      imageSource: 'url',
                      imageFile: null,
                      phone: '',
                      email: '',
                      website: ''
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

        {!selectedGround && (
          <div className="mt-12 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Grounds Network</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalGrounds}+</p>
                <p className="text-gray-400">Premium Grounds</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{featuredVenues}</p>
                <p className="text-gray-400">Featured Venues</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalMatches}+</p>
                <p className="text-gray-400">Matches Hosted</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalPlayerCapacity}+</p>
                <p className="text-gray-400">Player Capacity</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroundsPage;