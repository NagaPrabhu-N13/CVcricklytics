import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import img from "../../../assets/yogesh/login/img1.png";
import googleImg from "../../../assets/yogesh/login/google.png";
import { auth, db } from "../../../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import whatsap_signup from "../../../assets/yogesh/login/whatsap_signup.png";
import { toast } from "react-toastify";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");

  // // 🔊 Speak welcome message when modal shows
  // useEffect(() => {
  //   if (showWelcome) {
  //     const message = `Welcome to Cricklytics! Hello, ${userName}`;
  //     const utterance = new SpeechSynthesisUtterance(message);
  //     utterance.lang = "en-US";
  //     utterance.rate = 1;
  //     window.speechSynthesis.speak(utterance);
  //   }
  // }, [showWelcome, userName]);
  

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast.warning("Please verify your email before logging in.");
        setLoading(false);
        return;
      }

      // ✅ Fetch first name from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().firstName || "User");
      } else {
        setUserName("User");
      }

      // setShowWelcome(true); //  Show modal popup
      // setEmail("");
      // setPassword("");

      // //  After 3 seconds, close popup and navigate
      // setTimeout(() => {
      //   setShowWelcome(false);
      //   navigate("/landingpage");
      // }, 6000);
      navigate("/welcome", { state: { userName: userDoc.data().firstName || "User" } });
    } catch (error) {
      toast.error("Invalid credentials or user does not exist.");
      console.error("Login error:", error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store user info in Firestore if not already present
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          firstName: user.displayName || "User",
          createdAt: new Date().toISOString(),
          signupMethod: "google",
        });
      }

      // setUserName(user.displayName || "User");
      // setShowWelcome(true);

      // setTimeout(() => {
      //   setShowWelcome(false);
      //   navigate("/landingpage");
      // }, 3000);
      navigate("/welcome", { state: { userName: user.displayName || "User" } });


      toast.success("Signed in with Google!");
    } catch (error) {
      console.error("Google Sign-In error:", error.message);
      toast.error("Google Sign-In failed");
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.warning("Enter your email address to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error) {
      console.error("Reset error:", error.message);
      toast.error("Error sending reset email.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-[#0a1f44] to-[#123456] relative">
      {/* ✅ Welcome Modal Popup */}
      {/* {showWelcome && (
        <div className="fixed inset-0 backdrop-blur-[5px] bg-transparent flex justify-center items-center z-50">
          <div className="bg-white text-center px-8 py-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Welcome to Cricklytics!</h2>
            <p className="text-gray-700 text-lg">Hello <span className="font-semibold">{userName}</span> 👋</p>
          </div>
        </div>
      )} */}

      <div className="flex max-w-4xl w-full">
        <div className="w-1/2 hidden md:block">
          <img src={img} alt="Cricket Player" className="w-full h-full object-cover" />
        </div>

        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-3xl font-bold text-blue-800 mb-4">Cricklytics</h2>
          <p className="text-gray-400 mb-6">Express sign in via Google</p>

          <div className="flex justify-around mb-6">
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center bg-white w-full py-2 rounded-lg shadow-md hover:bg-blue-200"
            >
              <span className="text-blue-600 font-semibold">GOOGLE</span>
              <img src={googleImg} alt="Google" className="w-5 h-5 ml-2" />
            </button>
            {/* <button
              className="flex items-center justify-center bg-white w-1/2 py-2 rounded-lg shadow-md hover:bg-blue-200"
              disabled
            >
              <span className="text-blue-600 font-semibold">WhatsApp</span>
              <img
                src={whatsap_signup}
                alt="Facebook"
                className="w-10 h-10 ml-2"
              />
            </button> */}
          </div>

          <div className="py-2 rounded-lg shadow-md text-white">
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Sign in</h3>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.956 9.956 0 012.688-6.812M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                )}
              </span>
            </div>

            <p
              onClick={handleForgotPassword}
              className="text-sm text-blue-200 hover:underline cursor-pointer text-right mb-4"
            >
              Forgot Password?
            </p>

            <button
              className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-white font-semibold p-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-center mt-4">
              <Link to="/signup" className="text-blue-300 hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
