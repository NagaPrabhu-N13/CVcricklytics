import { useNavigate } from "react-router-dom";
import banner from '../../../assets/yogesh/login/landing_img.png';
import { motion } from "framer-motion";

const HeroSection1 = () => {
  const navigate = useNavigate();

  return (
    
    <div className="w-full h-screen flex items-center justify-between px-6 md:px-12 lg:px-24 bg-gradient-to-r from-[#0a1f44] to-[#123456] overflow-hidden">
      <motion.div 
        className="max-w-5xl"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight font-['Alegreya'] mt-20 transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-cyan-300 hover:to-blue-400 hover:drop-shadow-[0_2px_8px_rgba(93,224,230,0.6)]">
          Where Passion Meets  Precision,<br /> and Every Score Tells a <span className="text-5xl md:text-6xl font-bold text-white leading-tight font-['Alegreya'] mt-24 transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-black hover:to-black hover:drop-shadow-[0_2px_8px_rgba(93,224,230,0.6)] "  >Story</span>
        </h2>
        <p className="text-gray-300 mt-10 text-xl leading-relaxed font-['Alegreya'] transition-all duration-300 hover:text-white hover:drop-shadow-[0_1px_4px_rgba(255,255,255,0.3)]">
          From the dusty pitches of local tournaments to the electric vibe of international cricket — Cricklytics brings every heartbeat of the game to your screen. With real-time insights, AI-powered support, and a deeply connected community, we redefine the way cricket is played, followed, and celebrated.
        </p>
        <p className="text-white text-bold font-bold mt-10 pl-20 tracking-wider italic text-sm md:text-base font-['Alegreya'] transition-all duration-300 hover:text-cyan-300">
          "This isn't just a cricket app — it's a movement. Built for players, fans, and dreamers alike." <br />
          <span className="text-lime-200 pl-4 " >— ShanmuhaSundaram, Founder of  Cricklytics </span>
        </p>
        <motion.button 
          onClick={() => navigate("/login")} 
          className="mt-6 bg-gradient-to-r from-[#004AAD] to-[#5DE0E6] text-white px-8 py-3 rounded-full text-lg shadow-lg font-['Alegreya'] cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign In
        </motion.button>

        {/* Copyright Notice below the Sign In button */}
        <div className="text-white text-xs opacity-80 mt-10">
          © 2025 Creativity Ventures. All rights reserved
        </div>

  <div className="flex gap-4 mt-22 md:mt-7 text-xs ">
    <a href="/terms" className="text-white hover:text-blue-600">Terms & Conditions</a>
    <span>|</span>
    <a href="/privacy" className="text-white hover:text-blue-600">Privacy Policy</a>
    <span>|</span>
    <a href="/refunds" className="text-white hover:text-blue-600">Refunds & Cancellations</a>
    <span>|</span>
    <a href="/contact" className="text-white hover:text-blue-600">Contact Us</a>
  </div>



      </motion.div>
      <motion.div 
        className="hidden md:block mt-16 md:mt-24"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <img src={banner} alt="Cricket Theme" className="max-w-xs md:max-w-md drop-shadow-2xl" />
      </motion.div>
    </div>
  );
};

export default HeroSection1;