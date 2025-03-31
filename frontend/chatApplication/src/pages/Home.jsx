import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, MoreVertical, Phone, Video, Send, PlusCircle, Paperclip, 
  Smile, ArrowLeft, Menu, Image, File, X, Clock, Check, 
  UserCircleIcon, CheckCheck, UserCircle
} from 'lucide-react';
import { messageStore } from '../store/message.store.js';
import { authStore } from '../store/userAuth.store.js';

const ChatHomePage = () => {
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const { get_online_user, activeUser, selectUser, getActiveUser, deleteActiveUser, authUser,delete_all_previous_activeUser } = authStore();
  const { 
    contactsLoading, get_all_contacts, contacts, send_message, getAll_messages,update_message_array_to_seen,locallyUpdate_toSeen,
    messages, setSelectedUser, subScribe, selectedUser, unSubScribe,update_message_array_received,locallyUpdateMessage
  } = messageStore();

  const [message, setMessage] = useState({
    receiverId: "",
    message: "",
    status: "",
    file: null,
    image: null
  });
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [showContactsOnMobile, setShowContactsOnMobile] = useState(true);

  useEffect(() => {
    get_all_contacts();
  }, [get_all_contacts]);

// Add this useEffect to handle deletion of previous active users when the page loads


  
  useEffect(() => {
    subScribe();
    return () => {
      unSubScribe();
      if(activeContact){
        deleteActiveUser(activeContact.id);
      }
    }
  }, [selectedUser, unSubScribe, subScribe, activeContact, deleteActiveUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

// updating the message status

useEffect(()=>{
if(authUser){
  update_message_array_received(authUser._id,get_online_user);
}
},[authUser,update_message_array_received])





  // Determine message status for contact
  const getContactMessageStatus = (contact) => {
    // Find messages related to this contact
    const contactMessages = messages.filter(
      msg => msg.sender === contact.userId._id || msg.receiver === contact.userId._id
    );
    
    if (contactMessages.length === 0) return null;
    
    const latestMessage = contactMessages[contactMessages.length - 1];
    
    // Check if the message is unread (not seen by the current user)
    const isUnread = latestMessage.status !== 'seen' && !latestMessage.isOwn;
    
    return {
      latestMessage: latestMessage.text,
      isUnread: isUnread,
      status: latestMessage.status
    };
  };

  const handleContactClick = (contactId) => {
    // Delete previous active user if exists
    if(get_online_user.includes(contactId._id)){
      locallyUpdateMessage(contactId._id)
    }
   
    if (activeContact) {
      deleteActiveUser(authUser._id);
    }
    


    if(get_online_user.includes(authUser._id)){
        update_message_array_to_seen(contactId._id)
    }
  
    // Set new selected user
    setSelectedUser(contactId._id);
    selectUser(contactId._id,authUser._id);
    setActiveContact(contactId);
    setMessage((prev) => ({ ...prev, receiverId: contactId._id }));
    getAll_messages(contactId._id);
    setShowContactsOnMobile(false);
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    // Check if there's a one-way connection from activeContact to authUser
    const fromContactToUser = activeUser?.some(
      item => item.authUserId === activeContact?._id && item.selectedId === authUser?._id
    );
    
    // Check if there's a connection from authUser to activeContact
    const fromUserToContact = activeUser?.some(
      item => item.authUserId === authUser?._id && item.selectedId === activeContact?._id
    );
    
    // If there's only a one-way connection from contact to user
    if (fromContactToUser && fromUserToContact) {
      locallyUpdate_toSeen();
    }
  }, [isMounted, activeUser, activeContact?._id, authUser?._id, locallyUpdate_toSeen]);
console.log(activeUser)

  useEffect(() => {
    deleteActiveUser(activeContact?._id);
    // First delete the current active user
    return()=>            deleteActiveUser(authUser?._id);


}, []);




  useEffect(()=>{
    if(get_online_user.includes(activeContact?._id)){
      locallyUpdateMessage(activeContact?._id)
    }
  },[get_online_user,activeContact])

  const handleBackToContacts = () => {
    setSelectedUser(null);
    setShowContactsOnMobile(true);
    deleteActiveUser(authUser._id)
  };



  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(parseInt(timestamp));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleInputChange = (e) => {
    setMessage((prev) => ({ ...prev, message: e.target.value }));
  };

  const handleSendMessage = () => {
    try {
      const messageToSend = { ...message };
      if (get_online_user.includes(activeContact?._id) && activeUser) {
      const seen_bool = activeUser?.some(
  (item) =>
    (item.authUserId === activeContact?._id && item.selectedId === authUser?._id) &&
    !(item.authUserId === authUser?._id && item.selectedId === activeContact?._id)
);
        if (seen_bool) {
          message["status"] = "seen";
        } else {
          message["status"] = "received";
        }
      }
      else {
        message["status"] = "sent";
      }
      
      const new_format = new FormData();
      new_format.append("message", messageToSend.message);
      new_format.append("receiverId", message.receiverId);
      new_format.append("file", message.file);
      new_format.append("status", message.status);
      new_format.append("image", message.image);
    
      send_message(new_format);
      
      setMessage((prev) => ({
        ...prev,
        message: "",
        status: "",
        file: null,
        image: null
      }));
      
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleFilePopup = () => {
    setShowFilePopup(!showFilePopup);
  };

  const handleFileSelection = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('accept', type === 'image' ? 'image/*' : '*/*');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        setMessage((prev) => ({
          ...prev,
          image: file
        }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setMessage((prev) => ({
          ...prev,
          file: file
        }));
        setFilePreview(null);
      }
    }
    setShowFilePopup(false);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessage((prev) => ({
      ...prev,
      file: null
    }));
  };

  const renderMessageStatus = (status, isOwn) => {
    if (!isOwn) return;
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 ml-1 inline text-gray-400" />;
      case "received":
        return <CheckCheck className="h-3 w-3 ml-1 inline text-gray-400" />;
      case "seen":
        return <CheckCheck className="h-3 w-3 ml-1 inline text-teal-400" />;
      default:
        return <Clock className="h-3 w-3 ml-1 inline text-gray-400" />;
    }
  };

  // Render notification indicator
  const renderNotificationIndicator = (contact) => {
    const messageStatus = getContactMessageStatus(contact);
    
    if (!messageStatus) return null;
    
    if (messageStatus.isUnread) {
      return (
        <span className="bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {contact.unread || 1}
        </span>
      );
    }
    
    return null;
  };

  useEffect(() => {
    getActiveUser()
  }, [getActiveUser]);

  
  if (contactsLoading) {
    return <>Loading...</>;
  }

  return (
    <div className="h-screen bg-[#1a1e23] mt-16 flex flex-col md:flex-row">
      {/* Left Side - Contacts List */}
      <div className={`${showContactsOnMobile ? 'flex' : 'hidden'} md:flex md:w-80 border-r border-gray-800 flex-col h-full md:h-screen`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Messages</h1>
          </div>
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Search contacts..."
            />
          </div>
        </div>
        
        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => {
            const messageStatus = getContactMessageStatus(contact);
            
            return (
              <div 
                key={contact._id}
                className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${activeContact === contact._id ? 'bg-gray-800' : ''}`}
                onClick={() => handleContactClick(contact.userId)}
              >
                <div className="flex items-center">
                  <div className="relative">
                    {contact.save_contact ?
                      <img
                        src={contact.userId.profilePhoto}
                        alt={contact.userId.name}
                        className="w-12 h-12 rounded-full object-cover"
                      /> :
                      <img
                        src="https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    }
                    {get_online_user.includes(contact.userId._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1e23]"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      {contact.save_contact ?
                        <h3 className="text-white font-medium">{contact.name}</h3> :
                        <h3 className="text-white font-medium">{contact.phone}</h3>
                      }
                      {get_online_user.includes(contact.userId._id) ? 
                        <span className="text-xs text-green-500">Online</span> :
                        <span className="text-xs text-gray-400">{formatLastSeen(contact.userId.lastSeen)}</span>
                      }
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-sm truncate max-w-xs ${messageStatus?.isUnread ? 'text-white font-semibold' : 'text-gray-400'}`}>
                        {messageStatus?.latestMessage || contact.userId.status || "Hey there! I'm using ChatApp."}
                      </p>
                      {renderNotificationIndicator(contact)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className={`${!showContactsOnMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
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
                  <>
                    <img
                      src={activeContact && contacts.find(c => c.userId._id === activeContact._id)?.save_contact 
                        ? contacts.find(c => c.userId._id === activeContact._id)?.userId.profilePhoto
                        : "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"}
                      alt={activeContact && contacts.find(c => c.userId._id === activeContact._id)?.userId.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <h3 className="text-white font-medium">{contacts.find(c => c.userId._id === activeContact._id)?.save_contact
                        ? contacts.find(c => c.userId._id === activeContact._id)?.name
                        : contacts.find(c => c.userId._id === activeContact._id)?.phone}</h3>
                      <p className="text-xs text-gray-400">
                        {get_online_user.includes(activeContact._id) ? 'Online' : 'Last seen ' + formatLastSeen(contacts.find(c => c.userId._id === activeContact._id)?.userId.lastSeen)}
                      </p>
                    </div>
                  </> 
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button className="text-gray-400 hover:text-white hidden sm:block">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white hidden sm:block">
                  <Video className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-2 sm:p-4 overflow-y-auto bg-[#1a1e23]">
              <div ref={scrollRef} className="space-y-4">
                {messages?.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-xs md:max-w-md">
                      {!message.isOwn && (
                        <img
                          src={contacts.find(c => c.userId._id === message.sender)?.save_contact 
                            ? contacts.find(c => c.userId._id === message.sender)?.userId.profilePhoto 
                            : "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                        />
                      )}
                      <div>
                        <div className={`${message.isOwn ? 'bg-teal-500 p-3 rounded-l-lg rounded-tr-lg text-white' : 'bg-gray-800 p-3 rounded-r-lg rounded-tl-lg text-white'}`}>
                          <p className="text-sm">{message.text}</p>
                          {message?.image && message.image.match(/\.(jpeg|jpg|gif|png)$/) && (
                            <img 
                              onClick={() => setFullViewImage(message?.image)}
                              src={message.image} 
                              alt="Shared image" 
                              className="mt-2 rounded max-w-56 h-auto" 
                            />
                          )}

                          {fullViewImage && (
                            <div 
                              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                              onClick={() => setFullViewImage(null)}
                            >
                              <div className="max-w-4xl max-h-screen p-4">
                                <img 
                                  src={fullViewImage} 
                                  alt="Full view" 
                                  className="max-w-full max-h-[90vh] object-contain" 
                                />
                              </div>
                            </div>
                          )}

                          {message.file && !message.file.match(/\.(jpeg|jpg|gif|png)$/) && (
                            <div className="mt-2 bg-gray-700 p-2 w-56 rounded flex items-center">
                              <File className="h-4 w-full" />
                              <span className="text-xs truncate">{message.file}</span>
                            </div>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${message.isOwn ? 'text-right' : ''} text-gray-400`}>
                    {message?.isOwn&&
                          <span className='mr-1 text-center'>
                                             {/* {message.status!="seen"&&get_online_user.includes(activeContact._id)&&!activeUser.includes(authUser?._id)? <CheckCheck className="h-3 w-3 ml-1 inline text-gray-400" />:<>
                             {activeUser.includes(authUser?._id)?<CheckCheck className="h-3 w-3 ml-1 inline text-teal-400" />: */
                             renderMessageStatus(message?.status, message?.isOwn)
 }
                          </span>
                }
                          {message.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Message Input Area */}
            <div className="p-2 sm:p-4 border-t border-gray-800">
              {/* File Preview Area - only shown when a file is selected */}
              {filePreview && (
                <div className="mb-2 relative">
                  <div className="relative inline-block">
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="h-24 max-w-full rounded object-cover border border-gray-700" 
                    />
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
                  onClick={() => handleSendMessage(activeContact)} 
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
              <h3 className="mt-4 text-xl font-medium text-white">Select a conversation</h3>
              <p className="mt-2 text-gray-400 max-w-sm">
                Choose from your existing conversations or start a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHomePage;