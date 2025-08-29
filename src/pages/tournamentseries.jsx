import { useState, useEffect } from 'react';
import HeaderComponent from '../components/kumar/header';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // Import Firebase auth and db
import upload from '../assets/kumar/image-regular.svg';
import location from '../assets/kumar/loc.png';
import ball1 from '../assets/kumar/cricket-ball.png';
import ball2 from '../assets/kumar/ball-others.png';
import others from '../assets/kumar/icons8-tennis-ball-96.png';
import { collection, query, where, getDocs, setDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

function Tournamentseries() {
    const navigate = useNavigate();
    const [isRulesVisible, setIsRulesVisible] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // State for the selected image file
    const [user, setUser] = useState(null);
    const [debounceTimeout, setDebounceTimeout] = useState(null);

    const [formData, setFormData] = useState({
        tournamentName: '',
        selectedLocation: '',
        noOfTeams: '',
        startDate: '',
        endDate: '',
        physicalLocation: '',
        selectedSchedule: '',
        selectedTiming: '',
        selectedPitch: null,
        selectedcategory: null,
        selectedmatchtype: null,
        selectedBall: null,
        selectedwp: null,
        homeAwayFormat: false,
        lastBatterRule: false,
        imageUrl: '',
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (user) {
            async function fetchData() {
                const docRef = doc(db, `users/${user.uid}/forms/tournamentseries`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                    if (docSnap.data().imageUrl) {
                        setSelectedImage(docSnap.data().imageUrl);
                    }
                }
            }
            fetchData();
        }
    }, [user]);

    const saveFormData = async () => {
        if (!user) return;
        const docRef = doc(db, `users/${user.uid}/forms/tournamentseries`);
        await setDoc(docRef, formData);
    };

    useEffect(() => {
        if (user) {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
            const timeout = setTimeout(() => {
                saveFormData();
            }, 1000);
            setDebounceTimeout(timeout);
        }
    }, [formData, user]);

    useEffect(() => {
        return () => {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
        };
    }, [debounceTimeout]);

    const toggleDivVisibility = (e) => {
        e.preventDefault();
        setIsRulesVisible(prevState => !prevState); 
    };
   
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setFormData(prev => ({ ...prev, imageUrl: '' }));
            setShowValidationError(false);
        }
    };

    const handleNavigation = async (e) => {
        e.preventDefault();
        
        const isFormValid = (
            formData.tournamentName.trim() !== '' && 
            formData.selectedLocation.trim() !== '' && 
            formData.noOfTeams.trim() !== '' && 
            formData.startDate !== '' && 
            formData.endDate !== '' && 
            formData.physicalLocation.trim() !== '' && 
            formData.selectedTiming !== '' && 
            formData.selectedBall !== null && 
            formData.selectedPitch !== null && 
            formData.selectedcategory !== null && 
            formData.selectedmatchtype !== null && 
            formData.selectedwp !== null
        );

        if (!isFormValid) {
            setShowValidationError(true);
            return;
        }

        let imageUrl = formData.imageUrl;
        if (selectedImage && typeof selectedImage !== 'string') {
            try {
                const storage = getStorage();
                const storageRef = ref(storage, `tournament_images/${Date.now()}_${selectedImage.name}`);
                await uploadBytes(storageRef, selectedImage);
                imageUrl = await getDownloadURL(storageRef);
                setFormData(prev => ({ ...prev, imageUrl }));
            } catch (error) {
                console.error('Error uploading image:', error);
                setShowValidationError(true);
                return;
            }
        }

        // Get the current user's ID
        const userId = auth.currentUser?.uid;

        // Prepare the tournament data with userId
        const tournamentData = {
            name: formData.tournamentName,
            location: formData.selectedLocation,
            noOfTeams: formData.noOfTeams,
            startDate: formData.startDate,
            endDate: formData.endDate,
            physicalLocation: formData.physicalLocation,
            schedule: formData.selectedSchedule,
            timing: formData.selectedTiming,
            pitch: formData.selectedPitch,
            category: formData.selectedcategory,
            matchType: formData.selectedmatchtype,
            ball: formData.selectedBall,
            winningPrize: formData.selectedwp,
            homeAwayFormat: formData.homeAwayFormat,
            lastBatterRule: formData.lastBatterRule,
            createdAt: new Date().toISOString(),
            imageUrl: imageUrl,
            userId: userId || null
        };

        try {
            // Query the tournament collection to find a document with matching name
            const q = query(collection(db, 'tournament'), where('name', '==', formData.tournamentName));
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
            navigate('/next', { state: { noOfTeams: formData.noOfTeams, tournamentName: formData.tournamentName } });
        } catch (error) {
            console.error('Error saving tournament data:', error);
            setShowValidationError(true);
        }
    };

    const handleCancel = (e) => {
        e.preventDefault();
        const hasData = Object.values(formData).some(v => v !== null && v !== false && v !== '');

        if (hasData) {
            if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
                window.location.reload();
            }
        } else {
            navigate('/'); 
        }
    };
    
    const pitchOptions = ['Rough', 'Cement', 'Matting', 'Turf', 'Astroturf'];
    const categoryoption = ['community', 'corporate', 'open', 'school', 'others', 'series', 'college', 'university'];
    const matchtypeoption = ['limited overs', 'Box cricket', 'Pair Cricket', 'Test match', 'the hundered'];
    const wpoption = ['Cash', 'Trophies', 'Both'];
    const timingOptions = ['Morning', 'Noon', 'Night'];

    const handlePitchClick = (pitch) => {
        setFormData(prev => ({ ...prev, selectedPitch: pitch }));
        setShowValidationError(false);
    };

    const handlecategoryclick = (Category) => {
        setFormData(prev => ({ ...prev, selectedcategory: Category }));
        setShowValidationError(false);
    };

    const handlematchtypeclick = (matchtype) => {
        setFormData(prev => ({ ...prev, selectedmatchtype: matchtype }));
        setShowValidationError(false);
    };

    const handleBallClick = (ball) => {
        setFormData(prev => ({ ...prev, selectedBall: ball }));
        setShowValidationError(false);
    };

    const handlewpclick = (wp) => {
        setFormData(prev => ({ ...prev, selectedwp: wp }));
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
            <div className="absolute z-[9999] bg-gradient-to-b from-[#0D171E] to-[#283F79] p-6 rounded-lg shadow-lg">
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
                          className="w-[16rem] h-12 border-2 border-white text-white p-2 rounded-xl mt-4" 
                          type="text" 
                          placeholder="" 
                          value={formData.tournamentName}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, tournamentName: e.target.value }));
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !formData.tournamentName.trim() && (
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
                                        <p className="mb-2 text-[10px] text-gray-500"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                                    </div>
                                    <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white">Venue*</label>
                        <input 
                          className="w-64 h-12 border-2 border-white text-white p-2 rounded-xl mt-[.5rem]" 
                          type="text" 
                          placeholder="" 
                          value={formData.selectedLocation}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, selectedLocation: e.target.value }));
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !formData.selectedLocation.trim() && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white">Number of Teams*</label>
                        <input 
                          className="w-64 h-12 border-2 border-white text-white p-2 rounded-xl mt-[.5rem]" 
                          type="text" 
                          placeholder="" 
                          value={formData.noOfTeams}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, noOfTeams: e.target.value }));
                            setShowValidationError(false);
                          }}
                        />
                        {showValidationError && !formData.noOfTeams.trim() && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="relative flex flex-col md:flex-row justify-between w-full  gap-2 md:gap-0">
                    <label className="text-lg md:text-xl text-white mt-5">Dates*</label>
                    <div className="w-full md:absolute md:left-[30%] flex flex-col md:flex-row gap-2 md:gap-0 md:w-[90%] h-fit">                    
                            <div className="flex items-center w-[30%]">
                                <label className="text-xl text-white">Start Date</label>
                                <input 
                                  className="w-40 h-12 border-2 border-white text-white p-2 rounded-xl ml-[.5rem]"
                                  type="date" 
                                  value={formData.startDate}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, startDate: e.target.value }));
                                    setShowValidationError(false);
                                  }}
                                />
                                {showValidationError && !formData.startDate && (
                                  <p className="text-red-500 text-sm absolute bottom-[-20px] left-[120px]">This field is required</p>
                                )}
                            </div>
                            <div className="flex items-center w-[30%]">
                                <label className="text-xl text-white">End Date</label>
                                <input 
                                  className="w-40 h-12 border-2 border-white text-white p-2 rounded-xl ml-[.5rem]" 
                                  type="date" 
                                  value={formData.endDate}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, endDate: e.target.value }));
                                    setShowValidationError(false);
                                  }}
                                />
                                {showValidationError && !formData.endDate && (
                                  <p className="text-red-500 text-sm absolute bottom-[-20px] left-[120px]">This field is required</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white md:mt-6">Location*</label>
                        <input
                            className="w-64 h-12 border-2 border-white text-white p-2 rounded-xl mt-2 bg-no-repeat pl-10 pr-12 py-2 placeholder-white"
                            type="text"
                            placeholder=""
                            value={formData.physicalLocation}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, physicalLocation: e.target.value }));
                              setShowValidationError(false);
                            }}
                            style={{
                                backgroundImage: `url(${location})`,
                                backgroundPosition: 'right 1rem center',
                                backgroundSize: '1.5rem 1.5rem'
                            }}
                        />
                        {showValidationError && !formData.physicalLocation.trim() && (
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
                              checked={formData.selectedSchedule === 'weekdays'}
                              onChange={() => {
                                setFormData(prev => ({ ...prev, selectedSchedule: 'weekdays' }));
                                setShowValidationError(false);
                              }}
                            />
                            <label className="text-xl text-white ml-[1rem]" htmlFor="weekdays">Weekdays</label>

                            <input 
                              className="accent-cyan-500 w-[1rem] h-[1rem] ml-[1rem]" 
                              type="radio" 
                              name="days" 
                              id="weekends" 
                              checked={formData.selectedSchedule === 'weekends'}
                              onChange={() => {
                                setFormData(prev => ({ ...prev, selectedSchedule: 'weekends' }));
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
                          className="block w-[16rem] bg-white-900 px-4 py-2 border border-white rounded-md text-gray-200 focus:ring-blue-500 cursor-pointer"
                          value={formData.selectedTiming}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, selectedTiming: e.target.value }));
                            setShowValidationError(false);
                          }}
                        >
                            <option value="" className='bg-blue-400 text-white'>Select a Timing</option>
                            {timingOptions.map(time => (
                              <option key={time} value={time} className='bg-blue-400 text-white'>{time}</option>
                            ))}
                        </select>
                        {showValidationError && !formData.selectedTiming && (
                          <p className="text-red-500 text-sm absolute bottom-[-20px] right-0">This field is required</p>
                        )}
                    </div>

                    <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
                        <label className="text-xl text-white">Rules and Description</label>
                        <div className="w-[40%] relative flex items-center justify-between gap-5  mb-6">
                       <button id="view-rules" className="rounded-xl w-24 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-9 text-white mr-6 cursor-pointer" onClick={toggleDivVisibility}>
                       {isRulesVisible ? 'Hide Rules' : 'View Rules'}
                       </button>
                       </div>
                    </div>
                    
                    <div className='relative flex-col items-center w-full'>
                      <h1 className='text-xl text-white mb-[1rem]'>Ball Type*</h1>
                      <div className='relative flex items-center w-full h-fit gap-5'>
                        <a
                          className={`animate-rotate flex items-center justify-center w-25 h-25 rounded-full ${formData.selectedBall === 'ball1' ? 'bg-blue-100' : 'bg-transparent'} hover:text-white mt-4 cursor-pointer`}
                          onClick={() => handleBallClick('ball1')}
                        >
                          <img src={ball1} alt="" className='w-20 h-20' />
                        </a>
                        <a
                          className={`animate-rotate flex items-center justify-center w-25 h-25 rounded-full ${formData.selectedBall === 'others' ? 'bg-blue-100' : 'bg-transparent'}  hover:text-white mt-4 cursor-pointer`}
                          onClick={() => handleBallClick('others')}
                        >
                          <img src={others} alt="" className='w-20 h-20' />
                        </a>
                        <a
                          className={`animate-rotate flex items-center justify-center w-25 h-25 rounded-full ${formData.selectedBall === 'ball2' ? 'bg-blue-100' : 'bg-transparent'}  hover:text-white mt-4 cursor-pointer`}
                          onClick={() => handleBallClick('ball2')}
                        >
                          <img src={ball2} alt="" className='w-18 h-18' />
                        </a>
                      </div>
                      {showValidationError && formData.selectedBall === null && (
                        <p className="text-red-500 text-sm mt-1">Please select a ball type</p>
                      )}
                    </div>

                    <div id='pitch' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Pitch Type*</label>
                      <div className='w-full relative flex-col items-center justify-center mt-4'>
                        {pitchOptions.map((pitch) => (
                          <input
                            key={pitch}
                            type="text"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${formData.selectedPitch === pitch ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={pitch}
                            onClick={() => handlePitchClick(pitch)}
                          />
                        ))}
                        {showValidationError && formData.selectedPitch === null && (
                          <p className="text-red-500 text-sm mt-1">Please select a pitch type</p>
                        )}
                      </div>
                    </div>
    
                    <div id='Category' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Tournament Category*</label>
                      <div className='md:w-[40%] lg:w-[50%] relative flex flex-wrap items-center justify-start mt-2 md:mt-4'>
                        {categoryoption.map((Category) => (
                          <input
                            key={Category}
                            type="text"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${formData.selectedcategory === Category ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={Category}
                            onClick={() => handlecategoryclick(Category)}
                          />
                        ))}
                        {showValidationError && formData.selectedcategory === null && (
                          <p className="text-red-500 text-sm mt-1">Please select a category</p>
                        )}
                      </div>
                    </div>

                    <div id='matchtype' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Match Type*</label>
                      <div className='md:w-[40%] relative flex-col items-center justify-center mt-4'>
                        {matchtypeoption.map((matchtype) => (
                          <input
                            key={matchtype}
                            type="text"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${formData.selectedmatchtype === matchtype ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={matchtype}
                            onClick={() => handlematchtypeclick(matchtype)}
                          />
                        ))}
                        {showValidationError && formData.selectedmatchtype === null && (
                          <p className="text-red-500 text-sm mt-1">Please select a match type</p>
                        )}
                      </div>
                    </div>

                    <div id='wp' className="w-full relative flex-col items-center justify-between gap-5">
                      <label className="text-xl text-white">Winning Prize*</label>
                      <div className='md:w-[40%]relative flex-col items-center justify-center mt-4'>
                        {wpoption.map((wp) => (
                          <input
                            key={wp}
                            type="text"
                            className={`rounded-xl w-24 h-9 m-1 cursor-pointer text-center font-bold placeholder-white placeholder-opacity-100 caret-transparent 
                              ${formData.selectedwp === wp ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                            name='user'
                            placeholder={wp}
                            onClick={() => handlewpclick(wp)}
                          />
                        ))}
                        {showValidationError && formData.selectedwp === null && (
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
                              id="weekdays" 
                              checked={formData.homeAwayFormat}
                              onChange={(e) => setFormData(prev => ({ ...prev, homeAwayFormat: e.target.checked }))}
                            />
                            <label className="text-xl text-white ml-[1rem]" htmlFor="weekdays">Enable Home/Away Format</label>
                        </div>
                        <div>
                            <input 
                              className="accent-cyan-500 w-[1rem] h-[1rem]" 
                              type="checkbox" 
                              name="opt2" 
                              id="weekends" 
                              checked={formData.lastBatterRule}
                              onChange={(e) => setFormData(prev => ({ ...prev, lastBatterRule: e.target.checked }))}
                            />
                            <label className="text-xl text-white ml-[1rem]" htmlFor="weekends">Enable Last Batter Batting Rule</label>
                        </div>
                    </div>

                    <div className="flex justify-end w-full gap-4">
                        <button 
                          className="rounded-xl w-22 bg-gray-500 h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6]"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          className="rounded-xl w-22 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6]" 
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