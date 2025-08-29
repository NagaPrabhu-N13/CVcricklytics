import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth } from "../../firebase"; // Adjust path as needed
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const ScoresPage = () => {
  const [scoresData, setScoresData] = useState([]);
  const [isModalOpen, setIsModalOpen ] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    matches: '',
    rating: '',
    reviews: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all player data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'PlayerScores'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScoresData(data);
    }, (error) => {
      console.error("Error fetching scores:", error);
    });

    return () => unsubscribe();
  }, []);

  // Handle saving or updating player data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.matches || !formData.rating || !formData.reviews) {
      alert("Please fill all fields!");
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

    setIsLoading(true);
    try {
      const entryData = {
        name: formData.name,
        location: formData.location,
        matches: parseInt(formData.matches),
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'PlayerScores', editingId), entryData);
      } else {
        await addDoc(collection(db, 'PlayerScores'), entryData);
      }

      setFormData({ name: '', location: '', matches: '', rating: '', reviews: '' });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Failed to save data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting player data
  const handleDeleteData = async (id) => {
    const player = scoresData.find(p => p.id === id);
    if (!player || player.userId !== auth.currentUser.uid) {
      alert("You can only delete your own scores.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this player?")) return;

    try {
      await deleteDoc(doc(db, 'PlayerScores', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing player data
  const handleEditData = (player) => {
    if (player.userId !== auth.currentUser.uid) {
      alert("You can only edit your own scores.");
      return;
    }

    setFormData({
      name: player.name,
      location: player.location,
      matches: player.matches.toString(),
      rating: player.rating.toString(),
      reviews: player.reviews.toString(),
    });
    setEditingId(player.id);
    setIsModalOpen(true);
  };

  return (
    <section className="bg-[#0b0f28] min-h-screen text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <div className="md:absolute flex items-center gap-4">
            <img
              src={backButton}
              alt="Back"
              className="h-8 w-8 cursor-pointer -scale-x-100"
              onClick={() => window.history.back()}
            />
          </div>
          <div className="flex-grow">
            <header className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-400">
                Score Profiles
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">
                View player statistics and ratings from your cricket community
              </p>
            </header>
          </div>
          <div></div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              setFormData({ name: '', location: '', matches: '', rating: '', reviews: '' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Player
          </button>
        </div>

        {scoresData.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scoresData.map((player) => (
              <div
                key={player.id}
                className="bg-[#111936] rounded-xl p-4 border border-blue-500/30 hover:border-blue-400 hover:scale-[1.02] transition-transform duration-300 shadow-lg"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-blue-300">
                      {player.name}
                    </h2>
                    <p className="text-gray-400 text-sm">{player.location}</p>
                  </div>
                  {player.userId === auth.currentUser.uid && (
                    <div className="flex gap-2">
                      <FiEdit
                        className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                        onClick={() => handleEditData(player)}
                      />
                      <FiTrash2
                        className="text-red-500 cursor-pointer hover:text-red-600"
                        onClick={() => handleDeleteData(player.id)}
                      />
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <p className="text-gray-300">
                    Matches Scored:{" "}
                    <span className="text-green-300 font-bold">
                      {player.matches.toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-yellow-400 font-bold mr-1">
                      {player.rating}/5
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(player.rating)
                              ? "text-yellow-400"
                              : "text-gray-600"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {player.reviews} Review(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No players added. Add a player to get started!</p>
        )}

        {/* Modal for Adding/Editing Player */}
        {isModalOpen && (
          <div className="border-2 border-white fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
            <div
              className="w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(138, 27, 211, 0.85) 15%, rgba(21, 19, 20, 0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.75)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center">
                {editingId ? 'Edit Player' : 'Add Player'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter player name"
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
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mb-4 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="matches">
                Matches
              </label>
              <input
                id="matches"
                type="number"
                placeholder="Enter matches scored"
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
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({ name: '', location: '', matches: '', rating: '', reviews: '' });
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

export default ScoresPage;
