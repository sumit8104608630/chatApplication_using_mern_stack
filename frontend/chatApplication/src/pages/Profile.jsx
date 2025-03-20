import React, { useEffect, useState } from 'react';
import { Phone, Mail, User, Camera, Save, Loader2 } from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import SuccessAlert from '../components/Alert';
const Profile = () => {
  const { authUser, isCheckingAuth ,updateProfile,isUpdatingProfile,checkAuth} = authStore();
  
  // State for user information
  const [userInfo, setUserInfo] = useState({
    name: authUser?.name || '',
    status: authUser?.status || '',
    email: authUser?.email || '',
    phoneNumber: authUser?.phoneNumber || ''
  });

  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [alert,showAlert]=useState({})
  const [show_Alert,setShow]=useState(false)
  // State for input values during edit
  const [editValues, setEditValues] = useState({
    ...userInfo,
    profilePhoto: authUser?.profilePhoto || ''
  });
  
  // State for full-size image modal
  const [showFullImage, setShowFullImage] = useState(false);
  
  // State for loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for selected file
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditValues({
      ...editValues,
      [name]: value
    });
  };

  // Handle profile photo change
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview of the image
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditValues({
          ...editValues,
          profilePhoto: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    console.log("yes")
    e.preventDefault();
    setIsSubmitting(true);
    
    // Create a new formData object for file upload
    const formData = new FormData();

    
    // Add other form fields
    formData.append('name', editValues.name);
    formData.append('status', editValues.status);
    formData.append('email', editValues.email);
    formData.append('phoneNumber', editValues.phoneNumber);
    
    // Simulate API call - would be replaced with actual API call
      // Update the userInfo state with the new values
      setUserInfo({
        name: editValues.name,
        status: editValues.status,
        email: editValues.email,
        phoneNumber: editValues.phoneNumber
      });
      console.log(editValues)

      
      setIsSubmitting(false);
  };


  // Cancel editing and reset form
  const handleCancel = () => {
    setEditValues({
      ...userInfo,
      profilePhoto: authUser?.profilePhoto
    });
    setSelectedFile(null);
    setEditMode(false);
  };
  const handleEditing=async(e)=>{
    e.preventDefault();

  const res= await updateProfile(editValues);
  if(res.status==200){
    setShow(true)
    setUserInfo({
      name: editValues.name,
      status: editValues.status,
      email: editValues.email,
      phoneNumber: editValues.phoneNumber
    });
    checkAuth()
    showAlert({
      message: "Profile updated successfully",
  duration: 1000, // 3 seconds
  isVisible: true,
    })  
  }
setTimeout(()=>{
  setShow(false)
},500)
  
    
  }

  return (
    <>
    {show_Alert&&
      <SuccessAlert message={alert.message} isVisible={alert.isVisible} duration={alert.duration} />
    }
      {isCheckingAuth ? (
        <div className={`h-screen  flex items-center justify-center bg-[#1a1e23]`}>
          <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className={`h-screen ${editMode?"mt-10":"mt-0"} bg-[#1a1e23] grid lg:grid-cols-2`}>
          {/* Left Side - Profile Form */}
          <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full grid grid-cols-12 gap-4">
                {Array(150).fill().map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-gray-400"></div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-md space-y-8 z-10">
              {/* Logo & Header */}
              <div className="text-center mb-8">
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-24 h-24 rounded-full bg-[#0e7970] flex items-center justify-center relative cursor-pointer border-4 border-[#0e7970]"
                    onClick={() => !editMode && setShowFullImage(true)}
                  >
                    {/* Hidden file input for photo upload */}
                    <input 
                      type="file" 
                      id="profilePhoto" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                    
                    <img 
                      src={editMode ? editValues.profilePhoto : authUser?.profilePhoto}
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                    
                    {editMode && (
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={() => document.getElementById('profilePhoto').click()}
                      >
                           <img 
                      src={editMode ? editValues.profilePhoto : authUser?.profilePhoto}
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                      </div>
                    )}
                  </div>
                  
                  <h1 className="text-2xl font-bold mt-2 text-white">
                    {!editMode ? userInfo.name : (
                      <input
                        type="text"
                        name="name"
                        value={editValues.name}
                        onChange={handleInputChange}
                        className="bg-transparent text-white text-center text-2xl font-bold w-full border-b border-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                    )}
                  </h1>
                  
                  <p className="text-gray-400">
                    {!editMode ? userInfo.status : (
                      <input
                        type="text"
                        name="status"
                        value={editValues.status}
                        onChange={handleInputChange}
                        className="bg-transparent text-gray-400 text-center w-full border-b border-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                    )}
                  </p>
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
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="email@example.com"
                      value={editMode ? editValues.email : userInfo.email}
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                </div>

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
                      name="phoneNumber"
                      className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="+1 (123) 456-7890"
                      value={editMode ? editValues.phoneNumber : userInfo.phoneNumber}
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                </div>

                {!editMode ? (
                  <button 
                    type="button" 
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center" 
                    onClick={() => setEditMode(true)}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={(e)=>handleEditing(e)} 
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center" 
                    disabled={isSubmitting}
                  >
                <>
                {isUpdatingProfile&&<>saving...</>}
                </>
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    
                  </button>
                )}

                {editMode && (
                  <button 
                    type="button" 
                    className="w-full bg-transparent hover:bg-gray-800 text-gray-400 font-medium py-2 px-4 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-opacity-50" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
              </form>

              <div className="text-center">
                <p className="text-gray-400">
                  View your activity log{" "}
                  <a href="#" className="text-teal-400 hover:text-teal-300">
                    Activity Log
                  </a>
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
              <h2 className="text-3xl font-bold mb-4">Your Profile</h2>
              <p className="text-lg opacity-90">
                Update your personal information and manage your account settings.
              </p>
            </div>
          </div>

          {/* Full-size image modal */}
          {showFullImage && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" 
              onClick={() => setShowFullImage(false)}
            >
              <div className="max-w-4xl overflow-auto max-h-full p-4">
                <img 
                  src={authUser?.profilePhoto}
                  alt="Profile" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Profile;