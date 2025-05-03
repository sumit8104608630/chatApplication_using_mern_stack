import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Phone, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // Step 1: Phone verification, Step 2: New password
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const handleRequestReset = async (e) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      // Replace with your actual API call to request verification code
      await axiosInstance.post("/auth/request-reset", { phoneNumber: formData.phoneNumber });
      
      // Move to step 2 (password reset)
      setStep(2);
      setIsSubmitting(false);
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to send verification code. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsSubmitting(false);
        return;
      }

      // Replace with your actual API call
      await axiosInstance.post("/auth/reset-password", {
        phoneNumber: formData.phoneNumber,
        verificationCode,
        newPassword: formData.password
      });
      
      // Show success message and redirect to login after delay
      setStep(3);
      setIsSubmitting(false);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to reset password. Please try again.");
      setIsSubmitting(false);
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
              <h1 className="text-2xl font-bold mt-2 text-white">Reset Password</h1>
              <p className="text-gray-400">
                {step === 1 && "Enter your phone number to receive a verification code"}
                {step === 2 && "Enter verification code and create a new password"}
                {step === 3 && "Password reset successful"}
              </p>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="tel"
                    className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="+91..."
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Sending code...
                  </>
                ) : (
                  "Request Verification Code"
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  className="w-full bg-transparent text-white px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter code sent to your phone"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative mb-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-transparent text-white pl-10 pr-10 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative mb-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full bg-transparent text-white pl-10 pr-10 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
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
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Resetting password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="bg-teal-500 bg-opacity-20 border border-teal-400 rounded-md p-4 text-center">
              <CheckCircle className="h-10 w-10 text-teal-400 mx-auto mb-2" />
              <p className="text-teal-300 font-medium mb-2">
                Password reset successful!
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Redirecting to login page...
              </p>
              <button 
                onClick={() => navigate("/login")}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
              >
                Go to Login
              </button>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="text-gray-400 hover:text-teal-400 flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
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
          <h2 className="text-3xl font-bold mb-4">Forgot your password?</h2>
          <p className="text-lg opacity-90">
            {step === 1 && "No worries! Enter your phone number and we'll send you a verification code to reset your password."}
            {step === 2 && "Enter the verification code sent to your phone and create a new secure password."}
            {step === 3 && "Your password has been successfully reset. You can now log in with your new password."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;