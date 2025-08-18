import React, { useState } from 'react';
import '../../styles/Awards.css';
import x1 from '../../assets/pawan/PlayerProfile/1.svg';
import Kudos from '../../assets/pawan/PlayerProfile/kudos4.png';
import x2025 from '../../assets/pawan/PlayerProfile/2025.png';
import app1288929611 from '../../assets/pawan/PlayerProfile/app-12889296-1-1.png';
import acup from '../../assets/pawan/PlayerProfile/cup1.png';
import award from '../../assets/pawan/PlayerProfile/awards.png';
import award1 from '../../assets/pawan/PlayerProfile/awards1.png';
import winnercriteria from '../../assets/pawan/PlayerProfile/winnercri.png';
import iconDesignArchiveAwards3 from '../../assets/pawan/PlayerProfile/icon-design-archive-awards-3.svg';
import jamInfo from '../../assets/pawan/PlayerProfile/jam-info.svg';
import Picture32 from '../../assets/pawan/PlayerProfile/picture-312.png';
import subtract from '../../assets/pawan/PlayerProfile/subtract.svg';
import FrameImage from '../../assets/kumar/right-chevron.png';
import Picture312Image from '../../assets/pawan/PlayerProfile/picture-312.png';
import { useNavigate } from "react-router-dom";

