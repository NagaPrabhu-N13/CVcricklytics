import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaUser, FaSearch, FaComment, FaTimes, FaPaperPlane, FaPlus, FaUpload, FaTrash, FaArrowLeft, FaArrowRight } from "react-icons/fa";
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
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot, addDoc, arrayUnion, arrayRemove, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";

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

  const [highlightsData, setHighlightsData] = useState([]); 
  const [followersData, setFollowersData] = useState([]); 
  const [reelsData, setReelsData] = useState([]); 

  const [userStories, setUserStories] = useState([]); 
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0); 
  const [showStoryUpload, setShowStoryUpload] = useState(false); 
  const storyInputRef = useRef(null); 

  const [selectedStoryMedia, setSelectedStoryMedia] = useState([]);
  const [storyMentions, setStoryMentions] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]); 
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

  const [storyReply, setStoryReply] = useState('');

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

  const [followingSearchTerm, setFollowingSearchTerm] = useState('');

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

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState(null);

  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const [postCount, setPostCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);

  const auth = getAuth();

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

  const handleCommentClick = async (highlight, e) => {
    e.stopPropagation();
    setSelectedHighlight(highlight);
    setShowCommentBox(showCommentBox === highlight.id ? null : highlight.id);
    setShowShareBox(null); 
    
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

        const commentsSnapshot = await getDocs(commentsRef);
        const updatedComments = commentsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

        setComments(prev => ({
          ...prev,
          [selectedHighlight.id]: updatedComments
        }));

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCommentBox !== null) {
        const commentBox = commentRefs.current[showCommentBox];
        if (commentBox && !commentBox.contains(event.target)) {
          const commentIcon = document.querySelector(`.comment-icon-${showCommentBox}`);
          if (!commentIcon?.contains(event.target)) {
            setShowCommentBox(null);
          }
        }
      }
      
      if (showShareBox !== null) {
        const shareBox = shareRefs.current[showShareBox];
        if (shareBox && !shareBox.contains(event.target)) {
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          firstName: doc.data().firstName || 'Unknown',
          profileImageUrl: doc.data().profileImageUrl || '',
          isFollowing: false
        }));
        
        if (userProfile?.uid) {
          const followingSnapshot = await getDocs(collection(db, "following", userProfile.uid, "myFollowing"));
          const followingIds = followingSnapshot.docs.map(doc => doc.id);
          users.forEach(user => {
            if (user.id !== userProfile.uid) {
              user.isFollowing = followingIds.includes(user.id);
            }
          });
        }
        
        const filteredUsers = users.filter(user => user.id !== userProfile?.uid);
        setFollowersData(filteredUsers);
        setAvailableUsers(filteredUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [userProfile?.uid]);

  const fetchReels = async () => {
    if (!userProfile?.uid) return;
    try {
      const q = query(collection(db, "landingFeed"), where("userId", "==", userProfile.uid));
      const reelsSnapshot = await getDocs(q);
      const reels = reelsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReelsData(reels);

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
  useEffect(() => {
    fetchReels();
  }, [userProfile?.uid]);

  useEffect(() => {
    if (activeTab === 'forYou' && userProfile?.uid) {
      const fetchForYouReels = async () => {
        try {
          const followingSnapshot = await getDocs(collection(db, "following", userProfile.uid, "myFollowing"));
          const followedIds = followingSnapshot.docs.map(doc => doc.id);
          followedIds.push(userProfile.uid);
          const q = query(collection(db, "landingFeed"), where("userId", "in", followedIds));
          const querySnapshot = await getDocs(q);
          const reels = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setHighlightsData(reels);
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

  const toggleLike = async (id) => {
    if (!userProfile?.uid) return;

    const docRef = doc(db, "landingFeed", id, "likes", userProfile.uid);

    const isLiked = likedVideos[id]?.liked || false;

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

  const handleProfileClick = (profile) => {
    setSelectedProfile(profile);
    setProfileStoryVisible(true);
    fetchStories(profile.id === 'user' ? userProfile.uid : profile.id);
  };

  const handleStoryMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedStoryMedia(files);
    setStoryMentions('');
    setMentionSuggestions([]);
    setShowStoryUpload(true);
  };

  const handleStoryUpload = async () => {
    if (!userProfile?.uid || !selectedStoryMedia.length) return;

    try {
      const mentionsArray = storyMentions.split('#').filter(m => m.trim());

      for (const file of selectedStoryMedia) {
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
              mentions: mentionsArray
            });
            resolve();
          });
        });
      }

      for (const mention of mentionsArray) {
        const trimmedMention = mention.trim();
        console.log(`Processing mention: "${trimmedMention}"`);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("firstName", "==", trimmedMention));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const mentionedUserDoc = querySnapshot.docs[0];
          const mentionedUser = { id: mentionedUserDoc.id, ...mentionedUserDoc.data() };

          console.log("✅ Mentioned user found:", mentionedUser);

          const recipientId = mentionedUser.id;
          const currentUserId = userProfile.uid;

          const generateChatId = (uid1, uid2) => {
            return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
          };
          const chatId = generateChatId(currentUserId, recipientId);
          const chatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(chatRef);
          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              participants: [currentUserId, recipientId],
              lastMessage: "",
              lastUpdated: serverTimestamp()
            });
          }
          await addDoc(collection(db, "chats", chatId, "messages"), {
            senderId: currentUserId,
            text: "Mentioned You in their Story",
            createdAt: serverTimestamp(),
            read: false
          });

          await setDoc(chatRef, {
            lastMessage: "Mentioned You in their Story",
            lastUpdated: serverTimestamp()
          }, { merge: true });

        } else {
          console.warn(`❌ No user found in Firestore with firstName: "${trimmedMention}"`);
        }
      }

      setShowStoryUpload(false);
      setSelectedStoryMedia([]);
      setStoryMentions('');
      setMentionSuggestions([]);
      fetchStories(userProfile.uid);
    } catch (err) {
      console.error("Error uploading story:", err);
    }
  };

  const handleMentionChange = (e) => {
    const text = e.target.value;
    setStoryMentions(text);

    const matches = text.match(/#(\w*)$/);
    if (matches) {
      const fragment = matches[1].toLowerCase();
      const suggestions = availableUsers
        .filter(user => user.firstName.toLowerCase().startsWith(fragment))
        .map(user => user.firstName);
      setMentionSuggestions(suggestions);
    } else {
      setMentionSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const text = storyMentions.replace(/#(\w*)$/, `#${suggestion} `);
    setStoryMentions(text);
    setMentionSuggestions([]);
  };

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

  const handleUploadReelClick = () => {
    reelInputRef.current.click();
  };

  const handleReelInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedMedia(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setMediaPreview(URL.createObjectURL(file));
      setDescription('');
      setShowUploadModal(true);
    }
  };

  const handleUploadReel = async () => {
    if (!selectedMedia || !description.trim() || !userProfile?.uid) return;

    try {
      const isVideo = selectedMedia.type.startsWith('video/');
      const storagePath = isVideo ? `reels/videos/${userProfile.uid}/${selectedMedia.name}` : `reels/images/${userProfile.uid}/${selectedMedia.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedMedia);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          const mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, "landingFeed"), {
            userId: userProfile.uid,
            mediaUrl,
            type: isVideo ? 'video' : 'image',
            description,
            createdAt: new Date()
          });
          resolve();
        });
      });
      await fetchReels();
      setShowUploadModal(false);
      setSelectedMedia(null);
      setMediaPreview(null);
      setDescription('');
      setMediaType(null);
    } catch (error) {
      console.error('Error uploading reel:', error);
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    try {
      await deleteDoc(doc(db, "landingFeed", reelId));
      await fetchReels();
    } catch (error) {
      console.error("Error deleting reel:", error);
    }
  };

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  const toggleFollow = async (id) => {
    if (!userProfile?.uid) return;
    const targetUser = followersData.find(f => f.id === id);
    if (!targetUser) return;

    const myFollowingRef = doc(db, "following", userProfile.uid, "myFollowing", id);
    const theirFollowersRef = doc(db, "followers", id, "myFollowers", userProfile.uid);

    if (targetUser.isFollowing) {
      await deleteDoc(myFollowingRef);
      await deleteDoc(theirFollowersRef);
    } else {
      await setDoc(myFollowingRef, { uid: id, followedAt: new Date() });
      await setDoc(theirFollowersRef, { uid: userProfile.uid, followedAt: new Date() });
    }

    setFollowersData(prev => 
      prev.map(follower => 
        follower.id === id 
          ? { ...follower, isFollowing: !follower.isFollowing } 
          : follower
      )
    );
  };

  const handleSendStoryReply = async (storyOwnerId) => {
    if (!storyReply.trim() || !userProfile?.uid) return;

    const currentUserId = userProfile.uid;
    const recipientId = storyOwnerId;

    const generateChatId = (uid1, uid2) => {
      return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    };

    const chatId = generateChatId(currentUserId, recipientId);

    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [currentUserId, recipientId],
          lastMessage: "",
          lastUpdated: serverTimestamp()
        });
      }

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUserId,
        text: `Reply to your story: ${storyReply}`,
        createdAt: serverTimestamp(),
        read: false
      });

      await setDoc(chatRef, {
        lastMessage: `Reply to your story: ${storyReply}`,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      setStoryReply('');
      alert('Reply sent successfully!');
    } catch (err) {
      console.error("Error sending story reply:", err);
    }
  };

  const handlePrevStory = () => {
    setCurrentStoryIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextStory = () => {
    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < userStories.length) {
      setCurrentStoryIndex(nextIndex);
    } else {
      setProfileStoryVisible(false);
    }
  };

  const toggleHighlightVisibility = () => {
    setHighlightVisible(prev => !prev);
  };

  useEffect(() => {
    if (activeTab === 'profile' && userProfile?.uid) {
      const fetchProfileData = async () => {
        try {
          const postsQuery = query(collection(db, "landingFeed"), where("userId", "==", userProfile.uid));
          const postsSnapshot = await getDocs(postsQuery);
          setPostCount(postsSnapshot.size);

          const followingSnapshot = await getDocs(collection(db, "following", userProfile.uid, "myFollowing"));
          setFollowingCount(followingSnapshot.size);

          const followersSnapshot = await getDocs(collection(db, "followers", userProfile.uid, "myFollowers"));
          setFollowersCount(followersSnapshot.size);
        } catch (err) {
          console.error("Error fetching profile data:", err);
        }
      };
      fetchProfileData();
    }
  }, [activeTab, userProfile?.uid]);

  return (
    <div className="bg-[#02101E]">
      <div
        id="main"
        onClick={handleMainClick}
        className={`fixed inset-0 z-10 bg-[#02101E] transition-all duration-700 ease-in-out ${highlightVisible ? "bg-opacity-40 backdrop-blur-md" : ""}`}
      >
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
          style={{ display: 'none' }}
          accept="video/*,image/*"
          onChange={handleReelInputChange}
        />
        <input
          type="file"
          ref={storyInputRef}
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleStoryMediaSelect}
        />

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
                <h2 className="text-white text-xl">Add Description</h2>
                {mediaPreview && (
                  <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
                    )}
                  </div>
                )}
                <textarea
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-transparent border border-white p-2 rounded h-24 text-white"
                />
                <button
                  onClick={handleUploadReel}
                  className="bg-[#5DE0E6] text-white p-2 rounded"
                  disabled={!description.trim()}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
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
                            storyInputRef.current.click();
                          }}
                        >
                          <FaPlus />
                        </button>
                      )}
                    </div>
                    <p className="text-white mt-2 text-sm md:text-base">Viewing story...</p>
                  </div>
                </div>
                
                <div className="w-full h-64 md:h-96 rounded-lg m-3 md:m-5 relative overflow-hidden">
                  {userStories.length > 0 ? (
                    <>
                      {userStories[currentStoryIndex].type === 'image' ? (
                        <img
                          src={userStories[currentStoryIndex].mediaUrl}
                          alt="Story"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <video
                          src={userStories[currentStoryIndex].mediaUrl}
                          autoPlay
                          onEnded={() => {
                            const nextIndex = (currentStoryIndex + 1) % userStories.length;
                            setCurrentStoryIndex(nextIndex);
                            if (nextIndex === 0) setProfileStoryVisible(false);
                          }}
                          className="w-full h-full object-contain"
                        />
                      )}
                      <button 
                        onClick={handlePrevStory}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
                      >
                        <FaArrowLeft size={24} />
                      </button>
                      <button 
                        onClick={handleNextStory}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
                      >
                        <FaArrowRight size={24} />
                      </button>
                    </>
                  ) : (
                    <p className="text-white text-center py-20">No active stories</p>
                  )}
                </div>
                
                <div className="w-full flex justify-between items-center gap-3">
                  <input
                    type="text"
                    placeholder="Reply"
                    value={storyReply}
                    onChange={(e) => setStoryReply(e.target.value)}
                    className="bg-transparent border border-white border-[2px] h-8 md:h-10 rounded-3xl text-white w-full pl-3 md:pl-5 text-sm md:text-base"
                  />
                  <button
                    className="w-fit p-1 px-2 md:px-3 text-center rounded-2xl text-sm md:text-xl text-white cursor-pointer bg-[linear-gradient(120deg,_#000000,_#001A80)]"
                    onClick={() => {
                      handleSendStoryReply(selectedProfile.id);
                      setStoryReply('');
                    }}
                  >
                    send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showStoryUpload && (
          <div className="fixed inset-0 flex justify-center items-center bg-opacity-60 backdrop-blur-md z-[9999]">
            <div className="bg-gradient-to-b from-[#0D171E] to-[#283F79] p-6 rounded-lg shadow-lg w-[90%] md:w-[70%] lg:w-[28%] max-w-lg">
              <button
                className="absolute top-4 right-4 text-2xl text-white cursor-pointer"
                onClick={() => setShowStoryUpload(false)}
              >
                X
              </button>
              <div className="flex flex-col gap-4 items-center">
                <h2 className="text-white text-xl">Upload Story</h2>
                {selectedStoryMedia.length > 0 && (
                  <div className="w-full flex flex-wrap gap-2">
                    {selectedStoryMedia.map((file, index) => (
                      <div key={index} className="relative w-24 h-24">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover rounded" />
                        ) : (
                          <video src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  placeholder="Add mentions with # (e.g. #user1 #user2)"
                  value={storyMentions}
                  onChange={handleMentionChange}
                  className="bg-transparent border border-white p-2 rounded h-24 text-white w-full"
                />
                {mentionSuggestions.length > 0 && (
                  <ul className="bg-gray-800 rounded-lg w-full max-h-32 overflow-y-auto">
                    {mentionSuggestions.map((suggestion, index) => (
                      <li 
                        key={index} 
                        className="p-2 text-white cursor-pointer hover:bg-gray-700"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        #{suggestion}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={handleStoryUpload}
                  className="bg-[#5DE0E6] text-white p-2 rounded mt-4"
                  disabled={selectedStoryMedia.length === 0}
                >
                  Send Media
                </button>
              </div>
            </div>
          </div>
        )}
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
              className="ml-4 md:ml-8 mt-4 md:mt-6 text-xl md:text-3xl font-bold cursor-pointer select-none" 
              onClick={toggleHighlightVisibility}
            >
              Cricklytics
            </span>
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
            <FaBell className="cursor-pointer hover:scale-110" size={24} onClick={() => navigate('/notifications')}/>

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
        <div
          className={`absolute z-[1010] flex flex-col items-center p-2 md:p-[1rem] transition-all duration-700 ease-in-out ${
            highlightVisible ? "top-16 md:top-23" : "top-[50%]"
          } w-full ${isAIExpanded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <div ref={stickyHeaderRef} className={`sticky w-full md:w-[80%] top-0 z-20 bg-[rgba(2,16,30,0.7)] bg-opacity-40 backdrop-blur-md pb-2 md:pb-4 ${highlightVisible && !showChat ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
           <div className="w-full flex justify-center pt-2 md:pt-4 caret-none">
  <div className="w-full md:w-[50%] flex justify-center text-white text-sm md:text-xl">
    <div className="flex gap-2 md:gap-3 md:ml-5 overflow-x-auto whitespace-nowrap scrollbar-hide px-2 [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Webkit browsers */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {userProfile && (
        <div
          key={userProfile.uid}
          className="relative profile-image-container inline-block"
          id="user-profile-image-container"
        >
                      <button
                        className="w-13 h-13 md:w-20 md:h-20 rounded-full bg-cover bg-center border-2 border-white flex items-center justify-center"
                        style={{
                          backgroundImage: userProfile.profileImageUrl
                            ? `url(${userProfile.profileImageUrl})`
                            : 'none',
                          backgroundColor: userProfile.profileImageUrl ? 'transparent' : 'gray',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick({
                            id: 'user',
                            image:
                              userProfile.profileImageUrl || 'path/to/default/image.png',
                            name: userProfile.userName || 'You',
                          });
                        }}
                      >
                        {!userProfile.profileImageUrl && (
                          <span className="text-white font-bold text-xl md:text-2xl">
                            {userProfile?.userName?.charAt(0).toUpperCase() || 'Y'}
                          </span>
                        )}
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

                   {followersData
        .filter((f) => f.isFollowing)
        .map((follower) => (
          <div
            key={follower.id}
            className="relative profile-image-container inline-block"
          >
                        <button
                          className="w-13 h-13 md:w-20 md:h-20 rounded-full bg-cover bg-center flex items-center justify-center"
                          style={{
                            backgroundImage: follower.profileImageUrl
                              ? `url(${follower.profileImageUrl})`
                              : 'none',
                            backgroundColor: follower.profileImageUrl
                              ? 'transparent'
                              : 'gray',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProfileClick({
                              id: follower.id,
                              image: follower.profileImageUrl,
                              name: follower.firstName,
                            });
                          }}
                        >
                          {!follower.profileImageUrl && (
                            <span className="text-white font-bold text-xl md:text-2xl">
                              {follower.firstName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="w-full flex justify-center mt-2 md:mt-4">
              <div className="w-full md:w-[60%] flex justify-around text-white text-sm md:text-xl cursor-pointer">
                <span
                  className={`text-base md:text-2xl font-bold px-3 py-1 rounded ${activeTab === 'profile' ? 'bg-[#1c8fe8] border rounded-lg border-white' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  My Profile
                </span>
                <span
                  className={`text-base md:text-2xl font-bold px-3 py-1 rounded ${activeTab === 'forYou' ? 'bg-[#1c8fe8] border rounded-lg border-white' : ''}`}
                  onClick={() => setActiveTab('forYou')}
                >
                  Following
                </span>
                <span
                  className={`text-base md:text-2xl font-bold px-3 py-1 rounded ${activeTab === 'following' ? 'bg-[#1c8fe8] border rounded-lg border-white' : ''}`}
                  onClick={() => setActiveTab('following')}
                >
                  People You May Know
                </span>
                <span
                  className={`text-base md:text-2xl font-bold px-3 py-1 rounded ${activeTab === 'reels' ? 'bg-[#1c8fe8] border rounded-lg border-white' : ''}`}
                  onClick={() => setActiveTab('reels')}
                >
                  For You
                </span>
              </div>
            </div>
          </div>
          <div
            id="highlight"
            ref={highlightRef}
            className={`transition-opacity duration-700 ease-in-out mt-4 md:mt-0 flex flex-col md:flex-row md:flex-wrap justify-center items-center w-full h-full overflow-y-auto scrollbar-hide gap-4 md:gap-6 px-2 md:px-4 ${highlightVisible && !isAIExpanded ? "opacity-100" : "opacity-0"} flex-grow`}
          >
            {activeTab === 'forYou' && (
              highlightsData.length > 0 ? highlightsData.map((item) => (
                <div
                  key={item.id}
                  className="relative flex flex-col w-full sm:w-[95%] md:w-[48%] lg:w-[32%] bg-gradient-to-b from-[#0A5F68] to-[#000000] rounded-t-3xl md:rounded-t-3xl mx-2 md:mx-10 my-4 md:my-6 shadow-lg md:shadow-2xl border border-white/20 group cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <div className="relative w-full aspect-video overflow-hidden rounded-t-3xl md:rounded-t-3xl">
                    {item.type === 'image' ? (
                      <img
                        src={item.mediaUrl}
                        alt="Highlight"
                        className="absolute top-0 left-0 w-full h-full object-contain brightness-125"
                      />
                    ) : (
                      <video
                        src={item.mediaUrl}
                        controls
                        className="absolute top-0 left-0 w-full h-full object-contain brightness-125"
                      />
                    )}
                  </div>
                  <div className="p-2 md:p-3 bg-gradient-to-b from-[#0A5F68] to-[#000000] rounded-b-3xl md:rounded-b-3xl flex flex-col">
                    {item.description && (
                      <div className="flex flex-col">
                        <p className={`${expandedDescriptions[item.id] ? '' : 'line-clamp-1'} text-white text-sm md:text-base`}>
                          {item.description}
                        </p>
                        {item.description.length > 100 && (
                          <button
                            onClick={() => toggleDescription(item.id)}
                            className="text-blue-500 text-sm mt-1 self-start"
                          >
                            {expandedDescriptions[item.id] ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2 mb-1 md:mb-2">
                      <div className="flex items-center gap-4 md:gap-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(item.id);
                          }}
                          className="z-10 flex items-center p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                          <img 
                            src={likedVideos[item.id]?.liked ? alike : blike} 
                            alt="Like" 
                            className="w-7 h-7 md:w-9 md:h-9"
                          />
                          <span className="text-white text-sm md:text-base ml-2">{likedVideos[item.id]?.count || 0}</span>
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => handleCommentClick(item, e)}
                            className={`comment-icon-${item.id} flex items-center p-2 rounded-full hover:bg-gray-700/50 transition-colors`}
                          >
                            <img 
                              src={comment} 
                              alt="Comment" 
                              className="w-7 h-7 md:w-9 md:h-9"
                            />
                            <span className="text-white text-sm md:text-base ml-2">{commentsCount[item.id] || 0}</span>
                          </button>
                          {showCommentBox === item.id && (
                            <div
                              ref={(el) => (commentRefs.current[item.id] = el)}
                              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-64 bg-[#0D171E] rounded-lg shadow-xl z-50 border border-gray-700 p-3"
                            >
                              <div className="max-h-40 overflow-y-auto mb-2">
                                {comments[item.id]?.length > 0 ? (
                                  comments[item.id].map((comment) => (
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
                        <div className="relative">
                          <button
                            onClick={(e) => handleShareClick(item, e)}
                            className={`share-icon-${item.id} flex items-center p-2 rounded-full hover:bg-gray-700/50 transition-colors`}
                          >
                            <img 
                              src={share} 
                              alt="Share" 
                              className="w-7 h-7 md:w-9 md:h-9"
                            />
                          </button>
                          {showShareBox === item.id && (
                            <div
                              ref={(el) => (shareRefs.current[item.id] = el)}
                              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-48 bg-[#0D171E] rounded-lg shadow-xl z-50 border border-gray-700 p-3"
                            >
                              <h4 className="text-white text-sm mb-2">Share via</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {shareOptions.map((option) => (
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
                </div>
              )) : (
                <p className="text-white mt-10 text-center">No highlights yet. Please add some!</p>
              )
            )}
            {activeTab === 'following' && (
              <div className="w-full p-4 overflow-y-auto">
                <h2 className="text-white text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center md:text-left">People You May Know</h2>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search users by name..."
                    value={followingSearchTerm}
                    onChange={(e) => setFollowingSearchTerm(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  {followersData
                    .filter(follower => follower.firstName.toLowerCase().includes(followingSearchTerm.toLowerCase()))
                    .sort((a, b) => b.isFollowing - a.isFollowing)
                    .map(follower => (
                      <div key={follower.id} className="bg-[#0D171E] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between">
                        <div className="flex items-center mb-2 sm:mb-0">
                          {follower.profileImageUrl ? (
                            <img 
                              src={follower.profileImageUrl} 
                              alt={follower.firstName}
                              className="w-12 h-12 rounded-full object-cover mr-0 sm:mr-4"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-xl mr-0 sm:mr-4">
                              {follower.firstName.charAt(0).toUpperCase()}
                            </div>
                          )}
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
                <div className="p-4 flex justify-center">
                  <button
                    onClick={handleUploadReelClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
                  >
                    <FaUpload />
                    Upload Reel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {reelsData.map(reel => (
                    <div key={reel.id} className="bg-[#0D171E] rounded-xl overflow-hidden shadow-lg">
                      <div className="relative w-full aspect-video overflow-hidden rounded-t-3xl md:rounded-t-3xl">
                        {reel.type === 'image' ? (
                          <img
                            src={reel.mediaUrl}
                            alt="Reel"
                            className="absolute top-0 left-0 w-full h-full object-contain"
                          />
                        ) : (
                          <video
                            src={reel.mediaUrl}
                            controls
                            className="absolute top-0 left-0 w-full h-full object-contain"
                          />
                        )}
                      </div>
                      <div className="p-3 md:p-4">
                        {reel.description && (
                          <div>
                            <p className={`${expandedDescriptions[reel.id] ? '' : 'line-clamp-1'} text-white`}>
                              {reel.description}
                            </p>
                            {reel.description.length > 100 && (
                              <button
                                onClick={() => toggleDescription(reel.id)}
                                className="text-blue-500 text-sm mt-1"
                              >
                                {expandedDescriptions[reel.id] ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-4 md:gap-6">
                            <button 
                              onClick={() => toggleLike(reel.id)} 
                              className="flex items-center p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                            >
                              <img 
                                src={likedVideos[reel.id]?.liked ? alike : blike} 
                                alt="Like" 
                                className="w-7 h-7 md:w-9 md:h-9"
                              />
                              <span className="text-white text-sm ml-2">{likedVideos[reel.id]?.count || 0}</span>
                            </button>
                            <div className="relative">
                              <button 
                                onClick={(e) => handleCommentClick(reel, e)}
                                className={`comment-icon-${reel.id} flex items-center p-2 rounded-full hover:bg-gray-700/50 transition-colors`}
                              >
                                <img 
                                  src={comment} 
                                  alt="Comment" 
                                  className="w-7 h-7 md:w-9 md:h-9"
                                />
                                <span className="text-white text-sm ml-2">{commentsCount[reel.id] || 0}</span>
                              </button>
                              {showCommentBox === reel.id && (
                                <div
                                  ref={(el) => (commentRefs.current[reel.id] = el)}
                                  className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-64 bg-[#0D171E] rounded-lg shadow-xl z-50 border border-gray-700 p-3"
                                >
                                  <div className="max-h-40 overflow-y-auto mb-2">
                                    {comments[reel.id]?.length > 0 ? (
                                      comments[reel.id].map((comment) => (
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
                            <div className="relative">
                              <button 
                                onClick={(e) => handleShareClick(reel, e)}
                                className={`share-icon-${reel.id} flex items-center p-2 rounded-full hover:bg-gray-700/50 transition-colors`}
                              >
                                <img 
                                  src={share} 
                                  alt="Share" 
                                  className="w-7 h-7 md:w-9 md:h-9"
                                />
                              </button>
                              {showShareBox === reel.id && (
                                <div
                                  ref={(el) => (shareRefs.current[reel.id] = el)}
                                  className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-48 bg-[#0D171E] rounded-lg shadow-xl z-50 border border-gray-700 p-3"
                                >
                                  <h4 className="text-white text-sm mb-2">Share via</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {shareOptions.map((option) => (
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
                          <div className="flex items-center">
                            <button 
                              onClick={() => handleDeleteReel(reel.id)} 
                              className="p-2 rounded-full hover:bg-gray-700/50 transition-colors text-red-500"
                            >
                              <FaTrash className="w-6 h-6 md:w-7 md:h-7" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'profile' && (
              <div className="w-full p-4 overflow-y-auto flex flex-col items-center">
                <h2 className="text-white text-xl md:text-2xl font-bold mb-4 md:mb-6">My Profile</h2>
                <div className="bg-[#0D171E] rounded-lg p-6 flex flex-col items-center w-full max-w-md">
                  <img
                    src={userProfile?.profileImageUrl || 'path/to/default/image.png'}
                    alt="Profile"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mb-4"
                  />
                  <h3 className="text-white text-lg md:text-xl font-semibold mb-4">{userProfile?.userName || 'You'}</h3>
                  <div className="flex justify-around w-full text-white mb-4">
                    <div className="text-center">
                      <p className="font-bold text-xl">{postCount}</p>
                      <p className="text-sm">Posts</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xl">{followingCount}</p>
                      <p className="text-sm">Following</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xl">{followersCount}</p>
                      <p className="text-sm">Followers</p>
                    </div>
                  </div>
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