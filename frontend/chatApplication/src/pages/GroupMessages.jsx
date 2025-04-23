import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MoreVertical, 
  Download, 
  X, 
  PlusCircle, 
  Paperclip, 
  Image, 
  File, 
  Send, 
  Smile,
  Video as VideoIcon,
  Info,
  Link
} from 'lucide-react';
import { groupMessageStore } from '../store/groupMessage.store';
import { messageStore } from '../store/message.store';

function GroupMessages({
  handleContactClick,
  activeGroup,
  setActiveGroup,
  showContactsOnMobile,
  handleBackToGroups,
  handleDownloadFile,
  messageLoading,
  messageSendingLoading,
  setActiveTab
}) {
  const {sendGroupMessage,get_all_groupMessage,groupMessages} = groupMessageStore();
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const moreOptionsRef = useRef(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const {contacts}=messageStore()
  const [message, setMessage] = useState({
    receiverId: "",
    message: "",
    status: "",
    file: null,
    image: null,
    video: null,
  });

  // Dummy messages to display in the component
 
  // Combine original messages with dummy messages
  const messages = groupMessages ;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleFilePopup = () => {
    setShowFilePopup(!showFilePopup);
  };

  const handleSendMessage = () => {
    try {
      const messageToSend = { ...message };
      
      // Set message status based on online status
    
        const new_format = new FormData();
        new_format.append("message", messageToSend.message);
        new_format.append("groupId", activeGroup._id);
        new_format.append("status", message.status);
        
        // Handle files based on type
        if (selectedFile) {
          if (filePreview?.type === 'image') {
            new_format.append("image", selectedFile);
          } else if (filePreview?.type === 'video') {
            new_format.append("video", selectedFile);
          } else {
            new_format.append("file", selectedFile);
          }
        }
        
        // Send the message (call your API function)
         sendGroupMessage(new_format);
        
        // Clear input fields after sending
        setMessage({
          receiverId: "",
          message: "",
          status: "",
          file: null,
          image: null,
          video: null
        });
        
      
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      
    } catch (error) {
      console.log(error);
    }
  };

  const handleFileSelection = (type) => {
    if (fileInputRef.current) {
      switch (type) {
        case 'image':
          fileInputRef.current.setAttribute('accept', 'image/*');
          break;
        case 'file':
          fileInputRef.current.setAttribute('accept', 'application/pdf');
          break;
        case 'video':
          fileInputRef.current.setAttribute('accept', 'video/*');
          break;
        default:
          fileInputRef.current.setAttribute('accept', '*/*');
          
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setShowFilePopup(false)

      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const fileType = file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/')
          ? 'video'
          : 'file';
      
      if (fileType === 'image' || fileType === 'video') {
        const url = URL.createObjectURL(file);
        setFilePreview({
          type: fileType,
          url,
          name: file.name
        });
      } else {
        setFilePreview({
          type: 'file',
          name: file.name
        });
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    setMessage({ ...message, message: e.target.value });
  };

  const handleOptionClick = (option) => {
    // Handle the selected option
    console.log(`Selected option: ${option}`);
    if(option === "groupInfo") {
      setGroupInfo(activeGroup?.members);
      setShowMoreOptions(null);
    }
    // Add your logic for each option here
    setShowMoreOptions(false);
  };

  const renderMessageStatus = (status, isOwn) => {
    if (!isOwn) return null;
    
    switch (status) {
      case 'sent':
        return <span>✓</span>;
      case 'delivered':
        return <span>✓✓</span>;
      case 'read':
        return <span className="text-blue-500">✓✓</span>;
      default:
        return <span>...</span>;
    }
  };

  const toggleMoreOptions = () => {
    setShowMoreOptions(!showMoreOptions);
  };

  const handleClick = (contact) => {
    setActiveGroup(null);
    handleContactClick(contact);
    setActiveTab("contacts");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && (message.message || selectedFile)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`${!showContactsOnMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
      {activeGroup ? (
        <>
          {/* Group Chat Header */}
          <div className="p-4 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
              {!showContactsOnMobile && (
                <button 
                  className="mr-2 text-gray-400 md:hidden"
                  onClick={handleBackToGroups}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {activeGroup && (
                <>
                  {activeGroup.groupImage ? (
                    <img
                      src={activeGroup.groupImage}
                      alt={activeGroup.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                      {activeGroup.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="ml-3">
                    <h3 className="text-white font-medium">{activeGroup.name}</h3>
                    <p className="text-xs text-gray-400">
                      {activeGroup.members?.length || 0} members
                    </p>
                  </div>
                </> 
              )}
            </div>
            <div className="flex items-center space-x-3 relative" ref={moreOptionsRef}>
              <button 
                className="text-gray-400 hover:text-white" 
                onClick={toggleMoreOptions}
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {/* More Options Dropdown */}
              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 rounded-md shadow-lg z-10 border border-gray-700">
                  <div className="py-1">
                    <button 
                      onClick={() => handleOptionClick('groupInfo')} 
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Group Info
                    </button>
                    <button 
                      onClick={() => handleOptionClick('images')} 
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Images
                    </button>
                    <button 
                      onClick={() => handleOptionClick('videos')} 
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      <VideoIcon className="h-4 w-4 mr-2" />
                      Videos
                    </button>
                    <button 
                      onClick={() => handleOptionClick('links')} 
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Links
                    </button>
                  </div>
                </div>
              )}
              {
                groupInfo && (
                  <div className="absolute right-0 top-full mt-2 bg-gray-900 rounded-md shadow-lg z-10 border border-gray-700">
                    {
                      groupInfo?.map((contact, index) => {
                        return (
                          <li 
                            key={contact._id}
                            onClick={() => handleClick(contact)}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors list-none ${index != groupInfo.length-1 && "border-b-1"}`}
                          >
                            <div className="flex items-center px-4 py-3">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0 mr-3">
                                {contact.profilePhoto ? (
                                  <img 
                                    src={contact.profilePhoto} 
                                    alt={contact.name} 
                                    className="h-10 w-10 rounded-full"
                                  />
                                ) : (
                                  <img
                                    src="https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"
                                    alt=""
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">{contact.name}</p>
                                <p className="text-sm text-gray-500 truncate">
                                  {contact.status || "Hey there! I'm using ChatApp."}
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })
                    }
                  </div>
                )
              }
            </div>
          </div>
          
          {/* Messages */}
          {messageLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse flex-1 p-2 sm:p-4 overflow-y-auto bg-[#1a1e23]`}
              >
                <div className="flex max-w-xs md:max-w-md">
                  {idx % 2 === 0 && (
                    <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 self-end" />
                  )}
                  <div
                    className={`bg-gray-700 p-3 text-white ${
                      idx % 2 === 0
                        ? 'rounded-r-lg rounded-tl-lg'
                        : 'rounded-l-lg rounded-tr-lg'
                    } w-40`}
                  >
                    <div className="h-3 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div 
              ref={scrollRef}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                overflowY: "auto",
              }} 
              className="flex-1 p-2 sm:p-4 overflow-y-auto bg-[#1a1e23]"
            >
              <div className="space-y-4">
                {messages?.map((message) => {
                  const sender = contacts?.find(c => c?.userId?._id === message.sender) || 
                    { userId: { profilePhoto: "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png" }, 
                      save_contact: true, 
                      name: "Demo User", 
                      phone: "+1234567890" };
                  return (
                    <div 
                      key={message.id}
                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex max-w-xs md:max-w-md">
                        {!message.isOwn && (
                          <img
                            src={sender?.save_contact 
                              ? sender?.userId?.profilePhoto 
                              : "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                          />
                        )}
                        <div>
                          {!message.isOwn && (
                            <p className="text-xs text-gray-400 mb-1 ml-1">
                              {sender?.save_contact ? sender?.name : sender?.phone || "Unknown"}
                            </p>
                          )}
                          <div className={`${message.isOwn ? 'bg-teal-500 p-3 rounded-l-lg rounded-tr-lg text-white' : 'bg-gray-800 p-3 rounded-r-lg rounded-tl-lg text-white'}`}>
                            <p className="text-sm">{message.text}</p>
                            {message?.image && message.image.match(/\.(jpeg|jpg|gif|png)$/) && (
                              <div className="relative mt-2">
                                <img 
                                  onClick={() => setFullViewImage(message?.image)}
                                  src={message.image} 
                                  alt="Shared image" 
                                  className="rounded max-w-56 h-auto cursor-pointer" 
                                />
                                {!message.isOwn &&
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFile(message.image, `image-${Date.now()}.jpg`);
                                  }}
                                  className="absolute bottom-2 right-2 bg-black bg-opacity-50 p-1 rounded-full text-white hover:bg-opacity-70"
                                  title="Download image"
                                >
                                  <Download className="h-4 w-4" />
                                </button>}
                              </div>
                            )}
                            {message?.video && message.video.match(/\.(mp4|webm|ogg)$/)&& (
                              <video src={message.video} controls className="w-40 rounded" />
                            )}

                            {message.file && !message.file.match(/\.(jpeg|jpg|gif|png)$/) && (
                              <div className="mt-2 bg-gray-700 p-2 w-56 rounded flex items-center justify-between group">
                                <div className="flex items-center flex-1 overflow-hidden">
                                  <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <a target='_blank' className='cursor-pointer' href={message.file}>
                                    <span className="text-xs truncate">{message.file}</span>
                                  </a>
                                </div>
                                <button 
                                  onClick={() => handleDownloadFile(message.file, message.file)}
                                  className="text-white ml-2 flex-shrink-0 p-1 hover:bg-gray-600 rounded"
                                  title="Download file"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${message.isOwn ? 'text-right' : ''} text-gray-400`}>
                            {message?.isOwn &&
                              <span className='mr-1 text-center'>
                                {renderMessageStatus(message?.status, message?.isOwn)}
                              </span>
                            }
                            {message.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messageSendingLoading && (
                  <div className={`flex justify-end items-center py-2`}>
                    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full View Image Modal */}
          {fullViewImage && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setFullViewImage(null)}
            >
              <div className="max-w-4xl max-h-screen p-4 relative">
                <img 
                  src={fullViewImage} 
                  alt="Full view" 
                  className="max-w-full max-h-[90vh] object-contain" 
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(fullViewImage);
                  }}
                  className="absolute bottom-6 right-6 bg-black bg-opacity-60 p-2 rounded-full text-white hover:bg-opacity-80"
                  title="Download image"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Message Input Area */}
          <div className="p-2 sm:p-4 bottom-0 bg-[#1a1e23] border-t border-gray-800">
            {/* File Preview Area - only shown when a file is selected */}
            {filePreview && (
              <div className="mb-2 relative">
                <div className="relative inline-block">
                  {filePreview.type === 'image' && (
                    <img 
                      src={filePreview.url} 
                      alt="Preview" 
                      className="h-24 max-w-full rounded object-cover border border-gray-700" 
                    />
                  )}
                  {filePreview.type === 'video' && (
                    <video 
                      src={filePreview.url} 
                      className="h-24 max-w-full rounded object-cover border border-gray-700" 
                      controls
                    />
                  )}
                  {filePreview.type === 'file' && (
                    <div className="flex items-center p-3 rounded-md border border-gray-700 bg-gray-800 shadow-sm max-w-xs">
                      <div className="flex-shrink-0 text-teal-500">
                        <svg
                          className="w-6 h-6 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h8l6-6V4a2 2 0 00-2-2H4zm9 11v3H4V4h12v7h-3a1 1 0 00-1 1z" />
                        </svg>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-white truncate">
                          {filePreview.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {filePreview.name}
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={removeSelectedFile}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Input Bar */}
            <div className="flex items-center bg-gray-800 rounded-lg p-2 relative">
              <button 
                className="text-gray-400 hover:text-white p-1 sm:p-2"
                onClick={toggleFilePopup}
              >
                <PlusCircle className="h-5 w-5" />
              </button>
              <button className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block">
                <Paperclip className="h-5 w-5" />
              </button>
                           
              {/* File selection popup */}
              {showFilePopup && (
                <div className="absolute bottom-12 left-0 bg-gray-900 rounded-lg shadow-lg p-3 flex flex-col space-y-2 border border-gray-700 w-52 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-white text-sm font-medium">Select file type</h4>
                    <button 
                      onClick={toggleFilePopup}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleFileSelection('image')}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded text-white text-sm"
                  >
                    <Image className="h-5 w-5 text-teal-500" />
                    <span>Upload Image</span>
                  </button>
                  <button 
                    onClick={() => handleFileSelection('file')}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded text-white text-sm"
                  >
                    <File className="h-5 w-5 text-teal-500" />
                    <span>Upload File</span>
                  </button>
                  <button 
                    onClick={() => handleFileSelection('video')}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded text-white text-sm"
                  >
                    <VideoIcon className="h-5 w-5 text-teal-500" />
                    <span>Video</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
                           
              <input
                onChange={(e) => handleInputChange(e)}
                onKeyDown={(e) => handleKeyPress(e)}
                type="text"
                value={message.message}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-0 text-white px-2 text-sm sm:text-base"
              />
              {selectedFile && !filePreview && (
                <div className="bg-gray-700 px-2 py-1 rounded text-xs text-white flex items-center mr-2">
                  <File className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="truncate max-w-20">{selectedFile.name}</span>
                  <button 
                    onClick={removeSelectedFile}
                    className="ml-1 text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <button className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block">
                <Smile className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleSendMessage()} 
                className="bg-teal-500 text-white p-1 sm:p-2 rounded-lg"
                disabled={!message.message && !selectedFile}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#1a1e23]">
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Send className="h-8 w-8 text-teal-500" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-white">Select a group</h3>
            <p className="mt-2 text-gray-400 max-w-sm">
              Choose an existing group or create a new one to start chatting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupMessages;