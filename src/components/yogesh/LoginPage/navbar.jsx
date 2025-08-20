import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/yogesh/login/navlogo.png";
import { useEffect } from "react";
import { useRef } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for toggling mobile menu
  const [isContactOpen, setIsContactOpen] = useState(false); // State for toggling contact details
  const contactRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isContactOpen) setIsContactOpen(false); // Only close contact dropdown if open
  };

  const toggleContact = () => {
    setIsContactOpen(!isContactOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contactRef.current && !contactRef.current.contains(event.target)) {
        setIsContactOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 sm:px-8 py-4 z-50">
      {/* Logo */}
      <h1 className="text-white text-xl sm:text-2xl font-bold flex items-center">
        <img src={logo} alt="Cricklytics Logo" className="h-20 w-20 md:h-25 mr-2" />
        Cricklytics   
      </h1>

      {/* Hamburger Menu Icon (Visible on Mobile) */}
      <div className="sm:hidden">
        <button onClick={toggleMenu} className="text-white focus:outline-none">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            ></path>
          </svg>
        </button>
      </div>

      {/* Navbar Links */}
      <div
        className={`${
          isMenuOpen ? "flex" : "hidden"
        } sm:flex flex-col sm:flex-row absolute sm:static top-10 right-0 w-50% sm:w-auto bg-gray-900 sm:bg-transparent items-center sm:items-center px-4 sm:px-0 py-4 sm:py-0 transition-all duration-300 ease-in-out z-40`}
      >
        {/* Contact Button with Dropdown */}
        <div className="relative mb-4 sm:mb-0 sm:mr-4">
          <button
            onClick={toggleContact}
            className="text-white hover:text-gray-300 transition-colors"
          >
            Contact
          </button>
          {/* Contact Details Dropdown (Visible only on click) */}
          {isContactOpen && (
            <div className="absolute top-full right-0 mt-2 w-[calc(100%-2rem)] sm:w-64 max-w-[90vw] mx-auto min-w-[200px] bg-gray-800 rounded-lg shadow-lg p-4 z-60">
              <p className="text-white text-sm flex flex-col">
                <span className="font-semibold">Email:</span>
                <a
                  href="mailto:support_cricklytics@creativityventures.co.in"
                  className="hover:text-gray-300 transition-colors break-words"
                >
                  support_cricklytics@creativityventures.co.in
                </a>
              </p>
              <p className="text-white text-sm mt-2 flex flex-col">
                <span className="font-semibold">Ph-no:</span>
                <a
                  href="tel:+917397362027"
                  className="hover:text-gray-300 transition-colors"
                >
                  +91 7397362027
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Sign Up Button */}
        <button
          onClick={() => navigate("/signup")}
          className="bg-gradient-to-r from-[#004AAD] to-[#5DE0E6] text-white px-6 py-2 sm:px-8 sm:py-3 rounded-full text-base sm:text-lg shadow-lg transition-all font-['Alegreya'] cursor-pointer"
        >
          Sign Up
        </button>
      </div>
      
    </div>
  );
};

export default Navbar;