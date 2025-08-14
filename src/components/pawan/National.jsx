import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Picture32 from '../../assets/pawan/PlayerProfile/picture-312.png';

// Flags imports
import Australia from '../../assets/pawan/PlayerProfile/australia.png';
import India from '../../assets/pawan/PlayerProfile/india.png';
import England from '../../assets/pawan/PlayerProfile/england.png';
import SouthAfrica from '../../assets/pawan/PlayerProfile/south-africa.png';
import NewZealand from '../../assets/pawan/PlayerProfile/new-zealand.png';
import Pakistan from '../../assets/pawan/PlayerProfile/pakistan.png';
import SriLanka from '../../assets/pawan/PlayerProfile/sri-lanka.png';
import WestIndies from '../../assets/pawan/PlayerProfile/west-indies.png';
import Bangladesh from '../../assets/pawan/PlayerProfile/bangladesh.png';
import Afghanistan from '../../assets/pawan/PlayerProfile/afghanistan.png';
import Ireland from '../../assets/pawan/PlayerProfile/ireland.png';
import Zimbabwe from '../../assets/pawan/PlayerProfile/zimbabwe.png';
import Netherlands from '../../assets/pawan/PlayerProfile/netherlands.png';
import Scotland from '../../assets/pawan/PlayerProfile/scotland.png';
import Nepal from '../../assets/pawan/PlayerProfile/nepal.png';



const National = () => {
  const navigate = useNavigate();
  const [showCountries, setShowCountries] = useState(false);

  const sections = [
    {
      title: "All Countries",
      state: showCountries,
      setState: setShowCountries,
      items: [
        { name: "Australia", flag: Australia },
        { name: "India", flag: India },
        { name: "England", flag: England },
        { name: "South Africa", flag: SouthAfrica },
        { name: "New Zealand", flag: NewZealand },
        { name: "Pakistan", flag: Pakistan },
        { name: "Sri Lanka", flag: SriLanka },
        { name: "West Indies", flag: WestIndies },
        { name: "Bangladesh", flag: Bangladesh },
        { name: "Afghanistan", flag: Afghanistan },
        { name: "Ireland", flag: Ireland },
        { name: "Zimbabwe", flag: Zimbabwe },
        { name: "Netherlands", flag: Netherlands },
        { name: "Scotland", flag: Scotland },
        { name: "Nepal", flag: Nepal }
      ]
    }
  ];

  return (
    <div className="min-h-full bg-gradient-to-b from-black to-[#001A80] bg-fixed text-white p-5">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg mb-5">
        <div className="flex items-center gap-4">
          <img 
            src={Picture32}
            alt="Cricklytics Logo"
            className="h-10 object-contain block"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/Picture3 2.png";
            }}
          />
          <span className="text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">
            Cricklytics
          </span>
        </div>
        {/* <button 
          className="text-white bg-[#5DE0E6] px-4 py-2 rounded-lg hover:bg-[#48C6EF]"
          onClick={() => navigate("/go-live")}
        >
          Back to Go Live
        </button> */}
      </div>

      {/* Container for Title and Dropdowns */}
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-[rgba(71,156,182,0.7)] p-8 rounded-xl shadow-lg border border-white/20">
          <h1 className="text-3xl  text-black font-bold text-center mb-6">International and National Cricket Teams</h1>
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="relative">
                <div 
                  className="flex items-center justify-between gap-2 cursor-pointer text-lg p-4 bg-[#5DE0E6] text-black rounded-lg transition-all duration-300 hover:bg-[#48C6EF]"
                  onClick={() => section.setState(!section.state)}
                >
                  <span className="font-bold">{section.title}</span>
                  {section.state ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
                </div>
                {section.state && (
                  <ul className="bg-[#1b2627] text-white rounded-lg py-2 mt-2 max-h-[300px] overflow-y-auto border border-white/50 shadow-md">
                    {section.items.map((item) => (
                      <li 
                        key={item.name}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[#48C6EF] hover:text-white transition-all duration-200"
                        onClick={() => navigate(`/team/${item.name.toLowerCase().replace(/\s+/g, "-")}`)}
                      >
                        <img 
                          src={item.flag} 
                          alt={`${item.name} flag`} 
                          className="w-6 h-4 object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/flags/placeholder.png";
                          }}
                        />
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-6 items-center mt-10 w-full max-w-[800px] mx-auto px-4">
          <button 
            onClick={() => navigate("/landingpage")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={() => navigate("/go-live")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
            Back 
          </button>
          {/* <button 
            onClick={() => navigate("/some-next-page")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Skip
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default National;
