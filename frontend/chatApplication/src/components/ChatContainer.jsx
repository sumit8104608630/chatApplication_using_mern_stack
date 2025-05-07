import React, { useState ,useRef, useEffect} from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Download, 
  File, 
  Trash2,
  PlusCircle, 
  UserMinus,
  UserPlus,
  Paperclip, 
  Image as ImageIcon, 
  VideoIcon, 
  X, 
  Smile, 
  Send 
} from 'lucide-react';
import DropDownMenu from './DropDownMenu';
import ViewProfile from '../pages/ViewProfilePage';

const ChatContainer = ({
  showContactsOnMobile,
  activeContact,
  contacts,
  handleBackToContacts,
  get_online_user,
  formatLastSeen,
  handleCall,
  authUser,
  messageLoading,
  scrollRef,
  messages,
  ShowMenu,
  setShowMenu,
  activeMenuId,
  toggleMenu,
  setActiveMenuId,
  handleForwardMessage,
  handleDeleteMessage,
  renderMessageStatus,
  activeUser,
  messageSendingLoading,
  filePreview,
  removeSelectedFile,
  showFilePopup,
  toggleFilePopup,
  handleFileSelection,
  fileInputRef,
  handleFileChange,
  handleInputChange,
  message,
  selectedFile,
  handleSendMessage,
  fullViewImage,
  setFullViewImage,
  handleDownloadFile,
  setShowFilePopup
}) => {



const [showEmojiPicker,setShowEmojiPicker]=useState(false)
const emojiPickerRef = useRef(null);
const [toggleViewProfile,setToggle]=useState(false)
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef(null);


// Common emojis for a simple picker
const commonEmojis = [
  '😊', '😂', '🥰', '😍', '😎', '😢', '😡', '👍', 
  '👏', '🙏', '🔥', '❤️', '💯', '✅', '⭐', '🎉',
  '🤔', '😜', '🤣', '😇', '😴', '🤗', '🤨', '🤓',
  '💪', '👀', '🙄', '😘', '😋', '🤩', '😭', '🤷‍♂️',
];



useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);



// Get contact information
const currentContact = contacts.find(c => c.userId._id === activeContact?._id);
const isSaved = currentContact?.save_contact;
const contactName = isSaved 
  ? currentContact?.name 
  : currentContact?.phone;

if (!activeContact || !currentContact) return null;





const toggleDropdown = () => {
  setIsOpen(!isOpen);
};

    const handleEmoji = () => {
        setShowEmojiPicker(!showEmojiPicker);
        // Close file popup if open
        if (showFilePopup) setShowFilePopup(false);
      };


      const insertEmoji = (emoji) => {
        console.log(emoji)
        // Insert emoji at cursor position or at end
        
        let newMessage=message.message+emoji
        handleInputChange({ target: { value: newMessage } });
    };


