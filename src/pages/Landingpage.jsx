import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaUser, FaSearch, FaComment, FaTimes, FaPaperPlane, FaPlus, FaUpload } from "react-icons/fa";
import { Search } from 'lucide-react'; 
import Sidebar from "../components/sophita/HomePage/Sidebar";
import mImg from '../assets/sophita/HomePage/player.png';
import alike from '../assets/yogesh/login/heartafter.png';
import blike from '../assets/yogesh/login/heartbefore.png';
import share from '../assets/yogesh/login/share.png';
import fr1 from '../assets/yogesh/login/friends1.jpg';
import fr2 from '../assets/yogesh/login/friends2.jpg';
import comment from '../assets/yogesh/login/msg.png';
import SearchBar from '../components/yogesh/LandingPage/searcbar_aft';
import AIAssistance from "../components/sophita/HomePage/AIAssistance";
import { useNavigate } from "react-router-dom";
import { FaUserShield } from "react-icons/fa";

import { db, storage } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot, addDoc, arrayUnion, arrayRemove, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const Landingpage = ({ menuOpen, setMenuOpen, userProfile }) => {
  const navigate = useNavigate();
  const [likedVideos, setLikedVideos] = useState({});
  const [hovered, setHovered] = useState(null);
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [isPriceVisible, setIsPriceVisible] = useState(false);
  const [profileStoryVisible, setProfileStoryVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [profileImages, setProfileImages] = useState([]); 

  useEffect(() => {
    const initialProfileImages = [
      { id: 'user', image: userProfile?.profileImageUrl || 'path/to/default/image.png', name: userProfile?.userName || 'You' }, 
      { id: 1, image: fr1, name: 'Friend 1' },
      { id: 2, image: fr2, name: 'Friend 2' },
      { id: 3, image: fr1, name: 'Friend 3' }
    ];
    setProfileImages(initialProfileImages);
  }, [userProfile]); 

  const [editingProfileId, setEditingProfileId] = useState(null);
  const [activeTab, setActiveTab] = useState("forYou"); 
  
  const [showCommentBox, setShowCommentBox] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [showShareBox, setShowShareBox] = useState(null);
  const [commentsCount, setCommentsCount] = useState({});

  const [highlightsData, setHighlightsData] = useState([]); // Initialized as empty array
  const [followersData, setFollowersData] = useState([]); // Dynamic from Firestore
  const [reelsData, setReelsData] = useState([]); // Dynamic from Firestore

  // New states for stories
  const [userStories, setUserStories] = useState([]); // Current viewed user's stories
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0); // For autoplay
  const [showStoryUpload, setShowStoryUpload] = useState(false); // Modal for uploading
  const storyInputRef = useRef(null); // For file input

  const highlightRef = useRef(null);
  const searchBarRef = useRef(null);
  const fileInputRef = useRef(null);
  const reelInputRef = useRef(null);
  const commentRefs = useRef({});
  const shareRefs = useRef({});
  const stickyHeaderRef = useRef(null);

  const [isAIExpanded, setIsAIExpanded] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState('primary');
  const [messageInput, setMessageInput] = useState('');
  const searchRef = useRef(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const shareOptions = [
    { name: 'WhatsApp', icon: '📱' },
    { name: 'Facebook', icon: '👍' },
    { name: 'Twitter', icon: '🐦' },
    { name: 'Instagram', icon: '📷' },
    { name: 'Copy Link', icon: '🔗' }
  ];

  const chatData = {
    primary: [
      { id: 1, name: "Virat Kohli", lastMessage: "Hey, how's it going?", time: "2h", unread: true, avatar: "bg-blue-500" },
      { id: 2, name: "MS Dhoni", lastMessage: "Let's catch up soon", time: "1d", unread: false, avatar: "bg-green-500" }
    ],
    requests: [],
    general: []
  };

  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log("Message sent:", messageInput);
      setMessageInput('');
    }
  };

  // Comment handlers
  const handleCommentClick = async (highlight, e) => {
    e.stopPropagation();
    setSelectedHighlight(highlight);
    setShowCommentBox(showCommentBox === highlight.id ? null : highlight.id);
    setShowShareBox(null); 
    
    // Fetch comments from Firestore when opening
    const commentsRef = collection(db, "landingFeed", highlight.id, "comments");
    const commentsSnapshot = await getDocs(commentsRef);
    const fetchedComments = commentsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

    setComments(prev => ({
      ...prev,
      [highlight.id]: fetchedComments
    }));
  };

  const handleAddComment = async () => {
    if (newComment.trim() && selectedHighlight && userProfile) {
      const commentData = {
        text: newComment,
        timestamp: new Date(),
        user: userProfile.userName || "Anonymous"
      };

      const commentsRef = collection(db, "landingFeed", selectedHighlight.id, "comments");

      try {
        await addDoc(commentsRef, commentData);

        // Fetch comments again to refresh display
        const commentsSnapshot = await getDocs(commentsRef);
        const updatedComments = commentsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

        setComments(prev => ({
          ...prev,
          [selectedHighlight.id]: updatedComments
        }));

        // Update comment count
        setCommentsCount(prev => ({
          ...prev,
          [selectedHighlight.id]: updatedComments.length
        }));

        setNewComment('');
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    }
  };

  // Share handlers
  const handleShareClick = (highlight, e) => {
    e.stopPropagation();
    setSelectedHighlight(highlight);
    setShowShareBox(showShareBox === highlight.id ? null : highlight.id);
    setShowCommentBox(null); 
  };

  const handleShare = (platform) => {
    console.log(`Sharing ${selectedHighlight.title} via ${platform}`);
    setShowShareBox(null);
    alert(`Shared "${selectedHighlight.title}" via ${platform}`);
  };

  // Handle clicks outside comment/share boxes
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close comment box if clicked outside
      if (showCommentBox !== null) {
        const commentBox = commentRefs.current[showCommentBox];
        if (commentBox && !commentBox.contains(event.target)) {
          // Check if click was on the comment icon
          const commentIcon = document.querySelector(`.comment-icon-${showCommentBox}`);
          if (!commentIcon?.contains(event.target)) {
            setShowCommentBox(null);
          }
        }
      }
      
      // Close share box if clicked outside
      if (showShareBox !== null) {
        const shareBox = shareRefs.current[showShareBox];
        if (shareBox && !shareBox.contains(event.target)) {
          // Check if click was on the share icon
          const shareIcon = document.querySelector(`.share-icon-${showShareBox}`);
          if (!shareIcon?.contains(event.target)) {
            setShowShareBox(null);
          }
        }
      }
      
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        const messageIcon = document.querySelector('.message-icon');
        if (!messageIcon?.contains(event.target)) {
          setShowChat(false);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowSearch(false);
        setShowChat(false);
        setShowCommentBox(null);
        setShowShareBox(null);
      }
      if (event.key === 'Enter' && showChat && messageInput) {
        handleSendMessage();
      }
      if (event.key === 'Enter' && showCommentBox !== null && newComment) {
        handleAddComment();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [messageInput, newComment, showCommentBox, showShareBox]);

  // Fetch users for Following tab with firstName and profileImageUrl
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          firstName: doc.data().firstName || 'Unknown',
          profileImageUrl: doc.data().profileImageUrl || 'path/to/default/image.png', // Use profileImageUrl or fallback
          isFollowing: false // Will update based on current user's following
        }));
        
        // Fetch current user's following to set isFollowing
        if (userProfile?.uid) {
          const followingSnapshot = await getDocs(collection(db, "following", userProfile.uid, "myFollowing"));
          const followingIds = followingSnapshot.docs.map(doc => doc.id);
          users.forEach(user => {
            if (user.id !== userProfile.uid) { // Exclude current user from the list
              user.isFollowing = followingIds.includes(user.id);
            }
          });
        }
        
        // Filter out current user
        const filteredUsers = users.filter(user => user.id !== userProfile?.uid);
        setFollowersData(filteredUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [userProfile?.uid]);

  // Fetch reels for Reels tab from landingFeed
  useEffect(() => {
    const fetchReels = async () => {
      try {
        const reelsSnapshot = await getDocs(collection(db, "landingFeed"));
        const reels = reelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReelsData(reels);

        // Set likedVideos with likes count and check if liked by current user
        const likedState = {};
        for (const item of reels) {
          const likesRef = collection(db, "landingFeed", item.id, "likes");
          const likesSnapshot = await getDocs(likesRef);
          const likedByCurrentUser = likesSnapshot.docs.some(likeDoc => likeDoc.id === userProfile?.uid);
          likedState[item.id] = {
            count: likesSnapshot.size,
            liked: likedByCurrentUser,
          };
        }
        setLikedVideos(likedState);
      } catch (err) {
        console.error("Error fetching reels:", err);
      }
    };

    fetchReels();
  }, [userProfile?.uid]);

  // Fetch reels for For You tab: current user's and followed users'
  useEffect(() => {
    if (activeTab === 'forYou' && userProfile?.uid) {
      const fetchForYouReels = async () => {
        try {
          const followingSnapshot = await getDocs(collection(db, "following", userProfile.uid, "myFollowing"));
          const followedIds = followingSnapshot.docs.map(doc => doc.id);
          followedIds.push(userProfile.uid); // Include current user

          const q = query(collection(db, "landingFeed"), where("userId", "in", followedIds));
          const querySnapshot = await getDocs(q);
          const reels = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setHighlightsData(reels);

          // Set likedVideos with likes count and check if liked by current user
          const likedState = {};
          for (const item of reels) {
            const likesRef = collection(db, "landingFeed", item.id, "likes");
            const likesSnapshot = await getDocs(likesRef);
            const likedByCurrentUser = likesSnapshot.docs.some(likeDoc => likeDoc.id === userProfile?.uid);
            likedState[item.id] = {
              count: likesSnapshot.size,
              liked: likedByCurrentUser,
            };
          }
          setLikedVideos(likedState);
        } catch (err) {
          console.error("Error fetching For You reels:", err);
        }
      };
      fetchForYouReels();
    }
  }, [activeTab, userProfile?.uid]);

  // Fetch comments counts for all highlights
  useEffect(() => {
    const fetchCommentsCounts = async () => {
      try {
        const counts = {};
        for (const item of highlightsData) {
          const commentsRef = collection(db, "landingFeed", item.id, "comments");
          const snapshot = await getDocs(commentsRef);
          counts[item.id] = snapshot.size;
        }
        setCommentsCount(counts);
      } catch (err) {
        console.error("Error fetching comments counts:", err);
      }
    };

    if (highlightsData.length) fetchCommentsCounts();
  }, [highlightsData]);

  // Like toggle with Firestore update
  const toggleLike = async (id) => {
    if (!userProfile?.uid) return;

    const docRef = doc(db, "landingFeed", id, "likes", userProfile.uid);

    // Get current state
    const isLiked = likedVideos[id]?.liked || false;

    // Optimistically update UI
    setLikedVideos(prev => ({
      ...prev,
      [id]: {
        liked: !isLiked,
        count: isLiked ? (prev[id]?.count || 0) - 1 : (prev[id]?.count || 0) + 1,
      }
    }));

    try {
      if (isLiked) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { likedAt: new Date() });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      // Rollback UI
      setLikedVideos(prev => ({
        ...prev,
        [id]: {
          liked: isLiked,
          count: isLiked ? (prev[id]?.count || 0) + 1 : (prev[id]?.count || 0) - 1,
        }
      }));
    }
  };

  const togglePriceVisibility = (e) => {
    e.preventDefault();
    setIsPriceVisible((prev) => {
      const next = !prev;
      if (next) setHighlightVisible(true);
      return next;
    });
  };

  useEffect(() => {
    const highlightEl = highlightRef.current;

    const showHighlightOnScroll = () => {
      if (highlightEl && highlightEl.scrollTop > 0) {
        setHighlightVisible(true);
      }
    };

    if (highlightEl) {
      highlightEl.addEventListener("scroll", showHighlightOnScroll);
    }

    const timeoutId = setTimeout(() => {
      setHighlightVisible(true);
    }, 3000);

    return () => {
      if (highlightEl) {
        highlightEl.removeEventListener("scroll", showHighlightOnScroll);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (highlightVisible && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [highlightVisible]);

  const handleMainClick = (e) => {
    if (
      isPriceVisible ||
      profileStoryVisible ||
      e.target.closest('#user-profile-image-container') || 
      (highlightRef.current && highlightRef.current.contains(e.target)) ||
      (stickyHeaderRef.current && stickyHeaderRef.current.contains(e.target)) ||
      (searchBarRef.current && searchBarRef.current.contains(e.target)) ||
      e.target === fileInputRef.current ||
      e.target === reelInputRef.current ||
      (commentRefs.current && Object.values(commentRefs.current).some(ref => ref && ref.contains(e.target))) ||
      (shareRefs.current && Object.values(shareRefs.current).some(ref => ref && ref.contains(e.target))) ||
      e.target.closest('.message-icon') ||
      e.target.closest('.profile-story-modal-content') ||
      (isAIExpanded && e.target.closest('.ai-assistance-container')) ||
      e.target.closest('#cricklytics-title') 
    ) {
      return;
    }
    setHighlightVisible(false);
    setShowCommentBox(null); 
    setShowShareBox(null); 
  };

  // Fetch stories for a user, filtering active stories < 24h
  const fetchStories = async (targetUserId) => {
    if (!targetUserId) return;
    try {
      const storiesRef = collection(db, "landingStories", targetUserId, "items");
      const q = query(storiesRef, where("timestamp", ">", Date.now() - 24*60*60*1000));
      const snapshot = await getDocs(q);
      let stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      stories = stories.sort((a,b) => a.timestamp - b.timestamp);
      setUserStories(stories);
      setCurrentStoryIndex(0);
    } catch (err) {
      console.error("Error fetching stories:", err);
      setUserStories([]);
    }
  };

  // Handle profile click: fetch stories for selected user
  const handleProfileClick = (profile) => {
    setSelectedProfile(profile);
    setProfileStoryVisible(true);
    fetchStories(profile.id === 'user' ? userProfile.uid : profile.id);
  };

  // Story upload handler
  const handleStoryUpload = async (files) => {
    if (!userProfile?.uid || !files.length) return;

    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video');
        const path = isVideo ? `stories/videos/${userProfile.uid}/${file.name}` : `stories/images/${userProfile.uid}/${file.name}`;
        const storageRefPath = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRefPath, file);

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', null, reject, async () => {
            const mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db,"landingStories", userProfile.uid, "items"), {
              mediaUrl,
              type: isVideo ? 'video' : 'image',
              timestamp: Date.now(),
            });
            resolve();
          });
        });
      }
      setShowStoryUpload(false);
      fetchStories(userProfile.uid);
    } catch (err) {
      console.error("Error uploading story:", err);
    }
  };

  // Autoplay stories effect
  useEffect(() => {
    if (!profileStoryVisible || userStories.length === 0) return;

    let timer;
    const currStory = userStories[currentStoryIndex];

    if (!currStory) return;

    if (currStory.type === 'image') {
      timer = setTimeout(() => {
        const nextIndex = (currentStoryIndex + 1) % userStories.length;
        setCurrentStoryIndex(nextIndex);
        if (nextIndex === 0) setProfileStoryVisible(false);
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [currentStoryIndex, userStories, profileStoryVisible]);

  const handleAddImageClick = (e, profileId) => {
    e.stopPropagation();
    setEditingProfileId(profileId);
    fileInputRef.current.click();
    setHighlightVisible(true);
  };

  // Updated handleReelUploadClick to prompt for video, caption, or URL
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reelFile, setReelFile] = useState(null);
  const [reelThumbnail, setReelThumbnail] = useState(null);
  const [reelTitle, setReelTitle] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [reelUrl, setReelUrl] = useState('');

  const handleReelUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleReelUpload = async () => {
    if (!userProfile?.uid) return;
    let videoUrl = reelUrl;
    let thumbnailUrl = null;

    if (reelFile) {
      const storageRef = ref(storage, `reels/${userProfile.uid}/${reelFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, reelFile);
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve();
        });
      });
    }

    if (reelThumbnail) {
      const thumbnailRef = ref(storage, `thumbnails/${userProfile.uid}/${reelThumbnail.name}`);
      const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, reelThumbnail);
      await new Promise((resolve, reject) => {
        thumbnailUploadTask.on('state_changed', null, reject, async () => {
          thumbnailUrl = await getDownloadURL(thumbnailUploadTask.snapshot.ref);
          resolve();
        });
      });
    }

    if (videoUrl) {
      await addDoc(collection(db, "landingFeed"), {
        userId: userProfile.uid,
        videoUrl,
        title: reelTitle,
        caption: reelCaption,
        thumbnailUrl,
        likes: 0,
        createdAt: new Date()
      });
      setShowUploadModal(false);
      setReelFile(null);
      setReelThumbnail(null);
      setReelTitle('');
      setReelCaption('');
      setReelUrl('');
      // Refresh reels
      const reelsSnapshot = await getDocs(collection(db, "landingFeed"));
      setReelsData(reelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = event.target.result;
        setProfileImages(prev => prev.map(profile =>
          profile.id === editingProfileId
            ? { ...profile, image: newImage }
            : profile
        ));
      };
      reader.readAsDataURL(file);
    }
    setEditingProfileId(null);
  };

  // Updated toggleFollow to use Firestore
  const toggleFollow = async (id) => {
    if (!userProfile?.uid) return;
    const targetUser = followersData.find(f => f.id === id);
    if (!targetUser) return;

    const followingRef = doc(db, "following", userProfile.uid, "myFollowing", id);
    if (targetUser.isFollowing) {
      await deleteDoc(followingRef);
    } else {
      await setDoc(followingRef, { uid: id, followedAt: new Date() });
    }

    // Update local state
    setFollowersData(prev => 
      prev.map(follower => 
        follower.id === id 
          ? { ...follower, isFollowing: !follower.isFollowing } 
          : follower
      )
    );
  };

  const toggleHighlightVisibility = () => {
    setHighlightVisible(prev => !prev);
  };

  return (
    <div className="bg-[#02101E]">
      <div
        id="main"
        onClick={handleMainClick}
        className={`fixed inset-0 z-10 bg-[#02101E] transition-all duration-700 ease-in-out ${highlightVisible ? "bg-opacity-40 backdrop-blur-md" : ""}`}
      >
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={reelInputRef}
          onChange={(e) => setReelFile(e.target.files[0])}
          accept="video/*"
          style={{ display: 'none' }}
        />
        {/* Story Upload Hidden Input */}
        <input
          type="file"
          ref={storyInputRef}
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleStoryUpload(Array.from(e.target.files))}
        />

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-opacity-60 backdrop-blur-md z-[9999]">
            <div className="bg-gradient-to-b from-[#0D171E] to-[#283F79] p-6 rounded-lg shadow-lg w-[90%] md:w-[70%] lg:w-[28%] max-w-lg">
              <button
                className="absolute top-4 right-4 text-2xl text-white cursor-pointer"
                onClick={() => setShowUploadModal(false)}
              >
                X
              </button>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Title (required)"
                  value={reelTitle}
                  onChange={(e) => setReelTitle(e.target.value)}
                  className="bg-transparent border border-white p-2 rounded"
                />
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setReelFile(e.target.files[0])}
                />
                <input
                  type="text"
                  placeholder="Or enter video URL"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  className="bg-transparent border border-white p-2 rounded"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReelThumbnail(e.target.files[0])}
                />
                <input
                  type="text"
                  placeholder="Caption"
                  value={reelCaption}
                  onChange={(e) => setReelCaption(e.target.value)}
                  className="bg-transparent border border-white p-2 rounded"
                />
                <button
                  onClick={handleReelUpload}
                  className="bg-[#5DE0E6] text-white p-2 rounded"
                  disabled={!reelTitle.trim()}
                >
                  Upload Reel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Story Modal */}
        {profileStoryVisible && selectedProfile && (
          <div className="fixed inset-0 flex justify-center items-center bg-opacity-60 backdrop-blur-md z-[9999]">
            <div className="bg-gradient-to-b from-[#0D171E] to-[#283F79] p-6 rounded-lg shadow-lg w-[90%] md:w-[70%] lg:w-[28%] max-w-lg">
              <button
                className="absolute top-4 right-4 text-2xl text-white cursor-pointer"
                onClick={() => setProfileStoryVisible(false)}
              >
                X
              </button>
              <div className="flex justify-center items-center flex-col">
                <div className="flex w-full h-fit px-2 gap-5 items-center">
                  <img
                    src={selectedProfile.image}
                    alt="Profile"
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-white text-xl md:text-2xl">{selectedProfile.name}</h2>
                      {selectedProfile.id === 'user' && (
                        <button
                          className="text-white text-2xl font-bold"
                          onClick={() => {
                            setShowStoryUpload(true);
                            storyInputRef.current.click();
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>
                    <p className="text-white mt-2 text-sm md:text-base">Viewing story...</p>
                  </div>
                </div>
                
                {/* Story Display Area */}
                <div className="w-full h-64 md:h-96 rounded-lg bg-yellow-300 m-3 md:m-5 relative overflow-hidden">
                  {userStories.length > 0 ? (
                    <>
                      {userStories[currentStoryIndex].type === 'image' ? (
                        <img
                          src={userStories[currentStoryIndex].mediaUrl}
                          alt="Story"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={userStories[currentStoryIndex].mediaUrl}
                          autoPlay
                          onEnded={() => {
                            const nextIndex = (currentStoryIndex + 1) % userStories.length;
                            setCurrentStoryIndex(nextIndex);
                            if (nextIndex === 0) setProfileStoryVisible(false); // Close after full cycle
                          }}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </>
                  ) : (
                    <p className="text-white text-center py-20">No active stories</p>
                  )}
                </div>
                
                <div className="w-full flex justify-between items-center gap-3 md:gap-5">
                  <input
                    type="text"
                    placeholder="Reply"
                    className="bg-transparent border border-white border-[2px] h-8 md:h-10 rounded-3xl text-white w-full pl-3 md:pl-5 text-sm md:text-base"
                  />
                  <button
                    className="w-fit p-1 px-2 md:px-3 text-center rounded-2xl text-sm md:text-xl text-white cursor-pointer bg-[linear-gradient(120deg,_#000000,_#001A80)]"
                    onClick={() => setProfileStoryVisible(false)}
                  >
                    send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navbar */}
        <nav className="fixed top-0 z-[1000] h-20 md:h-30 flex w-full items-center justify-between bg-gradient-to-b from-[#02101E] to-[#040C15] px-3 md:px-5 py-2 text-white">
          <div className="flex items-center">
            <button
              className="mt-4 md:mt-6 flex cursor-pointer flex-col gap-1 p-1 md:p-2.5"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
            >
              <div className="h-0.5 md:h-1 w-6 md:w-10 rounded bg-white"></div>
              <div className="h-0.5 md:h-1 w-4 md:w-8 rounded bg-white"></div>
              <div className="h-0.5 md:h-1 w-3 md:w-5 rounded bg-white"></div>
            </button>
            <span
              id="cricklytics-title" 
              className="ml-4 md:ml-8 mt-4 md:mt-6 text-xl md:text-3xl font-bold cursor-pointer select-none" onClick={toggleHighlightVisibility} >Cricklytics</span>
          </div>

          <div className="fixed inset-0 -z-10 flex items-center justify-center">
            <img
              src={mImg}
              alt="Player"
              className={`h-full w-full -z-[-989] object-contain transition-all duration-300 ${highlightVisible ? "blur-md brightness-75" : ""}`}
            />
          </div>

          <div className="mt-1 md:mt-9 flex items-center gap-4 md:gap-8">
            <div className="z-[2000] mt-9 md:mt-5 h-16 md:h-22 w-fit">
              <button
                className="w-8 h-8 md:w-14 md:h-14 rounded-full border-4 border-cyan-500 flex items-center justify-center"
                onClick={() => navigate("/search-aft")}
              >
                <Search className="text-white w-4 h-4 md:w-6 md:h-6" />
              </button>
            </div>
            <div>
              <button
                className="text-sm md:text-2xl font-bold cursor-pointer hover:text-[#3edcff]"
                onClick={() => navigate("/contacts")}
              >
                Contacts
              </button>
            </div>
            <FaBell className="cursor-pointer hover:scale-110" size={24} />

            {/* Message Icon */}
            <div className="relative">
              <FaComment
                className="message-icon cursor-pointer text-white transition-transform duration-200 hover:scale-110"
                size={24}
                onClick={() => navigate('/message')}
              />
            </div>
          </div>
        </nav>

        <Sidebar isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

        {/* Content */}
        <div
          className={`absolute z-[1010] flex flex-col items-center p-2 md:p-[1rem] transition-all duration-700 ease-in-out ${
            highlightVisible ? "top-16 md:top-23" : "top-[50%]"
          } w-full ${isAIExpanded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <div ref={stickyHeaderRef} className={`sticky w-full md:w-[80%] top-0 z-20 bg-[rgba(2,16,30,0.7)] bg-opacity-40 backdrop-blur-md pb-2 md:pb-4 ${highlightVisible && !showChat ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="w-full flex justify-center pt-2 md:pt-4 caret-none">
              <div className="w-full md:w-[50%] flex justify-center gap-2 md:gap-3 md:ml-5 text-white text-sm md:text-xl">
                {userProfile && (
                  <div key={userProfile.uid} className="relative profile-image-container" id="user-profile-image-container">
                    <button
                      className="w-13 h-13 md:w-20 md:h-20 rounded-full bg-cover bg-center border-2 border-white"
                      style={{
                        backgroundImage: userProfile.profileImageUrl
                          ? `url(${userProfile.profileImageUrl})`
                          : 'url(path/to/default/image.png)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick({ id: 'user', image: userProfile.profileImageUrl || 'path/to/default/image.png', name: userProfile.userName || 'You' });
                      }}
                    >
                    </button>
                    {!userProfile.profileImageUrl && (
                      <button
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full pb-2 bg-gray-800 flex items-center justify-center text-xl text-white font-bold"
                        onClick={(e) => handleAddImageClick(e, 'user')}
                      >
                        +
                      </button>
                    )}
                  </div>
                )}
                {/* Display followed users' profile images dynamically */}
                {followersData.filter(f => f.isFollowing).map((follower) => (
                  <div key={follower.id} className="relative profile-image-container">
                    <button
                      className="w-13 h-13 md:w-20 md:h-20 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${follower.profileImageUrl})` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick({ id: follower.id, image: follower.profileImageUrl, name: follower.firstName });
                      }}
                    ></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="w-full flex justify-center mt-2 md:mt-4">
              <div className="w-full md:w-[50%] flex justify-around text-white text-sm md:text-xl underline cursor-pointer">
                <span 
                  className={`text-base md:text-2xl font-bold hover:text-[#800080] ${activeTab === 'forYou' ? 'text-[#800080]' : ''}`}
                  onClick={() => setActiveTab('forYou')}
                >
                  Following
                </span>
                <span 
                  className={`text-base md:text-2xl font-bold hover:text-[#800080] ${activeTab === 'following' ? 'text-[#800080]' : ''}`}
                  onClick={() => setActiveTab('following')}
                >
                  People You May Know
                </span>
                <span 
                  className={`text-base md:text-2xl font-bold hover:text-[#800080] ${activeTab === 'reels' ? 'text-[#800080]' : ''}`}
                  onClick={() => setActiveTab('reels')}
                >
                  For You
                </span>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          <div
            id="highlight"
            ref={highlightRef}
            className={`transition-opacity duration-700 ease-in-out mt-4 md:mt-0 flex flex-col md:flex-row md:flex-wrap justify-center items-center w-full h-full overflow-y-auto scrollbar-hide gap-4 md:gap-6 px-2 md:px-4 ${highlightVisible && !isAIExpanded ? "opacity-100" : "opacity-0"} flex-grow`}
          >
            {activeTab === 'forYou' && (
              highlightsData.length > 0 ? highlightsData.map((item) => (
                <div
                  key={item.id}
                  className="relative flex flex-col w-full sm:w-[95%] md:w-[48%] lg:w-[32%] bg-gradient-to-b from-[#0A5F68] to-[#000000] rounded-3xl md:rounded-3xl mx-2 md:mx-10 my-4 md:my-6 shadow-lg md:shadow-2xl border border-white/20 group cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  {/* Video container with fixed aspect ratio and local overflow control */}
                  <div className="relative w-full aspect-video overflow-hidden rounded-3xl md:rounded-3xl">
                    <iframe
                      src={item.videoUrl}
                      title={`Highlight ${item.title}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full brightness-125"
                    />
                  </div>

                  {/* Title and actions below the video */}
                  <div className="p-2 md:p-3 bg-gradient-to-b from-[#0A5F68] to-[#000000] rounded-b-3xl md:rounded-b-3xl">
                    <h3 className="text-white text-base md:text-lg font-bold m-0">
                      {item.title}
                    </h3>
                    <div className="flex justify-evenly items-center mt-2 mb-1 md:mb-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }} 
                        className="z-10 flex items-center"
                      >
                        <img src={likedVideos[item.id]?.liked ? alike : blike} alt="Like" className="w-6 h-6 md:w-8 md:h-8" />
                        <span className="text-white text-sm md:text-base ml-1">{likedVideos[item.id]?.count || 0}</span>
                      </button>
                      
                      {/* Comment Button and Box */}
                      <div className="relative">
                        <button 
                          onClick={(e) => handleCommentClick(item, e)}
                          className={`comment-icon-${item.id} flex items-center`}
                        >
                          <img src={comment} alt="Comment" className="w-6 h-6 md:w-8 md:h-8 z-10" />
                          <span className="text-white text-sm md:text-base ml-1">{commentsCount[item.id] || 0}</span>
                        </button>
                        
                        {showCommentBox === item.id && (
                          <div 
                            ref={el => commentRefs.current[item.id] = el}
                            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-64 bg-[#0D171E] rounded-lg shadow-xl z-50 border border-gray-700 p-3"
                          >
                            <div className="max-h-40 overflow-y-auto mb-2">
                              {comments[item.id]?.length > 0 ? (
                                comments[item.id].map(comment => (
                                  <div key={comment.id} className="mb-2 pb-2 border-b border-gray-700">
                                    <p className="text-white text-sm">{comment.text}</p>
                                    <p className="text-gray-400 text-xs">{comment.user}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-400 text-sm">No comments yet</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1"
                              />
                              <button
                                onClick={handleAddComment}
                                className="bg-[#5DE0E6] text-white px-2 rounded text-sm"
                                disabled={!newComment.trim()}
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Share Button and Box */}
                      <div className="relative">
                        <button 
                          onClick={(e) => handleShareClick(item, e)}
                          className={`share-icon-${item.id}`}
                        >
                          <img src={share} alt="Share" className="w-6 h-6 md:w-8 md:h-8 z-7" />
                        </button>
                        
                        {showShareBox === item.id && (
                          <div 
                            ref={el => shareRefs.current[item.id] = el}
                            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-48 bg-[#0D171E] rounded-lg shadow-xl z-50 border border-gray-700 p-3"
                          >
                            <h4 className="text-white text-sm mb-2">Share via</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {shareOptions.map(option => (
                                <button
                                  key={option.name}
                                  onClick={() => handleShare(option.name)}
                                  className="flex flex-col items-center p-2 hover:bg-gray-800 rounded"
                                >
                                  <span className="text-lg">{option.icon}</span>
                                  <span className="text-white text-xs">{option.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-white mt-10 text-center">No highlights yet. Please add some!</p>
              )
            )}

            {activeTab === 'following' && (
              <div className="w-full p-4 overflow-y-auto">
                <h2 className="text-white text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center md:text-left">People You Follow</h2>
                <div className="flex flex-col gap-4">
                  {followersData.map(follower => (
                    <div key={follower.id} className="bg-[#0D171E] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <img 
                          src={follower.profileImageUrl} 
                          alt={follower.firstName}
                          className="w-12 h-12 rounded-full object-cover mr-0 sm:mr-4"
                        />
                        <div>
                          <h3 className="text-white font-semibold text-center sm:text-left">{follower.firstName}</h3>
                          <p className="text-gray-400 text-sm text-center sm:text-left">
                            {follower.isFollowing ? "Following" : "Not Following"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFollow(follower.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium w-full sm:w-auto mt-2 sm:mt-0 ${
                          follower.isFollowing 
                            ? "bg-gray-700 text-white hover:bg-gray-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {follower.isFollowing ? "Unfollow" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reels' && (
              <div className="w-full px-2 md:px-4">
                {/* Upload Reel Button */}
                <div className="p-4 flex justify-center">
                  <button
                    onClick={handleReelUploadClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
                  >
                    <FaUpload />
                    Upload Reel
                  </button>
                </div>

                {/* Reels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {reelsData.map(reel => (
                    <div key={reel.id} className="bg-[#0D171E] rounded-xl overflow-hidden shadow-lg">
                      <div className="relative pt-[177.78%]">
                        <iframe
                          src={reel.videoUrl}
                          title={reel.title || reel.caption}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full"
                        ></iframe>
                      </div>
                      <div className="p-3 md:p-4">
                        <h3 className="text-white font-semibold mb-2 text-base md:text-lg">{reel.title || reel.caption}</h3>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <button onClick={() => toggleLike(reel.id)} className="mr-2 flex items-center">
                              <img src={likedVideos[reel.id]?.liked ? alike : blike} alt="Like" className="w-5 h-5 md:w-6 md:h-6" />
                              <span className="text-white text-sm ml-1">{likedVideos[reel.id]?.count || 0}</span>
                            </button>
                          </div>
                          <div className="flex gap-3">
                            <button className="text-white flex items-center">
                              <img src={comment} alt="Comment" className="w-5 h-5 md:w-6 md:h-6" />
                              <span className="text-white text-sm ml-1">{commentsCount[reel.id] || 0}</span>
                            </button>
                            <button className="text-white">
                              <img src={share} alt="Share" className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      <AIAssistance
        isAIExpanded={isAIExpanded}
        setIsAIExpanded={setIsAIExpanded}
      />
    </div>
  );
};

export default Landingpage;
