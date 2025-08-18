import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from '../../../assets/pawan/PlayerProfile/picture-312.png';
import Userprof from '../../../assets/pawan/PlayerProfile/user-placeholder.png';
import bot from '../../../assets/pawan/PlayerProfile/chitti_robot.png';
import { db } from "../../../firebase"; // Adjust path if your firebase config is elsewhere
import {
    doc,
    getDoc,
    collection,
    query as firestoreQuery, // Alias query to avoid conflict with function parameter
    where,
    getDocs,
    limit
} from "firebase/firestore";
import { geminiModel } from "../../../firebase";

const AIAssistance = ({ isAIExpanded, setIsAIExpanded }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const audioRef = useRef(null); // For playing audio URLs from Firebase
    const chatEndRef = useRef(null); // For auto-scrolling

    // Ref to hold available voices once loaded
    const availableVoicesRef = useRef([]);
    // Ref to hold the current SpeechSynthesisUtterance instance
    const utteranceRef = useRef(null);


    // Auto-scroll to the latest message
    useEffect(() => {
        const timer = setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100); // Adjust delay if needed

        return () => clearTimeout(timer); // Cleanup timeout
    }, [messages]);

    // Load voices when the component mounts or voices change in the browser
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                availableVoicesRef.current = voices;
                 console.log("Speech Synthesis voices loaded:", voices);
            }
        };

        // Load voices initially
        loadVoices();

        // Listen for voiceschanged event - necessary because getVoices() might return empty array initially
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Cleanup listener
        return () => {
            if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged) {
                window.speechSynthesis.onvoiceschanged = null;
            }
             // Also stop audio/speech on component unmount
             if (audioRef.current) {
                 audioRef.current.pause();
                 audioRef.current = null;
             }
             if (window.speechSynthesis) {
                  window.speechSynthesis.cancel();
             }
        };
    }, []); // Empty dependency array means this runs once on mount and cleanup on unmount


    // Stop audio/speech when voice is disabled
    useEffect(() => {
        if (!isVoiceEnabled) {
            // Stop Firebase audio if playing
            if (audioRef.current) {
                audioRef.current.pause();
                 // audioRef.current.currentTime = 0; // Optional: reset time
                console.log("Firebase audio paused because voice was disabled.");
            }
            // Stop browser speech synthesis if speaking
            if (window.speechSynthesis && window.speechSynthesis.speaking) {
                 window.speechSynthesis.cancel();
                 console.log("Browser speech synthesis cancelled because voice was disabled.");
            }
        }
    }, [isVoiceEnabled]);


    // Expanded dummy data for matches (scalable for real-time updates) - Keep this as per your new code
    const matches = [
        {
            id: 1,
            teams: "India vs Australia",
            score: "IND 120/2 (15.0 ov)",
            venue: "Wankhede Stadium, Mumbai",
            status: "Live",
            date: "2025-05-01",
        },
        {
            id: 2,
            teams: "England vs South Africa",
            score: "ENG 50/1 (5.0 ov)",
            venue: "Lord's, London",
            status: "Live",
            date: "2025-05-02",
        },
        {
            id: 3,
            teams: "Pakistan vs New Zealand",
            score: "Not started",
            venue: "Gaddafi Stadium, Lahore",
            status: "Upcoming",
            date: "2025-05-03",
        },
    ];

    // Keep your existing getBotResponse function, it now *only* checks Firebase
    const ultimateFallbackText = "Sorry, I couldn't find an answer for that right now.";
    const configErrorFallbackText = "Sorry, there was a configuration issue fetching the response. Please ensure Firestore indexes are set up correctly.";

    const getBotResponse = async (userInput) => {
        const lowerQuery = userInput.toLowerCase().trim();

        if (!lowerQuery) {
            return {
                text: ultimateFallbackText,
                audioUrl: null
            };
        }

        try {
            const assistanceCol = collection(db, "ai_assistance");
            const q = firestoreQuery(
                assistanceCol,
                where("prompt", "==", lowerQuery),
                limit(1)
            );

            console.log(`Executing Firestore query: where("prompt", "==", "${lowerQuery}")`);
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const data = docSnap.data();
                console.log(`Firestore Data found via query (Doc ID: ${docSnap.id}):`, data);
                return {
                    text: data.context || "Response context is missing.",
                    audioUrl: data.audioUrl || null // Return audioUrl if it exists in Firestore
                };
            } else {
                console.log(`No document found matching prompt: "${lowerQuery}". Trying 'default' document ID.`);
                const defaultDocRef = doc(db, "ai_assistance", "default");
                const defaultDocSnap = await getDoc(defaultDocRef);

                if (defaultDocSnap.exists()) {
                    const defaultData = defaultDocSnap.data();
                    console.log("Firestore Data for 'default' document:", defaultData);
                    return {
                        text: defaultData.context || "Default response context is missing.",
                        audioUrl: defaultData.audioUrl || null // Return audioUrl if it exists in Firestore
                    };
                } else {
                    console.log("No 'default' document found either. Returning ultimate fallback.");
                    return {
                         text: ultimateFallbackText,
                         audioUrl: null
                     };
                }
            }
        } catch (error) {
            console.error("Error fetching Firestore document:", error);
             if (error.code === 'failed-precondition') {
                 console.error("Firestore query failed. This often means you need to create an index. Check the Firebase console for a link to create it, usually for the 'prompt' field in the 'ai_assistance' collection.");
                 return {
                     text: configErrorFallbackText,
                     audioUrl: null
                 };
             }
             return {
                 text: ultimateFallbackText,
                 audioUrl: null
             };
        }
    };

    // *** Function to speak text using browser's SpeechSynthesis API with configured settings ***
    const speakText = (text) => {
        if (!window.speechSynthesis) {
            console.warn("Speech Synthesis API not supported by this browser.");
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        console.log("Cancelled previous speech synthesis.");

        const utterance = new SpeechSynthesisUtterance(text);

        // *** Attempt to match voice settings from Cloud Function request ***
        const targetLang = 'en-IN'; // Corresponds to languageCode: "en-IN"
        const targetVoiceNameHint = 'Wavenet'; // Hint, browser voices won't be exactly this

        let voiceToUse = null;

        // Try to find a specific voice
        const voices = availableVoicesRef.current; // Use the ref holding loaded voices

         // Prioritize finding a voice that matches language and potentially a name hint or is male
        voiceToUse = voices.find(voice =>
            voice.lang === targetLang && voice.name.includes(targetVoiceNameHint)
        );

        if (!voiceToUse) {
             // If Wavenet hint not found, try finding a male voice for the language
             voiceToUse = voices.find(voice =>
                 voice.lang === targetLang && voice.name.toLowerCase().includes('male') // Check for 'male' in name
             );
        }

         if (!voiceToUse) {
             // If male voice not found, just find any voice for the target language
             voiceToUse = voices.find(voice => voice.lang === targetLang);
         }

         if (voiceToUse) {
            utterance.voice = voiceToUse;
             console.log(`Using browser voice: ${voiceToUse.name} (${voiceToUse.lang})`);
        } else {
             // Fallback: just set the language, browser will pick a default voice
             utterance.lang = targetLang;
             console.warn(`No specific voice found for ${targetLang}. Using browser default.`);
        }

        // Set other audio config properties (mapping from Cloud TTS to Web Speech API)
        // speakingRate: 1.0 -> rate: 1 (default)
        // pitch: 0.0 -> pitch: 1 (default) - Web Speech pitch is 0-2, 1 is default
        // volumeGainDb: 0.0 -> volume: 1 (default) - Web Speech volume is 0-1, 1 is default
        // effectsProfileId: ["handset-class-device"] - Not directly supported in Web Speech API

        utterance.rate = 1.0; // Equivalent to speakingRate
        utterance.pitch = 3.0; // Equivalent to pitch 0.0 in Cloud TTS (assuming default is mid-range)
        utterance.volume = 2.0; // Equivalent to volumeGainDb 0.0

        // Store the utterance instance in ref for potential cancellation later
        utteranceRef.current = utterance;

        utterance.onend = () => {
             console.log("Speech synthesis finished.");
             utteranceRef.current = null; // Clear ref when done
        };

        utterance.onerror = (event) => {
             console.error('Speech synthesis error:', event.error);
             utteranceRef.current = null; // Clear ref on error
        };

        window.speechSynthesis.speak(utterance);
        console.log("Started speech synthesis.");
    };


    // Modified handleSendMessage to include Gemini fallback and conditional audio/speech
    const handleSendMessage = async () => {
        const currentInput = input.trim();
        if (!currentInput || isLoading) return; // Prevent sending empty messages or while loading

        const userMessage = { text: currentInput, sender: "user", timestamp: new Date() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput(""); // Clear input immediately
        setIsLoading(true); // Set loading state

        let botMessageText = "";
        let audioUrlFromFirebase = null; // To store audio URL ONLY if from Firebase

        try {
            // 1. First, try getting response from Firebase
            const responseData = await getBotResponse(currentInput);

            // Check if the response is NOT one of the specific fallback texts
            if (responseData.text !== ultimateFallbackText && responseData.text !== configErrorFallbackText) {
                console.log("Firebase returned a specific response.");
                botMessageText = responseData.text;
                audioUrlFromFirebase = responseData.audioUrl; // Store Firebase audio URL if available
                console.log("Using Firebase Response:", botMessageText, "Audio URL:", audioUrlFromFirebase);

            } else {
                console.log("Firebase returned fallback or error. Calling Gemini...");
                // 2. If Firebase returned fallback, call Gemini
                // Prepare history for Gemini
                const historyForPrompt = messages
                    .concat(userMessage) // Include the user's current message
                    .slice(-10) // Use last N messages for context
                    .map(msg => `${msg.sender === "bot" ? "AI" : "User"}: ${msg.text}`)
                    .join('\n');

                // Added a system instruction to Gemini to refine its output style
                 const systemInstruction = `You are a helpful AI assistant focused on cricket. Respond concisely and in plain text. Do not use markdown, HTML, or special symbols. When asked general questions unrelated to cricket, you can provide helpful, plain-text answers.`;


                const prompt = `${systemInstruction}

Chat History (if any):\n${historyForPrompt}

AI's response:`;

                try {
                    const result = await geminiModel.generateContent(prompt);
                    const response = await result.response;
                    botMessageText = response.text(); // Get text from Gemini response
                     // Clean up potential markdown formatting that Gemini might still sneak in
                     botMessageText = botMessageText.replace(/[*_`]/g, ''); // Remove common markdown chars
                     console.log("Gemini Response (Cleaned):", botMessageText);
                    // No audio URL from Gemini, so audioUrlFromFirebase remains null

                } catch (geminiError) {
                    console.error("Error sending message to Gemini:", geminiError);
                    botMessageText = "Sorry, the AI is currently unavailable. Please try again later.";
                    audioUrlFromFirebase = null; // Ensure no audio is attempted
                }
            }

            // Add the determined bot message to the state
            const botMessage = {
                text: botMessageText,
                sender: "bot",
                timestamp: new Date()
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);

            // *** Handle Audio/Speech based on source and toggle state ***
            if (isVoiceEnabled && botMessageText) { // Only attempt audio/speech if voice is enabled and there's text
                // Cancel any previous speech synthesis or audio playback before potentially starting new one
                 if (window.speechSynthesis && window.speechSynthesis.speaking) {
                      window.speechSynthesis.cancel();
                      console.log("Cancelled browser speech before new playback.");
                 }
                 if (audioRef.current) {
                     audioRef.current.pause();
                     audioRef.current.currentTime = 0;
                     audioRef.current = null;
                     console.log("Stopped Firebase audio before new playback.");
                 }

                if (audioUrlFromFirebase) {
                    // If Firebase provided an audio URL and voice is enabled, play the audio file
                    console.log("Attempting to play Firebase audio from URL:", audioUrlFromFirebase);
                    try {
                        audioRef.current = new Audio(audioUrlFromFirebase);
                        audioRef.current.play()
                            .then(() => console.log("Firebase audio playback started successfully."))
                            .catch(error => {
                                console.error("Error playing Firebase audio:", error);
                                audioRef.current = null;
                                // Optional: Fallback to speaking text if Firebase audio fails
                                // console.log("Firebase audio failed, falling back to browser speech.");
                                // speakText(botMessageText);
                            });
                         // Add ended listener even on successful play to clean up ref
                         audioRef.current.addEventListener('ended', () => {
                             console.log("Firebase audio playback finished.");
                             audioRef.current = null;
                         });

                    } catch (error) {
                         console.error("Error creating Audio object for Firebase URL:", error);
                         audioRef.current = null;
                         // Optional: Fallback to speaking text if Audio object creation fails
                         // console.log("Audio object creation failed, falling back to browser speech.");
                         // speakText(botMessageText);
                    }
                } else { // audioUrlFromFirebase is null, meaning no pre-recorded audio was found
                    // Use browser TTS for Gemini response or Firebase fallback text without audio
                    console.log("No Firebase audio URL, using browser speech synthesis.");
                    speakText(botMessageText);
                }
            } else if (!isVoiceEnabled) {
                 // If voice was just turned off, ensure nothing is speaking/playing
                 if (window.speechSynthesis && window.speechSynthesis.speaking) {
                     window.speechSynthesis.cancel();
                 }
                 if (audioRef.current) {
                     audioRef.current.pause();
                     audioRef.current.currentTime = 0;
                     audioRef.current = null;
                 }
            }


        } catch (error) {
            // Catch errors from the initial getBotResponse call itself or other unexpected errors
            console.error("Error in message handling:", error);
             const errorMessage = {
                 text: "An unexpected error occurred. Please try again.",
                 sender: "bot",
                 timestamp: new Date()
             };
             setMessages(prevMessages => [...prevMessages, errorMessage]);
             // If an error occurred and voice is enabled, speak the error message
             if (isVoiceEnabled) {
                 speakText(errorMessage.text);
             }
        } finally {
            setIsLoading(false); // Always set loading state to false after process
        }
    };

    // Allow sending message with Enter key
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };


    return (
        <div className="min-h-full bg-gradient-to-b from-black to-[#001A80] bg-fixed text-white p-5">
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg mb-5">
                <div className="flex items-center gap-4">
                    <img
                        src={logo}
                        alt="Cricklytics Logo"
                           className="w-20 h-20 sm:w-25 sm:h-25 object-contain block" 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/Picture3 2.png";
                        }}
                    />
                    <span className="text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">
                        Cricklytics
                    </span>
                </div>
            </div>
            {/* Back/Cancel Buttons (Keep existing logic) */}
            <div className="flex gap-330"> {/* Adjusted gap and added mb-5 */}
                 <button
                     className="text-white bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-500"
                     onClick={() => navigate(-1)}
                 >
                     Back
                 </button>
                 <button
                     className="text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500"
                     onClick={() => window.location.reload()}
                 >
                     Cancel
                 </button>
            </div>


            {/* Match Card (Keep existing logic) */}
            <motion.div
                className="max-w-5xl mx-auto mb-6 bg-[rgba(71,156,182,0.7)] p-6 rounded-xl shadow-lg border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-xl font-bold font-['Alegreya'] mb-4">Current Match</h2>
                <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">{matches[0].teams}</h3>
                    <p className="text-cyan-300">{matches[0].score}</p>
                    <p className="text-gray-300">{matches[0].venue}</p>
                    <p className={matches[0].status === "Live" ? "text-green-400" : "text-yellow-400"}>{matches[0].status}</p>
                </div>
            </motion.div>

            {/* Chatbox or Minimized Button (Keep existing logic) */}
            {isMinimized ? (
                <motion.div
                    className="fixed bottom-5 right-5 z-50"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <button
                        onClick={() => {
                            setIsMinimized(false);
                            setIsAIExpanded(true);
                        }}
                        className="relative flex items-center gap-2 px-4 py-2 bg-[#5DE0E6] text-black rounded-full shadow-lg hover:bg-[#48C6EF] transition-all duration-300"
                    >
                        <img
                            src={bot}
                            alt="Chitti ROBO"
                            className="w-17 h-17 -top-7 z-10 absolute -left-2 rounded-full"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/images/bot-placeholder.png";
                            }}
                        />
                        <span className="text-sm text-amber-100 font-bold pl-8 font-['Alegreya']">Chiti Robot</span>
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    className="fixed bottom-5 right-5 w-80 md:w-96 bg-[rgba(0,0,0,0.8)] rounded-xl shadow-xl z-50 border border-cyan-300/30"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Chat Header (Keep existing logic) */}
                    <div className="flex justify-between items-center p-4 bg-[#cccccc] rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <img
                                src={bot}
                                alt="Chitti ROBO"
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/images/bot-placeholder.png";
                                }}
                            />
                            <span className="text-lg font-bold text-black font-['Alegreya']">Chitti ROBO</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer"> {/* Added cursor-pointer */}
                                <span className="text-lg font-bold text-black select-none">Voice</span> {/* Added select-none */}
                                <input
                                    type="checkbox"
                                    checked={isVoiceEnabled}
                                    onChange={() => setIsVoiceEnabled(!isVoiceEnabled)}
                                     className="sr-only peer" // Hide default checkbox visually
                                />
                                {/* Custom Toggle Switch (example - replace with your actual styling if different) */}
                                <div className="relative w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#cccccc] dark:peer-focus:ring-[#cccccc] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-600"></div>
                            </label>
                            <button
                                onClick={() => {
                                    setIsMinimized(true);
                                    setIsAIExpanded(false);
                                }}
                                className="text-black hover:text-gray-700 text-xl" // Changed color for visibility on header
                            >X
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages Area */}
                    {/* Added flex-grow and overflow-y-auto from old code structure */}
                    <div className="h-75 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-300 scrollbar-track-gray-800">
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index} // Using index as key - consider unique IDs if possible
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={`flex items-start gap-2 max-w-[80%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                                    <img
                                        src={msg.sender === "user" ? Userprof : bot}
                                        alt={msg.sender}
                                        className={`w-8 h-8 rounded-full transform ${msg.sender === "user" ? "scale-100" : "scale-150"}`}
                                    />
                                    <div className={`p-3 rounded-lg ${msg.sender === "user" ? "bg-[#403636] text-white" : "bg-gray-700 text-white"} break-words`}> {/* Added break-words */}
                                        <p>{msg.text}</p>
                                        <p className="text-xs text-cyan-300 mt-1 text-right"> {/* Added text-right */}
                                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                         {/* Loading indicator */}
                         {isLoading && messages[messages.length - 1]?.sender === 'user' && (
                             <div className="flex justify-start">
                                 <div className="flex items-start gap-2 max-w-[80%]">
                                     <img src={bot} alt="bot" className="w-6 h-6 rounded-full flex-shrink-0" />
                                     <div className="p-3 rounded-lg bg-gray-700 text-white">
                                         <p>...</p> {/* Simple loader indicator */}
                                     </div>
                                 </div>
                             </div>
                         )}

                        {/* Element to scroll to */}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Area (Keep existing logic) */}
                    <div className="p-4 border-t border-gray-600">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress} // Use handleKeyPress for Enter key
                                placeholder={isLoading ? "Sending..." : "Ask about cricket..."} // Placeholder reflects loading state
                                className="flex-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
                                disabled={isLoading} // Disable input while loading
                            />
                            <button
                                onClick={handleSendMessage}
                                className="px-4 py-2 bg-[#5DE0E6] text-black rounded-lg hover:bg-[#48C6EF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" // Changed text-white to text-black for visibility, added disabled styles
                                disabled={isLoading || !input.trim()} // Disable button while loading or if input is empty
                            >
                                {isLoading ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AIAssistance;