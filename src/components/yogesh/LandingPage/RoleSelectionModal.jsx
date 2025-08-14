// src/components/modals/RoleSelectionModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RoleSelectionModal = ({ onSelectRole }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-700 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Who are you?</h2>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => onSelectRole('admin')}
              className="px-6 py-3 bg-purple-600 text-white rounded-md text-lg font-semibold hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Admin
            </button>
            <button
              onClick={() => onSelectRole('user')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              User
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RoleSelectionModal;