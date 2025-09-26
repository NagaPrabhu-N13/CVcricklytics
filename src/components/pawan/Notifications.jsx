// src/components/Notifications.jsx
import { FaTimes } from 'react-icons/fa';

export default function Notifications() {
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
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Notifications</h1>
        <div className="text-center">
          <p className="text-blue-100">No notifications</p>
        </div>
      </div>
    </div>
  );
}