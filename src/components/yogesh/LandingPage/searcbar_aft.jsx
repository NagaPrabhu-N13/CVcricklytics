import React from 'react';
import { Search } from 'lucide-react';
// import umpireImg from '../assets/images/umpire.png'; // Make sure this path is correct
import umpireaft from "../../../assets/yogesh/LandingPage/umpire-aft.png";




function SearchBarAft() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#021625] px-4">
    <div className="z-[2000] flex flex-col items-center bg-opacity-40 backdrop-blur-md  rounded-xl p-6 w-full max-w-xl text-white">
              < div className="flex items-center gap-3 mb-4 w-full">
                <div className="flex items-center bg-gray-700 rounded-full px-4 py-2 w-full">
                  <button className="w-8 h-8 rounded-full border-4 border-cyan-500 flex items-center justify-center mr-2"  onClick={() => navigate("/search-aft")}>
                    <Search className="text-white w-4 h-4"/>
                  </button>
                  <input
                    type="text"
                    placeholder="Search"
                    className="bg-transparent outline-none text-white w-full"
                  />
                </div>
              </div>
     
              <div className="flex gap-3 flex-wrap w-full justify-center">
                {['Team', 'Tournament', 'Match', 'Stats','Highlights'].map((tag) => (
                  <button
                    key={tag}
                    className="bg-gray-200 text-black font-semibold px-4 py-1 rounded-full hover:bg-gray-300"
                    onClick={() => {
                      if (tag === 'Stats') navigate('/stats');
                      else if (tag === 'Match') navigate('/match');
                      else if (tag === 'Tournament') navigate('/tournament');
                      else if (tag === 'Team') navigate('/team')
                      else if (tag === 'Highlights') navigate('/highlights');
                      else alert(`No page implemented for ${tag}`); // fallback or add more routes
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
    </div>
  );
}

export default SearchBarAft;





