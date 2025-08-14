import React from "react";
import { motion } from "framer-motion";
import backButton from '../assets/kumar/right-chevron.png';
import logo from "../assets/pawan/PlayerProfile/picture-312.png";

const UpcomingPage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-gray-900 overflow-hidden px-4">

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 flex items-center gap-2 p-4">
        <img 
          src={backButton}
          alt="Back"
          className="h-8 w-8 cursor-pointer -scale-x-100"
          onClick={() => window.history.back()}
        />
        <div className="flex items-center gap-2">
          <img 
            src={logo}
            alt="Cricklytics Logo"
            className="h-7 w-7 md:h-10 object-contain block select-none"
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

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="text-center max-w-full"
      >
        <motion.div
          animate={{
            y: [-5, 5, -5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-4xl sm:text-6xl mb-2 sm:mb-4"
        >
          🚀
        </motion.div>
        
        <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4 sm:mb-8 tracking-tight leading-tight">
          UPCOMING
        </h1>
        
        <motion.div
          animate={{
            y: [5, -5, 5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="text-4xl sm:text-6xl mt-2 sm:mt-4"
        >
          🔥
        </motion.div>
        
        <div className="mt-8 sm:mt-16">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto max-w-xs sm:max-w-none"
          />
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="text-blue-300 mt-4 sm:mt-8 text-sm sm:text-lg"
        >
          Something amazing is coming soon...
        </motion.p>
      </motion.div>
      
      {/* Animated background elements - fewer on mobile */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0,
            x: Math.random() * 600 - 300,
            y: Math.random() * 600 - 300,
          }}
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            x: Math.random() * 600 - 300,
            y: Math.random() * 600 - 300,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute rounded-full bg-blue-400 blur-xl"
          style={{
            width: Math.random() * 60 + 30,
            height: Math.random() * 60 + 30,
          }}
        />
      ))}
    </div>
  );
};

export default UpcomingPage;