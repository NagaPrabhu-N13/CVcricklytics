// // ✅ IMPORTS ADDED
// import { useState } from "react";
// import img from "../../../assets/yogesh/login/img1.png";
// import googleImg from "../../../assets/yogesh/login/google.png";
// import whatsap_signup from "../../../assets/yogesh/login/whatsap_signup.png";
// import { Link, useNavigate } from "react-router-dom";

// import { auth, db } from "../../../firebase"; // ✅ Firebase Auth & Firestore
// import {
//   createUserWithEmailAndPassword,
//   sendEmailVerification,
// } from "firebase/auth";
// import { doc, setDoc, getDoc } from "firebase/firestore";
// import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { FacebookAuthProvider } from "firebase/auth";


// export default function Signup() {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     firstName: "",
//     dob: "",
//     email: "",
//     whatsapp: "",
//     password: "", // ✅ Password field added for Firebase Auth
//   });

//   const [error, setError] = useState("");
//   const [message, setMessage] = useState("");

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // ✅ Signup handler with validation, auth, email verification, Firestore
//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setError("");
//     setMessage("");
  
//     const { firstName, dob, email, whatsapp, password } = formData;
  
//     if (!firstName || !dob || !email || !whatsapp || !password) {
//       setError("Please fill in all fields before continuing.");
//       return;
//     }
  
//     if (!email.includes("@") || password.length < 6) {
//       setError("Invalid email or password too short");
//       return;
//     }
  
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;
  
//       await sendEmailVerification(user);
  
//       await setDoc(doc(db, "users", user.uid), {
//         uid: user.uid,
//         firstName,
//         dob,
//         email,
//         whatsapp,
//         createdAt: new Date().toISOString(),
//       });
  
//       setMessage("Verification email sent. Please check your inbox.");
  
//       // Poll to check if email is verified
//       const interval = setInterval(async () => {
//         await user.reload();
//         if (user.emailVerified) {
//           clearInterval(interval);
//           setMessage("Email verified successfully! Redirecting to login...");
//           setTimeout(() => {
//             navigate("/login");
//           }, 2000);
//         }
//       }, 3000); // check every 3 seconds
//     } catch (err) {
//       setError(err.message);
//     }
//   };
  
// const handleGoogleSignup = async () => {
//   setError("");
//   setMessage("");

//   const provider = new GoogleAuthProvider();

//   try {
//     const result = await signInWithPopup(auth, provider);
//     const user = result.user;

//     const displayName = user.displayName || "";
//     const email = user.email || "";

//     // 🔥 Immediately delete this temporary user from Firebase Auth
//     await user.delete();

//     // ✅ Autofill form only
//     setFormData((prev) => ({
//       ...prev,
//       firstName: displayName.split(" ")[0] || "",
//       email: email,
//     }));

//     setMessage("Google autofill complete! Please finish the form and click Sign Up.");
//   } catch (err) {
//     setError("Google autofill failed. Please try again.");
//     console.error("Google sign-in error:", err);
//   }
// };

// const handleFacebookSignup = async () => {
//   setError("");
//   setMessage("");

//   const provider = new FacebookAuthProvider();

//   try {
//     const result = await signInWithPopup(auth, provider);
//     const user = result.user;

//     const displayName = user.displayName || "";
//     const email = user.email || "";

//     // 🔥 Immediately delete the temporary Firebase Auth account
//     await user.delete();

//     // ✅ Autofill form only
//     setFormData((prev) => ({
//       ...prev,
//       firstName: displayName.split(" ")[0] || "",
//       email: email,
//     }));

//     setMessage("Facebook autofill complete! Please finish the form and click Sign Up.");
//   } catch (err) {
//     setError("Facebook autofill failed. Please try again.");
//     console.error("Facebook sign-in error:", err);
//   }
// };


  
  
  


//   return (
//     <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gradient-to-r from-[#0a1f44] to-[#123456] p-6 md:p-12 ">
//       <div className="flex items-center justify-center w-full md:w-1/2">
//         <img src={img} alt="Cricket Player" className="max-w-xs md:max-w-md lg:max-w-lg h-auto object-contain" />
//       </div>

//       <div className="w-full md:w-1/2 max-w-lg bg-opacity-90 px-6 md:px-12 py-8 rounded-lg">
//         <h1 className="text-3xl md:text-4xl font-semibold text-cyan-400 mb-4 text-center">Cricklytics</h1>
//         <p className="text-gray-400 text-center mb-6">Express sign-up via Google and whatsApp</p>

