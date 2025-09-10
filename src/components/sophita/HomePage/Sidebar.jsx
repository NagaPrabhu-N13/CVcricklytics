import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTimes, FaTrophy, FaUsers, FaTv, FaStar, FaSignOutAlt,
  FaChevronDown, FaChevronUp, FaLock, FaPencilAlt, 
  FaEye, FaEyeSlash, FaShieldAlt, FaUserCog, FaCreditCard,
  FaTag, FaAt, FaComment, FaPalette, FaCheck, FaEnvelope,
  FaMobile, FaCalendarAlt, FaIdCard, FaKey, FaBell,
  FaFacebook, FaWhatsapp, FaInstagram, FaTwitter, FaSearch, FaCog
} from "react-icons/fa";
// import { LockKeyholeIcon } from "lucide-react";
import { auth, db } from "../../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Two-Step Verification</h3>
      
      {!isPhoneVerified ? (
        <div>
          <p className="text-sm mb-4">
            To turn on 2-Step Verification, you first need to add a second step to your Google Account, like a phone number
          </p>
          
          {!showVerification ? (
            <form onSubmit={handleAddPhone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm">Phone number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2 rounded bg-white/10 border border-white/20"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-2 rounded"
                style={{ backgroundColor: selectedColor }}
              >
                Add phone number
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm">
                Enter the verification code sent to {phoneNumber}
              </p>
              
              <div className="space-y-1">
                <label className="text-sm">Verification code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full p-2 rounded bg-white/10 border border-white/20"
                  placeholder="Enter code"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="px-4 py-2 text-sm rounded bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded"
                  style={{ backgroundColor: selectedColor }}
                >
                  Verify
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm mb-4">
            Prevent hackers from accessing your account with an additional layer of security. 
            Unless you're signing in with a passkey, you'll be asked to complete the most secure 
            second step available on your account.
          </p>
          
          <div className="bg-white/10 p-3 rounded mb-4">
            <div className="flex items-center gap-2">
              <FaMobile className="text-lg" />
              <span className="font-medium">Phone ({phoneNumber})</span>
            </div>
          </div>
          
          <button
            onClick={handleEnable2FA}
            className="w-full py-2 rounded font-medium"
            style={{ backgroundColor: selectedColor }}
          >
            Turn on 2-Step Verification
          </button>
        </div>
      )}
      
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      {success && <div className="text-green-500 text-sm mt-2">{success}</div>}
    </div>
  );
};

const LoginDetails = ({ selectedColor, isMobileView }) => {
  const [loginDetails, setLoginDetails] = useState([]);
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

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
      <p className="text-sm mb-4">Devices where you are currently logged in:</p>
      {loginDetails.length > 0 ? (
        <div className="space-y-3">
          {loginDetails.map((login, index) => (
            <div key={index} className="p-2 bg-white/10 rounded">
              <div className="text-sm">Device: {login.device}</div>
              <div className="text-xs text-gray-400">Last Login: {new Date(login.timestamp).toLocaleString()}</div>
              <div className="text-xs text-gray-400">IP Address: {login.ipAddress}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No login details available</p>
      )}
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

  return (
    <div className={`p-4 ${getTextStyleClass()}`}>
      <h3 className="text-lg font-medium mb-4">Account Login Settings</h3>
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name="loginSetting"
            checked={loginSetting === "requireLogin"}
            onChange={() => handleLoginSettingChange("requireLogin")}
            className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
          />
          <span>Require login</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name="loginSetting"
            checked={loginSetting === "noLogin"}
            onChange={() => handleLoginSettingChange("noLogin")}
            className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
          />
          <span>Allow access without login</span>
        </label>
      </div>
    </div>
  );
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

const PasswordSecurityContent = ({ selectedColor, isMobileView }) => {
  const [showPasswordOptions, setShowPasswordOptions] = useState(false);
  const [showSecurityChecks, setShowSecurityChecks] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [show2FAForm, setShow2FAForm] = useState(false);
  const [showLoginDetails, setShowLoginDetails] = useState(false);
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
        />
      )}
      
      {showAccountLoginSettings && (
        <AccountLoginSettings
          selectedColor={selectedColor}
          isMobileView={isMobileView}
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
          <p className="text-xs text-gray-400 p-1">
            Choose a strong password and don't reuse it for other accounts.
          </p>
          <p className="text-xs text-gray-400 p-1">
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
          <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer">
            Where you're logged in
          </div>
          <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer" onClick={() => setShowLoginDetails(true)}>
            Login details
          </div>
          <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer">
            Login alerts
          </div>
          <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer">
            Recent emails
          </div>
          <div className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer">
            Security checkup
          </div>
        </div>
      )}
      
      <div 
        className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setShow2FAForm(!show2FAForm)}
      >
        <div className="flex items-center gap-3">
          <FaShieldAlt style={getIconStyle()} />
          <span>Two-factor authentication</span>
        </div>
        {show2FAForm ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      <div 
        className="flex items-center justify-between gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setShowAccountLoginSettings(!showAccountLoginSettings)}
      >
        <div className="flex items-center gap-3">
          <FaLock style={getIconStyle()} />
          <span>Account login settings</span>
        </div>
        {showAccountLoginSettings ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
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
          <span>Date of Birth: {dob || "Not set"}</span>
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
      
      <div className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm">
        <FaCheck style={getIconStyle()} />
        <span>Allow ownership and control</span>
      </div>
    </div>
  );
};

const DevicePermissionsContent = ({ selectedColor, isMobileView }) => {
  const [permissions, setPermissions] = useState({
    camera: true,
    contacts: true,
    location: true,
    microphone: true,
    notifications: true,
    photos: true
  });
  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  const handlePermissionToggle = async (permission) => {
    const newPermissions = {
      ...permissions,
      [permission]: !permissions[permission]
    };
    setPermissions(newPermissions);

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        devicePermissions: newPermissions
      });
    } catch (err) {
      console.error("Error updating device permissions:", err);
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.devicePermissions) {
              setPermissions(data.devicePermissions);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching device permissions:", err);
      }
    };
    fetchPermissions();
  }, []);

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      <h3 className="text-lg font-medium mb-2">Device permissions</h3>
      <p className="text-sm mb-4">Your preferences</p>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span>Camera</span>
          <button
            onClick={() => handlePermissionToggle('camera')}
            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${permissions.camera ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-200 ${permissions.camera ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Contacts</span>
          <button
            onClick={() => handlePermissionToggle('contacts')}
            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${permissions.contacts ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-200 ${permissions.contacts ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Location services</span>
          <button
            onClick={() => handlePermissionToggle('location')}
            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${permissions.location ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-200 ${permissions.location ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Microphone</span>
          <button
            onClick={() => handlePermissionToggle('microphone')}
            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${permissions.microphone ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-200 ${permissions.microphone ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Notifications</span>
          <button
            onClick={() => handlePermissionToggle('notifications')}
            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${permissions.notifications ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-200 ${permissions.notifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Photos</span>
          <button
            onClick={() => handlePermissionToggle('photos')}
            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${permissions.photos ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-200 ${permissions.photos ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
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

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      <h3 className="text-lg font-medium mb-2">Settings and activity</h3>
      
      <div 
        className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer"
        onClick={() => toggleSection('limitInteractions')}
      >
        <span>🔒 Limit interactions</span>
        {expandedSections.limitInteractions ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {expandedSections.limitInteractions && (
        <div className="pl-4 space-y-2 text-sm">
          <p>Control who can interact with your content</p>
        </div>
      )}
      
      <div 
        className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer"
        onClick={() => toggleSection('hiddenWords')}
      >
        <span>🚫 Hidden words</span>
        {expandedSections.hiddenWords ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {expandedSections.hiddenWords && (
        <div className="pl-4 space-y-2 text-sm">
          <p>Manage words you want to filter out</p>
        </div>
      )}
      
      <div 
        className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer"
        onClick={() => toggleSection('followAndInvite')}
      >
        <span>👥 Follow and invite friends</span>
        {expandedSections.followAndInvite ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {expandedSections.followAndInvite && (
        <div className="pl-4 space-y-2 text-sm">
          <p>Manage how people can follow you</p>
        </div>
      )}
      
      <div 
        className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer"
        onClick={() => toggleSection('whatYouSee')}
      >
        <span>👀 What you see</span>
        {expandedSections.whatYouSee ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {expandedSections.whatYouSee && (
        <div className="pl-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span>⭐ Favorites</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔇 Muted accounts</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🎨 Content preferences</span>
          </div>
          <div className="flex items-center gap-2">
            <span>❤️ Like and share counts</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💳 Subscriptions</span>
          </div>
        </div>
      )}
      
      <div 
        className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer"
        onClick={() => toggleSection('appAndMedia')}
      >
        <span>📱 Your app and media</span>
        {expandedSections.appAndMedia ? <FaChevronUp style={getIconStyle()} /> : <FaChevronDown style={getIconStyle()} />}
      </div>
      
      {expandedSections.appAndMedia && (
        <div className="pl-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span>📲 Device permissions</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📥 Archiving and downloading</span>
          </div>
          <div className="flex items-center gap-2">
            <span>♿ Accessibility</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌐 Language and translations</span>
          </div>
        </div>
      )}
    </div>
  );
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
            <div className="pl-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer">
              Review tags
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

          <div className="space-y-2">
            <h4 className="font-medium">Who can @mention you</h4>
            <div className="space-y-2 pl-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mentionsPermission"
                  checked={mentionsPermission === "everyone"}
                  onChange={() => handleMentionsPermissionChange("everyone")}
                  className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
                />
                <span>Everyone</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mentionsPermission"
                  checked={mentionsPermission === "peopleYouFollow"}
                  onChange={() => handleMentionsPermissionChange("peopleYouFollow")}
                  className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
                />
                <span>People you follow</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mentionsPermission"
                  checked={mentionsPermission === "noOne"}
                  onChange={() => handleMentionsPermissionChange("noOne")}
                  className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
                />
                <span>Don't allow mentions</span>
              </label>
            </div>
          </div>
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
  navigate // Add this prop
}) => {
  const [activeSection, setActiveSection] = useState("accountType");
  
  const getIconStyle = () => (isMobileView ? { color: 'black' } : { color: selectedColor });
  const getTextStyleClass = () => (isMobileView ? 'text-black' : '');

  return (
    <div className={`space-y-3 p-2 ${getTextStyleClass()}`}>
      {activeSection === "accountType" && (
        <div className="p-2">
          <div className="flex items-center gap-3 mb-2">
            <FaUserCog style={getIconStyle()} />
            <span>Account Type</span>
          </div>
          <div className="space-y-2 pl-8">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="accountType"
                checked={accountType === "public"}
                onChange={() => handleAccountTypeChange("public")}
                className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
              />
              <span>Public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="accountType"
                checked={accountType === "private"}
                onChange={() => handleAccountTypeChange("private")}
                className="appearance-none w-4 h-4 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 relative"
              />
              <span>Private</span>
            </label>
          </div>
        </div>
      )}

      <div 
        className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded cursor-pointer text-sm"
        onClick={() => setActiveSection(activeSection === "passwordSecurity" ? "" : "passwordSecurity")}
      >
        <FaLock style={getIconStyle()} />
        <span>Password and Security</span>
      </div>
      {activeSection === "passwordSecurity" && (
        <PasswordSecurityContent selectedColor={selectedColor} isMobileView={isMobileView} />
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
        onClick={() => setActiveSection(activeSection === "settingsAndActivity" ? "" : "settingsAndActivity")}
      >
        <FaCog style={getIconStyle()} />
        <span>Settings and activity</span>
      </div>
      {activeSection === "settingsAndActivity" && (
        <SettingsAndActivityContent selectedColor={selectedColor} isMobileView={isMobileView} />
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
        onClick={() => setActiveSection(activeSection === "restrictedAccounts" ? "" : "restrictedAccounts")}
      >
        <FaShieldAlt style={getIconStyle()} />
        <span>Restricted accounts</span>
      </div>
      {activeSection === "restrictedAccounts" && (
        <RestrictedAccountsContent selectedColor={selectedColor} isMobileView={isMobileView} />
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
    }
  }, [userProfile]);

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
            {userProfile?.profileImageUrl ? (
              <img
                src={userProfile.profileImageUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-2 border-black"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold border-2 border-[#5DE0E6]">
                {userProfile?.userName ? userProfile.userName.charAt(0).toUpperCase() : 'U'}
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
      {userProfile?.userName || "User"}
    </h6>
  </div>
  <p className="text-xs md:text-sm opacity-80 mt-1">{userProfile?.email || "No email"}</p>
  <p className="text-xs md:text-sm opacity-80">{userProfile?.whatsapp || "No phone"}</p>

  {/* Show player ID if exists, otherwise show plus icon */}
  {hasPlayerId ? (
    <p className="text-xs md:text-sm opacity-80 mt-1">Player ID: {playerId}</p>
  ) : (
    <div className="flex items-center justify-center gap-1 mt-1">
    <span className="text-xs md:text-sm opacity-80"  onClick={() => navigate('/addplayer')}>About</span>
      <FaPencilAlt className="text-black text-sm cursor-pointer"  onClick={() => navigate('/addplayer')}/>
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
                    userProfile={userProfile}
                    navigate={navigate} // Add this line
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
            userProfile={userProfile}
            navigate={navigate} // Add this line
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