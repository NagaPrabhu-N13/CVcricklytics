import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from "react-router-dom";
import '../../index.css';
import nav from '../../assets/kumar/right-chevron.png';
import logo from '../../assets/sophita/HomePage/Picture3_2.png';

const plans = [
  {
    name: 'Bronze',
    price: { yearly: 'Free', monthly: 'Free' },
    razorpayPlanId: { yearly: null, monthly: null },
    razorpayLink: { yearly: null, monthly: null },
    features: {
      'AI Chatbot Support': true,
      'Core Features Access': true,
      'Add Tournament': true,
      'Start a Match': true,
      'Team, Tournament, Stats, Matches': true,
      'Scores, Commentators': true,
      Umpires: false,
      Streamers: true,
      Shops: true,
      Academics: true,
      Grounds: true,
      Trophy: true,
      'T-Shirts': true,
      'Bat Manufacturing': true,
      'Event Managers': false,
      Sponsors: false,
      Physio: false,
      Coach: false,
      'Leaderboard (Player Info Limit)': 'Up to 6 Players',
      'Instagram Feed Integration': true,
      'Find a Friend': true,
      'Clubs Module': false,
      'Go Live': false,
    },
  },
  {
    name: 'Silver',
    price: { yearly: '₹2500/Year', monthly: '₹210/Month' },
    razorpayPlanId: { yearly: 'plan_Qe0XUXFOwggzwq', monthly: 'plan_Qe0YeVwdn3w8gF' },
    razorpayLink: { 
      yearly: 'https://razorpay.me/@creativityventures', 
      monthly: 'https://razorpay.me/@creativityventures' 
    },
    features: {
      'AI Chatbot Support': true,
      'Core Features Access': true,
      'Add Tournament': true,
      'Start a Match': true,
      'Team, Tournament, Stats, Matches': true,
      'Scores, Commentators': true,
      Umpires: true,
      Streamers: true,
      Shops: true,
      Academics: true,
      Grounds: true,
      Trophy: true,
      'T-Shirts': true,
      'Bat Manufacturing': true,
      'Event Managers': false,
      Sponsors: false,
      Physio: false,
      Coach: false,
      'Leaderboard (Player Info Limit)': 'Up to 15 Players',
      'Instagram Feed Integration': true,
      'Find a Friend': true,
      'Clubs Module': true,
      'Go Live': '1 Live Stream + All Intl Streams',
    },
  },
  {
    name: 'Gold',
    price: { yearly: '₹5000/Year', monthly: '₹420/Month' },
    razorpayPlanId: { yearly: 'plan_Qe0ZKD5HdhN5W5', monthly: 'plan_Qe0ZxCpdAEZlxC' },
    razorpayLink: { 
      yearly: 'https://razorpay.me/@creativityventures', 
      monthly: 'https://razorpay.me/@creativityventures' 
    },
    features: {
      'AI Chatbot Support': true,
      'Core Features Access': true,
      'Add Tournament': true,
      'Start a Match': true,
      'Team, Tournament, Stats, Matches': true,
      'Scores, Commentators': true,
      Umpires: true,
      Streamers: true,
      Shops: true,
      Academics: true,
      Grounds: true,
      Trophy: true,
      'T-Shirts': true,
      'Bat Manufacturing': true,
      'Event Managers': false,
      Sponsors: false,
      Physio: true,
      Coach: true,
      'Leaderboard (Player Info Limit)': 'Unlimited',
      'Instagram Feed Integration': true,
      'Find a Friend': true,
      'Clubs Module': true,
      'Go Live': 'Unlimited National + All Intl Streams',
    },
  },
  {
    name: 'Platinum',
    price: { yearly: '₹7500/Year', monthly: '₹630/Month' },
    razorpayPlanId: { yearly: 'plan_Qe0aXjoF1EDtoT', monthly: 'plan_Qe0asdseYwLy4x' },
    razorpayLink: { 
      yearly: 'https://razorpay.me/@creativityventures', 
      monthly: 'https://razorpay.me/@creativityventures' 
    },
    features: {
      'AI Chatbot Support': true,
      'Core Features Access': true,
      'Add Tournament': true,
      'Start a Match': true,
      'Team, Tournament, Stats, Matches': true,
      'Scores, Commentators': true,
      Umpires: true,
      Streamers: true,
      Shops: true,
      Academics: true,
      Grounds: true,
      Trophy: true,
      'T-Shirts': true,
      'Bat Manufacturing': true,
      'Event Managers': true,
      Sponsors: true,
      Physio: true,
      Coach: true,
      'Leaderboard (Player Info Limit)': 'Unlimited',
      'Instagram Feed Integration': true,
      'Find a Friend': true,
      'Clubs Module': true,
      'Go Live': 'Unlimited National + All Intl Streams',
    },
  },
];

