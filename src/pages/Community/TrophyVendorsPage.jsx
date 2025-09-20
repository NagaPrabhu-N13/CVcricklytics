import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiHeart, FiStar, FiExternalLink, FiArrowLeft } from 'react-icons/fi';
import { Edit, Trash2 } from 'lucide-react';
import IND from "../../assets/yogesh/communityimg/INDflag.png";
import AUS from "../../assets/yogesh/communityimg/AUSflag.png";
import ENG from "../../assets/yogesh/communityimg/ENGflag.png";
import PAK from "../../assets/yogesh/communityimg/PAKflag.png";
import NZ from "../../assets/yogesh/communityimg/NZflag.png";
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase"; // Adjust path as needed
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const TShirtVendorsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    products: '',
    logo: '',
    featured: false,
    team: '',
    description: '',
    logoSource: 'url',
    logoFile: null,
    phoneNumber: '',
    email: '',
    website: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const teams = [
    { id: 1, name: 'India', logo: IND },
    { id: 2, name: 'Australia', logo: AUS },
    { id: 3, name: 'England', logo: ENG },
    { id: 4, name: 'Pakistan', logo: PAK },
    { id: 5, name: 'New Zealand', logo: NZ },
  ];

  // Fetch all vendor data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'TShirtVendors'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(data);
    }, (error) => {
      console.error("Error fetching vendors:", error);
    });

    return () => unsubscribe();
  }, []);

  // Calculate stats for "Merchandise Community Stats"
  const calculateStats = () => {
    const totalVendors = vendors.length;
    const totalTeams = new Set(vendors.map(v => v.team)).size;
    const averageRating = vendors.length > 0
      ? (vendors.reduce((acc, v) => acc + (parseFloat(v.rating) || 0), 0) / vendors.length).toFixed(1)
      : 0;

    return {
      totalVendors,
      totalTeams,
      averageRating
    };
  };

  const { totalVendors, totalTeams, averageRating } = calculateStats();

  // Handle saving or updating vendor data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.rating || !formData.products || !formData.team.trim() || !formData.description.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (!formData.phoneNumber.trim() || !formData.email.trim() || !formData.website.trim()) {
      alert("Phone Number, Email, and Website are required!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (isNaN(formData.products) || formData.products < 0) {
      alert("Number of products must be a non-negative number!");
      return;
    }
    if (!teams.some(team => team.name === formData.team)) {
      alert("Please select a valid team from the available options!");
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
      let logoUrl = formData.logo;
      if (formData.logoSource === 'file' && formData.logoFile) {
        const storageRef = ref(storage, `tshirt-vendors/${auth.currentUser.uid}/${formData.logoFile.name}`);
        await uploadBytes(storageRef, formData.logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        name: formData.name,
        rating: parseFloat(formData.rating),
        products: parseInt(formData.products),
        logo: logoUrl || '',
        featured: formData.featured,
        team: formData.team,
        description: formData.description,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        website: formData.website
      };

      if (editingId) {
        await updateDoc(doc(db, 'TShirtVendors', editingId), entryData);
      } else {
        await addDoc(collection(db, 'TShirtVendors'), entryData);
      }

      setFormData({
        name: '',
        rating: '',
        products: '',
        logo: '',
        featured: false,
        team: '',
        description: '',
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

  // Handle deleting vendor data
  const handleDeleteData = async (id) => {
    const vendor = vendors.find(v => v.id === id);
    if (!vendor || vendor.userId !== auth.currentUser.uid) {
      alert("You can only delete your own vendors.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this vendor?")) return;

    try {
      await deleteDoc(doc(db, 'TShirtVendors', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing vendor data
  const handleEditData = (vendor) => {
    if (vendor.userId !== auth.currentUser.uid) {
      alert("You can only edit your own vendors.");
      return;
    }

    setFormData({
      name: vendor.name,
      rating: vendor.rating.toString(),
      products: vendor.products.toString(),
      logo: vendor.logo,
      featured: vendor.featured,
      team: vendor.team,
      description: vendor.description,
      logoSource: vendor.logo ? 'url' : 'none',
      logoFile: null,
      phoneNumber: vendor.phoneNumber || '',
      email: vendor.email || '',
      website: vendor.website || ''
    });
    setEditingId(vendor.id);
    setIsModalOpen(true);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = !selectedTeam || vendor.team === selectedTeam;
    const matchesTab = activeTab === 'all' || (activeTab === 'featured' && vendor.featured) || (activeTab === 'top-rated' && vendor.rating >= 4.5);
    
    return matchesSearch && matchesTeam && matchesTab;
  });

  const addToWishlist = (vendorId) => {
    if (wishlist.includes(vendorId)) {
      setWishlist(wishlist.filter(id => id !== vendorId));
    } else {
      setWishlist([...wishlist, vendorId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-start mb-8">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => window.history.back()}
          />
          <div className="flex-1 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Cricket Merchandise Vendors
            </h1>
            <p className="text-blue-300 max-w-2xl mx-auto">
              Shop authentic jerseys, t-shirts and accessories from official vendors
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md mx-auto">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2 bg-[#0b1a3b] border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Team Filter */}
        <div className="mb-8 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">Shop by Team</h3>
          <div className="flex space-x-2 pb-2">
            <button
              onClick={() => setSelectedTeam(null)}
              className={`px-4 py-2 rounded-full ${!selectedTeam ? 'bg-blue-600 text-white' : 'bg-[#0b1a3b] hover:bg-[#0b1a3b]/80'}`}
            >
              All Teams
            </button>
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.name)}
                className={`px-4 py-2 rounded-full flex items-center ${selectedTeam === team.name ? 'bg-blue-600 text-white' : 'bg-[#0b1a3b] hover:bg-[#0b1a3b]/20'}`}
              >
                <img src={team.logo} alt={team.name} className="w-6 h-6 mr-2" />
                {team.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-600/50 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
          >
            All Vendors
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-4 py-2 font-medium ${activeTab === 'featured' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
          >
            Featured
          </button>
          <button
            onClick={() => setActiveTab('top-rated')}
            className={`px-4 py-2 font-medium ${activeTab === 'top-rated' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
          >
            Top Rated
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '',
                rating: '',
                products: '',
                logo: '',
                featured: false,
                team: '',
                description: '',
                logoSource: 'url',
                logoFile: null,
                phoneNumber: '',
                email: '',
                website: ''
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Vendor
          </button>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <div 
              key={vendor.id} 
              className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl overflow-hidden hover:border-blue-400 transition-all duration-300 hover:shadow-lg relative"
            >
              {vendor.userId === auth.currentUser.uid && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                  <Edit
                    className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditData(vendor);
                    }}
                  />
                  <Trash2
                    className="text-red-500 cursor-pointer hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteData(vendor.id);
                    }}
                  />
                </div>
              )}
              <div className="relative h-48 bg-[#0b1a3b]/70 flex items-center justify-center p-4">
                <img 
                  src={vendor.logo || 'https://via.placeholder.com/150'} 
                  alt={vendor.name} 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                />
                {vendor.featured && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-xs font-bold px-2 py-1 rounded">
                    Featured
                  </div>
                )}
                <button
                  onClick={() => addToWishlist(vendor.id)}
                  className={`absolute top-2 right-2 p-2 rounded-full ${wishlist.includes(vendor.id) ? 'text-red-500 bg-[#0b1a3b]' : 'text-gray-400 bg-[#0b1a3b]'}`}
                >
                  <FiHeart className={wishlist.includes(vendor.id) ? 'fill-current' : ''} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{vendor.name}</h3>
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar 
                        key={i} 
                        className={`${i < Math.floor(vendor.rating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-blue-300">{vendor.rating}</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{vendor.description}</p>
                <div className="mb-3 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-400 sm:w-28">Phone:</span>
                      <span className="text-white">{vendor.phoneNumber}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-400 sm:w-28">Email:</span>
                      <span className="text-white">{vendor.email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-400 sm:w-28">Website:</span>
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full">
                    {vendor.team}
                  </span>
                  <div className="flex items-center text-blue-400 hover:text-blue-300 text-sm">
                    Visit Store <FiExternalLink className="ml-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <h4 className="text-xl font-medium text-gray-400 mb-4">No vendors found matching your criteria</h4>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedTeam(null);
                setActiveTab('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Vendor Input Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div
              className="w-full max-w-md rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
                {editingId ? 'Edit Vendor' : 'Add Vendor'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter vendor name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                max="5"
                step="0.1"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="products">
                Number of Products
              </label>
              <input
                id="products"
                type="number"
                placeholder="Enter number of products"
                value={formData.products}
                onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
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
                    onChange={(e) => setFormData({ ...formData, logoSource: e.target.value, logo: '', logoFile: null })}
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
                    onChange={(e) => setFormData({ ...formData, logoSource: e.target.value, logo: '', logoFile: null })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Local File
                </label>
              </div>
              {formData.logoSource === 'url' ? (
                <>
                  <label className="block mb-1 text-white font-semibold" htmlFor="logo">
                    Logo URL (Optional)
                  </label>
                  <input
                    id="logo"
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
                  <label className="block mb-1 text-white font-semibold" htmlFor="logoFile">
                    Logo File (Optional)
                  </label>
                  <input
                    id="logoFile"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => setFormData({ ...formData, logoFile: e.target.files[0] })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              )}
              <label className="block mb-1 text-white font-semibold" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
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
                required
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
                required
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="team">
                Team
              </label>
              <select
                id="team"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-white-600 bg-transparent text-white focus:outline-none focus:ring-white"
                disabled={isLoading}
              >
                <option value="" className="bg-white text-gray-700">Select a team</option>
                {teams.map((team) => (
                  <option
                    key={team.id}
                    value={team.name}
                    className="bg-white text-gray-700"
                  >
                    {team.name}
                  </option>
                ))}
              </select>
              <label className="block mb-1 text-white font-semibold" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Enter vendor description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="4"
                disabled={isLoading}
              />
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
                      rating: '',
                      products: '',
                      logo: '',
                      featured: false,
                      team: '',
                      description: '',
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
          <h2 className="text-xl font-bold mb-4">Merchandise Community Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{totalVendors}+</p>
              <p className="text-gray-400">Official Vendors</p>
            </div>
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{totalTeams}+</p>
              <p className="text-gray-400">National Teams</p>
            </div>
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">100%</p>
              <p className="text-gray-400">Authentic Merch</p>
            </div>
            <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{averageRating}+</p>
              <p className="text-gray-400">Avg. Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TShirtVendorsPage;