//         <div className="flex flex-col md:flex-row gap-4 mb-6">
//           <button onClick={handleGoogleSignup} className="flex items-center justify-center gap-3 bg-teal-800 text-black px-6 py-3 rounded-lg hover:bg-gray-200 w-full">
//             <img src={googleImg} alt="Google" className="w-6" />
//             Google
//           </button>
//           <button onClick={handleFacebookSignup}
//            className="flex items-center justify-center gap-3 bg-teal-800 text-black px-6 py-3 rounded-lg hover:bg-white w-full">
//             <img src={whatsap_signup} alt="whatsapp" className="w-10 h-10" />
//            WhatApp
//           </button>
//         </div>

//         <form onSubmit={handleSignup} className="space-y-4">
//           <input
//             type="text"
//             name="firstName"
//             placeholder="First name"
//             className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400"
//             onChange={handleChange}
//             value={formData.firstName}
//           />
//           <input
//             type="date"
//             name="dob"
//             className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400"
//             onChange={handleChange}
//             value={formData.dob}
//           />
//           <input
//             type="email"
//             name="email"
//             placeholder="Email address"
//             className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400"
//             onChange={handleChange}
//             value={formData.email}
//           />
//           <input
//             type="text"
//             name="whatsapp"
//             placeholder="Whatsapp number"
//             className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400"
//             onChange={handleChange}
//           />
//           {/* ✅ Password Field added */}
//           <input
//             type="password"
//             name="password"
//             placeholder="Create password"
//             className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400"
//             onChange={handleChange}
//           />

//           {/* ✅ Show errors/messages */}
//           {error && <p className="text-red-500 text-sm">{error}</p>}
//           {message && <p className="text-green-400 text-sm">{message}</p>}

//           <button
//             type="submit"
//             className="w-full bg-gradient-to-r from-cyan-300 to-teal-700 text-white py-3 rounded-lg mt-2 hover:bg-cyan-500 text-lg"
//           >
//             Sign up
//           </button>
//         </form>
//       </div>
      
//     </div>
//   );
// }

import { useState, useRef } from "react";
import img from "../../../assets/yogesh/login/img1.png";
import googleImg from "../../../assets/yogesh/login/google.png";
import whatsap_signup from "../../../assets/yogesh/login/whatsap_signup.png";
import { Link, useNavigate } from "react-router-dom";

