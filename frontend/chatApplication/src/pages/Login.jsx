import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Phone, Lock } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { authStore } from "../store/userAuth.store";

const Login = () => {
    const {authUser,checkAuth,isCheckingAuth,isLoginIng,login} = authStore( );
  
  const navigate=useNavigate()
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const handleSubmit = async (e) => {
  try {
      e.preventDefault();
     login(formData);
  } catch (error) {
    console.log(error)
  }
  };
  return (
    <div className="h-screen bg-[#1a1e23] grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
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
              <h1 className="text-2xl font-bold mt-2 text-white">Welcome Back</h1>
              <p className="text-gray-400">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="phoneNumber"
                  className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="+91..."
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
            </div>

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
                  className="w-full bg-transparent text-white pl-10 pr-10 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
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
            </div>

            <button 
              type="submit" 
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center" 
              disabled={isLoginIng}
            >
              {isLoginIng ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <Link to="/signUpPage" className="text-teal-400 hover:text-teal-300">
                Create account
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
          <h2 className="text-3xl font-bold mb-4">Welcome back!</h2>
          <p className="text-lg opacity-90">
            Sign in to continue your conversations and catch up with your messages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;