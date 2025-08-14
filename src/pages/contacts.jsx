// src/components/Contact.jsx
import { FaEnvelope, FaPhone, FaTimes } from 'react-icons/fa';

export default function Contact() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] relative">
      {/* Close icon */}
      <button 
        onClick={() => window.history.back()} 
        className="absolute top-4 right-4 text-white text-3xl hover:text-red-500 transition duration-200"
        aria-label="Close"
      >
        <FaTimes />
      </button>

      <div className="bg-[#1e40af] bg-opacity-90 p-6 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Contact Support</h1>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <FaEnvelope className="text-white mr-3" />
            <div>
              <p className="text-sm text-blue-200">Email</p>
              <a 
                href="mailto:support_cricklytics@creativityventures.co.in" 
                className="text-blue-100 hover:underline break-all"
              >
                support_cricklytics@creativityventures.co.in
              </a>
            </div>
          </div>

          <div className="flex items-center">
            <FaPhone className="text-white mr-3" />
            <div>
              <p className="text-sm text-blue-200">Phone</p>
              <a 
                href="tel:+917397362027" 
                className="text-blue-100 hover:underline"
              >
                +91 7397362027
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
