import React from 'react';
import HeaderComponent from '../kumar/header';
import { useNavigate, useLocation } from 'react-router-dom';
import scanner from '../../assets/kumar/icons8-qr-code-52.png';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function Tournament_nextpg() {
  const navigate = useNavigate();
  const location = useLocation();
  const { noOfTeams, tournamentName } = location.state || {};
  const [isRulesVisible, setIsRulesVisible] = useState(false);
  const [ispriceVisible, setIspriceVisible] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [user, setUser] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  
  console.log(tournamentName);

  const [formData, setFormData] = useState({
    isUmpire: false,
    isLiveStreamer: false,
    isScorer: false,
    isCommentator: false,
    selectedhmd: null,
    selectedmpd: null,
    sameBudget: false,
    perDay: '',
    currency: 'INR',
    perMatch: '',
    selectedof: null,
    contact: '',
    entryFeesCheck: false,
    activeTournament: '',
    rounds: '',
    terms: false,
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
        const docRef = doc(db, `users/${user.uid}/forms/tournament_nextpg`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        }
      }
      fetchData();
    }
  }, [user]);

  const saveFormData = async () => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/forms/tournament_nextpg`);
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
  
  const togglepriceVisibility = (e) => {
    e.preventDefault();
    setIspriceVisible(prevState => !prevState); 
  };

  const Teamprofile = () => {
    navigate('/TeamProfile');
  };
  
  const Tournament = async (e) => {
    e.preventDefault();
    
    // Check if all required fields are filled
    const isFormValid = (
      formData.selectedhmd !== null &&
      formData.selectedmpd !== null &&
      formData.selectedof !== null
    );

    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }

    // Reset form data in Firestore for tournamentseries and tournament_nextpg
    if (user) {
      const tournamentSeriesRef = doc(db, `users/${user.uid}/forms/tournamentseries`);
      const tournamentNextPgRef = doc(db, `users/${user.uid}/forms/tournament_nextpg`);
      
      // Set both collections to null
      await setDoc(tournamentSeriesRef, {});
      await setDoc(tournamentNextPgRef, {});
    }

    // Navigate to TournamentPage
    navigate('/TournamentPage', { state: { noOfTeams, tournamentName } });
  };

  const handleCancel = (e) => {
    e.preventDefault();
    // Check if any fields have values
    const hasData = Object.values(formData).some(v => v !== null && v !== false && v !== '');

    if (hasData) {
      if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        window.location.reload();
      }
    } else {
      navigate('/tournamentseries');
    }
  };

  const home = () => {
    navigate('/');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Form Submitted");
  };

  const [selectedhmd, setSelectedhmd] = useState(null);
  const hmdoptions = ['1', '2', '3','4','5+'];
  const handlehmdClick = (hmd) => {
    setFormData(prev => ({ ...prev, selectedhmd: hmd }));
    setShowValidationError(false);
  };

  const [selectedmpd, setSelectedmpd] = useState(null);
  const mpdoptions = ['1', '2', '3','4','5+'];
  const handlempdClick = (mpd) => {
    setFormData(prev => ({ ...prev, selectedmpd: mpd }));
    setShowValidationError(false);
  };

  const [selectedof, setSelectedof] = useState(null);
  const ofoptions = ['Cricklytics','Whatsapp','Call'];
  const handleofClick = (of) => {
    setFormData(prev => ({ ...prev, selectedof: of }));
    setShowValidationError(false);
  };

  const [selectedpay, setSelectedpay] = useState(null);
  const payoptions = ['UPI:QR Scan', 'Add Debit Card or Credit Card', 'Add Net Banking'];
  const handlepayclick = (pay) => {
    setSelectedpay(pay); 
  };

  return (
    <section className="min-h-screen w-full overflow-hidden z-0 bg-gradient-to-b from-[#0D171E] to-[#283F79] relative">
      <HeaderComponent />
      <div className="absolute left-[-25%] top-[30%] w-[80rem] min-h-screen rounded-full bg-[radial-gradient(circle,rgba(69,218,255,0.5)_40%,rgba(69,218,255,0.1)_60%,rgba(69,218,255,0.1)_100%)] blur-lg -z-10"></div>
      
      {ispriceVisible && (
        <div 
          id="price" 
          className="fixed left-0 w-full h-full flex justify-center items-center inset-0 bg-opacity-40 backdrop-blur-md z-[9999]" 
        >
          <div className="absolute z-[9999] bg-gradient-to-b from-[#0D171E] to-[#283F79] p-4 md:p-6 rounded-lg shadow-lg max-w-[90%] md:max-w-2xl overflow-y-auto max-h-[90vh]">
            <button 
              className="absolute top-2 md:top-4 right-2 md:right-4 text-xl md:text-2xl text-white cursor-pointer"
              onClick={togglepriceVisibility}
            >
              X
            </button>
            <h2 className="text-xl md:text-3xl font-bold text-white mb-3 md:mb-4">Price Details for Players</h2>
            <p className="text-sm md:text-lg text-white mb-3 md:mb-4">
              Welcome to the pricing section! Below are the details about pricing for players on our platform:
            </p>
            <ul className="list-disc pl-5 text-white mb-4 md:mb-6 text-sm md:text-base">
              <li className="mb-1 md:mb-2">Pricing is tiered based on performance, participation, and engagement.</li>
              <li className="mb-1 md:mb-2">There are different price levels based on the player's rank and experience.</li>
              <li className="mb-1 md:mb-2">Discounts and special offers are available for top-tier players and long-term members.</li>
              <li className="mb-1 md:mb-2">Payment can be made monthly, quarterly, or annually, with different benefits for each plan.</li>
              <li className="mb-1 md:mb-2">Refunds and cancellations are subject to terms outlined in the player agreement.</li>
            </ul>
            <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
              <p className="text-sm md:text-lg text-white font-bold">Instructions for Subscription:</p>
              <p className="text-white text-sm"> Beesubscription, follow these simple steps:</p>
              <ol className="list-decimal pl-5 md:pl-6 text-white mb-3 md:mb-4 text-sm">
                <li className="mb-1 md:mb-2">Create an account or log in if you already have one.</li>
                <li className="mb-1 md:mb-2">Choose your subscription plan based on your preference and budget.</li>
                <li className="mb-1 md:mb-2">Enter payment details and confirm the subscription.</li>
              </ol>
            </div>
            <div className="mt-4 md:mt-6">
              <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-5 md:mb-3">Additional Pricing Information</h3>
              <p className="text-white text-sm">Here are a few additional details to help you understand the pricing better:</p>
<ul className="list-disc md:text-white list:ml-5 md:mb-4 text-sm">
  <li className="mb-1 md:ml-5 mb-2">Higher-tier players may qualify for additional perks and bonuses.</li>
  <li className="mb-1 md:mb-2">Players with significant achievements will be offered custom pricing packages.</li>
  <li className="mb-1 md:mb-2">For special cases, please reach out to our support team for personalized offers.</li>
</ul>
</div>
          </div>
        </div>
      )}
      
      {isRulesVisible && (
        <div id="rules" className="fixed left-0 w-full h-full flex justify-center items-center inset-0 bg-opacity-40 backdrop-blur-md z-[9999]">
          <div className="absolute z-[9999] w-[90%] md:w-fit bg-gradient-to-b from-[#0D171E] to-[#283F79] p-4 md:p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-2 md:top-4 right-2 md:right-4 text-xl md:text-2xl text-white cursor-pointer"
              onClick={toggleDivVisibility}
            >
              X
            </button>
            <div className="flex flex-col md:flex-row px-2 md:px-[1.5rem]">
              <div className="w-full md:w-[50%] h-[50%] flex flex-col items-start px-2 md:px-[1.5rem]">
                <h1 className="text-white text-start mt-4 md:mt-10 font-bold text-xl md:text-3xl">Choose Payment Method</h1>
                <p className="text-white text-xs md:text-sm my-3 md:my-[2rem] md:mt-10">
                  Available payment methods are based on your currency (INR) and payment setting.
                </p>
                {payoptions.map((pay) => (
                  <div
                    key={pay}
                    className={`flex items-center w-full gap-3 md:gap-5 mb-3 md:mb-5 p-2 md:p-3 cursor-pointer text-white text-sm md:text-lg rounded-md
                      ${selectedpay === pay ? 'bg-[#9370DB] shadow-md' : 'bg-transparent'}
                      transition duration-200 ease-in-out`}
                    onClick={() => handlepayclick(pay)}
                  >
                    <button className="text-xl md:text-3xl border-dotted border border-white w-8 h-8 md:w-10 md:h-10 pt-0 text-white hover:bg-white flex items-center justify-center">+</button>
                    <div className='caret-transparent'>{pay}</div>
                  </div>
                ))}
              </div>

              {selectedpay === 'UPI:QR Scan' && (
                <div id='pay1' className='w-full md:w-[50%] h-fit bg-blue-900 mt-2 md:mt-[1rem] py-5 md:py-10 flex flex-col items-start px-2 md:px-[1rem]'>
                  <h1 className='text-white font-bold text-xl md:text-3xl'>{selectedpay}</h1>
                  <p className='text-white text-xs md:text-sm my-2 md:my-[2rem]'>
                    Approve UPI Autopay in the app.
                  </p>
                  <div className='w-full h-fit mt-3 md:mt-5 p-3 md:p-5 text-black flex justify-center border-dotted border border-white'>
                    <img className='w-20 h-20 md:w-30 md:h-30' src={scanner} alt="QR Scanner" />
                  </div>
                  <h1 className='text-white font-bold text-sm md:text-lg mt-3 md:mt-5'>Instruction</h1>
                  <p className='text-white text-xs md:text-sm w-full md:w-[60%] m-0'>Approve UPI Autopay in the app.Approve UPI Autopay in the app. This isn't a charge.</p>
                  <div className="flex justify-end w-full mt-3 md:mt-4">
                    <button className="rounded-xl w-20 md:w-22 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6] text-sm md:text-base">
                      Next
                    </button>
                  </div>
                </div>
              )}

              {selectedpay === 'Add Debit Card or Credit Card' && (
                <div id='pay2' className='w-full md:w-[50%] h-fit bg-blue-900 mt-2 md:mt-[1rem] py-5 md:py-10 flex flex-col items-start px-2 md:px-[1rem]'>
                  <h1 className='text-white font-bold text-xl md:text-3xl'>{selectedpay}</h1>
                  <p className='text-white text-xs md:text-sm my-2 md:my-[2rem]'>All fields required</p>

                  <div className="relative w-full md:w-[60%] flex flex-col mb-4 md:mb-6">
                    <input
                      id="card-number"
                      className="peer w-full h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl mt-1 md:mt-2 pl-3 md:pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm md:text-base"
                      type="text"
                      placeholder=" "
                    />
                    <label
                      htmlFor="card-number"
                      className="absolute left-3 md:left-4 top-9 md:top-11 text-white transition-all bg-blue-900 duration-200 transform scale-100 origin-top-left pointer-events-none peer-placeholder-shown:top-4 md:peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:px-[5px] md:peer-focus:px-[10px] peer-focus:text-xs"
                    >
                      Card Number
                    </label>
                  </div>

                  <div className="flex flex-col md:flex-row w-full gap-3 md:gap-4">
                    <div className="relative w-full md:w-[60%] flex flex-col mb-4 md:mb-6">
                      <input
                        id="expiry-date"
                        className="peer w-full h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl mt-1 md:mt-2 pl-3 md:pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm md:text-base"
                        type="text"
                        // placeholder=" "
                      />
                      <label
                        htmlFor="expiry-date"
                        className="absolute left-3 md:left-4 top-9 md:top-11 text-white transition-all bg-blue-900 duration-200 transform scale-100 origin-top-left pointer-events-none peer-placeholder-shown:top-4 md:peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:px-[5px] md:peer-focus:px-[10px] peer-focus:text-xs"
                      >
                        MM/YY
                      </label>
                    </div>

                    <div className="relative w-full md:w-[60%] flex flex-col mb-4 md:mb-6">
                      <input
                        id="cvv"
                        className="peer w-full h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl mt-1 md:mt-2 pl-3 md:pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm md:text-base"
                        type="text"
                        // placeholder=" "
                      />
                      <label
                        htmlFor="cvv"
                        className="absolute left-3 md:left-4 top-9 md:top-11 text-white transition-all bg-blue-900 duration-200 transform scale-100 origin-top-left pointer-events-none peer-placeholder-shown:top-4 md:peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:px-[5px] md:peer-focus:px-[10px] peer-focus:text-xs"
                      >
                        CVV
                      </label>
                    </div>
                  </div>

                  <div className="relative w-full md:w-[60%] flex flex-col mb-4 md:mb-6">
                    <input
                      id="cardholder-name"
                      className="peer w-full h-10 md:h-12 border-2 border-white text-white p-2 rounded-lg md:rounded-xl mt-1 md:mt-2 pl-3 md:pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm md:text-base"
                      type="text"
                      // placeholder=" "
                    />
                    <label
                      htmlFor="cardholder-name"
                      className="absolute left-3 md:left-4 top-9 md:top-11 text-white transition-all bg-blue-900 duration-200 transform scale-100 origin-top-left pointer-events-none peer-placeholder-shown:top-4 md:peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:px-[5px] md:peer-focus:px-[10px] peer-focus:text-xs"
                    >
                      Cardholder Name
                    </label>
                  </div>

                  <div className="flex justify-end w-full">
                    <button className="rounded-xl w-20 md:w-22 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6] text-sm md:text-base">
                      Next
                    </button>
                  </div>
                </div>
              )}

              {selectedpay === 'Add Net Banking' && (
                <div id='pay3' className='w-full md:w-[50%] h-fit bg-blue-900 mt-2 md:mt-[1rem] py-5 md:py-10 flex flex-col items-start px-2 md:px-[1rem]'>
                  <h1 className='text-white font-bold text-xl md:text-3xl'>{selectedpay}</h1>
                  <p className='text-white text-xs md:text-sm my-2 md:my-[2rem]'>All fields required</p>
                  <div className="flex justify-end w-full">
                    <button className="rounded-xl w-20 md:w-22 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6] text-sm md:text-base">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="z-20 flex overflow-hidden justify-center w-full -mt-5 px-[1rem] pt-[1rem] pb-[1rem] md:px-[5rem] md:pt-[1rem] md:pb-[1rem] relative">
        <form onSubmit={handleSubmit} className="z-30 gap-4 md:gap-5 bg-[#1A2B4C] rounded-xl md:rounded-[2rem] shadow-[8px_-5px_0px_2px_#253A6E] md:shadow-[22px_-14px_0px_5px_#253A6E] flex flex-col items-start justify-around w-full max-w-[90rem] pl-[1rem] pr-[1rem] pt-[2rem] pb-[1rem] md:pl-[3rem] md:pr-[5rem] md:pt-[3rem] md:pb-[2rem]">
          <h1 className="text-2xl md:text-4xl text-white font-bold mt-1 md:mt-1 w-full text-center md:text-left">Add Tournament/Series</h1>
          
          {noOfTeams && (
            <div className="w-1/3 text-white p-2 rounded-lg mb-4 text-sm md:text-base">
              Number of Teams: {noOfTeams}
            </div>
          )}
          {tournamentName && (
            <div className="w-1/3 text-white p-2 rounded-lg mb-4 text-sm md:text-base">
              Tournament Name: {tournamentName}
            </div>
          )}

          {showValidationError && (
            <div className="w-full bg-red-500 text-white p-2 rounded-lg mb-4 text-sm md:text-base">
              Please fill all required fields before proceeding
            </div>
          )}

          <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-col items-start md:items-start justify-between gap-2 md:gap-5">
            <label className="text-lg md:text-xl text-white">What You need?</label>
            <div className="flex flex-wrap gap-2 md:gap-0 md:-mt-3">
              <div className="flex items-center">
                <input className="accent-cyan-500 w-4 h-4 md:w-[1rem] md:h-[1rem]" type="checkbox" name="umpire" id="weekdays" checked={formData.isUmpire} onChange={() => setFormData(prev => ({ ...prev, isUmpire: !prev.isUmpire }))} />
                <label className="text-sm md:text-xl text-white ml-2 md:ml-[1rem]" htmlFor="weekdays">Umpire</label>
              </div>

              <div className="flex items-center ml-2 md:ml-[1rem]">
                <input className="accent-cyan-500 w-4 h-4 md:w-[1rem] md:h-[1rem]" type="checkbox" name="live" id="weekends" checked={formData.isLiveStreamer} onChange={() => setFormData(prev => ({ ...prev, isLiveStreamer: !prev.isLiveStreamer }))} />
                <label className="text-sm md:text-xl text-white ml-2 md:ml-[1rem]" htmlFor="weekends">Live streamer</label>
              </div>

              <div className="flex items-center ml-2 md:ml-[1rem]">
                <input className="accent-cyan-500 w-4 h-4 md:w-[1rem] md:h-[1rem]" type="checkbox" name="score" id="weekends" checked={formData.isScorer} onChange={() => setFormData(prev => ({ ...prev, isScorer: !prev.isScorer }))} />
                <label className="text-sm md:text-xl text-white ml-2 md:ml-[1rem]" htmlFor="weekends">Scorer</label>
              </div>

              <div className="flex items-center ml-2 md:ml-[1rem]">
                <input className="accent-cyan-500 w-4 h-4 md:w-[1rem] md:h-[1rem]" type="checkbox" name="commen" id="weekends" checked={formData.isCommentator} onChange={() => setFormData(prev => ({ ...prev, isCommentator: !prev.isCommentator }))} />
                <label className="text-sm md:text-xl text-white ml-2 md:ml-[1rem]" htmlFor="weekends">Comentator</label>
              </div>
            </div>
          </div>

          <div id='hdm' className="w-full relative flex-col items-center justify-between gap-3 md:gap-5 mt-2 md:-mt-[.5rem]">
            <label className="text-lg md:text-xl text-white">Match Type*</label>
            <div className='w-full md:w-[50%] relative flex items-center justify-start mt-2 md:mt-2'>
              {hmdoptions.map((hdm) => ( 
                <input
                  key={hdm}
                  type="text"
                  className={`rounded-full w-8 h-8 md:w-10 md:h-10 m-1 cursor-pointer text-center font-bold placeholder-white placeholder-opacity-100 caret-transparent text-sm md:text-base
                    ${formData.selectedhmd === hdm ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                  name='user'
                  placeholder={hdm}
                  onClick={() => handlehmdClick(hdm)}
                />
              ))}
            </div>
            {showValidationError && formData.selectedhmd === null && (
              <p className="text-red-500 text-sm mt-1">Please select match type</p>
            )}
          </div>

          <div id='mpd' className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-col items-start md:items-start justify-start gap-2 md:gap-5 md:-mt-[.5rem]">
            <label className="text-lg md:text-xl text-white">How Many Days*</label>
            <div className='w-full md:w-[50%] relative flex items-center justify-start mt-2 md:-mt-3'>
              {mpdoptions.map((mpd) => ( 
                <input
                  key={mpd}
                  type="text"
                  className={`rounded-full w-8 h-8 md:w-10 md:h-10 m-1 cursor-pointer text-center font-bold placeholder-white placeholder-opacity-100 caret-transparent text-sm md:text-base
                    ${formData.selectedmpd === mpd ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                  name='user'
                  placeholder={mpd}
                  onClick={() => handlempdClick(mpd)}
                />
              ))}
            </div>
            {showValidationError && formData.selectedmpd === null && (
              <p className="text-red-500 text-sm mt-1">Please select number of days</p>
            )}
          </div>

          <div className='w-full flex flex-col md:-mt-[.5rem]'>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center'>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-3 md:mt-[1rem]">Budget Range</h2> 
              <div className='w-full md:w-[80%] lg:w-[80%] h-10 flex items-center justify-start mt-2 md:pt-2'>
                <input className="accent-cyan-500 w-4 h-4 md:w-[1rem] md:h-[1rem]" type="checkbox" name="range" id="budgetrange" checked={formData.sameBudget} onChange={() => setFormData(prev => ({ ...prev, sameBudget: !prev.sameBudget }))} />
                <label htmlFor="" className='ml-2 md:ml-[1rem] text-sm md:text-xl text-white'>Same Budget For All</label>
              </div>
            </div>
            <div id='bpr' className="w-full relative flex-col items-center justify-between mt-3 md:mt-[1rem]">
              <label className="text-lg md:text-xl text-white">Per Day*</label>
              <div className='w-full md:w-[40%] lg:w-[50%] relative flex flex-wrap items-center justify-start mt-2 md:mt-2'>
                <input
                className="w-full md:w-64 h-10 md:h-12 border-2 border-white text-white p-2 rounded-xl mt-[.5rem] text-sm md:text-base"
                type="number"
                min="1"
                // placeholder="Enter the Amount"
                value={formData.perDay}
                onChange={(e) => setFormData(prev => ({ ...prev, perDay: e.target.value }))}
              />
              </div>
            </div>
            <div id='pm'className="w-full relative flex-col items-center justify-between mt-3 md:mt-[1rem]">
              <div className='flex-col items-center gap-2 mt-2'>
                <div className='w-full md:w-[40%] lg:w-[50%] relative flex items-center justify-start'>
                <label className="flex gap-2 md:gap-5 text-lg md:text-xl text-white">Per Match*</label>
                  <select
                    id="location"
                    name="location"
                    className="block w-16 md:w-20 mt-.5 h-6 md:h-7 ml-6 md:ml-0 bg-white-900 border text-xs md:text-sm border-white rounded-md text-gray-200 focus:ring-blue-500 cursor-pointer "
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="" className='bg-blue-400 text-white'>INR</option>
                    <option value="t2" className='bg-blue-400 text-white'>DOLLAR</option>
                    <option value="t3" className='bg-blue-400 text-white'>EURO</option>
                  </select>
                </div>
                
                <div className='w-full md:w-[40%] lg:w-[50%] relative flex flex-wrap items-center justify-star mt-2'>
                  <input
                  className="w-full md:w-64 h-10 md:h-12 border-2 border-white text-white p-2 rounded-xl mt-[.5rem] text-sm md:text-base"
                  type="number"
                  min="1"
                  // placeholder="Enter the Amount"
                  value={formData.perMatch}
                  onChange={(e) => setFormData(prev => ({ ...prev, perMatch: e.target.value }))}
                />
                </div>
              </div>
            </div>

            <div id='of' className="w-full relative flex-col items-center justify-between gap-3 md:gap-5 mt-3 md:mt-[1rem]">
              <label className="text-lg md:text-xl text-white">How Can Official Handle You*</label>
              <div className='w-full md:w-[40%] lg:w-[50%] relative flex flex-wrap items-center justify-start mt-2 md:mt-2'>
                {ofoptions.map((of) => ( 
                  <input
                    key={of}
                    type="text"
                    className={`rounded-xl w-20 md:w-24 h-8 md:h-10 m-1 cursor-pointer text-center font-bold placeholder-white placeholder-opacity-100 caret-transparent text-xs md:text-base
                      ${formData.selectedof === of ? 'bg-[#73DDD8]' : 'bg-blue-300'}`}
                    name='user'
                    placeholder={of}
                    onClick={() => handleofClick(of)}
                  />
                ))}
              </div>
              {showValidationError && formData.selectedof === null && (
                <p className="text-red-500 text-sm mt-1">Please select official handling method</p>
              )}
              
              <input className="w-full md:w-70 h-10 md:h-12 border-2 border-white text-white p-2 rounded-xl mt-3 md:mt-[1rem] placeholder-white placeholder-opacity-100 text-sm md:text-base" type="number" value={formData.contact} onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))} />
            </div>
          </div>

          <div className="w-full md:w-[50%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5 mt-3 md:mt-0">
            <label className="text-lg md:text-xl text-white">Entry Fees</label>
            <div className="w-full md:w-[95%] lg:w-[65%] relative flex items-center md:items-end justify-center gap-3 md:gap-5 mb-4 md:mb-4">
              {/* Optional checkbox */}
              <label className="flex items-center gap-2 text-sm md:text-base text-white">
                <input
                  type="checkbox"
                  className="form-checkbox h-6 w-6 text-blue-500"
                  checked={formData.entryFeesCheck}
                  onChange={() => setFormData(prev => ({ ...prev, entryFeesCheck: !prev.entryFeesCheck }))}
                />
              </label>

              {/* Make Payment button */} 
              <button
                id="view-rules"
                className="rounded-xl w-24 md:w-29 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white mr-2 md:mr-6 cursor-pointer text-sm md:text-base"
                onClick={toggleDivVisibility}
              >
                {isRulesVisible ? 'Hide Rules' : 'Make Payment'}
              </button>
            </div>

          </div>

          <div className="w-full md:w-[80%] lg:w-[60%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
            <label className="text-lg md:text-xl text-white">Prize details</label>
            <div className="w-full md:w-[55%] lg:w-[50%] relative flex items-center justify-start md:justify-between gap-3 md:gap-5 mb-4 md:mb-4">
              <button id="view-rules" className="rounded-xl w-20 md:w-24 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white mr-2 md:mr-6 cursor-pointer text-sm md:text-base" onClick={togglepriceVisibility}>
                {ispriceVisible ? 'Hide price' : 'View price'}
              </button>
            </div>
          </div>

          <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
            <label htmlFor="location" className="text-lg md:text-xl text-white mb-4 md:mb-5">Active Tournaments</label>
            <select
              id="location"
              name="location"
              className="block w-full md:w-64 bg-white-900 px-3 md:px-4 py-2 border border-white rounded-md text-gray-200 focus:ring-blue-500 cursor-pointer text-sm md:text-base"
              value={formData.activeTournament}
              onChange={(e) => setFormData(prev => ({ ...prev, activeTournament: e.target.value }))}
            >
              <option value="">Select a Tournament</option>
              <option value="t1" className='bg-blue-400 text-white'>Tournament1</option>
              <option value="t2" className='bg-blue-400 text-white'>Tournament2</option>
              <option value="t3" className='bg-blue-400 text-white'>Tournament3</option>
            </select>
          </div>

          <div className="w-full md:w-[80%] lg:w-[50%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
            <label className="text-lg md:text-xl text-white">Add rounds</label>
            <input
              className="w-full md:w-64 h-10 md:h-12 border-2 border-white text-white p-2 rounded-xl mt-[.5rem] text-sm md:text-base"
              type="text"
              // placeholder="Participation Team"
              value={formData.rounds}
              onChange={(e) => setFormData(prev => ({ ...prev, rounds: e.target.value }))}
            />
          </div>

          <div className="w-full md:w-[80%] lg:w-[65%] relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-5">
            <label className="text-lg md:text-xl text-white">Team Profiles</label>
            <div className="w-full md:w-[55%] lg:w-[55%] relative flex items-center justify-start md:justify-between gap-3 md:gap-5 mb-4 md:mb-6">
              <button
                className="rounded-xl w-20 md:w-24 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white mr-2 md:mr-6 cursor-pointer text-sm md:text-base"
                onClick={Teamprofile}
              >
                Add Details
              </button>
            </div>
          </div>

          <div className="w-full md:w-[80%] lg:w-[60%] relative flex flex-col md:flex-row items-start md:items-start justify-start gap-2 md:gap-5">
            <label className="text-lg md:text-xl text-white">Link Share via</label>
            <div>
              <label className="flex items-center text-sm md:text-xl text-white">
                <a href="#" className="flex items-center text-blue-400 text-xs md:text-base truncate max-w-[200px] md:max-w-none">
                  https://cricklytics-asdihgity99/friends-?-eruwi/..
                </a>
                <a>
                  <img className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-[1rem]" src={scanner} alt="QR Code" />
                </a>
              </label>
            </div>
          </div>

          <div className="flex items-center mb-4 md:mb-6">
            <input className="accent-cyan-500 w-4 h-4 md:w-[1rem] md:h-[1rem]" type="checkbox" name="terms" id="conditions" checked={formData.terms} onChange={() => setFormData(prev => ({ ...prev, terms: !prev.terms }))} />
            <label className="text-sm md:text-lg text-white ml-2 md:ml-[1rem]">
              Accept all the Terms and condition{' '}
              <a className="text-sm md:text-lg text-yellow-200" href="#">
                Click here
              </a>
            </label>
          </div>

          <div className="flex justify-end w-full gap-4">
            <button
              type="button"
              className="rounded-xl w-32 md:w-44 bg-gray-500 h-8 md:h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6] text-sm md:text-base"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl w-32 md:w-44 bg-gradient-to-l from-[#5DE0E6] to-[#004AAD] h-8 md:h-9 text-white cursor-pointer hover:shadow-[0px_0px_13px_0px_#5DE0E6] text-sm md:text-base"
              onClick={Tournament}
            >
              Create Tournament
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Tournament_nextpg;