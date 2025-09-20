import { useState, useEffect } from 'react';
import { FiSearch, FiStar, FiHeart, FiExternalLink, FiArrowLeft } from 'react-icons/fi';
import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase"; // Adjust path as needed
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const BatManufacturersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: '',
    rating: '',
    featured: false,
    bats: [],
    logoSource: 'url',
    logoFile: null,
    phoneNumber: '',
    email: '',
    website: ''
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch all manufacturer data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'BatManufacturers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManufacturers(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching manufacturers:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate stats for "Bat Manufacturing Community"
  const calculateStats = () => {
    const totalBrands = manufacturers.length;
    const averageRating = manufacturers.length > 0
      ? (manufacturers.reduce((acc, m) => acc + (parseFloat(m.rating) || 0), 0) / manufacturers.length).toFixed(1)
      : 0;
    const totalBatModels = manufacturers.reduce((acc, m) => acc + (m.bats ? m.bats.length : 0), 0);

    return {
      totalBrands,
      averageRating,
      totalBatModels
    };
  };

  const { totalBrands, averageRating, totalBatModels } = calculateStats();

  // Handle saving or updating manufacturer data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.rating || !formData.phoneNumber.trim() || !formData.email.trim() || !formData.website.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (formData.logoSource === 'url' && formData.logo && !formData.logo.match(/\.(jpg|jpeg|png|gif)$/i)) {
      alert("Please provide a valid logo URL (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.logoSource === 'file' && !formData.logoFile) {
      alert("Please select a logo file!");
      return;
    }
    if (formData.logoSource === 'file' && formData.logoFile && !formData.logoFile.type.match(/image\/(jpg|jpeg|png|gif)/i)) {
      alert("Please select a valid logo file (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.bats.length === 0) {
      alert("Please add at least one bat!");
      return;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Please provide a valid email address!");
      return;
    }
    if (!formData.website.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/)) {
      alert("Please provide a valid website URL!");
      return;
    }

    // Check add limit for current user
    const userManufacturersCount = manufacturers.filter(m => m.userId === auth.currentUser.uid).length;
    if (!editingId && userManufacturersCount >= 4) {
      alert("You have reached the maximum limit of 4 manufacturers.");
      return;
    }

    setIsLoading(true);
    try {
      let logoUrl = formData.logo;
      if (formData.logoSource === 'file' && formData.logoFile) {
        const storageRef = ref(storage, `bat-manufacturers/${auth.currentUser.uid}/${formData.logoFile.name}`);
        await uploadBytes(storageRef, formData.logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        name: formData.name,
        logo: logoUrl || '',
        description: formData.description,
        rating: parseFloat(formData.rating),
        featured: formData.featured,
        bats: formData.bats.map(bat => ({
          id: bat.id || Date.now() + Math.random().toString(36).substr(2, 9),
          name: bat.name,
          price: parseInt(bat.price),
          image: bat.image || 'https://via.placeholder.com/150'
        })),
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        website: formData.website
      };

      if (editingId) {
        await updateDoc(doc(db, 'BatManufacturers', editingId), entryData);
      } else {
        await addDoc(collection(db, 'BatManufacturers'), entryData);
      }

      setFormData({
        name: '',
        logo: '',
        description: '',
        rating: '',
        featured: false,
        bats: [],
        logoSource: 'url',
        logoFile: null,
        phoneNumber: '',
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

  // Handle deleting manufacturer data
  const handleDeleteData = async (id) => {
    const manufacturer = manufacturers.find(m => m.id === id);
    if (!manufacturer || manufacturer.userId !== auth.currentUser.uid) {
      alert("You can only delete your own manufacturers.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this manufacturer?")) return;

    try {
      await deleteDoc(doc(db, 'BatManufacturers', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing manufacturer data
  const handleEditData = (manufacturer) => {
    if (manufacturer.userId !== auth.currentUser.uid) {
      alert("You can only edit your own manufacturers.");
      return;
    }

    setFormData({
      name: manufacturer.name,
      logo: manufacturer.logo,
      description: manufacturer.description,
      rating: manufacturer.rating.toString(),
      featured: manufacturer.featured,
      bats: manufacturer.bats || [],
      logoSource: manufacturer.logo ? 'url' : 'none',
      logoFile: null,
      phoneNumber: manufacturer.phoneNumber || '',
      email: manufacturer.email || '',
      website: manufacturer.website || ''
    });
    setEditingId(manufacturer.id);
    setIsModalOpen(true);
  };

  // Add bat
  const addBat = () => {
    const name = prompt("Enter bat name:");
    const price = prompt("Enter bat price (e.g., 299):");
    const image = prompt("Enter bat image URL (optional):");
    if (name && price && !isNaN(price) && price > 0) {
      setFormData({
        ...formData,
        bats: [...formData.bats, { name, price: parseInt(price), image }]
      });
    } else {
      alert("Invalid bat details! Ensure name is provided and price is a positive number.");
    }
  };

  // Remove bat
  const removeBat = (index) => {
    setFormData({ ...formData, bats: formData.bats.filter((_, i) => i !== index) });
  };

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const filteredManufacturers = manufacturers.filter(manufacturer => {
    const matchesSearch = manufacturer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         manufacturer.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'featured' && manufacturer.featured) || 
                       (activeTab === 'top-rated' && manufacturer.rating >= 4.5);
    
    return matchesSearch && matchesTab;
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar 
        key={i} 
        className={`${i < Math.floor(rating) ? 'fill-current text-yellow-400' : 'text-yellow-400'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => window.history.back()}
          />
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Cricket Bat Manufacturers
            </h1>
            <p className="text-blue-300 max-w-2xl mx-auto">
              Explore top cricket bat brands and their premium products
            </p>
          </div>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="relative mb-6 max-w-md mx-auto">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              className="w-full pl-10 pr-4 py-2 bg-[#0b1a3b] border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-[#0b1a3b] text-gray-300 hover:bg-[#0b1a3b]/80'}`}
            >
              All Brands
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'featured' ? 'bg-blue-600 text-white' : 'bg-[#0b1a3b] text-gray-300 hover:bg-[#0b1a3b]/80'}`}
            >
              Featured
            </button>
            <button
              onClick={() => setActiveTab('top-rated')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'top-rated' ? 'bg-blue-600 text-white' : 'bg-[#0b1a3b] text-gray-300 hover:bg-[#0b1a3b]/80'}`}
            >
              Top Rated
            </button>
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  logo: '',
                  description: '',
                  rating: '',
                  featured: false,
                  bats: [],
                  logoSource: 'url',
                  logoFile: null,
                  phoneNumber: '',
                  email: '',
                  website: ''
                });
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-700 transition"
            >
              Add Manufacturer
            </button>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Manufacturers Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredManufacturers.map((manufacturer) => (
              <div 
                key={manufacturer.id} 
                className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl overflow-hidden hover:border-blue-400 transition-all duration-300 hover:shadow-lg relative"
              >
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                  {manufacturer.userId === auth.currentUser.uid && (
                    <>
                      <Edit
                        className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditData(manufacturer);
                        }}
                      />
                      <Trash2
                        className="text-red-500 cursor-pointer hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteData(manufacturer.id);
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <button 
                      onClick={() => toggleFavorite(manufacturer.id)}
                      className={`p-2 rounded-full ${favorites.includes(manufacturer.id) ? 'text-red-500 bg-[#0b1a3b]' : 'text-gray-400 bg-[#0b1a3b]'}`}
                    >
                      <FiHeart className={favorites.includes(manufacturer.id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                  
                  <div className="h-48 bg-[#0b1a3b]/70 flex items-center justify-center p-4">
                    <img 
                      src={manufacturer.logo || 'https://via.placeholder.com/150'} 
                      alt={`${manufacturer.name} logo`} 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                    />
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{manufacturer.name}</h2>
                    <div className="flex items-center">
                      {renderStars(manufacturer.rating)}
                      <span className="ml-1 text-sm text-blue-300">{manufacturer.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">{manufacturer.description}</p>

                  {/* Contact Information Section */}
                  <div className="mb-3 p-3 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-400 mb-2">Contact Information</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-300 mr-2">Phone:</span>
                        <span className="text-white">{manufacturer.phoneNumber}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-300 mr-2">Email:</span>
                        <span className="text-white">{manufacturer.email}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-300 mr-2">Website:</span>
                        <a
                          href={manufacturer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {manufacturer.website}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {manufacturer.featured && (
                    <span className="inline-block mb-3 px-2 py-1 text-xs font-semibold bg-blue-900/50 text-blue-400 rounded-full">
                      Featured
                    </span>
                  )}                  
                  
                  <div className="mt-4">
                    <button className="w-full py-2 px-4 border border-blue-500 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-900/30 hover:text-white transition-colors flex items-center justify-center">
                      View All Bats <FiExternalLink className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && filteredManufacturers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-bold text-blue-500 mb-2">No Manufacturers Found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or filter criteria...</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Manufacturer Input Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div
              className="w-full max-w-md sm:w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,1))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
                {editingId ? 'Edit Manufacturer' : 'Add Manufacturer'}
              </h2>
              <label className="block mb-1 text-white font-semibold">Name</label>
              <input
                type="text"
                placeholder="Enter manufacturer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Logo Source</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="logoSource"
                    value="url"
                    checked={formData.logoSource === 'url'}
                    onChange={(e) => setFormData({ ...formData, logoSource: 'url', logo: '', logoFile: null })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  URL
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="logoSource"
                    value="file"
                    checked={formData.logoSource === 'file'}
                    onChange={(e) => setFormData({ ...formData, logoSource: 'file', logo: '', logoFile: null })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Local File
                </label>
              </div>
              {formData.logoSource === 'url' ? (
                <>
                  <label className="block mb-1 text-white font-semibold">Logo URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter logo URL"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              ) : (
                <>
                  <label className="block mb-1 text-white font-semibold">Logo File (Optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => setFormData({ ...formData, logoFile: e.target.files[0] })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              )}
              <label className="block mb-1 text-white font-semibold">Description</label>
              <textarea
                placeholder="Enter manufacturer description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="4"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
              <label className="block mb-1 text-white font-semibold">Website</label>
              <input
                type="text"
                placeholder="Enter website URL"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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
              <label className="block mb-1 text-white font-semibold">Featured</label>
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="mb-3"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Bats</label>
              <div className="mb-3">
                {formData.bats.map((bat, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="text-gray-300">{bat.name} (${bat.price})</span>
                    <button
                      onClick={() => removeBat(index)}
                      className="text-red-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addBat}
                  className="text-blue-400 hover:text-blue-500 text-sm"
                  disabled={isLoading}
                >
                  + Add Bat
                </button>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      logo: '',
                      description: '',
                      rating: '',
                      featured: false,
                      bats: [],
                      logoSource: 'url',
                      logoFile: null,
                      phoneNumber: '',
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

        {/* Stats Section */}
        <div className="mt-12 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Bat Manufacturing Community</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{totalBrands}+</p>
              <p className="text-gray-400">Brands</p>
            </div>
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{averageRating}+</p>
              <p className="text-gray-400">Avg Rating</p>
            </div>
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">100%</p>
              <p className="text-gray-400">Premium Quality</p>
            </div>
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{totalBatModels}+</p>
              <p className="text-gray-400">Bat Models</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatManufacturersPage;