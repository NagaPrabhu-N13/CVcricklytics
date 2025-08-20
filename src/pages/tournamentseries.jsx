import { useState } from 'react';
import HeaderComponent from '../components/kumar/header';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Import Firebase auth
import upload from '../assets/kumar/image-regular.svg';
import locationIcon from '../assets/kumar/loc.png';
import ball1 from '../assets/kumar/cricket-ball.png';
import ball2 from '../assets/kumar/ball-others.png';
import others from '../assets/kumar/icons8-tennis-ball-96.png';
import { db } from '../firebase'; // Adjust the import path as needed
import { collection, query, where, getDocs, setDoc, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function Tournamentseries() {
    const navigate = useNavigate();
    const [isRulesVisible, setIsRulesVisible] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // State for the selected image file
    const [imageUploaded, setImageUploaded] = useState(false); // State to track if image is uploaded
    
    const toggleDivVisibility = (e) => {
      e.preventDefault();
      setIsRulesVisible(prevState => !prevState); 
    };
   
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedImage(file);
        setImageUploaded(true);
        setShowValidationError(false);
      }
    };

    const handleNavigation = async (e) => {
      e.preventDefault();
      
      const isFormValid = (
        tournamentName.trim() !== '' && 
        selectedLocation.trim() !== '' && 
        noOfTeams.trim() !== '' && 
        startDate !== null && 
        endDate !== null && 
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
          setShowValidationError(true); // Show error if image upload fails
          return;
        }
      }

      // Get the current user's ID
      const userId = auth.currentUser?.uid;

      // Prepare the tournament data with userId
      const tournamentData = {
        name: tournamentName,
        location: selectedLocation,
        noOfTeams: noOfTeams,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
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
        userId: userId || null // Include userId in the data (null if no user is logged in)
      };

      try {
        // Query the tournament collection to find a document with matching name
        const q = query(collection(db, 'tournament'), where('name', '==', tournamentName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Update the first matching document
          const docRef = doc(db, 'tournament', querySnapshot.docs[0].id);
          await updateDoc(docRef, tournamentData);
        } else {
          // Create a new document with auto-generated ID
          await setDoc(doc(collection(db, 'tournament')), tournamentData);
        }

        // Navigate to the next page with the number of teams
        navigate('/next', { state: { noOfTeams, tournamentName } });
      } catch (error) {
        console.error('Error saving tournament data:', error);
        setShowValidationError(true); // Optionally show an error to the user
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
    
    // Form state
    const [tournamentName, setTournamentName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [noOfTeams, setNoOfTeams] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
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
            <div className="absolute z-[9999] bg-gradient-to-b from-[#0D171E] to-[#283F79] p-6 rounded-lg shadow-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-2xl text-white cursor-pointer"
              onClick={toggleDivVisibility}
            >
              X
            </button>
              <h2 className="text-3xl font-bold text-white mb-4">Rules & Description</h2>
              <p className="text-lg text-white mb-4">
                Welcome to our platform! Below are some important rules and instructions to ensure a smooth experience:
              </p>
              <ul className="list-disc pl-5 text-white mb-6">
                <li className="mb-2">All users must adhere to our <strong>community guidelines</strong> at all times.</li>
                <li className="mb-2">Respect other participants and avoid any form of harassment.</li>
                <li className="mb-2">Keep your language professional and refrain from offensive content.</li>
                <li className="mb-2">Ensure your profile is accurate and up-to-date.</li>
                <li className="mb-2">Any breach of rules may lead to suspension or ban.</li>
              </ul>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-lg text-white font-bold">Instructions for use:</p>
                <p className="text-white">To get started, please follow these simple steps:</p>
                <ol className="list-decimal pl-6 text-white mb-4">
                  <li className="mb-2">Register an account and verify your email address.</li>
                  <li className="mb-2">Complete your profile by adding relevant details.</li>
                  <li className="mb-2">Explore available features and get involved in the community.</li>
                </ol>
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-bold text-white mb-3">Additional Guidelines</h3>
                <p className="text-white">Here are a few extra tips to enhance your experience:</p>
                <ul className="list-inside list-circle text-white">
                  <li className="mb-2">Stay active to maintain your reputation.</li>
                  <li className="mb-2">Engage with others through comments and feedback.</li>
                  <li className="mb-2">Feel free to report any inappropriate content.</li>
                </ul>
              </div>
            </div>
          </div>
            )}

            <div className="absolute left-[-25%] top-[30%] w-[80rem] h-[50rem] rounded-full bg-[radial-gradient(circle,rgba(69,218,255,0.5)_40%,rgba(69,218,255,0.1)_60%,rgba(69,218,255,0.1)_100%)] blur-lg -z-10"></div>

            <div className="z-20 flex overflow-hidden justify-center w-full md:-mt-5 px-[1rem] pt-[1rem] pb-[1rem] md:px-[5rem] md:pt-[1rem] md:pb-[1rem] relative">
                <form className="z-30 gap-5 md:gap-6 bg-[#1A2B4C] rounded-[1rem] md:rounded-[2rem] shadow-[11px_-7px_0px_3px_#253A6E] md:shadow-[22px_-14px_0px_5px_#253A6E] flex flex-col items-start justify-around w-full max-w-[90rem] pl-[1rem] pr-[1rem] pt-[2rem] pb-[1rem] md:pl-[3rem] md:pr-[5rem] md:pt-[3rem] md:pb-[2rem]">
                    <h1 className="text-3xl md:text-4xl text-white font-bold text-center">Add Tournament/Series</h1>
                    
                    {showValidationError && (
                      <div className="w-full bg-red-500 text-white p-3 rounded-lg mb-4">
                        Please fill all required fields before proceeding.
                      </div>
                    )}
                    
                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-8">
                        <label className="text-xl text-white mt-5">Tournament/ Series Name*</label>
                        <input 
                          className="w-[16rem] h-12 border-2 border-white text-white p-2 rounded-xl mt-4 bg-transparent" 
                          type="text" 
                          placeholder="Enter name" 
                          value={tournamentName}
                          onChange={(e) => {
                            setTournamentName(e.target.value);
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !tournamentName.trim() && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>
                     <div className="md:w-[80%] lg:w-[45%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <h2 className="text-xl mb-4 text-start text-white">Upload an Image</h2>
                        <div className="w-full md:w-[35%] relative flex items-center justify-between gap-5 mb-6">
                        <div className="w-[10rem] h-fit p-2 bg-white rounded-2xl shadow-lg">
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-[4rem] border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <img className="w-[2rem] h-[2rem]" src={upload} alt="upload" />
                                        <p className="mb-2 text-[10px] text-gray-500">
                                          {imageUploaded ? 'Uploaded!' : 'Click to upload'}
                                        </p>
                                    </div>
                                    <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>
                        {/* Show "Uploaded" text beside the picture box */}
                        {imageUploaded && (
                          <span className="text-green-500 font-semibold text-sm ml-2">
                            ✓ Uploaded
                          </span>
                        )}
                        </div>
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white">Venue*</label>
                        <input 
                          className="w-64 h-12 border-2 border-white text-white p-2 rounded-xl mt-[.5rem] bg-transparent" 
                          type="text" 
                          placeholder="Enter venue" 
                          value={selectedLocation}
                          onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !selectedLocation.trim() && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white">Number of Teams*</label>
                        <input 
                          className="w-64 h-12 border-2 border-white text-white p-2 rounded-xl mt-[.5rem] bg-transparent" 
                          type="number" 
                          placeholder="Enter number" 
                          value={noOfTeams}
                          onChange={(e) => {
                            setNoOfTeams(e.target.value);
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !noOfTeams.trim() && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="relative flex flex-col md:flex-row justify-between w-full gap-2 md:gap-0">
                    <label className="text-lg md:text-xl text-white mt-5">Dates*</label>
                    <div className="w-full md:absolute md:left-[30%] flex flex-col md:flex-row gap-4 md:gap-0 md:w-[90%] h-fit">                    
                            <div className="flex items-center w-full md:w-auto">
                                <label className="text-xl text-white mr-2">Start Date</label>
                                <DatePicker
                                  selected={startDate}
                                  onChange={(date) => {
                                    setStartDate(date);
                                    setShowValidationError(false);
                                  }}
                                  className="w-40 h-12 border-2 border-white text-white p-2 rounded-xl bg-transparent"
                                  placeholderText="Select start date"
                                  calendarClassName="bg-[#1A2B4C] text-white"
                                />
                                {showValidationError && !startDate && (
                                  <p className="text-red-500 text-sm absolute bottom-[-20px] left-[120px]">This field is required</p>
                                )}
                            </div>
                            <div className="flex items-center w-full md:w-auto">
                                <label className="text-xl text-white mr-2">End Date</label>
                                <DatePicker
                                  selected={endDate}
                                  onChange={(date) => {
                                    setEndDate(date);
                                    setShowValidationError(false);
                                  }}
                                  className="w-40 h-12 border-2 border-white text-white p-2 rounded-xl bg-transparent"
                                  placeholderText="Select end date"
                                  calendarClassName="bg-[#1A2B4C] text-white"
                                />
                                {showValidationError && !endDate && (
                                  <p className="text-red-500 text-sm absolute bottom-[-20px] left-[120px]">This field is required</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white md:mt-6">Location*</label>
                        <input
                            className="w-64 h-12 border-2 border-white text-white p-2 rounded-xl mt-2 bg-transparent bg-no-repeat pl-3 pr-10 py-2 placeholder-white"
                            type="text"
                            placeholder="Enter location"
                            value={physicalLocation}
                            onChange={(e) => {
                              setPhysicalLocation(e.target.value);
                              setShowValidationError(false);
                            }}
                            style={{
                                backgroundImage: `url(${locationIcon})`,
                                backgroundPosition: 'right 1rem center',
                                backgroundSize: '1.5rem 1.5rem'
                            }}
                        />
                        {showValidationError && !physicalLocation.trim() && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white">Schedule</label>
                        <div>
                            <input 
                              className="accent-cyan-500 w-[1rem] h-[1rem]" 
                              type="radio" 
                              name="days" 
                              id="weekdays" 
                              checked={selectedSchedule === 'weekdays'}
                              onChange={() => {
                                setSelectedSchedule('weekdays');
                                setShowValidationError(false);
                              }}
                            />
                            <label className="text-xl text-white ml-[1rem]" htmlFor="weekdays">Weekdays</label>

                            <input 
                              className="accent-cyan-500 w-[1rem] h-[1rem] ml-[1rem]" 
                              type="radio" 
                              name="days" 
                              id="weekends" 
                              checked={selectedSchedule === 'weekends'}
                              onChange={() => {
                                setSelectedSchedule('weekends');
                                setShowValidationError(false);
                              }}
                            />
                            <label className="text-xl text-white ml-[1rem]" htmlFor="weekends">Weekend</label>
                        </div>
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label htmlFor="timing" className="flex text-lg font-medium text-white md:mt-6">Choose your Timing*</label>
                        <select
                          id="timing"
                          name="timing"
                          className="block 
                                     w-[10rem] py-0   
                                     md:w-[16rem] md:py-2 
                                     bg-transparent px-4 border-2 border-white rounded-md 
                                     text-white focus:ring-blue-500 cursor-pointer"
                          value={selectedTiming}
                          onChange={(e) => {
                            setSelectedTiming(e.target.value);
                            setShowValidationError(false);
                          }}
                        >
                          <option value="" className="bg-blue-400 text-white">Select a Timing</option>
                          {timingOptions.map((time) => (
                            <option key={time} value={time} className="bg-blue-400 text-white">
                              {time}
                            </option>
                          ))}
                        </select>
                        {showValidationError && !selectedTiming && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white">Rules and Description</label>
                        <div className="w-[40%] relative flex items-center justify-between gap-5 mb-6">
                       <button id="view-rules" className="rounded-xl w-24 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-9 text-white mr-6 cursor-pointer" onClick={toggleDivVisibility}>
                       {isRulesVisible ? 'Hide Rules' : 'View Rules'}
                       </button>
                       </div>
                    </div>
                    
                    <div className='relative flex-col items-center w-full'>
                      <h1 className='text-xl text-white mb-[1rem]'>Ball Type*</h1>
                      <div className='relative flex items-center w-full h-fit gap-5'>
                        <div
                          className={`flex items-center justify-center w-25 h-25 rounded-full ${selectedBall === 'ball1' ? 'bg-blue-100' : 'bg-transparent'} hover:text-white mt-4 cursor-pointer`}
                          onClick={() => handleBallClick('ball1')}
                        >
                          <img src={ball1} alt="Cricket ball" className='w-20 h-20' />
                        </div>
                        <div
                          className={`flex items-center justify-center w-25 h-25 rounded-full ${selectedBall === 'others' ? 'bg-blue-100' : 'bg-transparent'}  hover:text-white mt-4 cursor-pointer`}
                          onClick={() => handleBallClick('others')}
                        >
                          <img src={others} alt="Tennis ball" className='w-20 h-20' />
                        </div>
                        <div
                          className={`flex items-center justify-center w-25 h-25 rounded-full ${selectedBall === 'ball2' ? 'bg-blue-100' : 'bg-transparent'}  hover:text-white mt-4 cursor-pointer`}
                          onClick={() => handleBallClick('ball2')}
                        >
                          <img src={ball2} alt="Other ball" className='w-18 h-18' />
                        </div>
                      </div>
                      {showValidationError && selectedBall === null && (
                        <p className="text-red-500 text-sm mt-1">Please select a ball type</p>
                      )}
                    </div>

                    <div id='pitch' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Pitch Type*</label>
                      <div className='w-full relative flex flex-wrap items-center justify-start mt-4'>
                        {pitchOptions.map((pitch) => (
                          <button
                            key={pitch}
                            type="button"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold text-white
                              ${selectedPitch === pitch ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            onClick={() => handlePitchClick(pitch)}
                          >
                            {pitch}
                          </button>
                        ))}
                        {showValidationError && selectedPitch === null && (
                          <p className="text-red-500 text-sm mt-1">Please select a pitch type</p>
                        )}
                      </div>
                    </div>
    
                    <div id='Category' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Tournament Category*</label>
                      <div className='md:w-[40%] lg:w-[50%] relative flex flex-wrap items-center justify-start mt-2 md:mt-4'>
                        {categoryoption.map((Category) => (
                          <button
                            key={Category}
                            type="button"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold text-white
                              ${selectedcategory === Category ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            onClick={() => handlecategoryclick(Category)}
                          >
                            {Category}
                          </button>
                        ))}
                        {showValidationError && selectedcategory === null && (
                          <p className="text-red-500 text-sm mt-1">Please select a category</p>
                        )}
                      </div>
                    </div>

                    <div id='matchtype' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Match Type*</label>
                      <div className='md:w-[40%] relative flex flex-wrap items-center justify-start mt-4'>
                        {matchtypeoption.map((matchtype) => (
                          <button
                            key={matchtype}
                            type="button"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold text-white
                              ${selectedmatchtype === matchtype ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            onClick={() => handlematchtypeclick(matchtype)}
                          >
                            {matchtype}
                          </button>
                        ))}
                        {showValidationError && selectedmatchtype === null && (
                          <p className="text-red-500 text-sm mt-1">Please select a match type</p>
                        )}
                      </div>
                    </div>

                    <div id='wp' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Winning Prize*</label>
                      <div className='md:w-[40%] relative flex flex-wrap items-center justify-start mt-4'>
                        {wpoption.map((wp) => (
                          <button
                            key={wp}
                            type="button"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold text-white
                              ${selectedwp === wp ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            onClick={() => handlewpclick(wp)}
                          >
                            {wp}
                          </button>
                        ))}
                        {showValidationError && selectedwp === null && (
                          <p className="text-red-500 text-sm mt-1">Please select a winning prize</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[60%] relative flex flex-col items-start justify-between gap-2 md:gap-5">
                        <div>
                            <input 
                              className="accent-cyan-500 w-[1rem] h-[1rem]" 
                              type="checkbox" 
                              name="opt1" 
                              id="homeAway" 
                              checked={homeAwayFormat}
                              onChange={(e) => setHomeAwayFormat(e.target.checked)}
                            />
                            <label className="text-xl text-white ml-[1rem]" htmlFor="homeAway">Enable Home/Away Format</label>
                        </div>
                        <div>
                            <input 
                              className="accent-cyan-500 w-[1rem] h-[1rem]" 
                              type="checkbox" 
                              name="opt2" 
                              id="lastBatter" 
                              checked={lastBatterRule}
                              onChange={(e) => setLastBatterRule(e.target.checked)}
                            />
                            <label className="text-xl text-white ml-[1rem]" htmlFor="lastBatter">Enable Last Batter Batting Rule</label>
                        </div>
                    </div>

                    <div className="flex justify-end w-full gap-4 mt-4">
                        <button 
                          className="rounded-xl w-22 bg-gray-500 h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6] px-4"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          className="rounded-xl w-22 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6] px-4" 
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