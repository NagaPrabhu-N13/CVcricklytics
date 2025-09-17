import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import banner from '../../../assets/yogesh/login/landing_img.png'; // Make sure this path is correct

const HeroSection1 = () => {
  const navigate = useNavigate();
  const [activePopup, setActivePopup] = useState(null);

  const policies = {
    terms: {
      title: "Terms & Conditions",
      content: "Welcome to Cricklytics, a product by Creativity Ventures Pvt. Ltd. By accessing or using our platform, you agree to comply with the following terms:\n- The platform provides cricket analytics, AI-based predictions, and engagement features.\n- Users are responsible for maintaining the confidentiality of their account.\n- Unauthorized use, resale, or redistribution of our content is strictly prohibited.\n- Creativity Ventures reserves the right to suspend accounts in case of fraudulent or abusive activities.\n- All disputes will be governed by Indian law and subject to Chennai jurisdiction.",
      bgGradient: "bg-gradient-to-br from-blue-50 to-indigo-100",
      headerBg: "bg-gradient-to-r from-blue-500 to-indigo-600",
      textColor: "text-gray-800",
      closeColor: "text-black hover:text-gray-800"
    },
    privacy: {
      title: "Privacy Policy",
      content: "Your privacy is important to us.\n- We collect only necessary information (e.g., email, login credentials) to provide our services.\n- All data is securely stored via Firebase & Razorpay systems.\n- Payment details are processed securely by Razorpay; we do not store card/bank details.\n- We do not sell or share personal data with third parties, except as required by law.\n- Users may contact us anytime to request deletion of their data.",
      bgGradient: "bg-gradient-to-br from-blue-50 to-indigo-100",
      headerBg: "bg-gradient-to-r from-blue-500 to-indigo-600",
      textColor: "text-gray-800",
      closeColor: "text-black hover:text-gray-800"
    },
    refunds: {
      title: "Refund & Cancellation Policy",
      content: "Subscription fees are non-refundable once payment is successful.\n- In case of double payments or technical errors, refunds will be initiated within 7–10 business days.\n- If a user cancels a subscription, access will remain until the billing cycle ends, but no partial refunds will be issued.\n- For refund requests, contact our support team with your transaction details.",
      bgGradient: "bg-gradient-to-br from-blue-50 to-indigo-100",
      headerBg: "bg-gradient-to-r from-blue-500 to-indigo-600",
      textColor: "text-gray-800",
      closeColor: "text-black hover:text-gray-800"
    },
    contact: {
      title: "Contact Us",
      content: "Creativity Ventures IT solution & IT consulting\n📍 Location: Chennai, Tamil Nadu, India\n📧 Email: support_cricklytics@creativityventures.co.in\n📞 Phone: +91 7397362027",
      bgGradient: "bg-gradient-to-br from-blue-50 to-indigo-100",
      headerBg: "bg-gradient-to-r from-blue-500 to-indigo-600",
      textColor: "text-gray-800",
      closeColor: "text-black hover:text-gray-800"
    }
  };

  const openPopup = (policy) => {
    setActivePopup(policy);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  return (
    <>
      <div className="w-full h-screen flex items-center justify-between px-6 md:px-12 lg:px-24 bg-gradient-to-r from-[#0a1f44] to-[#123456] overflow-hidden relative">
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
            <button onClick={() => openPopup('terms')} className="text-white hover:text-blue-300 transition-colors">Terms & Conditions</button>
            <span className="text-white">|</span>
            <button onClick={() => openPopup('privacy')} className="text-white hover:text-blue-300 transition-colors">Privacy Policy</button>
            <span className="text-white">|</span>
            <button onClick={() => openPopup('refunds')} className="text-white hover:text-blue-300 transition-colors">Refunds & Cancellations</button>
            <span className="text-white">|</span>
            <button onClick={() => openPopup('contact')} className="text-white hover:text-blue-300 transition-colors">Contact Us</button>
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

      {/* Policy Popup Modal */}
      <AnimatePresence>
        {activePopup && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div 
              className={`rounded-lg max-w-lg w-full overflow-hidden shadow-2xl ${policies[activePopup].bgGradient}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className={`${policies[activePopup].headerBg} text-white p-4 flex justify-between items-center`}>
                <h3 className="text-2xl font-bold font-['Alegreya']">
                  {policies[activePopup].title}
                </h3>
                <button 
                  onClick={closePopup}
                  className={`text-2xl font-bold ${policies[activePopup].closeColor} transition-colors`}
                >
                  &times;
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className={`${policies[activePopup].textColor} whitespace-pre-line font-['Alegreya']`}>
                  {policies[activePopup].content}
                </div>
                
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeroSection1;