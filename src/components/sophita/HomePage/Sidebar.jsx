import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTimes, FaTrophy, FaUsers, FaTv, FaStar, FaSignOutAlt,
  FaChevronDown, FaChevronUp, FaLock, FaPencilAlt, 
  FaEye, FaEyeSlash, FaShieldAlt, FaUserCog, FaCreditCard,
  FaTag, FaAt, FaComment, FaPalette, FaCheck, FaEnvelope,
  FaMobile, FaCalendarAlt, FaIdCard, FaKey, FaBell,
  FaFacebook, FaWhatsapp, FaInstagram, FaTwitter, FaSearch, FaCog ,FaVideo, 
  FaMicrophone, 
  FaMapMarkerAlt, 
  FaImage
} from "react-icons/fa";
// import { LockKeyholeIcon } from "lucide-react";
import { auth, db } from "../../../firebase";
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";
import { signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaPlus } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";

const hexToRgb = (hex) => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const PasswordChangeForm = ({ selectedColor, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await updateDoc(doc(db, "users", user.uid), {
        password: newPassword
      });
      setSuccess("Password updated successfully");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update password");
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Change Password</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-500 text-sm">{success}</div>}
        
        <div className="space-y-1">
          <label className="text-sm">Current password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 rounded bg-white/10 border border-white/20"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm">New password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 rounded bg-white/10 border border-white/20"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Use at least 8 characters. Don't use a password from another site, or something too obvious.
          </p>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm">Confirm new password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 rounded bg-white/10 border border-white/20"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-gray-500 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded"
            style={{ backgroundColor: selectedColor }}
          >
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
};

const TwoFactorAuth = ({ selectedColor }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddPhone = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!phoneNumber) {
      setError("Please enter a phone number");
      return;
    }

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        phoneNumber: phoneNumber
      });
      setShowVerification(true);
      setSuccess("Verification code sent to your phone");
    } catch (err) {
      setError("Failed to save phone number");
      console.error("Error saving phone number:", err);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!verificationCode) {
      setError("Please enter verification code");
      return;
    }

    try {
      setIsPhoneVerified(true);
      setSuccess("Phone number verified successfully");
      setShowVerification(false);
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        isPhoneVerified: true
      });
    } catch (err) {
      setError("Failed to verify code");
      console.error("Error verifying code:", err);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setSuccess("Two-factor authentication enabled successfully");
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        twoFactorEnabled: true
      });
    } catch (err) {
      setError("Failed to enable 2FA");
      console.error("Error enabling 2FA:", err);
    }
  };

 
};

const WhereYoureLoggedIn = ({ selectedColor, isMobileView, userProfile }) => {
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 1,
      device: "Cricklytics App",
      location: "Chennai, India",
      lastActive: new Date().toISOString(),
      current: true
    },
  ]);
  
    const getTextStyleClass = () => (isMobileView ? 'text-gray-800' : 'text-white');
  
// Use a lighter background for mobile view
const getBgStyle = () => {
  if (isMobileView) {
    // For mobile, use a very light white gradient background
    return 'bg-gradient-to-br from-white to-gray-100';
  }
  // For desktop, use the normal semi-transparent background with theme color
  const rgb = hexToRgb(selectedColor);
  return `rgba(${rgb}, 0.15)`;
};

const handleLogoutDevice = (deviceId) => {
  setActiveSessions(activeSessions.filter(session => session.id !== deviceId));
};

return (
  <div className={`p-4 ${getTextStyleClass()}`}>
    <h3 className="text-lg font-medium mb-4">Where You're Logged In</h3>
    <p className="text-sm mb-4">These are the devices where you're currently logged in:</p>
    
    <div className="space-y-4">
      {activeSessions.map(session => (
        <div 
          key={session.id} 
          className={`p-4 rounded-lg relative overflow-hidden ${
            isMobileView 
              ? 'border border-gray-300 bg-gradient-to-br from-white to-gray-50 shadow-sm' 
              : ''
          }`}
          style={{ 
            backgroundColor: getBgStyle(),
            border: !isMobileView ? `2px solid ${selectedColor}` : '',
            boxShadow: !isMobileView 
              ? `0 4px 12px rgba(${hexToRgb(selectedColor)}, 0.2)`
              : '',
          }}
        >
          {/* Accent bar - different color for mobile vs desktop */}
          <div 
            className="absolute top-0 left-0 h-full"
            style={{ 
              backgroundColor: isMobileView ? '#6b7280' : selectedColor, // Grey for mobile
              width: '4px'
            }}
          ></div>
          
          <div className="flex justify-between items-start ml-4">
            <div className="flex-1">
              <div className="font-medium text-sm flex items-center gap-2">
                <div 
                  className="rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: isMobileView ? '#6b7280' : selectedColor,
                    width: '14px',
                    height: '14px'
                  }}
                ></div>
                <span className={isMobileView ? 'text-gray-900' : 'text-white'}>
                  {session.device}
                </span>
              </div>
              <div className={`text-xs mt-2 ml-5 ${isMobileView ? 'text-gray-700' : 'text-gray-300'}`}>
                {session.location}
              </div>
              <div className={`text-xs ml-5 ${isMobileView ? 'text-gray-700' : 'text-gray-300'}`}>
                Last active: {new Date(session.lastActive).toLocaleString()}
              </div>
            </div>
            {!session.current && (
              <button
                onClick={() => handleLogoutDevice(session.id)}
                className="text-xs px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors border border-red-600 shadow-sm"
              >
                Log out
              </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginDetails = ({ selectedColor, isMobileView, userProfile }) => {
  const [loginDetails, setLoginDetails] = useState([]);
  
  // Add these helper functions
  const getTextStyleClass = () => (isMobileView ? 'text-gray-800' : 'text-white');
  
  const getBgStyle = () => {
    if (isMobileView) {
      return 'bg-gradient-to-br from-white to-gray-50';
    }
    const rgb = hexToRgb(selectedColor);
    return `rgba(${rgb}, 0.15)`;
  };

  // Add hexToRgb function
  const hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  useEffect(() => {
    const fetchLoginDetails = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setLoginDetails(data.loginDetails || []);
          }
        }
      } catch (err) {
        console.error("Error fetching login details:", err);
      }
    };
    fetchLoginDetails();
  }, []);

  return (
   <div className={`p-4 ${getTextStyleClass()}`}>
      <h3 className="text-lg font-medium mb-4">Login Details</h3>
      
      {/* User Information Section */}
      <div className={`mb-6 p-3 rounded-lg ${
        isMobileView 
          ? 'border border-gray-300 bg-gradient-to-br from-white to-gray-50 shadow-sm' 
          : ''
      }`}
      style={{ 
        backgroundColor: getBgStyle(),
        border: !isMobileView ? `2px solid ${selectedColor}` : '',
        boxShadow: !isMobileView 
          ? `0 4px 12px rgba(${hexToRgb(selectedColor)}, 0.2)`
          : '',
      }}>
        <h4 className="font-medium text-sm mb-2">Account Information</h4>
        <div className="text-xs space-y-1">
          <div>Name: {userProfile?.firstName || userProfile?.userName || "Not available"}</div>
          <div>Email: {userProfile?.email || "Not available"}</div>
        </div>
      </div>
    </div>
  );
};