import { auth, db } from "../../../firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FacebookAuthProvider } from "firebase/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    dob: "",
    email: "",
    whatsapp: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [usernameAfterOtp, setUsernameAfterOtp] = useState("");

  const otpInputs = useRef([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { firstName, dob, email, whatsapp, password } = formData;

    if (!firstName || !dob || !email || !whatsapp || !password) {
      setError("Please fill in all fields before continuing.");
      return;
    }

    if (!email.includes("@") || password.length < 6) {
      setError("Invalid email or password too short");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName,
        dob,
        email,
        whatsapp,
        createdAt: new Date().toISOString(),
      });

      setMessage("Verification email sent. Please check your inbox.");

      const interval = setInterval(async () => {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          setMessage("Email verified successfully! Redirecting to login...");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setMessage("");

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await user.delete();

      setFormData((prev) => ({
        ...prev,
        firstName: user.displayName?.split(" ")[0] || "",
        email: user.email || "",
      }));

      setMessage("Google autofill complete! Please finish the form and click Sign Up.");
    } catch (err) {
      setError("Google autofill failed. Please try again.");
      console.error("Google sign-in error:", err);
    }
  };

  const handleFacebookSignup = async () => {
    setError("");
    setMessage("");

    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await user.delete();

      setFormData((prev) => ({
        ...prev,
        firstName: user.displayName?.split(" ")[0] || "",
        email: user.email || "",
      }));

      setMessage("Facebook autofill complete! Please finish the form and click Sign Up.");
    } catch (err) {
      setError("Facebook autofill failed. Please try again.");
      console.error("Facebook sign-in error:", err);
    }
  };

  const setupRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
    });
  };

  const handleSendOtp = async () => {
    setError("");
    setMessage("");

    if (!phoneNumber) {
      setError("Please enter a valid phone number.");
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, appVerifier);
      setConfirmationResult(result);
      setMessage("OTP sent to your phone!");
    } catch (err) {
      setError("Failed to send OTP: " + err.message);
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6 || !confirmationResult) {
      setError("Please enter the full 6-digit OTP.");
      return;
    }

    try {
      const result = await confirmationResult.confirm(fullOtp);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        phoneNumber: `+91${phoneNumber}`,
        firstName: usernameAfterOtp,
        createdAt: new Date().toISOString(),
      });

      navigate("/landingpage");
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleOtpInputChange = (index, value) => {
    if (value.length > 1) return;
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gradient-to-r from-[#0a1f44] to-[#123456] p-6 md:p-12 relative">
      {/* OTP Modal */}
      {showOtpModal && (
        <div className="absolute inset-0 backdrop-blur-[5px] bg-transparent flex justify-center items-center z-50">
          <div className="bg-[#0a1f44] text-white p-6 rounded-xl w-[90%] max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Phone Verification</h2>
              <button onClick={() => setShowOtpModal(false)} className="text-white text-2xl">&times;</button>
            </div>
            <input
              type="text"
              placeholder="Enter phone number"
              className="w-full mb-4 px-4 py-2 rounded bg-gray-800 focus:ring-2 focus:ring-cyan-400"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <div id="recaptcha-container"></div>
            <button
              onClick={handleSendOtp}
              className="w-full bg-teal-700 text-white py-2 rounded mb-4 hover:bg-teal-600"
            >
              Send OTP
            </button>

            {/* OTP input */}
            <div className="flex justify-between gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInputChange(index, e.target.value)}
                  ref={(el) => (otpInputs.current[index] = el)}
                  className="w-10 h-10 text-center rounded bg-gray-800 text-white text-lg"
                />
              ))}
            </div>

            <input
              type="text"
              placeholder="Enter username"
              className="w-full px-4 py-2 rounded bg-gray-800 mb-4 focus:ring-2 focus:ring-cyan-400"
              value={usernameAfterOtp}
              onChange={(e) => setUsernameAfterOtp(e.target.value)}
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-gradient-to-r from-cyan-400 to-teal-600 text-white py-2 rounded hover:opacity-90"
            >
              Verify & Continue
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {message && <p className="text-green-400 text-sm mt-2">{message}</p>}
          </div>
        </div>
      )}

      {/* Left image */}
      <div className="flex items-center justify-center w-full md:w-1/2">
        <img src={img} alt="Cricket Player" className="max-w-xs md:max-w-md lg:max-w-lg h-auto object-contain" />
      </div>

      {/* Form */}
      <div className="w-full md:w-1/2 max-w-lg bg-opacity-90 px-6 md:px-12 py-8 rounded-lg">
        <h1 className="text-3xl md:text-4xl font-semibold text-cyan-400 mb-4 text-center">Cricklytics</h1>
        <p className="text-gray-400 text-center mb-6">Express sign-up via Google and WhatsApp</p>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button onClick={handleGoogleSignup} className="flex items-center justify-center gap-3 bg-teal-800 text-black px-6 py-3 rounded-lg hover:bg-gray-200 w-full">
            <img src={googleImg} alt="Google" className="w-6" />
            Google
          </button>
          <button
            onClick={() => setShowOtpModal(true)}
            className="flex items-center justify-center gap-3 bg-teal-800 text-black px-6 py-3 rounded-lg hover:bg-white w-full"
          >
            <img src={whatsap_signup} alt="whatsapp" className="w-10 h-10" />
            WhatsApp
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <input type="text" name="firstName" placeholder="First name" className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400" onChange={handleChange} value={formData.firstName} />
          <input type="date" name="dob" className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400" onChange={handleChange} value={formData.dob} />
          <input type="email" name="email" placeholder="Email address" className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400" onChange={handleChange} value={formData.email} />
          <input type="text" name="whatsapp" placeholder="WhatsApp number" className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400" onChange={handleChange} />
          <input type="password" name="password" placeholder="Create password" className="w-full px-5 py-3 rounded bg-gray-800 text-white focus:ring-2 focus:ring-cyan-400" onChange={handleChange} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}
          <button type="submit" className="w-full bg-gradient-to-r from-cyan-300 to-teal-700 text-white py-3 rounded-lg mt-2 hover:bg-cyan-500 text-lg">
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
