import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiStar, FiTruck, FiShield, FiArrowLeft } from 'react-icons/fi';
import { FaTrophy, FaMedal, FaCertificate, FaRegMoneyBillAlt } from 'react-icons/fa';
import { Edit, Trash2 } from 'lucide-react';
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase"; // Adjust path as needed
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const TrophyVendorsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    orders: '',
    deliveryTime: '',
    minOrder: '',
    image: '',
    bio: '',
    services: [],
    featured: false,
    products: [],
    imageSource: 'url',
    imageFile: null
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch vendor data from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'Vendors'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(entry => entry.userId === auth.currentUser.uid);
      setVendors(data);
    }, (error) => {
      console.error("Error fetching vendors:", error);
    });

    return () => unsubscribe();
  }, []);

  // Calculate stats for "Trophy Vendor Network"
  const calculateStats = () => {
    const totalVendors = vendors.length;
    const featuredSuppliers = vendors.filter(v => v.featured).length;
    const totalOrders = vendors.reduce((acc, v) => acc + (parseInt(v.orders) || 0), 0);
    const averageRating = vendors.length > 0
      ? (vendors.reduce((acc, v) => acc + (parseFloat(v.rating) || 0), 0) / vendors.length).toFixed(1)
      : 0;

    return {
      totalVendors,
      featuredSuppliers,
      totalOrders,
      averageRating
    };
  };

  const { totalVendors, featuredSuppliers, totalOrders, averageRating } = calculateStats();

  // Handle saving or updating vendor data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.rating || !formData.orders || !formData.deliveryTime.trim() || !formData.minOrder.trim() || !formData.bio.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (isNaN(formData.orders) || formData.orders < 0) {
      alert("Orders must be a non-negative number!");
      return;
    }
    if (!formData.minOrder.match(/^\$\d+$/)) {
      alert("Minimum order must be in the format '$[number]' (e.g., '$100')!");
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
    if (formData.services.length === 0) {
      alert("Please add at least one service!");
      return;
    }
    if (formData.products.length === 0) {
      alert("Please add at least one product!");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = formData.image;
      if (formData.imageSource === 'file' && formData.imageFile) {
        const storageRef = ref(storage, `vendors/${auth.currentUser.uid}/${formData.imageFile.name}`);
        await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        name: formData.name,
        rating: parseFloat(formData.rating),
        orders: parseInt(formData.orders),
        deliveryTime: formData.deliveryTime,
        minOrder: formData.minOrder,
        image: imageUrl || '',
        bio: formData.bio,
        services: formData.services,
        featured: formData.featured,
        products: formData.products.map(product => ({
          id: product.id || Date.now() + Math.random().toString(36).substr(2, 9),
          type: product.type,
          name: product.name,
          price: product.price,
          image: product.image || 'https://via.placeholder.com/150'
        })),
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'Vendors', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Vendors'), entryData);
      }

      setFormData({
        name: '',
        rating: '',
        orders: '',
        deliveryTime: '',
        minOrder: '',
        image: '',
        bio: '',
        services: [],
        featured: false,
        products: [],
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

  // Handle deleting vendor data
  const handleDeleteData = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;

    try {
      await deleteDoc(doc(db, 'Vendors', id));
      if (selectedVendor && selectedVendor.id === id) {
        setSelectedVendor(null);
      }
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing vendor data
  const handleEditData = (vendor) => {
    setFormData({
      name: vendor.name,
      rating: vendor.rating.toString(),
      orders: vendor.orders.toString(),
      deliveryTime: vendor.deliveryTime,
      minOrder: vendor.minOrder,
      image: vendor.image,
      bio: vendor.bio,
      services: vendor.services,
      featured: vendor.featured,
      products: vendor.products,
      imageSource: vendor.image ? 'url' : 'none',
      imageFile: null
    });
    setEditingId(vendor.id);
    setIsModalOpen(true);
  };

  // Add service
  const addService = () => {
    const newService = prompt("Enter service (e.g., custom-engraving, express-delivery):");
    if (newService && newService.trim()) {
      setFormData({ ...formData, services: [...formData.services, newService.trim()] });
    }
  };

  // Remove service
  const removeService = (index) => {
    setFormData({ ...formData, services: formData.services.filter((_, i) => i !== index) });
  };

  // Add product
  const addProduct = () => {
    const type = prompt("Enter product type (trophy, medal, plaque, certificate):");
    const name = prompt("Enter product name:");
    const price = prompt("Enter product price (e.g., $45):");
    const image = prompt("Enter product image URL (optional):");
    if (type && name && price && ['trophy', 'medal', 'plaque', 'certificate'].includes(type.toLowerCase()) && price.match(/^\$\d+$/)) {
      setFormData({
        ...formData,
        products: [...formData.products, { type: type.toLowerCase(), name, price, image }]
      });
    } else {
      alert("Invalid product details! Ensure type is valid and price is in '$[number]' format.");
    }
  };

  // Remove product
  const removeProduct = (index) => {
    setFormData({ ...formData, products: formData.products.filter((_, i) => i !== index) });
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'featured') return matchesSearch && vendor.featured;
    if (activeTab === 'express') return matchesSearch && vendor.services.includes('express-delivery');
    return matchesSearch;
  });

  const addToCart = (product) => {
    setCartItems([...cartItems, product]);
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case 'custom-engraving': return <FiAward className="inline mr-1" />;
      case 'express-delivery': return <FiTruck className="inline mr-1" />;
      case 'custom-design': return <FaTrophy className="inline mr-1" />;
      case 'bulk-discounts': return <FaRegMoneyBillAlt className="inline mr-1" />;
      default: return <FiShield className="inline mr-1" />;
    }
  };

  const getProductIcon = (type) => {
    switch (type) {
      case 'trophy': return <FaTrophy className="inline mr-1" />;
      case 'medal': return <FaMedal className="inline mr-1" />;
      case 'plaque': return <FiAward className="inline mr-1" />;
      case 'certificate': return <FaCertificate className="inline mr-1" />;
      default: return <FiAward className="inline mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => window.history.back()}
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Cricket Trophy Vendors</h1>
            <p className="text-blue-300">Find the perfect awards for your cricket tournaments</p>
          </div>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors by name or service..."
              className="w-full pl-10 pr-4 py-2 bg-[#0b1a3b] border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <FaTrophy className="text-blue-400" />
            <select 
              className="bg-[#0b1a3b] border border-blue-600/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="all">All Vendors</option>
              <option value="featured">Featured</option>
              <option value="express">Express Delivery</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFormData({
                name: '',
                rating: '',
                orders: '',
                deliveryTime: '',
                minOrder: '',
                image: '',
                bio: '',
                services: [],
                featured: false,
                products: [],
                imageSource: 'url',
                imageFile: null
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Vendor
          </button>
        </div>

        {/* Main Content */}
        {selectedVendor ? (
          // Vendor Detail View
          <div className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setSelectedVendor(null)}
                className="flex items-center text-blue-400 hover:text-blue-300"
              >
                <FiArrowLeft className="mr-2" /> Back to all vendors
              </button>
              <div className="flex gap-2">
                <Edit
                  className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                  onClick={() => handleEditData(selectedVendor)}
                />
                <Trash2
                  className="text-red-500 cursor-pointer hover:text-red-600"
                  onClick={() => handleDeleteData(selectedVendor.id)}
                />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img 
                  src={selectedVendor.image || 'https://via.placeholder.com/150'} 
                  alt={selectedVendor.name} 
                  className="w-full h-auto rounded-lg object-cover border-2 border-blue-500"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                />
                <div className="mt-4 flex justify-between items-center">
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-300">
                    Min Order: {selectedVendor.minOrder}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <FiStar className="mr-1" />
                    <span>{selectedVendor.rating}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-bold text-blue-400 mb-2">Services:</h3>
                  <div className="space-y-2">
                    {selectedVendor.services.map((service, index) => (
                      <div key={index} className="flex items-center">
                        {getServiceIcon(service)}
                        <span className="ml-2 capitalize">
                          {service.split('-').join(' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-2">{selectedVendor.name}</h2>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center text-blue-300">
                    <FiTruck className="mr-2" />
                    <span>Delivery: {selectedVendor.deliveryTime}</span>
                  </div>
                  <div className="flex items-center text-blue-300">
                    <FaRegMoneyBillAlt className="mr-2" />
                    <span>{selectedVendor.orders}+ orders completed</span>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">{selectedVendor.bio}</p>
                
                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-4">Available Products</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedVendor.products.map((product) => (
                      <div key={product.id} className="border border-blue-600/30 rounded-lg p-4 hover:border-blue-400 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-md overflow-hidden">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {getProductIcon(product.type)}
                              {product.name}
                            </h4>
                            <p className="text-blue-400 font-bold mt-1">{product.price}</p>
                            <button 
                              onClick={() => addToCart(product)}
                              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-full flex items-center"
                            >
                              <FiShoppingCart className="mr-1" /> Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Vendor List View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map(vendor => (
              <div 
                key={vendor.id} 
                className="bg-[#0b1a3b] border border-blue-600/50 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg group relative"
                onClick={() => setSelectedVendor(vendor)}
              >
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
                <div className="flex items-start gap-4">
                  <img 
                    src={vendor.image || 'https://via.placeholder.com/150'} 
                    alt={vendor.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 group-hover:border-blue-300 transition-colors"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                  />
                  <div>
                    <h3 className="font-bold">{vendor.name}</h3>
                    <div className="flex items-center text-yellow-400 text-sm">
                      <FiStar className="mr-1" />
                      <span>{vendor.rating}</span>
                    </div>
                    <div className="flex items-center text-blue-300 text-sm mt-1">
                      <FiTruck className="mr-1" />
                      <span>{vendor.deliveryTime} delivery</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {vendor.services.slice(0, 2).map((service, index) => (
                        <span key={index} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded capitalize">
                          {service.split('-').join(' ')}
                        </span>
                      ))}
                      {vendor.services.length > 2 && (
                        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">
                          +{vendor.services.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">From {vendor.minOrder}</span>
                  {vendor.featured && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-900 text-yellow-300">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vendor Input Modal */}
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
              <label className="block mb-1 text-white font-semibold" htmlFor="orders">
                Orders Completed
              </label>
              <input
                id="orders"
                type="number"
                placeholder="Enter number of orders"
                value={formData.orders}
                onChange={(e) => setFormData({ ...formData, orders: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="deliveryTime">
                Delivery Time
              </label>
              <input
                id="deliveryTime"
                type="text"
                placeholder="Enter delivery time (e.g., 3-5 days)"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="minOrder">
                Minimum Order
              </label>
              <input
                id="minOrder"
                type="text"
                placeholder="Enter minimum order (e.g., $100)"
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
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
                placeholder="Enter vendor bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="4"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Services</label>
              <div className="mb-3">
                {formData.services.map((service, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="text-gray-300">{service}</span>
                    <button
                      onClick={() => removeService(index)}
                      className="text-red-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addService}
                  className="text-blue-400 hover:text-blue-500 text-sm"
                  disabled={isLoading}
                >
                  + Add Service
                </button>
              </div>
              <label className="block mb-1 text-white font-semibold">Products</label>
              <div className="mb-3">
                {formData.products.map((product, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="text-gray-300">{product.name} ({product.type}, {product.price})</span>
                    <button
                      onClick={() => removeProduct(index)}
                      className="text-red-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addProduct}
                  className="text-blue-400 hover:text-blue-500 text-sm"
                  disabled={isLoading}
                >
                  + Add Product
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
                      rating: '',
                      orders: '',
                      deliveryTime: '',
                      minOrder: '',
                      image: '',
                      bio: '',
                      services: [],
                      featured: false,
                      products: [],
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

        {/* Community Stats */}
        {!selectedVendor && (
          <div className="mt-12 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Trophy Vendor Network</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalVendors}+</p>
                <p className="text-gray-400">Verified Vendors</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{featuredSuppliers}</p>
                <p className="text-gray-400">Featured Suppliers</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalOrders}+</p>
                <p className="text-gray-400">Orders Completed</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{averageRating}</p>
                <p className="text-gray-400">Average Rating</p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Indicator */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
            <div className="relative">
              <FiShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrophyVendorsPage;