import React from 'react';
import { Link } from 'react-router-dom';

import Scores from "../assets/yogesh/communityimg/score-icon.png";
import Umpires from "../assets/yogesh/communityimg/umpire-icon.png";
import Commentators from "../assets/yogesh/communityimg/Commentators-icon.png";
import Streamers from "../assets/yogesh/communityimg/Streamers-icon.png";
import Organisers from "../assets/yogesh/communityimg/Organisers-icon.png";
import Shops from "../assets/yogesh/communityimg/Shops-icon.png";
import Academics from "../assets/yogesh/communityimg/Academics-icon.png";
import Grounds from "../assets/yogesh/communityimg/Grounds-icon.png";
import TrophyVendors from "../assets/yogesh/communityimg/TrophyVendors-icon.png";
import TshirtVendors from "../assets/yogesh/communityimg/T-shirtVendors-icon.png";
import BatManufactures from "../assets/yogesh/communityimg/BatManufactures-icon.png";
import PersonalCoaching from "../assets/yogesh/communityimg/PersonalCoaching-icon.png";
import backButton from '../assets/kumar/right-chevron.png'
import logo from '../assets/pawan/PlayerProfile/picture-312.png';
 

const communityItems = [
  { icon: Scores, label: "Scores", link: "/scores" },
  { icon: Umpires, label: "Umpires", link: "/umpires" },
  { icon: Commentators, label: "Commentators", link: "/commentators" },
  { icon: Streamers, label: "Streamers", link: "/streamers" },
  { icon: Organisers, label: "Organisers", link: "/organisers" },
  { icon: Shops, label: "Shops", link: "/shops" },
  { icon: Academics, label: "Academics", link: "/academics" },
  { icon: Grounds, label: "Grounds", link: "/grounds" },
  { icon: TrophyVendors, label: "Trophy Vendors", link: "/trophy-vendors" },
  { icon: TshirtVendors, label: "T-shirt Vendors", link: "/tshirt-vendors" },
  { icon: BatManufactures, label: "Bat Manufactures", link: "/bat-manufactures" },
  { icon: PersonalCoaching, label: "Personal Coaching", link: "/personal-coaching" },
];

const CommunitySection = () => {
  return (
    <section className="min-h-full bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white py-8 px-4 sm:py-12">
      {/* Top Navigation Bar */}
      <div className="flex flex-col mt-0">
              <div className="flex items-start md:pl-5">
                <img
                  src={logo}
                  alt="Cricklytics Logo"
                  className="h-7 w-7 md:h-10 object-contain block select-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/Picture3 2.png";
                  }}
                />
                <span className="p-2 text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">
                  Cricklytics
                </span>
              </div>
              </div>
              <div className="md:absolute flex items-center gap-4 md:pl-5">
                <img
                  src={backButton}
                  alt="Back"
                  className="h-8 w-8 cursor-pointer -scale-x-100"
                  onClick={() => window.history.back()}
                />
            </div>
 
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <p className="text-sm text-blue-300 mb-2">Here Play, track, discuss, live</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Community to interact together
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-base sm:text-lg">
            Here, we could check out friends and the clubs and the users to connect and play together
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {communityItems.map((item, index) => (
            <Link 
              key={`community-item-${index}`} 
              to={item.link}
              className="flex flex-col items-center p-2 pointer-events-none"
            >
                <div className="group transition-transform duration-300 hover:scale-105 transition-all duration-300 flex flex-col items-center pointer-events-auto">
                    <div className="bg-[#0b1a3b] border border-blue-600/50 rounded-lg p-3 mb-1 group-hover:border-blue-400 transition-colors duration-300">
                        <img src={item.icon} alt={item.label} className="w-10 h-10" />
                    </div>
                    <p className="text-xs sm:text-sm text-center text-gray-200 group-hover:text-white transition-colors duration-300">
                        {item.label}
                    </p>
                </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;