const handleViewProfile=(activeContact)=>{
  console.log(activeContact)
  setToggle(true)
}



  return (
    <div className={`${!showContactsOnMobile ? 'flex' : 'hidden'} md:flex flex-1  flex-col h-full`}>
      {activeContact ? (
        <>
        
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
              {!showContactsOnMobile && (
                <button 
                  className="mr-2 text-gray-400 md:hidden"
                  onClick={handleBackToContacts}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {contacts.find(c => c.userId._id === activeContact._id) && (
                <button onClick={()=>handleViewProfile(activeContact)} className='cursor-pointer flex justify-center items-center'>
                  <img
                    src={activeContact && contacts.find(c => c.userId._id === activeContact._id)?.save_contact 
                      ? contacts.find(c => c.userId._id === activeContact._id)?.userId.profilePhoto
                      : "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"}
                    alt={activeContact && contacts.find(c => c.userId._id === activeContact._id)?.userId.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div className="ml-3 text-start">
                    <h3 className="text-white font-medium">{contacts.find(c => c.userId._id === activeContact._id)?.save_contact
                      ? contacts.find(c => c.userId._id === activeContact._id)?.name
                      : contacts.find(c => c.userId._id === activeContact._id)?.phone}</h3>
                    <p className="text-xs text-gray-400">
                      {get_online_user.includes(activeContact._id) ? 'Online' : 'Last seen ' + formatLastSeen(contacts.find(c => c.userId._id === activeContact._id)?.userId.lastSeen)}
                    </p>
                  </div>
                </button> 
              )}
            </div>
           { toggleViewProfile &&
            <div>
              <ViewProfile isSaved={isSaved} contact={activeContact} toggleViewProfile={toggleViewProfile} setToggle={setToggle} />
            </div>
            }
            <div className="flex items-center space-x-3">
              <button onClick={()=>handleCall(activeContact,authUser)} className="text-gray-400 hover:text-white hidden sm:block">
                <Phone className="h-5 w-5" />
              </button>
              <button className="text-gray-400 hover:text-white hidden sm:block">
                <Video onClick={()=>{}} className="h-5 w-5" />
              </button>
              <div>
              <button onClick={toggleDropdown}  className="text-gray-400 cursor-pointer hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>

              {isOpen && (
        <div className="absolute right-5 top-30  w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
          <ul className="divide-y divide-gray-700">
         
            
            <li>
                <button 
                  onClick={() => {
                    // blockContact(activeContact._id);
                    setIsOpen(false);
                  }}
                  className="flex items-center cursor-pointer w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <UserMinus className="h-4 w-4 mr-3" />
                  Remove Contact
                </button>
                </li>
            <li>
              <button 
                onClick={() => {
                  // deleteChat(activeContact._id);
                  setIsOpen(false);
                }}
                className="flex items-center cursor-pointer w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Delete Chat
              </button>
            </li>
          </ul>
        </div>
        
      )}
      </div>
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
                  {/* Avatar (only on left side) */}
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
                scrollbarWidth: "none",      // Firefox
                msOverflowStyle: "none",     // IE and Edge
                overflowY: "auto",
              }} className="flex-1 p-2 sm:p-4 overflow-y-auto bg-[#1a1e23]">
              <div className="space-y-4">
                {messages?.map((message) => (
                  <div key={message.id}>
                    {!message?.deletedFor?.includes(authUser._id) && (
                      <div 
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div>
                          {ShowMenu && ShowMenu === message.id && (
                            <div className='flex justify-end items-end'>
                              {message.isOwn && (
                                <button 
                                  onMouseOver={() => setShowMenu(message.id)} 
                                  onMouseLeave={() => setShowMenu(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu(message.id);
                                  }} 
                                  className="text-white flex hover:bg-opacity-50 p-2"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              )}
                            </div>
                          )}
                          {activeMenuId === message.id && message.isOwn && (
                            <DropDownMenu 
                              message={message} 
                              showMenu={ShowMenu}
                              setShowMenu={setShowMenu}
                              setActiveMenuId={setActiveMenuId}
                              handleForwardMessage={handleForwardMessage}
                              handleDeleteMessage={handleDeleteMessage}
                              activeContactId={activeContact._id}
                            />
                          )}
                        </div>

                        <div className="flex max-w-xs md:max-w-md relative group">
                          {!message.isOwn && (
                            <img
                              src={contacts.find(c => c.userId._id === message.sender)?.save_contact 
                                ? contacts.find(c => c.userId._id === message.sender)?.userId.profilePhoto 
                                : "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"}
                              alt="avatar"
                              className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                            />
                          )}
                          <div className="relative">
                            <div 
                              onMouseOver={() => setShowMenu(message.id)} 
                              onMouseLeave={() => setShowMenu(null)}
                              className={`${message.isOwn ? 'bg-teal-500 p-3 rounded-l-lg rounded-tr-lg text-white' : 'bg-gray-800 p-3 rounded-r-lg rounded-tl-lg text-white'} relative`}
                            >
                              <div className="flex justify-between">
                                <p className="text-sm">{message.text}</p>
                                
                                {/* Hover action button - Only visible on hover */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {/* Dropdown menu - Only visible when clicked */}
                                </div>
                              </div>
                              
                              {message?.image && message.image.match(/\.(jpeg|jpg|gif|png)$/) && (
                                <div className="relative mt-2">
                                  <img 
                                    onClick={() => setFullViewImage(message?.image)}
                                    src={message.image} 
                                    alt="Shared image" 
                                    className="rounded max-w-56 h-auto cursor-pointer" 
                                  />
                                  {!message.isOwn && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFile(message.image, `image-${Date.now()}.jpg`);
                                      }}
                                      className="absolute bottom-2 right-2 bg-black bg-opacity-50 p-1 rounded-full text-white hover:bg-opacity-70"
                                      title="Download image"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                              {
                                message?.video && message.video.match(/\.(mp4|webm|ogg)$/) && (
                                  <video src={message.video} controls className="w-40 rounded" />
                                )
                              }

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
                        
                        {!message.isOwn && (
                          <div>
                            {ShowMenu && ShowMenu === message.id && !message.isOwn && (
                              <div className={`flex justify-start items-end`}>
                                {!message.isOwn && (
                                  <button 
                                    onMouseOver={() => setShowMenu(message.id)} 
                                    onMouseLeave={() => setShowMenu(null)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMenu(message.id);
                                    }} 
                                    className="text-white flex hover:bg-opacity-50 p-2"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                            {activeMenuId === message.id && (
                              <DropDownMenu 
                                message={message} 
                                showMenu={ShowMenu}
                                setShowMenu={setShowMenu}
                                setActiveMenuId={setActiveMenuId}
                                handleForwardMessage={handleForwardMessage}
                                handleDeleteMessage={handleDeleteMessage}
                                activeContactId={activeContact._id}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {activeUser?.some(
                  (item) =>
                    (item.authUserId === activeContact?._id && item.selectedId === authUser?._id) &&
                    !(item.authUserId === authUser?._id && item.selectedId === activeContact?._id)
                ) && messageSendingLoading && (
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
                    <div className="flex items-center p-3 rounded-md border border-gray-300 bg-gray-50 shadow-sm max-w-xs">
                      <div className="flex-shrink-0 text-red-500">
                        {/* PDF/File Icon */}
                        <svg
                          className="w-6 h-6 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h8l6-6V4a2 2 0 00-2-2H4zm9 11v3H4V4h12v7h-3a1 1 0 00-1 1z" />
                        </svg>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {filePreview.name}
                        </span>
                        {/* Optional: file type label */}
                        <span className="text-xs text-gray-500">
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
                    <ImageIcon className="h-5 w-5 text-teal-500" />
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && (message.message || selectedFile)) {
                        e.preventDefault();
                        handleSendMessage(activeContact);
                      }
                    }}
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
              
              <input
                onChange={(e) => handleInputChange(e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (message.message || selectedFile)) {
                    e.preventDefault();
                    handleSendMessage(activeContact);
                  }
                }} 
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
             <div>

             {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className="absolute bottom-12 right-0 sm:right-12 bg-gray-900 rounded-lg shadow-lg p-3 border border-gray-700 z-10"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-white text-sm font-medium">Choose an emoji</h4>
            <button 
              onClick={handleEmoji}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1 w-64">
            {commonEmojis.map((emoji, index) => (
              <button 
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="text-xl hover:bg-gray-800 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}


             <button onClick={handleEmoji} className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block">
                <Smile className="h-5 w-5" />
              </button>
             </div>
              <button 
                onClick={() =>{ handleSendMessage(activeContact)
                    setShowEmojiPicker(false)
                }} 
                className="bg-teal-500 text-white p-1 sm:p-2 rounded-lg"
                disabled={!message.message && !selectedFile}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center bg-[#1a1e23]">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Send className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-white">Select a conversation</h3>
              <p className="mt-2 text-gray-400 max-w-sm">
                Choose from your existing conversations or start a new one.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatContainer;