import { useState, useEffect } from "react";
import { Link, useLocation,NavLink, useNavigate } from "react-router-dom";
import { Menu, X, MessageSquare, Bell, Search, Users, Settings, User ,Group} from "lucide-react";
import { authStore } from "../store/userAuth.store";
import { axiosInstance } from "../lib/axios";
const Head = () => {

  const {authUser,checkAuth,isCheckingAuth,logout,deleteActiveUser} = authStore();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate=useNavigate()
  // Check if the current path matches the link
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Listen for scroll events to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      setProfileMenuOpen(false)
    };
    
  }, []);

  const handleLogout=async()=>{
    deleteActiveUser(authUser?._id)
    logout(navigate)
   setProfileMenuOpen(false)
   setIsOpen(false)

  }

  // Navigation links
  const navLinks = [
    { name: "Create Group", path: "/createGroup", icon: <Group className="w-5 h-5" /> },
    { name: "Add Contacts", path: "/contacts", icon: <Users className="w-5 h-5" /> },
  ];

  return (
<nav 
  className={`bg-[#1a1e23] border-b-1 text-white sticky top-0 w-full z-30 transition-all duration-300 ${
    scrolled ? "shadow-lg shadow-black/20" : " "
  }`}
>
  <div className="flex w-full px-10">
    <div className="flex items-center  w-full justify-between h-16">
      {/* Logo and Brand */}
      <div className="flex-shrink-0 flex items-center">
        <Link onClick={()=>setIsOpen(false)} to="/" className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-[#0e7970] flex items-center justify-center mr-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              className="w-4 h-4 text-white"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M3 21l1.65-3.8a9 9 0 1112.713-12.713a9 9 0 01-12.8 12.82L3 21" 
              />
            </svg>
          </div>
          <span className="font-bold text-xl">Charcha</span>
        </Link>
      </div>

      {/* Search Bar - Hidden on Mobile */}
    
      <div className="flex justify-center items-center gap-10">
        {/* Desktop Navigation */}
        {authUser &&
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                isActive(link.path) 
                  ? "bg-teal-600 text-white" 
                  : "text-gray-300 hover:bg-[#252a30] hover:text-white"
              }`}
            >
              <span className="mr-1.5">{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          ))}
        </div>
        }
        {!authUser &&
        <div>
          <NavLink
            to="/signUpPage"
            className={({ isActive }) =>
              `px-4 py-1 rounded text-center ${
                isActive ? "hidden" : "bg-teal-600"
              } hover:bg-teal-700`
            }
          >
            Sign Up
          </NavLink>            
        </div>
        }

        {/* Profile Dropdown */}
        {authUser &&
        <div className="hidden md:flex-shrink-0 md:flex md:items-center">
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="bg-[#252a30] flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-teal-600 focus:ring-white"
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center">
                {authUser?.profilePhoto ? <img className="h-8 object-cover w-8 rounded-full" src={authUser?.profilePhoto}/> :
                <User className="h-5 w-5 text-white" />
                }
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div 
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-[#252a30] ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <Link onClick={()=>setProfileMenuOpen(false)} to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2d3239]">
                  Your Profile
                </Link>
                <Link onClick={()=>setProfileMenuOpen(false)} to="/account" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2d3239]">
                  Account Settings
                </Link>
                <button  onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-[#2d3239]">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
        }
      </div>
      
      {/* Mobile menu button - ADDED HERE */}
      {authUser&&
      <div className=" md:hidden  ">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex md:hidden   items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#252a30] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          {isOpen ? (
            <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
}
    </div>
  </div>

  {/* Mobile menu */}
  {isOpen && (
    <div className="md:hidden border-t border-gray-700">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">

        {navLinks.map((link) => (
          <Link
          onClick={()=>setIsOpen(false)}
            key={link.name}
            to={link.path}
            className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
              isActive(link.path) 
                ? "bg-teal-600 text-white" 
                : "text-gray-300 hover:bg-[#252a30] hover:text-white"
            }`}
          >
            <span className="mr-2">{link.icon}</span>
            <span>{link.name}</span>
          </Link>
        ))}
      </div>
      
      {/* Mobile profile section */}
      <div className="pt-4 pb-3 border-t border-gray-700">
        <div className="flex items-center px-5">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 flex rounded-full bg-teal-500 md:hidden items-center justify-center">
              {authUser?.profilePhoto ? 
                <img className="h-10 w-10 rounded-full object-cover" src={authUser?.profilePhoto}/> :
                <User className="h-6 w-6 text-white" />
              }
            </div>
          </div>
          <div className="ml-3">
            <div className="text-base font-medium leading-none text-white">{authUser?.displayName || "User Name"}</div>
            <div className="text-sm font-medium leading-none text-gray-400 mt-1">{authUser?.email || "user@example.com"}</div>
          </div>
        </div>
        <div className="mt-3 px-2 space-y-1">
          <Link onClick={()=>setIsOpen(false)} to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[#252a30] hover:text-white">
            Your Profile
          </Link>
          <Link onClick={()=>setIsOpen(false)} to="/account" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[#252a30] hover:text-white">
            Account Settings
          </Link>
          <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[#252a30] hover:text-white">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )}
</nav>
  );
};

export default Head;