const AccountLoginSettings = ({ selectedColor, isMobileView }) => {
  const [loginSetting, setLoginSetting] = useState("requireLogin");
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  const handleLoginSettingChange = async (value) => {
    setLoginSetting(value);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        loginSetting: value
      });
    } catch (err) {
      console.error("Error updating login setting:", err);
    }
  };

  return 
};

const HideStoriesContent = ({ selectedColor, isMobileView }) => {
  const [hiddenUsers, setHiddenUsers] = useState([
    { id: 1, username: "Phensi_1023", name: "Jihansi Chittunuri" },
    { id: 2, username: "falconcricketclub", name: "Falcon Cricket Club" },
    { id: 3, username: "anradhyagoyaj37", name: "Aaradhya" },
    { id: 4, username: "thalocalanaesthesia", name: "Arkush" },
    { id: 5, username: "charantaja.c", name: "Charan Teja" },
    { id: 6, username: "webarea", name: "Webirree-Web Designing and development" },
    { id: 7, username: "rahudahahan13", name: "Rishul Shahani" },
    { id: 8, username: "saukritithakur", name: "Saroni Thakur" }
  ]);
  const [showHideOptions, setShowHideOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userToHide, setUserToHide] = useState(null);

  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  const handleHideUser = (user) => {
    setUserToHide(user);
    setShowConfirmation(true);
  };

  const confirmHideUser = () => {
    if (userToHide) {
      setHiddenUsers([...hiddenUsers, userToHide]);
      setShowConfirmation(false);
      setUserToHide(null);
    }
  };

  const handleUnhideUser = (id) => {
    setHiddenUsers(hiddenUsers.filter(user => user.id !== id));
  };

  const filteredUsers = [
    { id: 9, username: "user1", name: "User One" },
    { id: 10, username: "user2", name: "User Two" },
    { id: 11, username: "user3", name: "User Three" }
  ].filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      <div 
        className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setShowHideOptions(!showHideOptions)}
      >
        <div className="flex items-center gap-3">
          <FaEyeSlash style={getIconStyle()} />
          <span>Hide Stories</span>
        </div>
        {showHideOptions ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {showHideOptions && (
        <div className="pl-8 space-y-4">
          {hiddenUsers.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Currently hiding stories from:</h4>
              <div className="space-y-2">
                {hiddenUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm">{user.username}</div>
                        <div className="text-xs text-gray-400">{user.name}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUnhideUser(user.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: selectedColor }}
                    >
                      Unhide
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">You're not hiding stories from anyone</p>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Hide stories from someone new:</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pl-8 rounded bg-white/10 border border-white/20 text-sm"
              />
              <FaSearch className="absolute left-2 top-3 text-gray-400" />
            </div>

            {searchQuery && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm">{user.username}</div>
                          <div className="text-xs text-gray-400">{user.name}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleHideUser(user)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: selectedColor }}
                      >
                        Hide
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No users found</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showConfirmation && userToHide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div 
            className="bg-gray-800 p-4 rounded-lg max-w-sm w-full mx-4"
            style={{ borderTop: `4px solid ${selectedColor}` }}
          >
            <h3 className="font-medium mb-2">Hide Stories</h3>
            <p className="text-sm mb-4">
              Hide stories from {userToHide.name} (@{userToHide.username})? Their stories won't appear in your feed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1 text-sm rounded bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmHideUser}
                className="px-3 py-1 text-sm rounded"
                style={{ backgroundColor: selectedColor }}
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PasswordSecurityContent = ({ selectedColor, isMobileView, userProfile }) => {
  const [showPasswordOptions, setShowPasswordOptions] = useState(false);
  const [showSecurityChecks, setShowSecurityChecks] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [show2FAForm, setShow2FAForm] = useState(false);
  const [showLoginDetails, setShowLoginDetails] = useState(false);
  const [showWhereLoggedIn, setShowWhereLoggedIn] = useState(false);
  const [showAccountLoginSettings, setShowAccountLoginSettings] = useState(false);
  
  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  return (
       <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      {showPasswordForm && (
        <PasswordChangeForm 
          selectedColor={selectedColor} 
          onClose={() => setShowPasswordForm(false)} 
        />
      )}
      
      {show2FAForm && (
        <TwoFactorAuth 
          selectedColor={selectedColor} 
          onClose={() => setShow2FAForm(false)} 
        />
      )}
      
      {showLoginDetails && (
        <LoginDetails
          selectedColor={selectedColor}
          isMobileView={isMobileView}
          userProfile={userProfile}
          onClose={() => setShowLoginDetails(false)}
        />
      )}
      
      {showWhereLoggedIn && (
        <WhereYoureLoggedIn
          selectedColor={selectedColor}
          isMobileView={isMobileView}
          userProfile={userProfile}
          onClose={() => setShowWhereLoggedIn(false)}
        />
      )}
      
      {showAccountLoginSettings && (
        <AccountLoginSettings
          selectedColor={selectedColor}
          isMobileView={isMobileView}
          onClose={() => setShowAccountLoginSettings(false)}
        />
      )}
      
      <div 
        className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setShowPasswordOptions(!showPasswordOptions)}
      >
        <div className="flex items-center gap-3">
          <FaKey style={getIconStyle()} />
          <span>Password</span>
        </div>
        {showPasswordOptions ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
     {showPasswordOptions && (
  <div className="pl-8 space-y-2 text-xs">
    <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer" onClick={() => setShowPasswordForm(true)}>
      Change password
    </div>
    <p className={`text-xs p-1 ${isMobileView ? 'text-gray-600' : 'text-gray-400'}`}>
      Choose a strong password and don't reuse it for other accounts.
    </p>
    <p className={`text-xs p-1 ${isMobileView ? 'text-gray-600' : 'text-gray-400'}`}>
      You may be signed out of your account on some devices.
    </p>
  </div>
)}
      
      <div 
        className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setShowSecurityChecks(!showSecurityChecks)}
      >
        <div className="flex items-center gap-3">
          <FaShieldAlt style={getIconStyle()} />
          <span>Security checks</span>
        </div>
        {showSecurityChecks ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {showSecurityChecks && (
        <div className="pl-8 space-y-2 text-xs">
          <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer" onClick={() => setShowWhereLoggedIn(true)}>
            Where you're logged in
          </div>
          <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer" onClick={() => setShowLoginDetails(true)}>
            Login details
          </div>
        </div>
      )}
    </div>
  );
};


const PersonalDetailsContent = ({ selectedColor, isMobileView, userProfile }) => {
  const [showDOBInput, setShowDOBInput] = useState(false);
  const [dob, setDob] = useState(userProfile?.dob || "");
  const [showIdentityConfirmation, setShowIdentityConfirmation] = useState(false);
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    facebook: userProfile?.socialMedia?.facebook || "",
    whatsapp: userProfile?.socialMedia?.whatsapp || "",
    instagram: userProfile?.socialMedia?.instagram || "",
    twitter: userProfile?.socialMedia?.twitter || ""
  });
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  
  // New states for editable name
  const [name, setName] = useState(userProfile?.firstName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userProfile?.firstName || "");

  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  const handleSaveDOB = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        dob: dob
      });
      setShowDOBInput(false);
    } catch (err) {
      console.error("Error updating date of birth:", err);
    }
  };

  const handleSaveSocialMedia = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        socialMedia: socialMediaLinks
      });
      setIsEditingSocial(false);
    } catch (err) {
      console.error("Error updating social media links:", err);
    }
  };

  // New function to save edited name
  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        firstName: tempName.trim()
      });
      setName(tempName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating name:", err);
    }
  };

  // Fetch initial name if not provided in userProfile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.firstName || "");
          setTempName(data.firstName || "");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      {/* Editable Name above Email */}
      <div className="flex items-center justify-between">
        <div>
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="p-2 border rounded"
            />
          ) : (
            <span className="font-bold">{name || "No name"}</span>
          )}
        </div>
        {isEditingName ? (
          <>
            <button onClick={handleSaveName} className="ml-2 text-green-600">Save</button>
            <button onClick={() => setIsEditingName(false)} className="ml-2 text-red-600">Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditingName(true)} className="ml-2 text-blue-600">Edit</button>
        )}
      </div>
      <div className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm">
        <FaEnvelope style={getIconStyle()} />
        <span>Email: {userProfile?.email || "No email"}</span>
      </div>
      <div className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm">
        <FaMobile style={getIconStyle()} />
        <span>Phone: {userProfile?.whatsapp || "No phone"}</span>
      </div>
      
      <div 
  className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
  onClick={() => setShowDOBInput(!showDOBInput)}
