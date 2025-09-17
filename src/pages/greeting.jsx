import React, { useEffect, useRef, useState } from 'react';
import '../App.scss';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import coinSound from '../assets/kumar/CoinTossAudio.mp3';
import { useLocation, useNavigate } from "react-router-dom";
import { getDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // Adjust if path differs

function Greeting() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = location.state?.userName || "User";

  const [flipComplete, setFlipComplete] = useState(false); // Will be true after 3s

  const nameRef = useRef(null);
  const [fontSize, setFontSize] = useState("2rem");

  useEffect(() => {
    const userName = location.state?.userName || "User";
    const spinAudio = new Audio(coinSound);
    spinAudio.volume = 0.9;
    spinAudio.loop = false;

    // Play coin sound on page load
    const playCoinSound = async () => {
      try {
        await spinAudio.play();
        console.log("✅ Coin sound playing...");
      } catch (err) {
        console.warn("⚠️ Coin sound play interrupted:", err.message);
      }
    };

    // Play welcome audio after 3 seconds
    const playWelcomeAudio = async () => {
      try {
        const q = query(collection(db, "users"), where("firstName", "==", userName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const audioURL = userDoc.data().welcomeAudio;
          console.log("🎯 welcomeAudio URL:", audioURL);

          if (audioURL) {
            const welcomeAudio = new Audio(audioURL);
            welcomeAudio.volume = 0.7;

            const welcomePlay = welcomeAudio.play();
            if (welcomePlay !== undefined) {
              welcomePlay
                .then(() => {
                  console.log("✅ Welcome audio played.");
                })
                .catch(() => {
                  console.warn("🔒 Welcome audio autoplay blocked.");
                  const resumeWelcome = () => {
                    welcomeAudio.play();
                    document.removeEventListener("click", resumeWelcome);
                  };
                  document.addEventListener("click", resumeWelcome);
                });
            }
          }
        } else {
          console.warn("❌ No user found with that name.");
        }
      } catch (err) {
        console.error("❌ Error fetching or playing welcome audio:", err);
      }
    };

    // Sequence:
    playCoinSound();

    // Set flip complete after 3s (assuming this triggers the 'flipped' class)
    const flipTimer = setTimeout(() => {
      setFlipComplete(true);
    }, 3000);

    const welcomeDelay = setTimeout(() => {
      playWelcomeAudio();
    }, 3000); // 3s delay

    const redirectDelay = setTimeout(() => {
      navigate("/landingpage");
    }, 9000); // Increased to 12s to allow ~7s welcome audio + buffer

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(welcomeDelay);
      clearTimeout(redirectDelay);
      spinAudio.pause();
      spinAudio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    const resizeFont = () => {
      const parentWidth = nameRef.current?.parentElement?.offsetWidth || 0;
      const textWidth = nameRef.current?.scrollWidth || 0;
      const greetElement = document.getElementById('greet');

      if (textWidth > parentWidth) {
        setFontSize("1.4rem"); // Shrink if too wide
      } else {
        setFontSize("2rem"); // Default size
      }

      // Adjust font size for #greet as well based on mobile size
      if (greetElement) {
        if (window.innerWidth <= 480) {
          greetElement.style.fontSize = '3rem'; // Adjust font-size for mobile
        } else {
          greetElement.style.fontSize = 'clamp(3rem, 8vw, 5rem)'; // Default size
        }
      }
    };

    resizeFont();
    window.addEventListener("resize", resizeFont);

    return () => window.removeEventListener("resize", resizeFont);
  }, [userName]);

  return (
    <div className="outer">
      <DotLottieReact
        src="https://lottie.host/42c7d544-9ec0-4aaf-895f-3471daa49e49/a5beFhswU6.lottie"
        style={{
          position: 'absolute',
          top: '10%',
          width: '100%',
          bottom: '25%',
          height: '100%',
        }}
        loop
        autoplay
      />

      <h2 id="greet">Welcome, to Cricklytics</h2>

      <div className={`coin ${flipComplete ? 'flipped' : 'flip-mode'}`}>
        <div className="coin__front">
          <h2
            ref={nameRef}
            className="whitespace-nowrap overflow-hidden font-bold text-center coin-text"
            style={{ maxWidth: "90%", fontSize }}
          >
            {userName}
          </h2>
        </div>
        <div className="coin__edge">
          {[...Array(180)].map((_, i) => (
            <div key={i}></div>
          ))}
        </div>
        <div className="coin__back">
          <h2 className="scarlet-transparent whitespace-nowrap overflow-hidden font-bold text-center coin-text" ref={nameRef} style={{ maxWidth: "90%", fontSize }}>
            {userName}
          </h2>
        </div>
        <div className="coin__shadow"></div>
      </div>
    </div>
  );
}

export default Greeting;
