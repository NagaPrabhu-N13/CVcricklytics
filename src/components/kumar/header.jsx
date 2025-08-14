import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from '../../assets/kumar/logo.png';
import FrameImage from '../../assets/kumar/right-chevron.png';

const HeaderComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    navigate('/landingpage');
  };

  const handleBackClick = () => {
    const currentPath = location.pathname;

    if (currentPath === '/TournamentPage') {
      navigate('/next'); // Page 3 to Page 2
    } else if (currentPath === '/next') {
      navigate('/tournamentseries'); // Page 2 to Page 1
    } else if (currentPath === '/tournamentseries') {
      navigate('/landingpage'); // Page 1 to landing page
    } else {
      navigate(-1); // Fallback to browser history for other routes
    }
  };

  return (
    <div className="flex justify-between items-center pt-2 px-4 pb-0 rounded-lg mb-1">
      <div className="flex flex-col items-start gap-2">
        <div
          className="flex items-center gap-4 cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          <img
            src={logo}
            alt="Cricklytics Logo"
            className="h-7 w-7 md:h-10 object-contain block select-none"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = logo;
            }}
          />
          <span className="text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">
            Cricklytics
          </span>
        </div>
        <img
          src={FrameImage}
          alt="Back Button"
          loading="lazy"
          className="w-10 h-10 -scale-x-100 cursor-pointer mt-[5px] ml-[1px]" 
          onClick={handleBackClick}
        />
      </div>
    </div>
  );
};

export default HeaderComponent;