import { useState } from 'react';
import HeaderComponent from '../components/kumar/header';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import upload from '../assets/kumar/image-regular.svg';
import location from '../assets/kumar/loc.png';
import ball1 from '../assets/kumar/cricket-ball.png';
import ball2 from '../assets/kumar/ball-others.png';
import others from '../assets/kumar/icons8-tennis-ball-96.png';
import { db } from '../firebase';
import { collection, query, where, getDocs, setDoc, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Tournamentseries() {
    const navigate = useNavigate();
    const [isRulesVisible, setIsRulesVisible] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    
    const toggleDivVisibility = (e) => {
      e.preventDefault();
      setIsRulesVisible(prevState => !prevState); 
    };
   
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedImage(file);
        setShowValidationError(false);
      }
    };

    const handleNavigation = async (e) => {
      e.preventDefault();
      
      const isFormValid = (
        tournamentName.trim() !== '' && 
        selectedLocation.trim() !== '' && 
        noOfTeams.trim() !== '' && 
        startDate !== '' && 
        endDate !== '' && 
        physicalLocation.trim() !== '' && 
        selectedTiming !== '' && 
        selectedBall !== null && 
        selectedPitch !== null && 
        selectedcategory !== null && 
        selectedmatchtype !== null && 
        selectedwp !== null
      );

      if (!isFormValid) {
        setShowValidationError(true);
        return;
      }

      let imageUrl = '';
      if (selectedImage) {
        try {
          const storage = getStorage();
          const storageRef = ref(storage, `tournament_images/${Date.now()}_${selectedImage.name}`);
          await uploadBytes(storageRef, selectedImage);
          imageUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error('Error uploading image:', error);
          setShowValidationError(true);
          return;
        }
      }

      const userId = auth.currentUser?.uid;

      const tournamentData = {
        name: tournamentName,
        location: selectedLocation,
        noOfTeams: noOfTeams,
        startDate: startDate,
        endDate: endDate,
        physicalLocation: physicalLocation,
        schedule: selectedSchedule,
        timing: selectedTiming,
        pitch: selectedPitch,
        category: selectedcategory,
        matchType: selectedmatchtype,
        ball: selectedBall,
        winningPrize: selectedwp,
        homeAwayFormat: homeAwayFormat,
        lastBatterRule: lastBatterRule,
        createdAt: new Date().toISOString(),
        imageUrl: imageUrl,
        userId: userId || null
      };

      try {
        const q = query(collection(db, 'tournament'), where('name', '==', tournamentName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docRef = doc(db, 'tournament', querySnapshot.docs[0].id);
          await updateDoc(docRef, tournamentData);
        } else {
          await setDoc(doc(collection(db, 'tournament')), tournamentData);
        }

        navigate('/next', { state: { noOfTeams, tournamentName } });
      } catch (error) {
        console.error('Error saving tournament data:', error);
        setShowValidationError(true);
      }
    };

    const handleCancel = (e) => {
      e.preventDefault();
      const hasData = (
        tournamentName || 
        selectedLocation || 
        noOfTeams || 
        startDate || 
        endDate || 
        physicalLocation || 
        selectedTiming || 
        selectedBall !== null || 
        selectedPitch !== null || 
        selectedcategory !== null || 
        selectedmatchtype !== null || 
        selectedwp !== null ||
        homeAwayFormat ||
        lastBatterRule ||
        selectedImage
      );

      if (hasData) {
        if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
          window.location.reload();
        }
      } else {
        navigate('/'); 
      }
    };
    
    const [tournamentName, setTournamentName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [noOfTeams, setNoOfTeams] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [physicalLocation, setPhysicalLocation] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [selectedTiming, setSelectedTiming] = useState('');
    const [selectedPitch, setSelectedPitch] = useState(null);
    const [selectedcategory, setSelectedcatagory] = useState(null);
    const [selectedmatchtype, setSelectedmatchtype] = useState(null);
    const [selectedBall, setSelectedBall] = useState(null);
    const [selectedwp, setSelectedwp] = useState(null);
    const [homeAwayFormat, setHomeAwayFormat] = useState(false);
    const [lastBatterRule, setLastBatterRule] = useState(false);

    const pitchOptions = ['Rough', 'Cement', 'Matting', 'Turf', 'Astroturf'];
    const categoryoption = ['community', 'corporate', 'open', 'school', 'others', 'series', 'college', 'university'];
    const matchtypeoption = ['limited overs', 'Box cricket', 'Pair Cricket', 'Test match', 'the hundered'];
    const wpoption = ['Cash', 'Trophies', 'Both'];
    const timingOptions = ['Morning', 'Noon', 'Night'];

    const handlePitchClick = (pitch) => {
        setSelectedPitch(pitch);
        setShowValidationError(false);
    };

    const handlecategoryclick = (Category) => {
        setSelectedcatagory(Category);
        setShowValidationError(false);
    };

    const handlematchtypeclick = (matchtype) => {
        setSelectedmatchtype(matchtype);
        setShowValidationError(false);
    };

    const handleBallClick = (ball) => {
        setSelectedBall(ball);
        setShowValidationError(false);
    };

    const handlewpclick = (wp) => {
        setSelectedwp(wp);
        setShowValidationError(false);
    };
    
    return (
      <section className="min-h-screen w-full overflow-hidden z-0 bg-gradient-to-b from-[#0D171E] to-[#283F79] relative">
            <HeaderComponent />
            {isRulesVisible && (
            <div 
            id="rules" 
            className="fixed left-0 w-full h-full flex justify-center items-center inset-0 bg-opacity-40 backdrop-blur-md z-[9999]" 
          >
            <div className="absolute z-[9999] bg-gradient-to-b from-[#0D171E] to-[#283F79] p-4 md:p-6 rounded-lg shadow-lg max-w-[90%] md:max-w-[80%] lg:max-w-[60%]">
            <button 
              className="absolute top-2 right-2 md:top-4 md:right-4 text-xl md:text-2xl text-white cursor-pointer"
              onClick={toggleDivVisibility}
            >
              X
            </button>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 md:mb-4">Rules & Description</h2>
              <p className="text-sm md:text-base lg:text-lg text-white mb-2 md:mb-4">
                Welcome to our platform! Below are some important rules and instructions to ensure a smooth experience:
              </p>
              <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm lg:text-base text-white mb-3 md:mb-6">
                <li className="mb-1 md:mb-2">All users must adhere to our <strong>community guidelines</strong> at all times.</li>
                <li className="mb-1 md:mb-2">Respect other participants and avoid any form of harassment.</li>
                <li className="mb-1 md:mb-2">Keep your language professional and refrain from offensive content.</li>
                <li className="mb-1 md:mb-2">Ensure your profile is accurate and up-to-date.</li>
                <li className="mb-1 md:mb-2">Any breach of rules may lead to suspension or ban.</li>
              </ul>
              <div className="bg-gray-800 p-2 md:p-4 rounded-lg">
                <p className="text-sm md:text-base lg:text-lg text-white font-bold">Instructions for use:</p>
                <p className="text-xs md:text-sm text-white">To get started, please follow these simple steps:</p>
                <ol className="list-decimal pl-4 md:pl-6 text-xs md:text-sm text-white mb-2 md:mb-4">
                  <li className="mb-1 md:mb-2">Register an account and verify your email address.</li>
                  <li className="mb-1 md:mb-2">Complete your profile by adding relevant details.</li>
                  <li className="mb-1 md:mb-2">Explore available features and get involved in the community.</li>
                </ol>
              </div>
              <div className="mt-3 md:mt-6">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 md:mb-3">Additional Guidelines</h3>
                <p className="text-xs md:text-sm text-white">Here are a few extra tips to enhance your experience:</p>
                <ul className="list-inside list-circle text-xs md:text-sm text-white">
                  <li className="mb-1 md:mb-2">Stay active to maintain your reputation.</li>
                  <li className="mb-1 md:mb-2">Engage with others through comments and feedback.</li>
                  <li className="mb-1 md:mb-2">Feel free to report any inappropriate content.</li>
                </ul>
              </div>
            </div>
          </div>
            )}

            <div className="absolute left-[-25%] top-[30%] w-[80rem] h-[50rem] rounded-full bg-[radial-gradient(circle,rgba(69,218,255,0.5)_40%,rgba(69,218,255,0.1)_60%,rgba(69,218,255,0.1)_100%)] blur-lg -z-10"></div>

            <div className="z-20 flex overflow-hidden justify-center w-full px-4 md:px-8 pt-4 pb-4 md:pt-8 md:pb-8 relative">
                <form className="z-30 gap-3 md:gap-4 bg-[#1A2B4C] rounded-xl md:rounded-2xl shadow-[11px_-7px_0px_3px_#253A6E] md:shadow-[22px_-14px_0px_5px_#253A6E] flex flex-col items-start justify-around w-full max-w-4xl p-4 md:p-6">
                    <h1 className="text-xl md:text-2xl lg:text-3xl text-white font-bold w-full text-center">Add Tournament/Series</h1>
                    
                    {showValidationError && (
                      <div className="w-full bg-red-500 text-white p-2 md:p-3 rounded-lg mb-2 md:mb-4 text-sm md:text-base">
                        Please fill all required fields before proceeding.
                      </div>
                    )}
                    
                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <label className="text-sm md:text-base lg:text-xl text-white">Tournament/ Series Name*</label>
                        <input 
                          className="w-full md:w-64 h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl text-sm md:text-base" 
                          type="text" 
                          placeholder="" 
                          value={tournamentName}
                          onChange={(e) => {
                            setTournamentName(e.target.value);
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !tournamentName.trim() && (
                          <p className="text-red-500 text-xs md:text-sm absolute bottom-[-18px] right-0">This field is required</p>
                        )}
                    </div>
                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <h2 className="text-sm md:text-base lg:text-xl text-white">Upload an Image</h2>
                        <div className="w-full md:w-auto relative flex items-center justify-between gap-3 md:gap-5 mb-3 md:mb-6">
                        <div className="w-32 md:w-40 h-fit p-1 md:p-2 bg-white rounded-lg md:rounded-xl shadow-lg">
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-12 md:h-16 border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                                    <div className="flex flex-col items-center justify-center pt-2 pb-3 md:pt-3 md:pb-4">
                                        <img className="w-5 h-5 md:w-6 md:h-6" src={upload} alt="upload" />
                                        <p className="mb-1 text-[8px] md:text-[10px] text-gray-500"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                                    </div>
                                    <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <label className="text-sm md:text-base lg:text-xl text-white">Venue*</label>
                        <input 
                          className="w-full md:w-64 h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl text-sm md:text-base" 
                          type="text" 
                          placeholder="" 
                          value={selectedLocation}
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !selectedLocation.trim() && (
                          <p className="text-red-500 text-xs md:text-sm absolute bottom-[-18px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <label className="text-sm md:text-base lg:text-xl text-white">Number of Teams*</label>
                        <input 
                          className="w-full md:w-64 h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl text-sm md:text-base" 
                          type="text" 
                          placeholder="" 
                          value={noOfTeams}
                          onChange={(e) => {
                            setNoOfTeams(e.target.value);
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !noOfTeams.trim() && (
                          <p className="text-red-500 text-xs md:text-sm absolute bottom-[-18px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="relative flex flex-col md:flex-row justify-between w-full gap-1 md:gap-2">
                    <label className="text-xs md:text-sm lg:text-base text-white">Dates*</label>
                    <div className="w-full flex flex-col md:flex-row gap-1 md:gap-2">                    
                            <div className="flex items-center w-full md:w-auto">
                                <label className="text-xs md:text-sm lg:text-base text-white">Start Date</label>
                                <input 
                                  className="w-32 md:w-40 h-10 md:h-12 border-2 border-white text-white p-1 md:p-2 rounded-lg md:rounded-xl ml-1 md:ml-2 text-sm md:text-base"
                                  type="date" 
                                  value={startDate}
                                  onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setShowValidationError(false);
                                  }}
                                />
                                {showValidationError && !startDate && (
                                  <p className="text-red-500 text-xs md:text-sm absolute bottom-[-18px] left-[100px] md:left-[120px]">This field is required</p>
                                )}
                            </div>
                            <div className="flex items-center w-full md:w-auto">
                                <label className="text-xs md:text-sm lg:text-base text-white">End Date</label>
                                <input 
                                  className="w-32 md:w-40 h-10 md:h-12 border-2 border-white text-white p-1 md:p-2 rounded-lg md:rounded-xl ml-1 md:ml-2 text-sm md:text-base" 
                                  type="date" 
                                  value={endDate}
                                  onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setShowValidationError(false);
                                  }}
                                />
                                {showValidationError && !endDate && (
                                  <p className="text-red-500 text-xs md:text-sm absolute bottom-[-18px] left-[100px] md:left-[120px]">This field is required</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <label className="text-sm md:text-base lg:text-xl text-white">Location*</label>
                        <input
                            className="w-full md:w-64 h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl bg-no-repeat pl-3 pr-8 md:pl-4 md:pr-10 py-1 md:py-2 placeholder-white text-sm md:text-base"
                            type="text"
                            placeholder=""
                            value={physicalLocation}
                            onChange={(e) => {
                              setPhysicalLocation(e.target.value);
                              setShowValidationError(false);
                            }}
                            style={{
                                backgroundImage: `url(${location})`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundSize: '1rem 1rem'
                            }}
                        />
                        {showValidationError && !physicalLocation.trim() && (
                          <p className="text-red-500 text-xs md:text-sm absolute bottom-[-18px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <label className="text-sm md:text-base lg:text-xl text-white">Schedule</label>
                        <div className="flex items-center gap-1 md:gap-2">
                            <input 
                              className="accent-cyan-500 w-4 h-4" 
                              type="radio" 
                              name="days" 
                              id="weekdays" 
                              checked={selectedSchedule === 'weekdays'}
                              onChange={() => {
                                setSelectedSchedule('weekdays');
                                setShowValidationError(false);
                              }}
                            />
                            <label className="text-xs md:text-sm lg:text-base text-white ml-1" htmlFor="weekdays">Weekdays</label>

                            <input 
                              className="accent-cyan-500 w-4 h-4 ml-1 md:ml-2" 
                              type="radio" 
                              name="days" 
                              id="weekends" 
                              checked={selectedSchedule === 'weekends'}
                              onChange={() => {
                                setSelectedSchedule('weekends');
                                setShowValidationError(false);
                              }}
                            />
                            <label className="text-xs md:text-sm lg:text-base text-white ml-1" htmlFor="weekends">Weekend</label>
                        </div>
                    </div>

                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <label htmlFor="timing" className="text-sm md:text-base lg:text-xl text-white">Choose your Timing*</label>
                        <select 
                          id="timing" 
                          name="timing" 
                          className="block w-full md:w-64 h-10 md:h-12 bg-white-900 px-2 md:px-4 py-1 md:py-2 border border-white rounded-lg md:rounded-xl text-gray-200 focus:ring-blue-500 cursor-pointer text-sm md:text-base"
                          value={selectedTiming}
                          onChange={(e) => {
                            setSelectedTiming(e.target.value);
                            setShowValidationError(false);
                          }}
                        >
                            <option value="" className='bg-blue-400 text-white'>Select a Timing</option>
                            {timingOptions.map(time => (
                              <option key={time} value={time} className='bg-blue-400 text-white'>{time}</option>
                            ))}
                        </select>
                        {showValidationError && !selectedTiming && (
                          <p className="text-red-500 text-xs md:text-sm absolute bottom-[-18px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-3">
                        <label className="text-sm md:text-base lg:text-xl text-white">Rules and Description</label>
                        <div className="w-full md:w-auto relative flex items-center justify-between gap-3 md:gap-5 mb-3 md:mb-6">
                       <button id="view-rules" className="rounded-lg md:rounded-xl w-20 md:w-24 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white text-xs md:text-sm cursor-pointer" onClick={toggleDivVisibility}>
                       {isRulesVisible ? 'Hide Rules' : 'View Rules'}
                       </button>
                       </div>
                    </div>
                    
                    <div className='relative flex-col items-center w-full'>
                      <h1 className='text-sm md:text-base lg:text-xl text-white mb-2 md:mb-4'>Ball Type*</h1>
                      <div className='relative flex items-center w-full h-fit gap-2 md:gap-4'>
                        <a
                          className={`animate-rotate flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full ${selectedBall === 'ball1' ? 'bg-blue-100' : 'bg-transparent'} hover:text-white cursor-pointer`}
                          onClick={() => handleBallClick('ball1')}
                        >
                          <img src={ball1} alt="" className='w-14 h-14 md:w-16 md:h-16' />
                        </a>
                        <a
                          className={`animate-rotate flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full ${selectedBall === 'others' ? 'bg-blue-100' : 'bg-transparent'} hover:text-white cursor-pointer`}
                          onClick={() => handleBallClick('others')}
                        >
                          <img src={others} alt="" className='w-14 h-14 md:w-16 md:h-16' />
                        </a>
                        <a
                          className={`animate-rotate flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full ${selectedBall === 'ball2' ? 'bg-blue-100' : 'bg-transparent'} hover:text-white cursor-pointer`}
                          onClick={() => handleBallClick('ball2')}
                        >
                          <img src={ball2} alt="" className='w-12 h-12 md:w-14 md:h-14' />
                        </a>
                      </div>
                      {showValidationError && selectedBall === null && (
                        <p className="text-red-500 text-xs md:text-sm mt-1">Please select a ball type</p>
                      )}
                    </div>

                    <div id='pitch' className="w-full relative flex-col items-center justify-between gap-2 md:gap-3">
                      <label className="text-sm md:text-base lg:text-xl text-white">Pitch Type*</label>
                      <div className='w-full relative flex flex-wrap items-center justify-start mt-1 md:mt-2'>
                        {pitchOptions.map((pitch) => (
                          <input
                            key={pitch}
                            type="text"
                            className={`rounded-lg md:rounded-xl w-16 md:w-20 h-7 md:h-8 m-0.5 md:m-1 cursor-pointer text-center text-xs md:text-sm font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${selectedPitch === pitch ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={pitch}
                            onClick={() => handlePitchClick(pitch)}
                          />
                        ))}
                        {showValidationError && selectedPitch === null && (
                          <p className="text-red-500 text-xs md:text-sm mt-1">Please select a pitch type</p>
                        )}
                      </div>
                    </div>
    
                    <div id='Category' className="w-full relative flex-col items-center justify-between gap-2 md:gap-3">
                      <label className="text-sm md:text-base lg:text-xl text-white">Tournament Category*</label>
                      <div className='w-full relative flex flex-wrap items-center justify-start mt-1 md:mt-2'>
                        {categoryoption.map((Category) => (
                          <input
                            key={Category}
                            type="text"
                            className={`rounded-lg md:rounded-xl w-16 md:w-20 h-7 md:h-8 m-0.5 md:m-1 cursor-pointer text-center text-xs md:text-sm font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${selectedcategory === Category ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={Category}
                            onClick={() => handlecategoryclick(Category)}
                          />
                        ))}
                        {showValidationError && selectedcategory === null && (
                          <p className="text-red-500 text-xs md:text-sm mt-1">Please select a category</p>
                        )}
                      </div>
                    </div>

                    <div id='matchtype' className="w-full relative flex-col items-center justify-between gap-2 md:gap-3">
                      <label className="text-sm md:text-base lg:text-xl text-white">Match Type*</label>
                      <div className='w-full relative flex flex-wrap items-center justify-start mt-1 md:mt-2'>
                        {matchtypeoption.map((matchtype) => (
                          <input
                            key={matchtype}
                            type="text"
                            className={`rounded-lg md:rounded-xl w-16 md:w-20 h-7 md:h-8 m-0.5 md:m-1 cursor-pointer text-center text-xs md:text-sm font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${selectedmatchtype === matchtype ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={matchtype}
                            onClick={() => handlematchtypeclick(matchtype)}
                          />
                        ))}
                        {showValidationError && selectedmatchtype === null && (
                          <p className="text-red-500 text-xs md:text-sm mt-1">Please select a match type</p>
                        )}
                      </div>
                    </div>

                    <div id='wp' className="w-full relative flex-col items-center justify-between gap-2 md:gap-3">
                      <label className="text-sm md:text-base lg:text-xl text-white">Winning Prize*</label>
                      <div className='w-full relative flex flex-wrap items-center justify-start mt-1 md:mt-2'>
                        {wpoption.map((wp) => (
                          <input
                            key={wp}
                            type="text"
                            className={`rounded-lg md:rounded-xl w-16 md:w-20 h-7 md:h-8 m-0.5 md:m-1 cursor-pointer text-center text-xs md:text-sm font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${selectedwp === wp ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={wp}
                            onClick={() => handlewpclick(wp)}
                          />
                        ))}
                        {showValidationError && selectedwp === null && (
                          <p className="text-red-500 text-xs md:text-sm mt-1">Please select a winning prize</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full relative flex flex-col items-start justify-between gap-2 md:gap-3">
                        <div className="flex items-center">
                            <input 
                              className="accent-cyan-500 w-4 h-4" 
                              type="checkbox" 
                              name="opt1" 
                              id="weekdays" 
                              checked={homeAwayFormat}
                              onChange={(e) => setHomeAwayFormat(e.target.checked)}
                            />
                            <label className="text-xs md:text-sm lg:text-base text-white ml-1" htmlFor="weekdays">Enable Home/Away Format</label>
                        </div>
                        <div className="flex items-center">
                            <input 
                              className="accent-cyan-500 w-4 h-4" 
                              type="checkbox" 
                              name="opt2" 
                              id="weekends" 
                              checked={lastBatterRule}
                              onChange={(e) => setLastBatterRule(e.target.checked)}
                            />
                            <label className="text-xs md:text-sm lg:text-base text-white ml-1" htmlFor="weekends">Enable Last Batter Batting Rule</label>
                        </div>
                    </div>

                    <div className="flex justify-end w-full gap-2 md:gap-4 mt-2 md:mt-4">
                        <button 
                          className="rounded-lg md:rounded-xl w-20 md:w-24 bg-gray-500 h-8 md:h-9 text-white text-xs md:text-sm cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6]"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          className="rounded-lg md:rounded-xl w-20 md:w-24 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white text-xs md:text-sm cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6]" 
                          onClick={handleNavigation}
                        >
                          Next
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default Tournamentseries;