import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TournamentSuccess = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => {
      setIsVisible(true);
    }, 100); // Small delay for smoother feel
  }, []);

  const handleGoToTournament = () => {
    navigate('/tournament');
  };

  return (
    <section className="min-h-screen w-full overflow-hidden z-0 bg-gradient-to-b from-[#0A141B] to-[#24406E] relative flex items-center justify-center">
      {/* Glowing background effect */}
      <div className="absolute left-[-20%] top-[20%] w-[90rem] h-[60rem] rounded-full bg-[radial-gradient(circle,rgba(93,224,230,0.4)_30%,rgba(93,224,230,0.15)_60%,rgba(93,224,230,0.05)_100%)] blur-2xl -z-10 animate-pulse-slow"></div>
      
      <div
        className={`z-20 bg-[#1A2B4C] rounded-2xl shadow-[0px_0px_30px_10px_rgba(37,58,110,0.5)] p-8 max-w-md text-center transform transition-all duration-700 ease-in-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}
      >
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-[#5DE0E6] animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl text-white font-bold mb-4 tracking-wide">Success!</h1>
        <p className="text-lg text-gray-200 mb-8 font-medium">
          Tournament is created Successfully. Go to tournaments to start.
        </p>
        <button
          onClick={handleGoToTournament}
          className="rounded-xl bg-gradient-to-r from-[#5DE0E6] to-[#004AAD] px-8 py-3 text-white font-semibold cursor-pointer hover:shadow-[0px_0px_15px_3px_#5DE0E6] transition-shadow duration-300"
        >
         Go to Tournament &gt;&gt; My Tournament &gt;&gt; Click "OK" to start
        </button>
      </div>
    </section>
  );
};

export default TournamentSuccess;
