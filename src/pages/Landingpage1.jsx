import React, { useState } from "react";
import Navbar from "../components/yogesh/LoginPage/navbar";
import HeroSection1 from "../components/yogesh/LoginPage/HeroSection1";
import HeroSection2 from "../components/yogesh/LoginPage/HeroSection2";
import HeroSection3 from "../components/yogesh/LoginPage/HeroSection3";
import HeroSection4 from "../components/yogesh/LoginPage/HeroSection4";

// ✅ Import Swiper modules
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  EffectFade,
  Autoplay,
  Keyboard, // ✅ Add this
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

function Landingpage1() {
  const [bgColor, setBgColor] = useState("bg-blue-900");

  // ✅ Define backgrounds for each hero section
  const backgrounds = [
    "bg-blue-900",
    "bg-gradient-to-b from-[#0F618D] to-[#041B27]",
    "bg-gradient-to-r from-blue-900 to-blue-500",
    "bg-gradient-to-br from-[#CFF6F0] to-[#737373]",
  ];

  return (
    <div className={`min-h-screen w-full transition-all duration-500 ${bgColor}`}>
      {/* ✅ Navbar */}
      <Navbar bgColor={bgColor} />

      {/* ✅ Swiper with keyboard support */}
      <Swiper
        modules={[Navigation, Pagination, EffectFade, Autoplay, Keyboard]} // ✅ Added Keyboard module
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        effect="fade"
        autoplay={{ delay: 15000, disableOnInteraction: false }}
        keyboard={{ enabled: true }} // ✅ Enable keyboard navigation
        className="w-full"
        onSlideChange={(swiper) => setBgColor(backgrounds[swiper.activeIndex])}
      >
        <SwiperSlide>
          <HeroSection1 />
        </SwiperSlide>
        <SwiperSlide>
          <HeroSection2 />
        </SwiperSlide>
        <SwiperSlide>
          <HeroSection3 />
        </SwiperSlide>
        <SwiperSlide>
          <HeroSection4 />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}

export default Landingpage1;
