import { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Phone, 
  Video, 
  ChevronDown, 
  MessageSquare, 
  UserPlus, 
  UserMinus, 
  AlertCircle,
  Mail,
  ArrowLeft,
  Image,
  Film,
  Loader2,
  XCircle
} from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import { messageStore } from '../store/message.store';

export default function ViewProfile({
    setToggle,
    toggleViewProfile,
    contact, 
    isSaved,
    
}) {
  // Sample data - in a real application, this would come from props or context
  const {get_online_user,authUser} = authStore();
  const [showFullImage, setShowFullImage] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 640);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const {getAllMedia,mediaLoading,allContactVideoMessages,allContactImageMessages} = messageStore()  
  // Media content - simplified fake data with just URLs
  const mediaContent = {
    images: [
      "/api/placeholder/300/300", 
      "/api/placeholder/300/300", 
      "/api/placeholder/300/300", 
      "/api/placeholder/300/300", 
      "/api/placeholder/300/300", 
      "/api/placeholder/300/300"
    ],
    videos: [
      "/api/placeholder/300/200",
      "/api/placeholder/300/200",
      "/api/placeholder/300/200",
      "/api/placeholder/300/200"
    ]
  };

  const handleClose = () => {
    setToggle(false);
  };
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Never";
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diff = now - lastSeenDate;
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return "Just now";
    }
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Format date
    return lastSeenDate.toLocaleDateString();
  };

  const handleSaveContact = () => {
    setContact(prev => ({...prev, isSaved: true}));
  };

  const handleMediaData = () => {
    setActiveTab('media');

    getAllMedia(authUser._id,contact._id)
  };

  const handleRemoveContact = () => {
    setContact(prev => ({...prev, isSaved: false}));
  };
  const [mediaType, setMediaType] = useState('images');

  const renderMediaContent = () => {
    if (mediaLoading) {
      return (
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
          <Loader2 className="h-12 w-12 text-teal-500 animate-spin mb-4" />
          <p className="text-gray-300">Loading media content...</p>
        </div>
      );
    }
    return (
      <div className="p-4 sm:p-6">
        {/* Media type selector */}
        <div className="flex gap-2 mb-4">
          <button 
            className={`px-4 py-2 rounded-full text-sm flex items-center gap-1 ${mediaType === 'images' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setMediaType('images')}
          >
            <Image size={16} />
            <span>Images ({allContactImageMessages.length})</span>
          </button>
          <button 
            className={`px-4 py-2 rounded-full text-sm flex items-center gap-1 ${mediaType === 'videos' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setMediaType('videos')}
          >
            <Film size={16} />
            <span>Videos ({allContactVideoMessages.length})</span>
          </button>
        </div>
        
        {/* Media grid */}
        {mediaType === 'images' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allContactImageMessages?.map((image) => (
              <div 
                key={image.id} 
                className="aspect-square relative rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedMedia({ url: image.fileUrl, type: 'image' })}
              >
                <img src={image.fileUrl} alt={` ${image.fileUrl + 1}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="text-white text-xs font-medium truncate">Shared image</div>
                  <div className="text-gray-300 text-xs">{new Date(image.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allContactVideoMessages?.map((video) => (
              <div 
                key={video.id} 
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedMedia({ url: video.fileUrl, type: 'video' })}
              >
                <div className="relative">
                  <video src={video.fileUrl} alt={`Shared video ${video.id + 1}`} className="w-full h-32 object-cover" />
                 
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-12 border-l-white ml-1"></div>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-white text-sm font-medium">Shared video</div>
                  <div className="text-gray-400 text-xs mt-1">{new Date(video.createdAt ).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
       
          </div>
        )}
      </div>
    );
  };

  const renderMessagesContent = () => {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="py-12 flex flex-col items-center">
          <MessageSquare size={48} className="text-gray-600 mb-4" />
          <h3 className="text-lg text-gray-300 font-medium">Shared Messages</h3>
          <p className="text-gray-500 text-sm mt-2">Important messages and links shared with {contact.name} will appear here</p>
        </div>
      </div>
    );
  };

  if (!toggleViewProfile) return null;

  return (
    <div className="fixed backdrop-blur-2xl inset-0 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="relative w-full max-w-4xl flex flex-col sm:flex-row h-full sm:h-5/6 max-h-screen">
        {/* Mobile Tab Navigation - Only visible on small screens */}
        {isMobileView && (
          <div className="bg-gray-900 flex  border-gray-700">
            <button 
              className={`flex-1 flex items-center justify-center py-3 ${activeTab === 'overview' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-400'}`}
              onClick={() => setActiveTab('overview')}
            >
              <AlertCircle size={18} className="mr-1" />
              <span className="text-xs">Overview</span>
            </button>
            
            <button 
              className={`flex-1 flex items-center justify-center py-3 ${activeTab === 'media' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-400'}`}
              onClick={ handleMediaData}
            >
              <Video size={18} className="mr-1" />
              <span className="text-xs">Media</span>
            </button>
            
            <button 
              className={`flex-1 flex items-center justify-center py-3 ${activeTab === 'messages' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-400'}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare size={18} className="mr-1" />
              <span className="text-xs">Messages</span>
            </button>
          </div>
        )}
        
        {/* Desktop Sidebar navigation - Only visible on larger screens */}
        {!isMobileView && (
          <div className="bg-gray-900 w-16 flex flex-col py-4 hidden sm:flex">
            <button 
              className={`flex flex-col items-center justify-center py-4 ${activeTab === 'overview' ? 'text-teal-500 border-l-2 border-teal-500' : 'text-gray-400'}`}
              onClick={() => setActiveTab('overview')}
            >
              <AlertCircle size={20} />
              <span className="text-xs mt-1">Overview</span>
            </button>
            
            <button 
              className={`flex flex-col items-center justify-center py-4 ${activeTab === 'media' ? 'text-teal-500 border-l-2 border-teal-500' : 'text-gray-400'}`}
              onClick={() => {
                setActiveTab('media');
                handleMediaData();
              }}
            >
              {mediaLoading && activeTab === 'media' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Video size={20} />
              )}
              <span className="text-xs mt-1">Media</span>
            </button>
            
            <button 
              className={`flex flex-col items-center justify-center py-4 ${activeTab === 'messages' ? 'text-teal-500 border-l-2 border-teal-500' : 'text-gray-400'}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare size={20} />
              <span className="text-xs mt-1">Messages</span>
            </button>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 bg-gray-900 sm:rounded-r-lg shadow-lg overflow-hidden flex flex-col">
          {/* Header with close button */}
          <div className="px-4 py-3 bg-gray-800 text-gray-200 font-medium flex justify-between items-center">
            <div className="flex items-center">
              <ArrowLeft className="h-5 w-5 mr-2 cursor-pointer" onClick={handleClose} />
              <span>Contact Details</span>
            </div>
            <X className="h-5 w-5 cursor-pointer" onClick={handleClose} />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Display different content based on activeTab */}
            {activeTab === 'overview' && (
              <>
                {/* Profile Info */}
                <div className="p-4 sm:p-6 flex flex-col items-center border-b border-gray-800">
                  <div 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-teal-700 flex items-center justify-center relative cursor-pointer"
                    onClick={() => setShowFullImage(true)}
                  >
                    <img 
                      src={contact.profilePhoto}
                      alt={contact.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  
                  <h1 className="text-lg sm:text-xl font-bold mt-3 sm:mt-4 text-white">
                    {contact.name}
                  </h1>
                  
                  <div className="flex items-center text-xs sm:text-sm text-teal-400 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-teal-400 mr-2"></span>
                    {get_online_user.includes(contact._id) ? 'Online' : `Last seen ${formatLastSeen(Number(contact.lastSeen))}`}
                  </div>
                  
                  <div className="flex justify-center gap-4 sm:gap-6 mt-4 sm:mt-6">
                    <button className="flex flex-col items-center gap-1 text-gray-300">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center">
                        <MessageSquare size={isMobileView ? 16 : 20} />
                      </div>
                      <span className="text-xs sm:text-sm">Message</span>
                    </button>
                  </div>
                </div>
                
                {/* Contact Details */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
                  <div>
                    <div className="text-gray-400 text-xs sm:text-sm mb-1">About</div>
                    <div className="text-gray-300 text-sm sm:text-base">
                      {contact.status}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-xs sm:text-sm mb-1">Email</div>
                    <div className="flex items-center text-gray-300 text-sm sm:text-base">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      {contact.email}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-xs sm:text-sm mb-1">Phone Number</div>
                    <div className="flex items-center text-gray-300 text-sm sm:text-base">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      {contact.phoneNumber}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-xs sm:text-sm mb-1">Mute notifications</div>
                    <div className="flex items-center">
                      <div className="flex items-center gap-1 bg-gray-800 rounded px-3 py-1 text-gray-300 text-xs sm:text-sm">
                        <Bell size={16} />
                        <span>Mute</span>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'media' && renderMediaContent()}
            
            {activeTab === 'messages' && renderMessagesContent()}
          </div>
          
          {/* Action buttons - Only show in overview tab */}
          {activeTab === 'overview' && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-900 border-t border-gray-800">
              {isSaved ? (
                <button 
                  onClick={handleRemoveContact}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center justify-center text-sm"
                >
                  <UserMinus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Remove Contact
                </button>
              ) : (
                <button 
                  onClick={handleSaveContact}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center text-sm"
                >
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Add to Contacts
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded py-2 text-xs sm:text-sm font-medium">
                  Block
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-red-500 rounded py-2 text-xs sm:text-sm font-medium">
                  Report contact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Full-size image modal - for profile picture */}
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" 
          onClick={() => setShowFullImage(false)}
        >
          <div className="max-w-4xl overflow-auto max-h-full p-4">
            <img 
              src={contact.profilePhoto}
              alt={contact.name} 
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
      
      {/* Media viewer modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" 
          onClick={() => setSelectedMedia(null)}
        >
          <div 
            className="max-w-4xl max-h-full p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.type === 'image' ? (
              // For images
              <img 
                src={selectedMedia.url} 
                alt="Shared image"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              // For videos - now using proper video player with controls
              <div className="relative w-full">
                <div className='flex justify-end pb-5'><button onClick={()=>setSelectedMedia(null)} className='cursor-pointer'><XCircle></XCircle></button></div>
               <video 
                  key={selectedMedia.url} // Add key to force re-render when changing videos
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  muted={false}
                  playsInline
                  crossOrigin="anonymous"
                  preload="auto"
                  className="w-full max-h-full rounded"
                >
                    
                </video>
              </div>
            )}
            <div className="text-white mt-4">
              <h3 className="text-lg font-medium">{selectedMedia.type === 'image' ? 'Shared image' : 'Shared video'}</h3>
              <p className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}