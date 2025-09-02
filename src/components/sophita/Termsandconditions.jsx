import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from "react-router-dom";
import '../../index.css';
import nav from '../../assets/kumar/right-chevron.png';
import logo from '../../assets/sophita/HomePage/Picture3_2.png';

const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleBack = () => {
    navigate(-1);
  };

  const sections = [
    {
      title: "Terms & Conditions",
      content: `Welcome to Cricklytics, a product by Creativity Ventures Pvt. Ltd. By accessing or using our platform, you agree to comply with the following terms:
      - The platform provides cricket analytics, AI-based predictions, and engagement features.
      - Users are responsible for maintaining the confidentiality of their account.
      - Unauthorized use, resale, or redistribution of our content is strictly prohibited.
      - Creativity Ventures reserves the right to suspend accounts in case of fraudulent or abusive activities.
      - All disputes will be governed by Indian law and subject to Chennai jurisdiction.`
    },
    {
      title: "Privacy Policy",
      content: `Your privacy is important to us.
      - We collect only necessary information (e.g., email, login credentials) to provide our services.
      - All data is securely stored via Firebase & Razorpay systems.
      - Payment details are processed securely by Razorpay; we do not store card/bank details.
      - We do not sell or share personal data with third parties, except as required by law.
      - Users may contact us anytime to request deletion of their data.`
    },
    {
      title: "Refund & Cancellation Policy",
      content: `Subscription fees are non-refundable once payment is successful.
      - In case of double payments or technical errors, refunds will be initiated within 7–10 business days.
      - If a user cancels a subscription, access will remain until the billing cycle ends, but no partial refunds will be issued.
      - For refund requests, contact our support team with your transaction details.`
    },
    {
      title: "Contact Us",
      content: `Creativity Ventures IT solution & IT consulting
      📍 Location: Chennai, Tamil Nadu, India
      📧 Email: support_cricklytics@creativityventures.co.in
      📞 Phone: +91 7397362027`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 py-8 px-4">
      {/* Header with Logo and Back Button */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg mb-6">
        <div className="flex items-center">
          <motion.img
            src={logo}
            alt="Cricklytics Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 object-cover select-none"
            whileHover={{ scale: 1.05 }}
          />
          <h1 className="text-xl sm:text-2xl font-bold text-white pl-3">Cricklytics</h1>
        </div>
        <img
          src={nav}
          alt="Back"
          loading="lazy"
          className="w-8 h-8 sm:w-10 sm:h-10 -scale-x-100 cursor-pointer"
          onClick={handleBack}
        />
      </div>
        
      {/* Content */}
      <div className="max-w-14xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-blue-800">Terms & Policies</h2>
          <p className="text-gray-600 mt-2">Please review our terms and policies carefully</p>
        </motion.div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.div 
              key={index}
              className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.button
                className="w-full p-4 text-left flex justify-between items-center bg-white hover:bg-blue-50 transition-colors"
                onClick={() => setActiveSection(activeSection === index ? null : index)}
                whileHover={{ backgroundColor: "#f0f9ff" }}
              >
                <span className="font-semibold text-blue-700">{section.title}</span>
                <motion.span
                  animate={{ rotate: activeSection === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {activeSection === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 text-gray-700 whitespace-pre-line bg-blue-50">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;