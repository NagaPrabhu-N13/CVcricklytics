import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Frame1321317519 from './Frame';

const Winner25 = () => {
  const [activeCategory, setActiveCategory] = useState('Popularity');
  const [showModal, setShowModal] = useState(false);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState(null);

  const categories = ['Popularity', 'Batting', 'Bowling', 'Fielding', 'All Rounder'];

  const [formData, setFormData] = useState({
    name: '',
    category: 'Popularity',
    votes: '',
    location: '',
    image: '',
    imageSource: 'url',
    stats: {
      age: '',
      inns: '',
      runs: '',
      wickets: '',
      catches: '',
      runOuts: '',
      avg: '',
      sr: '',
      econ: '',
      matches: ''
    }
  });

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'winners2025'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('votes', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPlayers(data);
    } catch (err) {
      console.error('Error fetching players:', err);
      setPlayers([]);
      alert('Failed to fetch players');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'imageSource') {
      setFormData(prev => ({
        ...prev,
        imageSource: value,
        image: ''
      }));
    } else if (name.includes('stats.')) {
      const statField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'winners2025'), {
        ...formData,
        votes: formData.votes ? Number(formData.votes) : null,
        stats: {
          age: formData.stats?.age ? Number(formData.stats.age) : null,
          inns: formData.stats?.inns ? Number(formData.stats.inns) : null,
          runs: formData.stats?.runs ? Number(formData.stats.runs) : null,
          wickets: formData.stats?.wickets ? Number(formData.stats.wickets) : null,
          catches: formData.stats?.catches ? Number(formData.stats.catches) : null,
          runOuts: formData.stats?.runOuts ? Number(formData.stats.runOuts) : null,
          avg: formData.stats?.avg ? Number(formData.stats.avg) : null,
          sr: formData.stats?.sr ? Number(formData.stats.sr) : null,
          econ: formData.stats?.econ ? Number(formData.stats.econ) : null,
          matches: formData.stats?.matches ? Number(formData.stats.matches) : null,
        },
        userId: auth.currentUser.uid
      });

      setFormData({
        name: '',
        category: 'Popularity',
        votes: '',
        location: '',
        image: '',
        imageSource: 'url',
        stats: {
          age: '',
          inns: '',
          runs: '',
          wickets: '',
          catches: '',
          runOuts: '',
          avg: '',
          sr: '',
          econ: '',
          matches: ''
        }
      });

      setShowModal(false);
      fetchPlayers();
    } catch (err) {
      console.error('Error adding player:', err);
      alert('Failed to add player');
    }
  };

  const handleEditPlayer = (player) => {
    setFormData({
      name: player.name || '',
      category: player.category || 'Popularity',
      votes: player.votes || '',
      location: player.location || '',
      image: player.image || '',
      imageSource: 'url',
      stats: {
        age: player.stats?.age || '',
        inns: player.stats?.inns || '',
        runs: player.stats?.runs || '',
        wickets: player.stats?.wickets || '',
        catches: player.stats?.catches || '',
        runOuts: player.stats?.runOuts || '',
        avg: player.stats?.avg || '',
        sr: player.stats?.sr || '',
        econ: player.stats?.econ || '',
        matches: player.stats?.matches || ''
      }
    });
    setEditPlayerId(player.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateDoc(doc(db, 'winners2025', editPlayerId), {
        ...formData,
        votes: formData.votes ? Number(formData.votes) : null,
        stats: {
          age: formData.stats?.age ? Number(formData.stats.age) : null,
          inns: formData.stats?.inns ? Number(formData.stats.inns) : null,
          runs: formData.stats?.runs ? Number(formData.stats.runs) : null,
          wickets: formData.stats?.wickets ? Number(formData.stats.wickets) : null,
          catches: formData.stats?.catches ? Number(formData.stats.catches) : null,
          runOuts: formData.stats?.runOuts ? Number(formData.stats.runOuts) : null,
          avg: formData.stats?.avg ? Number(formData.stats.avg) : null,
          sr: formData.stats?.sr ? Number(formData.stats.sr) : null,
          econ: formData.stats?.econ ? Number(formData.stats.econ) : null,
          matches: formData.stats?.matches ? Number(formData.stats.matches) : null,
        },
        userId: auth.currentUser.uid
      });

      setFormData({
        name: '',
        category: 'Popularity',
        votes: '',
        location: '',
        image: '',
        imageSource: 'url',
        stats: {
          age: '',
          inns: '',
          runs: '',
          wickets: '',
          catches: '',
          runOuts: '',
          avg: '',
          sr: '',
          econ: '',
          matches: ''
        }
      });

      setShowModal(false);
      setIsEditing(false);
      setEditPlayerId(null);
      fetchPlayers();
    } catch (err) {
      console.error('Error updating player:', err);
      alert('Failed to update player');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;

    try {
      await deleteDoc(doc(db, 'winners2025', playerId));
      setPlayers(players.filter(player => player.id !== playerId));
    } catch (err) {
      console.error('Error deleting player:', err);
      alert('Failed to delete player');
    }
  };

  const limitedPlayerData = categories.reduce((acc, category) => {
    const categoryPlayers = players
      .filter(player => player.category === category)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
    return [...acc, ...categoryPlayers];
  }, []);

  const topThreeOverall = [...limitedPlayerData]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3);

  let filteredPlayers = [];

  if (activeCategory === 'Popularity') {
    filteredPlayers = topThreeOverall;
  } else {
    filteredPlayers = limitedPlayerData
      .filter(player => player.category === activeCategory)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  }

  const styles = {
    winnerContainer1: {
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(180deg, rgba(13, 23, 30, 1) 0%, rgba(40, 63, 121, 1) 100%)',
    },
    cricklyticsLogo1: {
      width: '25rem',
      height: 'auto',
    },
    jamInfo1: {
      width: '4rem',
      height: '4rem',
    },
    winnerContent1: {
      paddingLeft: '2.5rem',
      paddingRight: '2.5rem',
      paddingBottom: '1.5rem',
      overflowX: 'hidden',
    },
    pageTitle1: {
      marginTop: '50px',
      color: 'white',
      fontSize: '3rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '2rem',
      animation: 'fade-in 0.8s ease-out forwards',
    },
    categoryTabsContainer1: {
      width: '100%',
      overflowX: 'auto',
      paddingBottom: '10px',
      WebkitOverflowScrolling: 'touch',
    },
    categoryTabs1: {
      display: 'flex',
      justifyContent: 'flex-start',
      gap: '1rem',
      marginBottom: '2.5rem',
      padding: '0 1rem',
      minWidth: 'max-content',
    },
    tabButton1: {
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem',
      borderRadius: '9999px',
      color: 'white',
      fontSize: '1.125rem',
      fontWeight: 600,
      transition: 'all 0.3s ease',
      background: '#142136',
      flexShrink: 0,
    },
    tabButtonActive1: {
      background: '#ec4899',
      color: 'white',
      transform: 'scale(1.1)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    winnerCards1: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '2rem',
      maxWidth: '72rem',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    winnerCard1: {
      backgroundColor: 'rgb(20, 33, 54)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px',
      width: '300px',
      height: '530px',
      display: 'flex',
      flexDirection: 'column',
      margin: '0 auto',
    },
    cardHeader1: {
      backgroundColor: 'rgb(37, 99, 235)',
      color: 'white',
      fontSize: '1.25rem',
      fontWeight: 600,
      padding: '1rem',
      textAlign: 'center',
      position: 'relative',
    },
    cardContent1: {
      padding: '1.5rem',
      color: 'white',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    playerImage1: {
      width: '8rem',
      height: '8rem',
      borderRadius: '9999px',
      marginBottom: '1rem',
      objectFit: 'cover',
      border: '2px solid red',
    },
    playerName1: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '0.5rem',
    },
    playerVotes1: {
      fontSize: '1.125rem',
      textAlign: 'center',
      marginBottom: '0.5rem',
    },
    playerLocation1: {
      fontSize: '1.125rem',
      textAlign: 'center',
      marginBottom: '1rem',
    },
    statsTable1: {
      width: '100%',
      textAlign: 'left',
      fontSize: '0.875rem',
      marginTop: 'auto',
    },
    statsTableTd1: {
      paddingTop: '0.25rem',
      paddingBottom: '0.25rem',
    },
    statsTableFirstChild1: {
      fontWeight: 600,
      paddingRight: '1rem',
    },
    winnerBanner1: {
      backgroundColor: 'rgb(251, 191, 36)',
      color: 'black',
      textAlign: 'center',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem',
      fontWeight: 'bold',
      fontSize: '1.25rem',
    },
    addButton: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      backgroundColor: '#ec4899',
      color: 'white',
      width: '4rem',
      height: '4rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      zIndex: 100,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#1a1a2e',
      padding: '2rem',
      borderRadius: '0.5rem',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    formLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      color: 'white',
      fontWeight: 'bold',
    },
    formInput: {
      width: '100%',
      padding: '0.5rem',
      borderRadius: '0.25rem',
      border: '1px solid #374151',
      backgroundColor: '#1f2937',
      color: 'white',
    },
    formSelect: {
      width: '100%',
      padding: '0.5rem',
      borderRadius: '0.25rem',
      border: '1px solid #374151',
      backgroundColor: '#1f2937',
      color: 'white',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginTop: '1rem',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    submitButton: {
      backgroundColor: '#ec4899',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      border: 'none',
      cursor: 'pointer',
    },
    cancelButton: {
      backgroundColor: '#374151',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      border: 'none',
      cursor: 'pointer',
    },
  };

  const mobileStyles = {
    pageTitle1: {
      fontSize: '2rem',
    },
    tabButton1: {
      fontSize: '1rem',
      paddingLeft: '1rem',
      paddingRight: '1rem',
    },
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={styles.winnerContainer1}>
      <div style={styles.winnerContent1}>
        <h1 style={{ ...styles.pageTitle1, ...(isMobile ? mobileStyles.pageTitle1 : {}) }}>
          Winners of 2025
        </h1>

        <div style={styles.categoryTabsContainer1}>
          <div style={styles.categoryTabs1}>
            <Frame1321317519 />
            {categories.map((category) => (
              <button
                key={category}
                style={{
                  ...styles.tabButton1,
                  ...(isMobile ? mobileStyles.tabButton1 : {}),
                  ...(activeCategory === category ? styles.tabButtonActive1 : {}),
                }}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'white', textAlign: 'center' }}>Players loading...</p>
        ) : filteredPlayers.length === 0 ? (
          <p style={{ color: 'white', textAlign: 'center' }}>No players found. Add some winners!</p>
        ) : (
          <div style={styles.winnerCards1}>
            {filteredPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                style={styles.winnerCard1}
                className="transition-transform duration-200 hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div style={styles.cardHeader1}>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <FaEdit
                      className="text-white hover:text-yellow-400 cursor-pointer"
                      onClick={() => handleEditPlayer(player)}
                    />
                    <FaTrash
                      className="text-white hover:text-red-500 cursor-pointer"
                      onClick={() => handleDeletePlayer(player.id)}
                    />
                  </div>
                  {activeCategory === 'Popularity' ? 'Popularity' : player.category || 'Popularity'}
                </div>
                <div style={styles.cardContent1}>
                  <img src={player.image || ''} alt={player.name || 'Player'} style={styles.playerImage1} />
                  <h2 style={styles.playerName1}>{player.name || 'Unknown'}</h2>
                  {activeCategory === 'Popularity' && (
                    <p style={styles.playerVotes1}>{player.votes || 0} Votes</p>
                  )}
                  <p style={styles.playerLocation1}>{player.location || 'Unknown'}</p>
                  <table style={styles.statsTable1}>
                    <tbody>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Age:</td>
                        <td>{player.stats?.age || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Innings:</td>
                        <td>{player.stats?.inns || 'N/A'}</td>
                      </tr>
                      {(player.category === 'Batting' || player.category === 'All Rounder' || (activeCategory === 'Popularity' && player.stats?.runs)) && (
                        <>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Runs:</td>
                            <td>{player.stats?.runs || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Average:</td>
                            <td>{player.stats?.avg || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Strike Rate:</td>
                            <td>{player.stats?.sr || 'N/A'}</td>
                          </tr>
                        </>
                      )}
                      {(player.category === 'Bowling' || player.category === 'All Rounder' || (activeCategory === 'Popularity' && player.stats?.wickets)) && (
                        <>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Wickets:</td>
                            <td>{player.stats?.wickets || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Average:</td>
                            <td>{player.stats?.avg || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Economy:</td>
                            <td>{player.stats?.econ || 'N/A'}</td>
                          </tr>
                        </>
                      )}
                      {(player.category === 'Fielding' || (activeCategory === 'Popularity' && (player.stats?.catches || player.stats?.runOuts))) && (
                        <>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Matches:</td>
                            <td>{player.stats?.matches || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Catches:</td>
                            <td>{player.stats?.catches || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={styles.statsTableFirstChild1}>Run Outs:</td>
                            <td>{player.stats?.runOuts || 'N/A'}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={styles.winnerBanner1}>WINNER</div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          style={styles.addButton}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setFormData({
              name: '',
              category: 'Popularity',
              votes: '',
              location: '',
              image: '',
              imageSource: 'url',
              stats: {
                age: '',
                inns: '',
                runs: '',
                wickets: '',
                catches: '',
                runOuts: '',
                avg: '',
                sr: '',
                econ: '',
                matches: ''
              }
            });
            setIsEditing(false);
            setShowModal(true);
          }}
        >
          +
        </motion.div>

        <AnimatePresence>
          {showModal && (
            <motion.div
              style={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                style={styles.modalContent}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
                  {isEditing ? 'Edit Winner' : 'Add New Winner'}
                </h2>
                <form onSubmit={isEditing ? handleEditSubmit : handleSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      style={styles.formSelect}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Votes</label>
                    <input
                      type="number"
                      name="votes"
                      value={formData.votes}
                      onChange={handleChange}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Image Source</label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <label style={{ color: 'white' }}>
                        <input
                          type="radio"
                          name="imageSource"
                          value="url"
                          checked={formData.imageSource === 'url'}
                          onChange={handleChange}
                          style={{ marginRight: '0.5rem' }}
                        />
                        URL
                      </label>
                      <label style={{ color: 'white' }}>
                        <input
                          type="radio"
                          name="imageSource"
                          value="local"
                          checked={formData.imageSource === 'local'}
                          onChange={handleChange}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Local File
                      </label>
                    </div>
                  </div>

                  {formData.imageSource === 'url' ? (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Image URL</label>
                      <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        style={styles.formInput}
                        required
                      />
                    </div>
                  ) : (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={styles.formInput}
                        required
                      />
                    </div>
                  )}

                  <h3 style={{ color: 'white', marginTop: '1.5rem' }}>Player Stats</h3>
                  <div style={styles.statsGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Age</label>
                      <input
                        type="number"
                        name="stats.age"
                        value={formData.stats.age}
                        onChange={handleChange}
                        style={styles.formInput}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Innings</label>
                      <input
                        type="number"
                        name="stats.inns"
                        value={formData.stats.inns}
                        onChange={handleChange}
                        style={styles.formInput}
                        required
                      />
                    </div>

                    {(formData.category === 'Batting' || formData.category === 'All Rounder') && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Runs</label>
                          <input
                            type="number"
                            name="stats.runs"
                            value={formData.stats.runs}
                            onChange={handleChange}
                            style={styles.formInput}
                            required={formData.category === 'Batting'}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Batting Avg</label>
                          <input
                            type="number"
                            name="stats.avg"
                            value={formData.stats.avg}
                            onChange={handleChange}
                            style={styles.formInput}
                            step="0.01"
                            required={formData.category === 'Batting'}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Strike Rate</label>
                          <input
                            type="number"
                            name="stats.sr"
                            value={formData.stats.sr}
                            onChange={handleChange}
                            style={styles.formInput}
                            step="0.01"
                            required={formData.category === 'Batting'}
                          />
                        </div>
                      </>
                    )}

                    {(formData.category === 'Bowling' || formData.category === 'All Rounder') && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Wickets</label>
                          <input
                            type="number"
                            name="stats.wickets"
                            value={formData.stats.wickets}
                            onChange={handleChange}
                            style={styles.formInput}
                            required={formData.category === 'Bowling'}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Bowling Avg</label>
                          <input
                            type="number"
                            name="stats.avg"
                            value={formData.stats.avg}
                            onChange={handleChange}
                            style={styles.formInput}
                            step="0.01"
                            required={formData.category === 'Bowling'}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Economy</label>
                          <input
                            type="number"
                            name="stats.econ"
                            value={formData.stats.econ}
                            onChange={handleChange}
                            style={styles.formInput}
                            step="0.01"
                            required={formData.category === 'Bowling'}
                          />
                        </div>
                      </>
                    )}

                    {formData.category === 'Fielding' && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Matches</label>
                          <input
                            type="number"
                            name="stats.matches"
                            value={formData.stats.matches}
                            onChange={handleChange}
                            style={styles.formInput}
                            required
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Catches</label>
                          <input
                            type="number"
                            name="stats.catches"
                            value={formData.stats.catches}
                            onChange={handleChange}
                            style={styles.formInput}
                            required
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Run Outs</label>
                          <input
                            type="number"
                            name="stats.runOuts"
                            value={formData.stats.runOuts}
                            onChange={handleChange}
                            style={styles.formInput}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div style={styles.buttonGroup}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.submitButton}
                    >
                      {isEditing ? 'Update Player' : 'Add Player'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Winner25;