const Awards = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const handleButtonHover = (buttonId) => setHoveredButton(buttonId);
  const handleButtonLeave = () => setHoveredButton(null);
  const handleYearClick = (year) => setSelectedYear(year === selectedYear ? null : year);

  const InteractiveButton = ({ children, className, style, onClick, id }) => (
    <button
      className={`interactive-button ${className} ${hoveredButton === id ? 'hovered' : ''}`}
      style={style}
      onClick={onClick}
      onMouseEnter={() => handleButtonHover(id)}
      onMouseLeave={handleButtonLeave}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white flex flex-col items-center w-full min-h-screen awards-bg-gradient">
      {/* Header Section */}
      <div className="relative w-full h-fit flex flex-col items-center">
        <div className="absolute top-0 w-full flex justify-between items-center mb-4 px-4 sm:px-6">
          {/* Logo + Title + Back Button */}
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 cursor-pointer py-2" onClick={() => navigate("/landingpage")}>
              <img 
                src={Picture312Image} 
                alt="Logo" 
                className="w-20 h-20 sm:w-25 sm:h-25 object-cover" 
              />
              <span className="font-raleway font-bold text-white text-lg sm:text-2xl">Cricklytics</span>
            </div>
            <img
              src={FrameImage}
              alt="Back"
              loading="lazy"
              className="w-8 h-8 sm:w-10 sm:h-10 -scale-x-100 cursor-pointer"
              onClick={() => navigate("/landingpage")}
            />
          </div>

          {/* Right-side info icon */}
          <img src={jamInfo} alt="Jam info" className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>

        <img 
          src={Kudos} 
          alt="Kudos Banner" 
          className="w-full h-auto object-cover" 
        />

        {/* About Section */}
        <section className="flex flex-col items-center gap-3 sm:gap-5 relative w-full py-4 sm:py-8 mt-6 sm:mt-12 text-center px-4">
          <h1 className="text-3xl sm:text-5xl md:text-[4rem] font-merriweather-sans font-bold text-[#ff77d6] mb-2 sm:mb-4">
            About Cricklytics Kudos
          </h1>
          <h3 className="font-merriweather-sans text-white w-full sm:w-[90%] md:w-[70%] text-center text-sm sm:text-lg md:text-2xl leading-relaxed">
            The Cricklytics Kudos celebrate the passion, talent, and dedication of cricket's finest players and teams,
            honoring those who smash boundaries and create unforgettable moments on the field.
          </h3>
          <InteractiveButton
            className="mt-4 sm:mt-6 w-[160px] sm:w-[200px] md:w-[250px] h-10 sm:h-12 md:h-16 bg-[#4cc5dc] shadow-button-shadow text-sm sm:text-lg md:text-xl rounded-3xl"
            id="explore-button"
          >
            Explore
          </InteractiveButton>
        </section>

        {/* Awards Section */}
        <section className='flex flex-col items-center w-full min-h-screen bg-[#142136] py-8 sm:py-12 pb-12 sm:pb-20 px-4'>
          <h1 className="text-2xl sm:text-3xl md:text-[4rem] w-full sm:w-[90%] md:w-[70%] mt-6 sm:mt-9 font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#f09e64] text-center">
            Here the winning and Awards Details
          </h1>
          
          <div className="bg-[#142136] flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 sm:mt-10 w-full max-w-6xl">
            {/* Award Card 1 */}
            <div className="w-full sm:w-[300px] md:w-[350px] h-[300px] sm:h-[350px]">
              <div
                className="w-full h-full rounded-[1rem] flex flex-col items-center justify-center transition-all duration-500 p-4"
                style={{ background: 'linear-gradient(to top, #000000, #683902, #ED8C1A)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(120deg, #FF00B3, #7E0059, #000000)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(to top, #000000, #683902, #ED8C1A)')
                }
              >
                <div className="flex flex-col items-center">
                  <img src={award} alt="Award Icon" className="w-20 sm:w-24 h-20 sm:h-24 mb-3 sm:mb-4" />
                  <div className="font-bebas-neue text-[#f09e64] text-lg sm:text-xl md:text-2xl text-center tracking-wider [-webkit-text-stroke:1px_#ed8a48]">
                    CRICKLYTICS <span className='text-yellow-500'>2025</span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 flex justify-center">
                  <InteractiveButton
                    onClick={() => navigate("/Winner25")}
                    id="winners-2025-button"
                    className="w-[160px] sm:w-[200px] h-10 sm:h-12 md:h-14 bg-[#4cc5dc] shadow-button-shadow text-sm sm:text-lg md:text-xl rounded-3xl"
                  >
                    Winners of 2025
                  </InteractiveButton>
                </div>
              </div>
            </div>

            {/* Award Card 2 */}
            <div className="w-full sm:w-[300px] md:w-[350px] h-[300px] sm:h-[350px]">
              <div
                className="w-full h-full rounded-[1rem] flex flex-col items-center justify-center transition-all duration-500 p-4"
                style={{ background: 'linear-gradient(to top, #000000, #683902, #ED8C1A)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(120deg, #FF00B3, #7E0059, #000000)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(to top, #000000, #683902, #ED8C1A)')
                }
              >
                <img src={acup} alt="Trophy" className="w-24 sm:w-32 h-auto mb-3 sm:mb-4" />
                <div className="font-bebas-neue text-[#f09e64] text-lg sm:text-xl md:text-2xl text-center tracking-wider [-webkit-text-stroke:1px_#ed8a48]">
                  Popularity Award Winner
                </div>
                <div className="mt-3 sm:mt-4 flex justify-center items-center gap-3 sm:gap-5">
                  <InteractiveButton
                    onClick={() => navigate("/Winner25")}
                    id="past-winners-button"
                    className="w-[120px] sm:w-[140px] h-10 sm:h-12 bg-[#4cc5dc] shadow-button-shadow text-sm sm:text-base rounded-xl"
                  >
                    Past Winners
                  </InteractiveButton>
                  <InteractiveButton
                    id="view-result-button"
                    className="w-[120px] sm:w-[140px] h-10 sm:h-12 bg-[#4cc5dc] shadow-button-shadow text-sm sm:text-base rounded-xl"
                  >
                    View Result
                  </InteractiveButton>
                </div>
              </div>
            </div>

            {/* Award Card 3 */}
            <div className="w-full sm:w-[300px] md:w-[350px] h-[300px] sm:h-[350px]">
              <div
                className="w-full h-full rounded-[1rem] flex flex-col items-center justify-center transition-all duration-500 p-4"
                style={{ background: 'linear-gradient(to top, #000000, #683902, #ED8C1A)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(120deg, #FF00B3, #7E0059, #000000)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(to top, #000000, #683902, #ED8C1A)')
                }
              >
                <img src={award1} alt="App Icon" className="w-20 sm:w-28 h-auto mx-auto mb-3 sm:mb-4" />
                <h3 className="font-bebas-neue text-[#f09e64] text-lg sm:text-xl md:text-2xl text-center tracking-wider [-webkit-text-stroke:1px_#ed8a48]">
                  Categories Of 2025
                </h3>
                <InteractiveButton
                  id="check-now-1"
                  onClick={() => navigate("/Winner25")}
                  className="w-[160px] sm:w-[200px] h-10 sm:h-12 bg-[#4cc5dc] rounded-3xl text-sm sm:text-lg md:text-xl mt-3 sm:mt-5"
                >
                  CHECK NOW
                </InteractiveButton>
              </div>
            </div>

            {/* Award Card 4 */}
            <div className="w-full sm:w-[300px] md:w-[350px] h-[300px] sm:h-[350px]">
              <div
                className="w-full h-full rounded-[1rem] flex flex-col items-center justify-center transition-all duration-500 p-4"
                style={{ background: 'linear-gradient(to top, #000000, #683902, #ED8C1A)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(120deg, #FF00B3, #7E0059, #000000)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'linear-gradient(to top, #000000, #683902, #ED8C1A)')
                }
              >
                <img src={winnercriteria} alt="Trophy" className="w-24 sm:w-32 h-auto mb-3 sm:mb-4" />
                <div className="w-full flex flex-col items-center">
                  <div className="font-bebas-neue text-[#f09e64] text-lg sm:text-xl md:text-2xl text-center tracking-wider [-webkit-text-stroke:1px_#ed8a48]">
                    selection criteria
                  </div>
                  <InteractiveButton
                    id="sel-criteria"
                    onClick={() => navigate("/SelectionCriteria")}
                    className="w-[160px] sm:w-[200px] h-10 sm:h-12 bg-[#4cc5dc] rounded-xl text-sm sm:text-lg md:text-xl mt-3 sm:mt-5"
                  >
                    See the result
                  </InteractiveButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Awards;