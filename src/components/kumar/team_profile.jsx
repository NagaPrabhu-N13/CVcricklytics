import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nav from '../../assets/kumar/right-chevron.png';

function TeamProfileForm() {
  const [teamLogo, setTeamLogo] = useState(null);
  const [players, setPlayers] = useState([{ name: '', role: '' }]);
  const navigate = useNavigate();
  
  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    setTeamLogo(URL.createObjectURL(file));
  };

  const handlePlayerChange = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  const handleAddPlayer = () => {
    setPlayers([...players, { name: '', role: '' }]);
  };

  const handleRemovePlayer = (index) => {
    const updatedPlayers = players.filter((_, i) => i !== index);
    setPlayers(updatedPlayers);
  };

  const nextpage = (event) => {
    event.preventDefault(); 
    navigate('/next'); 
  };
  const herenext = () => {
    navigate('/next');
  };

  return (
    <section className="min-h-screen w-full overflow-hidden z-0 bg-gradient-to-b from-[#0D171E] to-[#283F79] relative">
      <section className="min-h-screen z-0 bg-gradient-to-b from-[#0D171E] to-[#283F79] relative">

      <div className="z-20 flex overflow-hidden justify-center w-full p-[1rem] md:p-[5rem] relative">
                <form className="z-30 gap-5 md:gap-10 bg-[#1A2B4C] rounded-[1rem] md:rounded-[2rem] shadow-[11px_-7px_0px_3px_#253A6E] md:shadow-[22px_-14px_0px_5px_#253A6E] flex flex-col items-start justify-around w-full max-w-[90rem] pl-[1rem] pr-[1rem] pt-[2rem] pb-[1rem] md:pl-[5rem] md:pr-[5rem] md:pt-[5rem] md:pb-[2rem]" onSubmit={nextpage}>
            <button
                          onClick={herenext}
                          className="mt-10 text-sm cursor-pointer bg-yellow-900"
                        >
                          <img src={nav} className="absolute w-10 h-10 -scale-x-100 top-13 left-10" alt="Back" />
                        </button>
            
            <h2 className="text-4xl text-white font-bold ">Enter Team Data & Rosters</h2>

            <div className="mb-4 pt-[2rem]">
              <label htmlFor="teamLogo" className="block text-lg text-white mb-2">Upload Team Logo</label>
              <input
                type="file"
                id="teamLogo"
                accept="image/*"
                className="block w-full text-sm text-gray-300 border border-gray-300 rounded-md file:py-2 file:px-4 file:border-none file:bg-blue-500 file:text-white file:rounded-md"
                onChange={handleLogoChange}
              />
              {teamLogo && (
                <div className="mt-2">
                  <img src={teamLogo} alt="Team Logo" className="w-32 h-32 object-cover rounded-md" />
                </div>
              )}
            </div>

            {players.map((player, index) => (
              <div key={index} className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2 ">Player {index + 1}</h3>

                <label htmlFor={`playerName-${index}`} className="block text-lg text-white mb-2">Player Name</label>
                <input
                  type="text"
                  id={`playerName-${index}`}
                  value={player.name}
                  onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                  placeholder="Enter player name"
                  className="w-full px-4 py-2 border text-white border-gray-300 rounded-md"
                />

                <label htmlFor={`playerRole-${index}`} className="block text-lg text-white mb-2 mt-2">Player Role</label>
                <select
                  id={`playerRole-${index}`}
                  value={player.role}
                  onChange={(e) => handlePlayerChange(index, 'role', e.target.value)}
                  className="w-full px-4 py-2 border text-white bg-yellow-900 border-gray-300 rounded-md"
                >
                  <option value="">Select Role</option>
                  <option value="Captain">Captain</option>
                  <option value="Player">Player</option>
                  <option value="Substitute">Substitute</option>
                  <option value="Coach">Coach</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemovePlayer(index)}
                  className="mt-2 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove Player
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddPlayer}
              className="w-full lg:w-[50%] py-3 bg-cyan-500 text-white rounded-md hover:bg-blue-500 mt-4 cursor-pointer"
            >
              Add Another Player
            </button>

            <button
              type="button"
              onClick={nextpage}
              className="w-full py-3 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] text-white rounded-md hover:shadow-[0px_0px_13px_0px_#5DE0E6] mt-4 cursor-pointer"
            >
              Submit Team Data
            </button>
          </form>
        </div>
      </section>
    </section>
  );
}

export default TeamProfileForm;
