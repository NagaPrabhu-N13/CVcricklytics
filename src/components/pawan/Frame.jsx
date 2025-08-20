import React from 'react';
import Picture312Image from '../../assets/pawan/PlayerProfile/picture-312.png';
import VectorImage from '../../assets/pawan/PlayerProfile/jam-info.svg';
import leftchevron from '../../assets/kumar/right-chevron.png';
import { useNavigate } from "react-router-dom";

const Frame1321317519 = () => {

    const navigate = useNavigate();

  return (
    <div className="absolute top-0 left-0 w-full h-10 grid">
    {/* Header section with logo and menu icon */}
    <div className="flex items-center justify-between h-[32px] pl-[10px] pt-3"> {/* Added left padding here */}
      {/* Picture3 1 2 Image now comes FIRST */}
      <img
        src={Picture312Image}
        alt="Picture3 1 2"
        loading="lazy"
        className="h-20 w-20 md:h-30 object-contain select-none cursor-pointer pl-1"
        onClick={() => navigate("/landingpage")}
      />
      
      {/* Cricklytics Text - now comes AFTER the image with 3px space */}
      <div
        className="text-white font-raleway font-bold text-[20px] leading-[100%] cursor-pointer ml-[3px] pl-1.5"
      >
        Cricklytics
      </div>
      
      {/* JamInfo Container (menu icon) - positioned to the right */}
      <div className="ml-auto pr-[10px]"> {/* Added right padding here */}
        <img
          src={VectorImage}
          alt="Vector"
          loading="lazy"
          className="left-[6px] top-[1px] w-[30.5px] h-[30.17px] pt-3 pr-3"
        />
      </div>
    </div>
  
    {/* Frame Image (back button) - positioned lower with margin-top and left padding */}
    <img
      src={leftchevron}
      alt="Frame 1321317522"
      loading="lazy"
      className="w-10 h-10 -scale-x-100 cursor-pointer mt-[20px] ml-[10px]" 
      onClick={() => navigate(window.history.back())}
    />
  </div>
  );
};

export default Frame1321317519;

// left-[6px] top-[1px] w-[30.5px] h-[30.17px] pt-3 pr-3