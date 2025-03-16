import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const Error = () => {
  return (
    <div className="h-screen bg-[#1a1e23] grid lg:grid-cols-2">
      {/* Left Side - Error Content */}
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
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mt-4 text-white">Oops!</h1>
              <p className="text-xl text-gray-400">Something went wrong</p>
            </div>
          </div>

          {/* Error Message */}
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 text-center">
            <p className="text-gray-300 mb-4">
              We couldn't find the page you were looking for or an unexpected error occurred.
            </p>
            <p className="text-gray-400">
              Please try again or return to the home page.
            </p>
          </div>

          {/* Back to Home Button */}
          <Link 
            to="/"
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
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
          <h2 className="text-3xl font-bold mb-4">Need help?</h2>
          <p className="text-lg opacity-90">
            If you continue to experience issues, please contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Error;