const faqs = [
  {
    question: 'What is included in the Core Features Access?',
    answer: 'Core Features include access to basic functionalities like viewing match stats, team management, and tournament tracking.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time through your account settings.',
  },
  {
    question: 'What does "Go Live" include?',
    answer: 'Go Live allows you to stream matches. Silver includes one live stream plus international streams, while Gold and Platinum offer unlimited national and international streams.',
  },
  {
    question: 'Is the AI Chatbot available 24/7?',
    answer: 'Yes, the AI Chatbot is available 24/7 across all plans to assist with your queries.',
  },
  {
    question: 'Terms & Conditions',
    answer: `Welcome to Cricklytics, a product by Creativity Ventures Pvt. Ltd. By accessing or using our platform, you agree to comply with the following terms:
      - The platform provides cricket analytics, AI-based predictions, and engagement features.
      - Users are responsible for maintaining the confidentiality of their account.
      - Unauthorized use, resale, or redistribution of our content is strictly prohibited.
      - Creativity Ventures reserves the right to suspend accounts in case of fraudulent or abusive activities.
      - All disputes will be governed by Indian law and subject to Chennai jurisdiction.`
  },
  {
    question: 'Privacy Policy',
    answer: `Your privacy is important to us.
      - We collect only necessary information (e.g., email, login credentials) to provide our services.
      - All data is securely stored via Firebase & Razorpay systems.
      - Payment details are processed securely by Razorpay; we do not store card/bank details.
      - We do not sell or share personal data with third parties, except as required by law.
      - Users may contact us anytime to request deletion of their data.`
  },
  {
    question: 'Refund & Cancellation Policy',
    answer: `Subscription fees are non-refundable once payment is successful.
      - In case of double payments or technical errors, refunds will be initiated within 7–10 business days.
      - If a user cancels a subscription, access will remain until the billing cycle ends, but no partial refunds will be issued.
      - For refund requests, contact our support team with your transaction details.`
  },
  {
    question: 'Contact Us',
    answer: `Creativity Ventures IT solution & IT consulting
      📍 Location: Chennai, Tamil Nadu, India
      📧 Email: support_cricklytics@creativityventures.co.in
      📞 Phone: +91 7397362027`
  }
];

const Subscription = () => {
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [activeFaq, setActiveFaq] = useState(null);
  const [userPlan, setUserPlan] = useState('Bronze');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Fetch user's subscription status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setUserPlan(docSnap.data().subscriptionPlan || 'Bronze');
        }
      } else {
        setUserPlan('Bronze');
      }
    });
    return () => unsubscribe();
  }, [auth, db]);

  // Handle Razorpay Redirect
  const handleCheckout = async (plan) => {
    if (plan.name === 'Bronze') {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { subscriptionPlan: 'Bronze' }, { merge: true });
        setUserPlan('Bronze');
      }
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in to proceed with payment.');
        setLoading(false);
        return;
      }

      const razorpayLink = plan.razorpayLink[billingCycle];
      if (razorpayLink) {
        // Open Razorpay payment link in a new tab
        window.open(razorpayLink, '_blank', 'noopener,noreferrer');
      } else {
        alert('Payment link not available for this plan.');
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      alert('Error initiating payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo and Back Button */}
        <div className="flex flex-col items-start mb-8 ml-4 sm:ml-6">
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
            className="w-8 h-8 sm:w-10 sm:h-10 -scale-x-100 cursor-pointer mt-2 ml-2"
            onClick={handleBack}
          />
        </div>
       
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-green-400 drop-shadow-lg">Cricklytics Subscription Plans</h1>
          <p className="mt-4 text-lg text-gray-300">Choose the perfect plan to elevate your cricket experience!</p>
          <div className="mt-6 flex justify-center space-x-4">
            <button
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                billingCycle === 'yearly' ? 'bg-green-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                billingCycle === 'monthly' ? 'bg-green-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="p-6 rounded-lg shadow-lg bg-gray-800 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-green-500"
            >
              <h2 className="text-2xl font-semibold text-green-400">{plan.name}</h2>
              <p className="mt-4 text-3xl font-bold text-gray-100">{plan.price[billingCycle]}</p>
              <ul className="mt-6 space-y-2">
                {Object.entries(plan.features).map(([feature, value]) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <span className="mr-2 text-lg">{value === true ? '✅' : value === false ? '🔒' : 'ℹ️'}</span>
                    {feature}{value !== true && value !== false ? `: ${value}` : ''}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full py-2 rounded-full transition-all duration-300 ${
                  userPlan === plan.name
                    ? 'bg-gray-600 text-gray-300'
                    : 'bg-green-500 text-gray-900 hover:bg-green-600'
                } font-semibold`}
                onClick={() => handleCheckout(plan)}
                disabled={loading || userPlan === plan.name}
              >
                {userPlan === plan.name ? 'Active' : 'Choose Plan'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQs Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  className="w-full text-left text-lg font-semibold text-gray-100 flex justify-between items-center hover:text-green-400 transition-colors duration-300"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  {faq.question}
                  <span className="text-2xl">{activeFaq === index ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-300 mt-2 whitespace-pre-line"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Subscription;