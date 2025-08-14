import React from 'react';
import { Link } from 'react-router-dom';

const SubscriptionSuccess = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
    <div className="max-w-7xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-green-400">Subscription Successful!</h1>
      <p className="mt-4 text-lg text-gray-300">Your plan has been updated. Enjoy your Cricklytics experience!</p>
      <Link to="/subscription" className="mt-6 inline-block px-4 py-2 bg-green-500 text-gray-900 rounded-full hover:bg-green-600">
        Back to Plans
      </Link>
    </div>
  </div>
);

export default SubscriptionSuccess; 