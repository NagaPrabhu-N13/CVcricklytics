import React, { createContext, useContext, useState } from 'react';

const ClubContext = createContext();

export const ClubProvider = ({ children }) => {
  const [clubName, setClubName] = useState('');

  return (
    <ClubContext.Provider value={{ clubName, setClubName }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => useContext(ClubContext);