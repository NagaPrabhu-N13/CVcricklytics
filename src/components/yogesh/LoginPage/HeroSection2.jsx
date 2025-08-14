import React from "react";
import aboutimg from "../../../assets/yogesh/login/about.png";  
import cricketbg from "../../../assets/yogesh/login/2-removebg-preview 1.png";  

const HeroSection2 = () => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#0a1f44] to-[#123456] px-10 relative">
      <div className="container mx-auto flex flex-col md:flex-row items-center">
        <div className="relative w-full md:w-1/2 flex justify-center mt-24">
          <img src={aboutimg} alt="Stadium Background" className="w-1/2 rounded-lg shadow-lg" />
        </div>
        <div className="w-full md:w-1/2 text-white px-8 text-center md:text-left">
          <h1 className="text-4xl font-bold mb-4 font-['Alegreya'] transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-cyan-300 hover:to-blue-400 hover:drop-shadow-[0_2px_8px_rgba(93,224,230,0.6)]">
            About Us
          </h1>
          <p className="text-xl opacity-80 leading-relaxed font-['Alegreya'] transition-all duration-300 hover:opacity-100 hover:text-gray-100 hover:drop-shadow-[0_1px_4px_rgba(255,255,255,0.3)]">
            At Cricklytics, we’re not just building an app — we’re redefining how cricket is played, followed, and felt. From local streets to stadium lights, our platform bridges the digital gap in the game. Whether you’re organizing a tournament, tracking stats, or just staying in sync with every ball, Cricklytics puts the power of modern cricket right in your hands.
          </p>
          <p className="text-lg opacity-80 leading-relaxed font-['Alegreya'] mt-4">
            The time to play or watch the league matches according to your comfort with instant match scores, without delay. We keep you updated in real-time.
          </p>
        </div>
      </div>
      {/* Cricket Player Illustration */}
      <div className="absolute bottom-5 right-5">
        <img src={cricketbg} alt="Cricket Player" className="w-40 md:w-52" />
      </div>
    </div>
  );
};

export default HeroSection2;
