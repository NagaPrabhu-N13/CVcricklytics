import React from "react";
import focusImage from "../../../assets/yogesh/login/focus-image.png";
import cricketbg3 from "../../../assets/yogesh/login/3_-removebg-preview 1.png"; 
import { motion } from "framer-motion";

const HeroSection3 = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-r from-[#0a1f44] to-[#123456] p-6 relative overflow-hidden">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between text-white">
        <div className="max-w-4xl mt-18 text-left">
          <h1 className="text-4xl font-bold text-white mb-4 font-['Alegreya'] transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-cyan-300 hover:to-blue-400 hover:drop-shadow-[0_2px_8px_rgba(93,224,230,0.6)]">
            Focus
          </h1>
          <p className="text-xl text-white leading-relaxed font-['Alegreya'] transition-all duration-300 hover:text-gray-100 hover:drop-shadow-[0_1px_4px_rgba(255,255,255,0.3)]">
            Our vision is to create a seamless space where cricket communities can thrive digitally — organizing matches, connecting fans, and showcasing talent with real-time precision. Long term, Cricklytics aims to become the digital heartbeat of cricket, empowering every player and enthusiast with tools that blend technology and passion into one unbeatable game experience.
          </p>
        </div>
        <div className="relative w-full flex justify-center  mt-10">
          <img src={focusImage} alt="Cricket Strategy" className="w-500 rounded-lg shadow-lg" />
        </div>
        <div className="absolute bottom-5 left-5 md:top-100 md:left-10">
          <img src={cricketbg3} alt="Cricket Player" className="w-32 md:w-60" />
        </div>
      </div>
    </div>
  );
};

export default HeroSection3;