import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, UserCircle, Upload } from "lucide-react";
import { authStore } from "../store/userAuth.store";

const SignUpPage = () => {
  const {signUp, isSigningUp} = authStore();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [fullImage, setShowFullImage] = useState(false);
  const [showRemove, setRemove] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  
  // Validation states
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePhoto: ""
  });

  const remove_photo = () => {
    setProfilePreview(null);
    setFormData({ ...formData, profilePhoto: "" });
    setRemove(false);
  };

  useEffect(() => {
    if(formData.profilePhoto) {
      setRemove(true);
    }
  }, [formData.profilePhoto]);

  // Name validation

  useEffect(()=>{
    if(formData.name){
      setNameError(false)
    }
  },[formData])

  // Phone number validation for Indian format (10 digits)
  useEffect(() => {
    if (formData.phoneNumber) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setPhoneError("Please enter a valid 10-digit Indian phone number");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  }, [formData.phoneNumber]);

  // Email validation
  useEffect(() => {
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  }, [formData.email]);

  // Password validation
  useEffect(() => {
    if (formData.password) {
     // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(.{6,10})$/;
      
      if (formData.password.length < 6 || formData.password.length > 10) {
        setPasswordError("Password must be between 6-10 characters");
      } else if (!formData.password.match(/[A-Z]/)) {
        setPasswordError("Password must contain at least one uppercase letter");
      } else if (!formData.password.match(/[a-z]/)) {
        setPasswordError("Password must contain at least one lowercase letter");
      } else if (!formData.password.match(/[!@#$%^&*]/)) {
        setPasswordError("Password must contain at least one special character");
      } else if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        setPasswordError("Passwords do not match");
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }
  }, [formData.password,formData.confirmPassword]);

  // Confirm password validation
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
    } else if (formData.password && formData.confirmPassword && formData.password === formData.confirmPassword) {
      setPasswordError("");
    }
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all fields before submission
    if (!formData.name) {
      setNameError("Name is required");
      return;
    }
    
    if (!formData.phoneNumber) {
      setPhoneError("Phone number is required");
      return;
    }
    
    if (!formData.email) {
      setEmailError("Email is required");
      return;
    }
    
    if (!formData.password) {
      setPasswordError("Password is required");
      return;
    }
    
    if (!formData.confirmPassword) {
      setPasswordError("Please confirm your password");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Check if there are any validation errors
    if (nameError || phoneError || emailError || passwordError) {
      return;
    }
    
    // Proceed with signup if all validations pass
    signUp(formData, navigate);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        alert("Please select an image file");
        return;
      }
      
      setFormData({ ...formData, profilePhoto: file });
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Function to check if form is valid
  const isFormValid = () => {
    return !nameError && !phoneError && !emailError && !passwordError && 
           formData.name && formData.phoneNumber && formData.email && 
           formData.password && formData.confirmPassword;
  };

  return (
    <div className="min-h-screen  bg-[#1a1e23] grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {fullImage &&
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" 
            onClick={() => setShowFullImage(false)}
          >                    
            <img src={profilePreview} alt="Profile Preview" className="object-cover" />
          </div>
        }
        {/* Pattern Background - Only visible on desktop */}
        <div className="absolute inset-0 opacity-10 hidden lg:block">
          <div className="w-full h-full grid grid-cols-12 gap-4">
            {Array(150).fill().map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-gray-400"></div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md space-y-8 z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-[#0e7970] flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M3 21l1.65-3.8a9 9 0 1112.713-12.713a9 9 0 01-12.8 12.82L3 21" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mt-2 text-white">Create Account</h1>
              <p className="text-gray-400">Sign up to start messaging</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center mb-2">
              <div 
                onClick={() => showRemove ? setShowFullImage(true) : triggerFileInput()}
                className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-600 border-2 border-teal-500 overflow-hidden"
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {!showRemove && 
                <input
                  name="profilePhoto"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              }
              <button 
                type="button" 
                onClick={showRemove ? remove_photo : triggerFileInput}
                className="mt-2 text-sm text-teal-400 flex items-center"
              >
                {showRemove ? 
                  <span className="px-3 py-1 bg-teal-400 rounded-lg text-white">Remove</span> : 
                  <><Upload className="h-4 w-4 mr-1" /> Upload Profile Photo</>
                }
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className={`w-full bg-transparent text-white pl-10 pr-3 py-2 border ${nameError ? 'border-red-500' : 'border-gray-700'} rounded-md focus:outline-none focus:ring-1 ${nameError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {nameError && (
                <p className="text-red-500 text-sm mt-1">{nameError}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="tel"
                  className={`w-full bg-transparent text-white pl-10 pr-3 py-2 border ${phoneError ? 'border-red-500' : 'border-gray-700'} rounded-md focus:outline-none focus:ring-1 ${phoneError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                  placeholder="9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-sm mt-1">{phoneError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  className={`w-full bg-transparent text-white pl-10 pr-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-700'} rounded-md focus:outline-none focus:ring-1 ${emailError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full bg-transparent text-white pl-10 pr-10 py-2 border ${
                    passwordError && !formData.confirmPassword ? 'border-red-500' : 'border-gray-700'
                  } rounded-md focus:outline-none focus:ring-1 ${
                    passwordError && !formData.confirmPassword ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-teal-500 focus:border-teal-500'
                  }`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              {passwordError && !formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Password must be 6-10 characters with at least one uppercase letter, one lowercase letter, and one special character.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full bg-transparent text-white pl-10 pr-10 py-2 border ${
                    passwordError && formData.confirmPassword ? 'border-red-500' : 'border-gray-700'
                  } rounded-md focus:outline-none focus:ring-1 ${
                    passwordError && formData.confirmPassword ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-teal-500 focus:border-teal-500'
                  }`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              {passwordError && formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <button 
              type="submit" 
              className={`w-full ${isFormValid() ? 'bg-teal-500 hover:bg-teal-600' : 'bg-teal-500 bg-opacity-50 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center mt-6`}
              disabled={isSigningUp }
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-400 hover:text-teal-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Only visible on desktop */}
      <div className="hidden lg:flex bg-teal-500 flex-col justify-center items-center text-white p-12 relative">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full grid grid-cols-12 gap-4">
            {Array(150).fill().map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white"></div>
            ))}
          </div>
        </div>
        
        <div className="max-w-md z-10">
          <h2 className="text-3xl font-bold mb-4">Join our community!</h2>
          <p className="text-lg opacity-90">
            Create an account to connect with others, start conversations, and explore new possibilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;