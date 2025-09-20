import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaEnvelope, FaCalendarCheck, FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const OrganisersPage = () => {
  const navigate = useNavigate();
  const [organisers, setOrganisers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    events: '',
    avatar: '',
    email: '',
    phone: '',
    website: '',
    avatarSource: 'url',
    avatarFile: null
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all organiser data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'Organisers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrganisers(data);
    }, (error) => {
      console.error("Error fetching organisers:", error);
    });

    return () => unsubscribe();
  }, []);

  // Handle saving or updating organiser data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.events.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.website.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.events) || formData.events < 0) {
      alert("Events must be a non-negative number!");
      return;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Please provide a valid email address!");
      return;
    }
    if (formData.avatarSource === 'url' && formData.avatar && !formData.avatar.match(/\.(jpg|jpeg|png|gif)$/i)) {
      alert("Please provide a valid image URL (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.avatarSource === 'file' && !formData.avatarFile) {
      alert("Please select an image file!");
      return;
    }
    if (formData.avatarSource === 'file' && formData.avatarFile && !formData.avatarFile.type.match(/image\/(jpg|jpeg|png|gif)/i)) {
      alert("Please select a valid image file (jpg, jpeg, png, gif)!");
      return;
    }
    if (!formData.website.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/i)) {
      alert("Please provide a valid website URL (e.g., https://example.com)!");
      return;
    }

    // Check add limit for current user
    const userOrganisersCount = organisers.filter(org => org.userId === auth.currentUser.uid).length;
    if (!editingId && userOrganisersCount >= 4) {
      alert("You have reached the maximum limit of 4 organisers.");
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl = formData.avatar;
      if (formData.avatarSource === 'file' && formData.avatarFile) {
        const storageRef = ref(storage, `organisers/${auth.currentUser.uid}/${formData.avatarFile.name}`);
        await uploadBytes(storageRef, formData.avatarFile);
        avatarUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        name: formData.name,
        location: formData.location,
        events: parseInt(formData.events),
        avatar: avatarUrl || '',
        email: formData.email,
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'Organisers', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Organisers'), entryData);
      }

      setFormData({
        name: '',
        location: '',
        events: '',
        avatar: '',
        email: '',
        phone: '',
        website: '',
        avatarSource: 'url',
        avatarFile: null
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

  // Handle deleting organiser data
  const handleDeleteData = async (id) => {
    const org = organisers.find(o => o.id === id);
    if (!org || org.userId !== auth.currentUser.uid) {
      alert("You can only delete your own organiser.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this organiser?")) return;

    try {
      await deleteDoc(doc(db, 'Organisers', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing organiser data
  const handleEditData = (org) => {
    if (org.userId !== auth.currentUser.uid) {
      alert("You can only edit your own organiser.");
      return;
    }

    setFormData({
      name: org.name,
      location: org.location,
      events: org.events.toString(),
      avatar: org.avatar,
      email: org.email,
      phone: org.phone || '',
      website: org.website || '',
      avatarSource: org.avatar ? 'url' : 'none',
      avatarFile: null
    });
    setEditingId(org.id);
    setIsModalOpen(true);
  };

  // Generate avatar placeholder with first letter
  const getAvatarPlaceholder = (name) => {
    if (!name) return '';
    const firstLetter = name.trim().charAt(0).toUpperCase();
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%234B5EAA'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='32' font-family='Arial'%3E${firstLetter}%3C/text%3E%3C/svg%3E`;
  };

  return (
    <section className="bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => window.history.back()}
          />
        </div>
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-400 mb-2">
            Cricket Organisers
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Explore organizers conducting leagues, tournaments, and cricket events near you
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              setFormData({
                name: '',
                location: '',
                events: '',
                avatar: '',
                email: '',
                phone: '',
                website: '',
                avatarSource: 'url',
                avatarFile: null
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Organiser
          </button>
        </div>

        {organisers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {organisers.map((org) => (
              <div
                key={org.id}
                className="bg-[#111936] rounded-xl p-5 border border-blue-600/30 hover:border-blue-400 shadow-md hover:shadow-blue-700/20 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={org.avatar || getAvatarPlaceholder(org.name)}
                    alt={org.name}
                    className="w-16 h-16 rounded-full border-2 border-blue-500 flex-shrink-0"
                    onError={(e) => { e.target.src = getAvatarPlaceholder(org.name); }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold truncate">{org.name}</h2>
                      {org.userId === auth.currentUser.uid && (
                        <div className="flex items-center gap-2">
                          <FaEdit
                            className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditData(org);
                            }}
                          />
                          <FaTrash
                            className="text-red-500 cursor-pointer hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteData(org.id);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 text-sm sm:text-base min-w-0">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-400 text-base" />
                        <span className="text-gray-400">Location:</span>
                        <span className="text-blue-300 font-medium ml-2 truncate" title={org.location}>{org.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarCheck className="text-green-400 text-base" />
                        <span className="text-gray-400">Events Hosted:</span>
                        <span className="text-blue-300 font-medium ml-2">{org.events}</span>
                      </div>
                      {org.email && (
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-blue-400 text-base" />
                          <span className="text-gray-400">Email:</span>
                          <span className="text-blue-300 font-medium ml-2 truncate" title={org.email}>{org.email}</span>
                        </div>
                      )}
                      {org.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Phone:</span>
                          <span className="text-blue-300 font-medium ml-2 truncate" title={org.phone}>{org.phone}</span>
                        </div>
                      )}
                      {org.website && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Website:</span>
                          <a href={org.website} className="text-blue-300 font-medium hover:underline ml-2 truncate" title={org.website}>{org.website}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition flex items-center justify-center gap-2"
                  onClick={() => window.location.href = `mailto:${org.email}`}
                >
                  <FaEnvelope /> Contact
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No organisers added. Add an organiser to get started!</p>
        )}

        {/* Modal for Adding/Editing Organiser */}
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
                {editingId ? 'Edit Organiser' : 'Add Organiser'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter organiser name"
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
                placeholder="Enter location (e.g., Chennai, India)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="events">
                Events Hosted
              </label>
              <input
                id="events"
                type="number"
                placeholder="Enter number of events"
                value={formData.events}
                onChange={(e) => setFormData({ ...formData, events: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Avatar Source</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="avatarSource"
                    value="url"
                    checked={formData.avatarSource === 'url'}
                    onChange={(e) => setFormData({ ...formData, avatarSource: e.target.value, avatar: '', avatarFile: null })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  URL
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="avatarSource"
                    value="file"
                    checked={formData.avatarSource === 'file'}
                    onChange={(e) => setFormData({ ...formData, avatarSource: e.target.value, avatar: '', avatarFile: null })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Local File
                </label>
              </div>
              {formData.avatarSource === 'url' ? (
                <>
                  <label className="block mb-1 text-white font-semibold" htmlFor="avatar">
                    Avatar URL (Optional)
                  </label>
                  <input
                    id="avatar"
                    type="text"
                    placeholder="Enter avatar URL"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              ) : (
                <>
                  <label className="block mb-1 text-white font-semibold" htmlFor="avatarFile">
                    Avatar File (Optional)
                  </label>
                  <input
                    id="avatarFile"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => setFormData({ ...formData, avatarFile: e.target.files[0] })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              )}
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
              <label className="block mb-1 text-white font-semibold" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                type="url"
                placeholder="Enter website (e.g., https://example.com)"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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
                      location: '',
                      events: '',
                      avatar: '',
                      email: '',
                      phone: '',
                      website: '',
                      avatarSource: 'url',
                      avatarFile: null
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

export default OrganisersPage;