>
  <div className="flex items-center gap-3">
    <FaCalendarAlt style={getIconStyle()} />
    <span className={isMobileView ? 'text-gray-800' : ''}>
      Date of Birth: {dob || "Not set"}
    </span>
  </div>
  {showDOBInput ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
</div>
      
      {showDOBInput && (
        <div className="pl-8 space-y-2">
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full p-2 rounded bg-white/10 border border-white/20 text-sm"
            max={new Date().toISOString().split('T')[0]}
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setShowDOBInput(false)}
              className="px-3 py-1 text-xs rounded bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveDOB}
              className="px-3 py-1 text-xs rounded"
              style={{ backgroundColor: selectedColor }}
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setShowIdentityConfirmation(!showIdentityConfirmation)}
      >
        <div className="flex items-center gap-3">
          <FaIdCard style={getIconStyle()} />
          <span>Identity confirmation</span>
        </div>
        {showIdentityConfirmation ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {showIdentityConfirmation && (
        <div className="pl-8 space-y-3">
          <p className="text-xs">Link your social media profiles to verify your identity:</p>
          
          {isEditingSocial ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaFacebook style={{ color: '#1877F2' }} />
                <input
                  type="text"
                  placeholder="Facebook profile URL"
                  value={socialMediaLinks.facebook}
                  onChange={(e) => setSocialMediaLinks({...socialMediaLinks, facebook: e.target.value})}
                  className="flex-1 p-2 rounded bg-white/10 border border-white/20 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <FaWhatsapp style={{ color: '#25D366' }} />
                <input
                  type="text"
                  placeholder="WhatsApp number"
                  value={socialMediaLinks.whatsapp}
                  onChange={(e) => setSocialMediaLinks({...socialMediaLinks, whatsapp: e.target.value})}
                  className="flex-1 p-2 rounded bg-white/10 border border-white/20 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <FaInstagram style={{ color: '#E4405F' }} />
                <input
                  type="text"
                  placeholder="Instagram username"
                  value={socialMediaLinks.instagram}
                  onChange={(e) => setSocialMediaLinks({...socialMediaLinks, instagram: e.target.value})}
                  className="flex-1 p-2 rounded bg-white/10 border border-white/20 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <FaTwitter style={{ color: '#1DA1F2' }} />
                <input
                  type="text"
                  placeholder="Twitter handle"
                  value={socialMediaLinks.twitter}
                  onChange={(e) => setSocialMediaLinks({...socialMediaLinks, twitter: e.target.value})}
                  className="flex-1 p-2 rounded bg-white/10 border border-white/20 text-sm"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setIsEditingSocial(false)}
                  className="px-3 py-1 text-xs rounded bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSocialMedia}
                  className="px-3 py-1 text-xs rounded"
                  style={{ backgroundColor: selectedColor }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {socialMediaLinks.facebook && (
                <div className="flex items-center gap-2 text-sm">
                  <FaFacebook style={{ color: '#1877F2' }} />
                  <span>{socialMediaLinks.facebook}</span>
                </div>
              )}
              
              {socialMediaLinks.whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <FaWhatsapp style={{ color: '#25D366' }} />
                  <span>{socialMediaLinks.whatsapp}</span>
                </div>
              )}
              
              {socialMediaLinks.instagram && (
                <div className="flex items-center gap-2 text-sm">
                  <FaInstagram style={{ color: '#E4405F' }} />
                  <span>@{socialMediaLinks.instagram}</span>
                </div>
              )}
              
              {socialMediaLinks.twitter && (
                <div className="flex items-center gap-2 text-sm">
                  <FaTwitter style={{ color: '#1DA1F2' }} />
                  <span>@{socialMediaLinks.twitter}</span>
                </div>
              )}
              
              {!socialMediaLinks.facebook && !socialMediaLinks.whatsapp && 
               !socialMediaLinks.instagram && !socialMediaLinks.twitter && (
                <p className="text-xs italic">No social media links added</p>
              )}
              
              <button 
                onClick={() => setIsEditingSocial(true)}
                className="flex items-center gap-1 text-xs mt-2"
                style={{ color: selectedColor }}
              >
                <FaPencilAlt size={10} /> {socialMediaLinks.facebook ? 'Edit' : 'Add'} links
              </button>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

const DevicePermissionsContent = ({ selectedColor, isMobileView }) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    contacts: false,
    location: false,
    microphone: false,
    notifications: false,
    photos: false
  });
  
  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  // Function to request actual device permissions
  const requestDevicePermission = async (permission) => {
    try {
      switch (permission) {
        case 'camera':
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop the stream immediately since we just needed permission
          cameraStream.getTracks().forEach(track => track.stop());
          return true;
          
        case 'microphone':
          const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          microphoneStream.getTracks().forEach(track => track.stop());
          return true;
          
        case 'location':
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(true),
              () => resolve(false)
            );
          });
          
        case 'notifications':
          if ('Notification' in window) {
            const result = await Notification.requestPermission();
            return result === 'granted';
          }
          return false;
          
        case 'contacts':
          if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
              const contacts = await navigator.contacts.select(['name', 'email'], { multiple: true });
              return !!contacts;
            } catch (error) {
              console.error('Contacts access error:', error);
              return false;
            }
          }
          return false;
          
        case 'photos':
          // This would typically use a file input for photo access
          return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => resolve(true);
            input.oncancel = () => resolve(false);
            input.click();
          });
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
      return false;
    }
  };

  // Check current permission status
  const checkPermissionStatus = async (permission) => {
    try {
      switch (permission) {
        case 'camera':
        case 'microphone':
          const mediaStatus = await navigator.permissions.query({ name: permission });
          return mediaStatus.state === 'granted';
          
        case 'location':
          const locationStatus = await navigator.permissions.query({ name: 'geolocation' });
          return locationStatus.state === 'granted';
          
        case 'notifications':
          return Notification.permission === 'granted';
          
        case 'contacts':
        case 'photos':
          // These typically don't have a simple permission query API
          // We'll rely on the user interaction to determine status
          return permissions[permission];
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking ${permission} status:`, error);
      return false;
    }
  };

  const handlePermissionToggle = async (permission) => {
    try {
      // If turning ON, request the actual permission
      if (!permissions[permission]) {
        const hasPermission = await requestDevicePermission(permission);
        
        if (hasPermission) {
          const newPermissions = {
            ...permissions,
            [permission]: true
          };
          
          setPermissions(newPermissions);
          
          // Update Firebase
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            devicePermissions: newPermissions
          });
        }
      } else {
        // If turning OFF, just update the state
        const newPermissions = {
          ...permissions,
          [permission]: false
        };
        
        setPermissions(newPermissions);
        
        // Update Firebase
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          devicePermissions: newPermissions
        });
      }
    } catch (err) {
      console.error("Error updating device permissions:", err);
    }
  };

  // Initialize permissions from Firebase and device status
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Get saved permissions from Firebase
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            let initialPermissions = {
              camera: false,
              contacts: false,
              location: false,
              microphone: false,
              notifications: false,
              photos: false
            };
            
            if (data.devicePermissions) {
              initialPermissions = { ...data.devicePermissions };
            }
            
            // Check actual device permission status for browser-based permissions
            const updatedPermissions = { ...initialPermissions };
            
            for (const permission of ['camera', 'microphone', 'location', 'notifications']) {
              const hasPermission = await checkPermissionStatus(permission);
              updatedPermissions[permission] = hasPermission;
            }
            
            setPermissions(updatedPermissions);
            
            // Update Firebase with current status
            await updateDoc(doc(db, "users", user.uid), {
              devicePermissions: updatedPermissions
            });
          }
        }
      } catch (err) {
        console.error("Error initializing device permissions:", err);
      }
    };
    
    initializePermissions();
  }, []);

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      <h3 className="text-lg font-medium mb-2">Device permissions</h3>
      <p className="text-sm mb-4">Manage what this app can access on your device</p>
      
      <div className="space-y-4">
        {Object.entries({
          camera: 'Camera',
          microphone: 'Microphone',
          location: 'Location services',
          notifications: 'Notifications',
          contacts: 'Contacts',
          photos: 'Photos'
        }).map(([key, label]) => (
          <div key={key} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              {key === 'camera' && <FaVideo style={getIconStyle()} />}
              {key === 'microphone' && <FaMicrophone style={getIconStyle()} />}
              {key === 'location' && <FaMapMarkerAlt style={getIconStyle()} />}
              {key === 'notifications' && <FaBell style={getIconStyle()} />}
              {key === 'contacts' && <FaUsers style={getIconStyle()} />}
              {key === 'photos' && <FaImage style={getIconStyle()} />}
              <span>{label}</span>
            </div>
            <button
              onClick={() => handlePermissionToggle(key)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                permissions[key] 
                  ? 'justify-end bg-blue-500' 
                  : 'justify-start bg-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white"></div>
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-white/10 rounded-lg">
        <p className="text-xs text-gray-400">
          Note: Some permissions require explicit user approval through browser dialogs.
          The toggle will update once you grant or deny the permission.
        </p>
      </div>
    </div>
  );
};

const SettingsAndActivityContent = ({ selectedColor, isMobileView }) => {
  const [expandedSections, setExpandedSections] = useState({
    limitInteractions: false,
    hiddenWords: false,
    followAndInvite: false,
    whatYouSee: false,
    appAndMedia: false
  });

  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return 
};

const RestrictedAccountsContent = ({ selectedColor, isMobileView }) => {
  const [restrictedAccounts, setRestrictedAccounts] = useState([
    { id: 1, username: "fathimahudhabedi", name: "Fathima Hudha Bedi" },
    { id: 2, username: "ahsan_ali_janjuaa", name: "AhSafif Ali Jabujala" },
    { id: 3, username: "hari_krish9494", name: "Hari Krishna Pasuputetu" },
    { id: 4, username: "komalrajmanidi", name: "Komsi Raj Mamidi" },
    { id: 5, username: "_de_ad__of__wri_to_", name: "S__adshuk" }
  ]);

  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  const handleUnrestrict = (id) => {
    setRestrictedAccounts(prev => prev.filter(account => account.id !== id));
  };

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      <h3 className="text-lg font-medium mb-2">Restricted accounts</h3>
      <p className="text-sm mb-4">
        Limit interactions from someone without having to block or unfollow them.
        <a href="#" className="text-blue-500 ml-1">Learn how it works</a>
      </p>
      
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full p-2 pl-8 rounded bg-white/10 border border-white/20"
          />
          <FaSearch className="absolute left-2 top-3 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          {restrictedAccounts.map(account => (
            <div key={account.id} className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.1)] rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                  {account.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{account.username}</div>
                  <div className="text-xs text-gray-400">{account.name}</div>
                </div>
              </div>
              <button 
                onClick={() => handleUnrestrict(account.id)}
                className="text-sm px-3 py-1 rounded"
                style={{ backgroundColor: selectedColor }}
              >
                Unrestrict
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TagsMentionsContent = ({ selectedColor, isMobileView }) => {
  const [showTagsOptions, setShowTagsOptions] = useState(false);
  const [showMentionsOptions, setShowMentionsOptions] = useState(false);
  const [showPendingTags, setShowPendingTags] = useState(false);
  const [showMentionedTags, setShowMentionedTags] = useState(false);
  const [tagsPermission, setTagsPermission] = useState("peopleYouFollow");
  const [mentionsPermission, setMentionsPermission] = useState("everyone");
  const [manualApproveTags, setManualApproveTags] = useState(false);
  
  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  const handleTagsPermissionChange = (value) => {
    setTagsPermission(value);
  };

  const handleMentionsPermissionChange = (value) => {
    setMentionsPermission(value);
  };

  const toggleManualApproveTags = () => {
    setManualApproveTags(!manualApproveTags);
  };

  const mentionedTags = [
    { id: 1, username: "user1", name: "User One", postId: "post123", timestamp: new Date().toLocaleString() },
    { id: 2, username: "user2", name: "User Two", postId: "post456", timestamp: new Date().toLocaleString() }
  ];

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      <div 
        className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setShowTagsOptions(!showTagsOptions)}
      >
        <div className="flex items-center gap-3">
          <FaTag style={getIconStyle()} />
          <span>Tags and Mentions</span>
        </div>
        {showTagsOptions ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {showTagsOptions && (
        <div className="pl-8 space-y-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-medium">Who can tag you</h4>
            <div className="space-y-2 pl-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tagsPermission"
                  checked={tagsPermission === "everyone"}
                  onChange={() => handleTagsPermissionChange("everyone")}
                  className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
                />
                <span>Everyone</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tagsPermission"
                  checked={tagsPermission === "peopleYouFollow"}
                  onChange={() => handleTagsPermissionChange("peopleYouFollow")}
                  className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
                />
                <span>People you follow</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tagsPermission"
                  checked={tagsPermission === "noOne"}
                  onChange={() => handleTagsPermissionChange("noOne")}
                  className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
                />
                <span>Don't allow tags</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">How you manage tags</h4>
            <div className="flex items-center justify-between pl-2">
              <span>Manually approve tags</span>
              <button
                onClick={toggleManualApproveTags}
                className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${manualApproveTags ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-200 ${manualApproveTags ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>

          <div 
            className="flex items-center justify-between pl-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer"
            onClick={() => setShowPendingTags(!showPendingTags)}
          >
            <span>Pending Tags</span>
            {showPendingTags ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
          </div>
          {showPendingTags && (
            <div className="pl-4 space-y-2 text-sm">
              <p className="text-xs text-gray-400">No pending tags yet</p>
            </div>
          )}

          <div 
            className="flex items-center justify-between pl-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer"
            onClick={() => setShowMentionedTags(!showMentionedTags)}
          >
            <span>Mentioned Tags</span>
            {showMentionedTags ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
          </div>
          {showMentionedTags && (
            <div className="pl-4 space-y-2 text-sm">
              {mentionedTags.length > 0 ? (
                mentionedTags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-xs">
                        {tag.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm">{tag.username}</div>
                        <div className="text-xs text-gray-400">{tag.name}</div>
                        <div className="text-xs text-gray-400">Tagged in post: {tag.postId}</div>
                        <div className="text-xs text-gray-400">{tag.timestamp}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No mentioned tags yet</p>
              )}
            </div>
          )}

          
        </div>
      )}
    </div>
  );
};

const AccountSettingsContent = ({
  selectedColor,
  accountType,
  handleAccountTypeChange,
  showDropdown,
  setShowTagsDropdown,
  showTagsDropdown,
  setShowCommentsDropdown,
  showCommentsDropdown,
  colors,
  handleColorChange,
  isMobileView,
  accountSettingsBg,
  userProfile,
  navigate
}) => {
  const [activeSection, setActiveSection] = useState("accountType");
  
  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  return (
   <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
     
      <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setActiveSection(activeSection === "passwordSecurity" ? "" : "passwordSecurity")}
      >
        <FaLock style={getIconStyle()} />
        <span>Password and Security</span>
      </div>
      {activeSection === "passwordSecurity" && (
        <PasswordSecurityContent 
          selectedColor={selectedColor} 
          isMobileView={isMobileView} 
          userProfile={userProfile} // Pass userProfile here
        />
      )}


      <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setActiveSection(activeSection === "personalDetails" ? "" : "personalDetails")}
      >
        <FaUserCog style={getIconStyle()} />
        <span>Personal Details</span>
      </div>
      {activeSection === "personalDetails" && (
        <PersonalDetailsContent selectedColor={selectedColor} isMobileView={isMobileView} userProfile={userProfile} />
      )}

      <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setActiveSection(activeSection === "devicePermissions" ? "" : "devicePermissions")}
      >
        <FaShieldAlt style={getIconStyle()} />
        <span>Device permissions</span>
      </div>
      {activeSection === "devicePermissions" && (
        <DevicePermissionsContent selectedColor={selectedColor} isMobileView={isMobileView} />
      )}

     

     <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => navigate("/subscription")}
      >
        <FaCreditCard style={getIconStyle()} />
        <span>Subscriptions</span>
      </div>

      <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => navigate("/termsandconditions")}
      >
        <FaCreditCard style={getIconStyle()} />
        <span>Terms & Condition</span>
      </div>

      <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setActiveSection(activeSection === "hideStories" ? "" : "hideStories")}
      >
        <FaEyeSlash style={getIconStyle()} />
        <span>Hide Stories</span>
      </div>
      {activeSection === "hideStories" && (
        <HideStoriesContent selectedColor={selectedColor} isMobileView={isMobileView} />
      )}
      

      <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setActiveSection(activeSection === "tagsMentions" ? "" : "tagsMentions")}
      >
        <FaTag style={getIconStyle()} />
        <span>Tags and Mentions</span>
      </div>
      {activeSection === "tagsMentions" && (
        <TagsMentionsContent selectedColor={selectedColor} isMobileView={isMobileView} />
      )}

      <div className="p-2">
        <div className="flex items-center gap-3 mb-2">
          <FaPalette style={getIconStyle()} />
          <span>Theme Color</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all duration-200 ${
                selectedColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, closeMenu, userProfile }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showCommentsDropdown, setShowCommentsDropdown] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#5DE0E6");
  const [accountType, setAccountType] = useState("public");
  // const [showTournamentDropdown, setShowTournamentDropdown] = useState(false); 
  const [accountSettingsBg, setAccountSettingsBg] = useState("rgb(93, 224, 230, 0.5)");

  const accountSettingsPanelRef = useRef(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const MD_BREAKPOINT = 768;

  const colors = [
    "#5DE0E6", "#FF6B6B", "#48BB78", "#F6AD55", 
    "#667EEA", "#9F7AEA", "#ED64A6", "#38B2AC"
  ];
  const [hasPlayerId, setHasPlayerId] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [displayedProfile, setDisplayedProfile] = useState(userProfile || {});

  // Function to generate unique player ID (moved from AddPlayer)
  const generateUniquePlayerId = async () => {
    const playersCollectionRef = collection(db, 'PlayerDetails');
    const snapshot = await getDocs(playersCollectionRef);
    const existingIds = snapshot.docs.map(doc => doc.data().playerId).filter(id => id);

    let newId;
    do {
      newId = Math.floor(100000 + Math.random() * 900000);
    } while (existingIds.includes(newId));


    return newId;
  };

// Replace both useEffect hooks with this single one
useEffect(() => {
  const checkAndGeneratePlayerId = async () => {
    if (!userProfile?.uid) return;
    
    try {
      const q = query(collection(db, 'PlayerDetails'), where('userId', '==', userProfile.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // User already has a player ID
        querySnapshot.forEach((doc) => {
          if (doc.data().playerId) {
            setHasPlayerId(true);
            setPlayerId(doc.data().playerId);
          }
        });
      } else {
        // User doesn't have a player ID, generate one
        const newPlayerId = await generateUniquePlayerId();
        
        // Create basic player document
        await setDoc(doc(db, "PlayerDetails", newPlayerId.toString()), {
          playerId: newPlayerId,
          userId: userProfile.uid,
          name: userProfile.firstName || userProfile.userName || "User",
          createdAt: new Date(),
          // Add other default fields as needed
        });
        
        // Update user profile with player ID
        await updateDoc(doc(db, "users", userProfile.uid), {
          playerId: newPlayerId.toString()
        });
        
        setHasPlayerId(true);
        setPlayerId(newPlayerId.toString());
      }
    } catch (err) {
      console.error("Error checking/generating player details:", err);
      setHasPlayerId(false);
      setPlayerId('');
    }
  };

  checkAndGeneratePlayerId();
}, [userProfile]);


  useEffect(() => {
    const checkPlayerDetails = async () => {
      if (userProfile?.uid) {
        try {
          const q = query(collection(db, 'PlayerDetails'), where('userId', '==', userProfile.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              if (doc.data().playerId) {
                setHasPlayerId(true);
                setPlayerId(doc.data().playerId);
                return;
              }
            });
          } else {
            setHasPlayerId(false);
            setPlayerId('');
          }
        } catch (err) {
          console.error("Error checking player details:", err);
          setHasPlayerId(false);
          setPlayerId('');
        }
      }
    };

    checkPlayerDetails();
  }, [userProfile]);

  useEffect(() => {
    const checkMobileView = () => setIsMobileView(window.innerWidth < MD_BREAKPOINT);
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMobileView && showAccountSettings && accountSettingsPanelRef.current && !accountSettingsPanelRef.current.contains(event.target)) {
        setShowAccountSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAccountSettings, isMobileView]);

  useEffect(() => {
    if (!isOpen && showAccountSettings) {
      setShowAccountSettings(false);
    }
  }, [isOpen, showAccountSettings]);

  useEffect(() => {
    if (userProfile) {
      setSelectedColor(userProfile.themeColor || "#5DE0E6");
      setAccountType(userProfile.accountType || "public");
      setAccountSettingsBg(`rgba(${hexToRgb(userProfile.themeColor || "#5DE0E6")}, 0.2)`);
      setDisplayedProfile(userProfile);
    }
  }, [userProfile]);

  // Real-time listener for user profile updates
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDisplayedProfile((prev) => ({
          ...prev,
          userName: data.firstName || data.userName || "User", // Assuming userName is alias for firstName
          email: data.email,
          whatsapp: data.whatsapp,
          // Add other fields as needed
        }));
      }
    }, (err) => {
      console.error("Error in real-time profile listener:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleColorChange = async (color) => {
    setSelectedColor(color);
    setAccountSettingsBg(`rgba(${hexToRgb(color)}, 0.2)`);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        themeColor: color,
      });
    } catch (err) {
      console.error("Error updating theme color:", err);
    }
  };

  const handleAccountTypeChange = async (type) => {
    setAccountType(type);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        accountType: type,
      });
    } catch (err) {
      console.error("Error updating account type:", err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userProfile?.uid) return;
  
    const storage = getStorage();
    const storageRef = ref(storage, `profileImages/${userProfile.uid}`);
    
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", userProfile.uid), {
        profileImageUrl: downloadURL,
      });
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleCloseAllMenus = () => {
    setShowAccountSettings(false);
    closeMenu();
  };

  const sidebarStyle = { backgroundColor: selectedColor };

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-[220px] md:w-[300px] h-screen shadow-lg
                    transition-transform duration-300 ease-in-out z-[1100] overflow-y-auto select-none
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={sidebarStyle}
      >
        <div className="h-full relative">
          <button 
            className="absolute top-4 right-4 text-xl md:text-2xl text-black cursor-pointer"
            onClick={handleCloseAllMenus}
          >
            <FaTimes />
          </button>

                   {/* Profile Section */}
         <div className="text-center py-4 px-4 mt-6 text-black">
          <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
            {displayedProfile?.profileImageUrl ? (
              <img
                src={displayedProfile.profileImageUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-2 border-black"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold border-2 border-[#5DE0E6]">
                {displayedProfile?.userName ? displayedProfile.userName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

    <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full cursor-pointer shadow-md">
      <FaPlus className="text-black text-xs" />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </label>
  </div>

  <div className="flex items-center justify-center gap-2">
    <h6 className="text-base md:text-lg font-bold">
      {displayedProfile?.userName || "User"}
    </h6>
  </div>
  <p className="text-xs md:text-sm opacity-80 mt-1">{displayedProfile?.email || "No email"}</p>
  <p className="text-xs md:text-sm opacity-80">{displayedProfile?.whatsapp || "No phone"}</p>
  {/* Show player ID if exists, otherwise show plus icon */}
  {hasPlayerId ? (
  <div className="flex items-center justify-center gap-1 mt-1">
    <span className="text-xs md:text-sm opacity-80">Player ID: {playerId}</span>
    <FaPencilAlt 
      className="text-black text-sm cursor-pointer" 
      onClick={() => navigate('/addplayer', { 
        state: { 
          playerId: playerId,
          userProfile: displayedProfile 
        } 
      })}
    />
  </div>
) : (
  <div className="flex items-center justify-center gap-1 mt-1">
    <span className="text-xs md:text-sm opacity-80">About</span>
    <FaPencilAlt 
      className="text-black text-sm cursor-pointer" 
      onClick={() => navigate('/addplayer', { 
        state: { 
          playerId: playerId,
          userProfile: displayedProfile 
        } 
      })}
    />
  </div>
)}
</div>


          {/* Menu Items */}
          <ul className="list-none p-0 mt-4 text-black">
            <li className="px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300" onClick={() => navigate("/awards")}>
              <FaTrophy className="min-w-[20px]" /> CV Cricket Awards
            </li>
            <li 
              className="px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
               onClick={() => navigate("/tournamentseries")}
            >
              {/* <span className="flex items-center gap-2 md:gap-3"> */}
                <FaTrophy className="min-w-[20px]" /> Tournament/Series
              {/* </span> */}
              {/* {showTournamentDropdown ? <FaChevronUp /> : <FaChevronDown />} */}
            </li>
            {/* {showTournamentDropdown && (
              <ul className="pl-6 md:pl-10 border-l-2 border-[#5DE0E6]">
                <li 
                  className="flex items-center px-2 md:px-4 py-1 md:py-2 text-sm cursor-pointer hover:bg-[rgb(68,172,199)] transition-all duration-200"
                  onClick={() => navigate("/pendingTournament",{state:{information: "FromSidebar"}})} 
                >
                  🏏 Pending Tournament
                </li>
                <li 
                  className="flex items-center px-2 md:px-4 py-1 md:py-2 text-sm cursor-pointer hover:bg-[rgb(68,172,199)] transition-all duration-200"
                  onClick={() => navigate("/tournamentseries")} 
                >
                  ➕ Add Tournament
                </li>
              </ul>
            )} */}
            <li className="px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
              onClick={() => navigate('/match-start-sb', { state: { initialTab: 'Start Match', fromSidebar: true } })}>
              <FaUsers className="min-w-[20px]" /> Start a Match
            </li>

            <li 
              className="px-4 py-2 md:px-6 md:py-3 flex items-center justify-between cursor-pointer hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
              onClick={() => navigate("/go-live-upcomming")}>
              <span className="flex items-center gap-2 md:gap-3">
                <FaTv className="min-w-[16px] md:min-w-[20px]" /> Go Live <FaLock className="text-gray-600 ml-1" />
              </span>
            </li>
            
            <li 
              className="px-4 py-2 md:px-6 md:py-3 flex items-center justify-between cursor-pointer hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              <span className="flex items-center gap-2 md:gap-3">
                <FaTrophy className="min-w-[16px] md:min-w-[20px]" /> LeaderBoard
              </span>
              {showDropdown ? <FaChevronUp /> : <FaChevronDown />}
            </li>

            {showDropdown && (
              <ul className="pl-6 md:pl-10 border-l-2 border-[#5DE0E6]">
                <li 
                  className="flex items-center px-2 md:px-4 py-1 md:py-2 text-sm cursor-pointer hover:bg-[rgb(68,172,199)] transition-all duration-200"
                  onClick={() => navigate("/playerpages")} 
                >
                  🏏 Batting <FaLock className="text-gray-600 ml-auto" />
                </li>
                <li 
                  className="flex items-center px-2 md:px-4 py-1 md:py-2 text-sm cursor-pointer hover:bg-[rgb(68,172,199)] transition-all duration-200"
                  onClick={() => navigate("/bowlingPlayerPages")} 
                >
                  🎳 Bowling <FaLock className="text-gray-600 ml-auto" />
                </li>
                <li 
                  className="flex items-center px-2 md:px-4 py-1 md:py-2 text-sm cursor-pointer hover:bg-[rgb(68,172,199)] transition-all duration-200"
                  onClick={() => navigate("/fielding")}
                >
                  🛡️ Fielding <FaLock className="text-gray-600 ml-auto" />
                </li>
                <li 
                  className="flex items-center px-2 md:px-4 py-1 md:py-2 text-sm cursor-pointer hover:bg-[rgb(68,172,199)] transition-all duration-200"
                  onClick={() => navigate("/table-toppers")}
                >
                  🏆 Table Toppers <FaLock className="text-gray-600 ml-auto" />
                </li>
                <li
                  className="flex items-center px-2 md:px-4 py-1 md:py-2 text-sm cursor-pointer hover:bg-[rgb(68,172,199)] transition-all duration-200"
                  onClick={() => navigate("/tournamentStats")}
                >
                  🥇 Tournament stats <FaLock className="text-gray-600 ml-auto" />
                </li>
              </ul>
            )}

            <li className="px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
            onClick={() => navigate("/Clubsmain")} >
              <FaUsers className="min-w-[16px] md:min-w-[20px]" /> Club <FaLock className="text-gray-600 ml-1" />
            </li>
            <li className="px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
              onClick={() => navigate('/community')}>
              <FaUsers className="min-w-[20px]" /> Community
            </li>
            
            <li
              className={`px-4 py-2 md:px-6 md:py-3 flex items-center justify-between cursor-pointer ${isMobileView ? 'hover:bg-white/10' : 'hover:bg-[rgba(0,0,0,0.1)]'} transition-all duration-300`}
              onClick={(e) => {
                e.stopPropagation();
                setShowAccountSettings(!showAccountSettings);
              }}
            >
              <span className="flex items-center gap-2 md:gap-3">
                <FaUserCog className="min-w-[16px] md:min-w-[20px]" /> Account Settings
              </span>
              {isMobileView && (showAccountSettings ? <FaChevronUp /> : <FaChevronDown />)}
            </li>
            
            {showAccountSettings && isMobileView && (
              <div 
                className="text-black"
                style={{ backgroundColor: accountSettingsBg }}
              >
                <div className={`pl-6 border-l-2 ${isMobileView ? 'border-white/50' : 'border-[#5DE0E6]'}`}>
                  <AccountSettingsContent
                    selectedColor={selectedColor} 
                    accountType={accountType}
                    handleAccountTypeChange={handleAccountTypeChange}
                    showTagsDropdown={showTagsDropdown}
                    setShowTagsDropdown={setShowTagsDropdown}
                    showCommentsDropdown={showCommentsDropdown}
                    setShowCommentsDropdown={setShowCommentsDropdown}
                    colors={colors}
                    handleColorChange={handleColorChange}
                    isMobileView={isMobileView}
                    userProfile={displayedProfile}
                    navigate={navigate} // Updated to use displayedProfile
                  />
                </div>
              </div>
            )}
          </ul>
          <button 
            className="w-[calc(100%-32px)] mx-4 my-4 py-2 md:py-3 bg-black text-white flex items-center justify-center gap-2 rounded-lg hover:bg-[#d32f2f] transition-all duration-300"
            onClick={handleSignOut}
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      {/* Account Settings Panel */}
      {showAccountSettings && !isMobileView && (
        <div
          ref={accountSettingsPanelRef}
          className="fixed top-0 left-[220px] md:left-[300px] w-[280px] h-full shadow-xl rounded-lg p-0 text-white z-[1200] overflow-y-auto"
          style={{
            borderTop: `4px solid ${selectedColor}`,
            backgroundColor: accountSettingsBg,
            boxShadow: `0 0 10px ${selectedColor}20`
          }}
        >
          <div className="flex justify-between items-center p-4">
            <h3 className="font-bold text-lg" style={{ color: selectedColor }}>
              Account Settings
            </h3>
            <FaTimes
              className="cursor-pointer"
              onClick={() => setShowAccountSettings(false)}
              style={{ color: selectedColor }}
            />
          </div>
          <AccountSettingsContent
            selectedColor={selectedColor}
            accountType={accountType}
            handleAccountTypeChange={handleAccountTypeChange}
            showTagsDropdown={showTagsDropdown}
            setShowTagsDropdown={setShowTagsDropdown}
            showCommentsDropdown={showCommentsDropdown}
            setShowCommentsDropdown={setShowCommentsDropdown}
            colors={colors}
            handleColorChange={handleColorChange}
            isMobileView={isMobileView}
            userProfile={displayedProfile}
            navigate={navigate} // Updated to use displayedProfile
          />
        </div>
      )}

      {/* Background Overlay */}
      {isOpen && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-[rgba(0,0,0,0.5)] backdrop-blur-sm transition-opacity duration-300 ease-in-out z-[1050]"
          onClick={handleCloseAllMenus}
        />
      )}
    </>
  );
};

export default Sidebar;
