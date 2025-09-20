import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiShoppingCart,
  FiHeart,
  FiStar,
} from 'react-icons/fi';
import { FaEdit, FaTrash, FaEnvelope, FaPhone, FaGlobe } from "react-icons/fa";
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ShopsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gear');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    rating: '',
    reviews: '',
    image: '',
    discount: '',
    category: 'gear',
    imageSource: 'url',
    imageFile: null,
    email: '',
    phone: '',
    website: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all product data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'Products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    }, (error) => {
      console.error("Error fetching products:", error);
    });

    return () => unsubscribe();
  }, []);

  // Handle saving or updating product data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.price || !formData.rating || !formData.reviews || !formData.category || !formData.email.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.price) || formData.price <= 0) {
      alert("Price must be a positive number!");
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
    if (formData.discount && (isNaN(formData.discount) || formData.discount < 0 || formData.discount > 100)) {
      alert("Discount must be between 0 and 100!");
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
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Please provide a valid email address!");
      return;
    }
    if (formData.website && !formData.website.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/i)) {
      alert("Please provide a valid website URL (e.g., https://example.com)!");
      return;
    }

    // Check add limit for current user
    const userProductsCount = products.filter(p => p.userId === auth.currentUser.uid).length;
    if (!editingId && userProductsCount >= 4) {
      alert("You have reached the maximum limit of 4 products.");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = formData.image;
      if (formData.imageSource === 'file' && formData.imageFile) {
        const storageRef = ref(storage, `products/${auth.currentUser.uid}/${formData.imageFile.name}`);
        await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        name: formData.name,
        price: parseFloat(formData.price),
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        image: imageUrl || '',
        discount: formData.discount ? parseInt(formData.discount) : 0,
        category: formData.category,
        email: formData.email,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'Products', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Products'), entryData);
      }

      setFormData({
        name: '',
        price: '',
        rating: '',
        reviews: '',
        image: '',
        discount: '',
        category: 'gear',
        imageSource: 'url',
        imageFile: null,
        email: '',
        phone: '',
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

  // Handle deleting product data
  const handleDeleteData = async (id) => {
    const product = products.find(p => p.id === id);
    if (!product || product.userId !== auth.currentUser.uid) {
      alert("You can only delete your own products.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, 'Products', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing product data
  const handleEditData = (product) => {
    if (product.userId !== auth.currentUser.uid) {
      alert("You can only edit your own products.");
      return;
    }

    setFormData({
      name: product.name,
      price: product.price.toString(),
      rating: product.rating.toString(),
      reviews: product.reviews.toString(),
      image: product.image,
      discount: product.discount.toString(),
      category: product.category,
      imageSource: product.image ? 'url' : 'none',
      imageFile: null,
      email: product.email || '',
      phone: product.phone || '',
      website: product.website || ''
    });
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  // Check if product is new (within 7 days)
  const isProductNew = (timestamp) => {
    const productDate = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - productDate;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  };

  // Filter products based on search query and active tab
  const filteredProducts = products
    .filter((item) => item.category === activeTab)
    .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addToCart = (id) => {
    setCartItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <section className="bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <img
          src={backButton}
          alt="Back"
          className="h-8 w-8 cursor-pointer -scale-x-100 mb-6"
          onClick={() => window.history.back()}
        />

        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-400 mb-2">
            CricketZone Shop
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Explore top-quality cricket gear and accessories
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-[85vw] sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-100" />
            <input
              type="text"
              placeholder="Search cricket products..."
              className="pl-10 pr-4 py-2 rounded-full text-gray-100 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide justify-center">
          {['gear', 'jerseys', 'accessories'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 mx-2 rounded-full min-w-[80px] ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              setFormData({
                name: '',
                price: '',
                rating: '',
                reviews: '',
                image: '',
                discount: '',
                category: 'gear',
                imageSource: 'url',
                imageFile: null,
                email: '',
                phone: '',
                website: ''
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Product
          </button>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProducts.map((item) => (
              <div key={item.id} className="bg-[#111936] p-4 rounded-xl border border-blue-600/20 shadow-md relative group overflow-hidden">
                <div className="absolute top-2 left-2 flex flex-col items-start gap-2 min-h-[40px] z-10">
                  {item.discount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      {item.discount}% OFF
                    </span>
                  )}
                  {isProductNew(item.timestamp) && (
                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      NEW
                    </span>
                  )}
                </div>
                {item.userId === auth.currentUser.uid && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    <FaEdit
                      className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditData(item);
                      }}
                    />
                    <FaTrash
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteData(item.id);
                      }}
                    />
                  </div>
                )}
                <img
                  src={item.image || 'https://via.placeholder.com/150'}
                  alt={item.name}
                  className="w-full h-40 sm:h-48 object-contain rounded-lg mb-3"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                />
                <h3 className="text-lg font-semibold text-white mb-1 truncate" title={item.name}>{item.name}</h3>
                <p className="text-blue-400 font-semibold mb-1">₹{item.price.toFixed(2)}</p>
                <div className="flex items-center text-yellow-400 text-sm mb-2">
                  {[...Array(Math.round(item.rating))].map((_, idx) => (
                    <FiStar key={idx} />
                  ))}
                  <span className="text-gray-300 ml-2">({item.reviews})</span>
                </div>
                <div className="flex flex-col gap-2 text-sm sm:text-base mb-2 min-w-0 max-w-full">
                  {item.email && (
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-blue-400 text-base flex-shrink-0" />
                      <span className="text-gray-400 font-medium">Email:</span>
                      <span className="text-blue-300 font-medium ml-2 truncate" title={item.email}>{item.email}</span>
                    </div>
                  )}
                  {item.phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-blue-400 text-base flex-shrink-0" />
                      <span className="text-gray-400 font-medium">Phone:</span>
                      <span className="text-blue-300 font-medium ml-2 truncate" title={item.phone}>{item.phone}</span>
                    </div>
                  )}
                  {item.website && (
                    <div className="flex items-center gap-2">
                      <FaGlobe className="text-blue-400 text-base flex-shrink-0" />
                      <span className="text-gray-400 font-medium">Website:</span>
                      <a href={item.website} className="text-blue-300 font-medium ml-2 truncate hover:underline" title={item.website}>{item.website}</a>
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className={`p-2 rounded-full ${
                      favorites[item.id] ? 'bg-red-500' : 'bg-white text-black'
                    }`}
                  >
                    <FiHeart />
                  </button>
                  <button
                    onClick={() => addToCart(item.id)}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition"
                  >
                    <FiShoppingCart />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No products found. Add a product to get started!</p>
        )}

        {/* Modal for Adding/Editing Product */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div
              className="w-full max-w-[90vw] sm:w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="price">
                Price (₹)
              </label>
              <input
                id="price"
                type="number"
                placeholder="Enter price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                min="0"
                step="0.01"
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
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
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
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
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
                  <label className="block mb-1 text-white font-semibold" htmlFor="image">
                    Image URL (Optional)
                  </label>
                  <input
                    id="image"
                    type="text"
                    placeholder="Enter image URL"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
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
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                    disabled={isLoading}
                  />
                </>
              )}
              <label className="block mb-1 text-white font-semibold" htmlFor="discount">
                Discount (%)
              </label>
              <input
                id="discount"
                type="number"
                placeholder="Enter discount (optional)"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                min="0"
                max="100"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                disabled={isLoading}
              >
                <option className="bg-[#111936] text-white" value="gear">Gear</option>
                <option className="bg-[#111936] text-white" value="jerseys">Jerseys</option>
                <option className="bg-[#111936] text-white" value="accessories">Accessories</option>
              </select>
              <label className="block mb-1 text-white font-semibold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="phone">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="website">
                Website (Optional)
              </label>
              <input
                id="website"
                type="url"
                placeholder="Enter website (e.g., https://example.com)"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-0"
                disabled={isLoading}
              />
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      price: '',
                      rating: '',
                      reviews: '',
                      image: '',
                      discount: '',
                      category: 'gear',
                      imageSource: 'url',
                      imageFile: null,
                      email: '',
                      phone: '',
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
      </div>
    </section>
  );
};

export default ShopsPage;