// src/pages/Chat.jsx (New component for 1-to-1 chat screen)
import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaPaperPlane } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";

const Chat = () => {
  const { id: recipientId } = useParams(); // Get recipient UID from URL
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipientName, setRecipientName] = useState('Unknown');
  const [recipientAvatar, setRecipientAvatar] = useState('https://ui-avatars.com/api/?name=Unknown&background=004e92&color=fff');
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const messagesEndRef = useRef(null);

  // Generate unique chatId by sorting UIDs
  const generateChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  const chatId = generateChatId(currentUser.uid, recipientId);

  // Fetch recipient details
  useEffect(() => {
    const fetchRecipient = async () => {
      const recipientDoc = await getDoc(doc(db, "users", recipientId));
      if (recipientDoc.exists()) {
        const data = recipientDoc.data();
        setRecipientName(data.firstName || "Unknown");
        setRecipientAvatar(data.profileImageUrl || `https://ui-avatars.com/api/?name=${data.firstName || 'Unknown'}&background=004e92&color=fff`);
      }
    };
    fetchRecipient();
  }, [recipientId]);

  // Set up realtime listener for messages
  useEffect(() => {
    // Ensure the chat document exists
    const chatRef = doc(db, "chats", chatId);
    getDoc(chatRef).then((chatSnap) => {
      if (!chatSnap.exists()) {
        setDoc(chatRef, {
          participants: [currentUser.uid, recipientId],
          lastMessage: "",
          lastUpdated: serverTimestamp()
        });
      }
    });

    // Listen to messages subcollection
    const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.uid,
        text: messageInput,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update lastMessage in chat doc
      await setDoc(doc(db, "chats", chatId), {
        lastMessage: messageInput,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      setMessageInput('');
    }
  };

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
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5DE0E6] to-[#4facfe] p-0.5 mr-2">
            <div className="w-full h-full rounded-full bg-[#000428] overflow-hidden">
              <img 
                src={recipientAvatar} 
                alt={recipientName} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#5DE0E6] to-[#4facfe] bg-clip-text text-transparent">
            {recipientName}
          </h1>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex flex-col space-y-2">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-3 rounded-xl max-w-[75%] ${
                msg.senderId === currentUser.uid 
                  ? 'bg-[#5DE0E6]/20 self-end text-right' 
                  : 'bg-[#004e92]/20 self-start text-left'
              }`}
            >
              <p className="text-white">{msg.text}</p>
              <span className="text-xs text-[#5DE0E6]/70">
                {msg.createdAt?.toDate().toLocaleTimeString()}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Message Input */}
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
    </div>
  );
};

export default Chat;

// Note: To integrate this, add a route in your router like <Route path="/messages/:id" element={<Chat />} />.
// Your existing Message.jsx remains the same, as it already navigates to /messages/${chat.id}.
