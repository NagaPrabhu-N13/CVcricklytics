import React, { useState, useEffect } from "react";
import { FaSearch, FaPaperPlane, FaChevronLeft, FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, collection, getDocs, getDoc } from "firebase/firestore";

const Message = () => {
  const navigate = useNavigate();
  const [activeChatTab, setActiveChatTab] = useState('primary');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [primaryChats, setPrimaryChats] = useState([]);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        // 1. Find the document in 'following' collection for this user
        const followingDocRef = doc(db, "following", currentUser.uid);
        // 2. Get all documents in 'myFollowing' subcollection
        const myFollowingSnapshot = await getDocs(collection(followingDocRef, "myFollowing"));
        const userPromises = [];
        myFollowingSnapshot.forEach((followDoc) => {
          const followedUserId = followDoc.data().uid;
          if (followedUserId) {
            // 3. Fetch their name and profile from users collection
            userPromises.push(getDoc(doc(db, "users", followedUserId)));
          }
        });
        const userDocs = await Promise.all(userPromises);
        const usersList = userDocs
          .filter(docSnap => docSnap.exists())
          .map(docSnap => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              name: d.firstName || "Unknown",
              avatar: d.profileImageUrl || `https://ui-avatars.com/api/?name=${d.firstName || 'Unknown'}&background=004e92&color=fff`,
              lastMessage: "", // TODO: Fetch actual last message
              time: "",        // TODO: Fetch actual message time
              unread: false    // TODO: Implement unread logic
            };
          });
        setPrimaryChats(usersList);
      } catch (err) {
        console.error("Error fetching following users:", err);
      }
    };
    fetchFollowing();
  }, []);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log("Message sent:", messageInput);
      setMessageInput('');
    }
  };

  // Filter chats based on search query
  const filteredChats = primaryChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-[#000428] via-[#004e92] to-[#000428]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-[#000428]/90 to-[#004e92]/90 backdrop-blur-sm p-4 flex items-center border-b border-[#004e92]">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-[#ffffff10] transition-colors"
        >
          <FaChevronLeft size={18} className="text-[#5DE0E6]" />
        </button>
        <h1 className="text-xl font-bold flex-1 bg-gradient-to-r from-[#5DE0E6] to-[#4facfe] bg-clip-text text-transparent">
          Messages
        </h1>
        <button className="p-2 rounded-full hover:bg-[#ffffff10] transition-colors">
          <FaEllipsisV className="text-[#5DE0E6]" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-10">
        {/* Search Bar */}
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-[#5DE0E6] md:w-[1.5rem] md:h-[1.5rem]" />
          </div>
          <input
            type="text"
            placeholder="Search Names..."
            className="w-full bg-[#000428]/60 border border-[#004e92]/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-[#5DE0E6]/70 focus:outline-none focus:ring-2 focus:ring-[#5DE0E6] focus:border-transparent "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chat List */}
        <div className="space-y-2 mx-2">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div 
                key={chat.id} 
                className="p-2 rounded-xl bg-[#000428]/60 border border-[#004e92]/30 flex items-center cursor-pointer hover:bg-[#004e92]/20 transition-all duration-300 backdrop-blur-sm max-w-full"
                onClick={() => navigate(`/ChatMessage/${chat.id}`)}
              >
                <div className="relative mr-2 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5DE0E6] to-[#4facfe] p-0.5">
                    <div className="w-full h-full rounded-full bg-[#000428] overflow-hidden">
                      <img 
                        src={chat.avatar} 
                        alt={chat.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${chat.name}&background=004e92&color=fff`;
                        }}
                      />
                    </div>
                  </div>
                  {chat.unread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FF4D4D] border-2 border-[#000428] flex items-center justify-center">
                      <span className="text-[8px] font-bold">1</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-sm font-medium truncate ${
                      chat.unread ? 'text-white' : 'text-[#5DE0E6]/80'
                    }`}>
                      {chat.name}
                    </h3>
                    <span className={`text-xs whitespace-nowrap ml-2 ${
                      chat.unread ? 'text-[#5DE0E6]' : 'text-[#5DE0E6]/50'
                    }`}>
                      {chat.time}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${
                    chat.unread ? 'text-white font-medium' : 'text-[#5DE0E6]/70'
                  }`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-[#5DE0E6]/70">
                {searchQuery ? "No matches found" : "No messages yet"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Message Input (for primary tab) */}
      {/* {activeChatTab === 'primary' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#000428]/90 to-[#004e92]/90 backdrop-blur-sm p-3 border-t border-[#004e92]">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-[#000428]/60 border border-[#004e92]/50 rounded-l-xl py-3 px-4 text-white placeholder-[#5DE0E6]/70 focus:outline-none focus:ring-2 focus:ring-[#5DE0E6] focus:border-transparent"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              className={`px-5 py-3 rounded-r-xl transition-all ${
                messageInput.trim() 
                  ? 'bg-gradient-to-r from-[#5DE0E6] to-[#4facfe] hover:from-[#4facfe] hover:to-[#5DE0E6]'
                  : 'bg-[#000428]/60 border border-[#004e92]/50 cursor-not-allowed'
              }`}
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <FaPaperPlane className={`${messageInput.trim() ? 'text-white' : 'text-[#5DE0E6]/50'}`} />
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Message;