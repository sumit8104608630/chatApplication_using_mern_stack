import React, { useEffect, useState, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { 
  Search, MoreVertical, Phone, Video, Send, PlusCircle, Paperclip, 
  Smile, ArrowLeft, Menu, Image, File, X, Clock, Check, 
  UserCircleIcon, CheckCheck, UserCircle, Download,VideoIcon
} from 'lucide-react';
import { messageStore } from '../store/message.store.js';
import { authStore } from '../store/userAuth.store.js';
import { groupStore } from '../store/group.store';
import GroupMessages from './GroupMessages.jsx';


const ChatHomePage = () => {
      const {createGroup,isCreatingGroup,get_all_group,groups}=groupStore()
    const navigate=useNavigate()
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const { get_online_user, activeUser, selectUser,socket, getActiveUser, deleteActiveUser, authUser } = authStore();
  const { 
    contactsLoading, get_all_contacts, contacts, send_message, getAll_messages,update_message_array_to_seen,locallyUpdate_toSeen,clear_notification,
    messages, setSelectedUser, subScribe, selectedUser, unSubScribe,messageLoading,locallyUpdateMessage,messageSendingLoading,get_Notify,notify,notifyMessage
  } = messageStore();
  const [activeTab, setActiveTab] = useState('contacts');
  const [activeGroup, setActiveGroup] = useState(null);


  const [message, setMessage] = useState({
    receiverId: "",
    message: "",
    status: "",
    file: null,
    image: null,
    video: null,
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

  useEffect(() => {
    if(activeTab==="contacts"){
      setActiveGroup(null)
    }
    else if(activeTab==="groups"){
      setActiveContact(null)
    }
  },[activeTab])

  useEffect(() => {
    get_all_group()
  },[get_all_group])

  useEffect(() => {
    get_Notify()
  },[get_Notify])

useEffect(()=>{
  notifyMessage();
return ()=>{
  socket.off("newNotification")
}
},[notifyMessage,socket,selectedUser  ])

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
      // Small timeout to ensure content is rendered
      setTimeout(() => {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages]);

  // Handle file downloading
  const handleDownloadFile = async (fileUrl) => {
    try {
      // Show loading indicator or feedback to user
      console.log("Starting download...");
      
      // Fetch with appropriate options to bypass cache and handle CORS
      const response = await fetch(fileUrl, {
        method: 'GET',
        mode: 'cors', // Try with 'no-cors' if this fails
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        redirect: 'follow',
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
  
      // Create blob from response
      const blob = await response.blob();
      
      // Get filename from URL or Content-Disposition header if available
      let fileName = fileUrl.split('/').pop() || 'download';
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      
      // Create object URL
      const objectUrl = URL.createObjectURL(blob);
      
      // Create download link and trigger
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(objectUrl);
      document.body.removeChild(link);
      
      console.log("Download complete!");
    } catch (error) {
      console.error("Download failed:", error);
    }
  };
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
const handleGroupClick=(groupInfo)=>{
  console.log(groupInfo)
  setActiveContact(null)
  setActiveGroup(groupInfo)
}
  const handleContactClick = (contactId) => {
    setActiveGroup(null)
    // Delete previous active user if exists
    if(get_online_user.includes(contactId._id)){
      locallyUpdateMessage(contactId._id)
    }
    clear_notification(contactId._id)
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
    socket.off("newNotification")
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
    //socket.off("newNotification")
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
        //  clear_notification(activeContact?._id)

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
      new_format.append("video",message.video)
    
    send_message(new_format);

      setMessage((prev) => ({
        ...prev,
        message: "",
        status: "",
        file: null,
        image: null,
        video:null
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
          setFilePreview({
            type: 'image',
            url: reader.result
          });
        };
        reader.readAsDataURL(file);
      }
      else if(file.type.startsWith('video/')){
        setMessage((prev) => ({
          ...prev,
          video: file
        }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview({
            type: 'video',
            url: reader.result
          });        };
        reader.readAsDataURL(file);
      }
       else {
        setMessage((prev) => ({
          ...prev,
          file: file
        }));

  const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview({
            type: 'file',
            url: reader.result
          });        };
        reader.readAsDataURL(file);      }
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
    //console.log(contact)
    // const messageStatus = getContactMessageStatus(contact);
    // if (!messageStatus) return null;
   let notification= notify?.find(item=>item?.senderId==contact.userId._id)
    if(!notification?.unseenCount==0){
   return <span className="bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {notification?.unseenCount }
        </span>
    }
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
    
    {/* Tabs for switching between Contacts and Groups */}
    <div className="mt-3 flex bg-gray-800 rounded-md p-1">
      <button
        className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
          activeTab === 'contacts' 
            ? 'bg-gray-700 text-white' 
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => setActiveTab('contacts')}
      >
        Contacts
      </button>
      <button
        className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
          activeTab === 'groups' 
            ? 'bg-gray-700 text-white' 
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => setActiveTab('groups')}
      >
        Groups
      </button>
    </div>
    
    <div className="mt-4 relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-500" />
      </div>
      <input
        type="text"
        className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        placeholder={activeTab === 'contacts' ? "Search contacts..." : "Search groups..."}
      />
    </div>
  </div>
  
  {/* Contacts List */}
  {activeTab === 'contacts' && (
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
  )}
  
  {/* Groups List */}
  {activeTab === 'groups' && (
    <div className="flex-1 overflow-y-auto">
      {groups?.map((group) => {
        
        return (
          <div 
            key={group._id}
            className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${activeGroup === group._id ? 'bg-gray-800' : ''}`}
            onClick={()  => handleGroupClick(group)}
          >
           <div className="flex items-center">
  <div className="relative">
    {group.groupImage ? (
      <img
        src={group.groupImage}
        alt={group.name}
        className="w-12 h-12 rounded-full object-cover"
      />
    ) : (
      <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
        {group.name.substring(0, 2).toUpperCase()}
      </div>
    )}
  </div>
  <div className="ml-3 flex-1">
    <div className="flex justify-between items-center">
      <h3 className="text-white font-medium">{group.name}</h3>

    </div>
    <div className="flex justify-between items-center mt-1">
                  <p className={`text-sm truncate max-w-xs text-gray-500`}>
                    { group.description || "Hey there! I'm using ChatApp."}
                  </p>
                </div>
    
  </div>
</div>
          </div>
        );
      })}
      
      {/* Create new group button */}
      <div className="p-4 flex justify-center">
        <button 
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-4 py-2 text-sm font-medium flex items-center"
          onClick={()=>navigate("/createGroup")}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Group
        </button>
      </div>
    </div>
  )}
</div>


{activeGroup&&<>
  <GroupMessages setActiveTab={setActiveTab} activeGroup={activeGroup} handleContactClick={handleContactClick} setActiveGroup={setActiveGroup}/>
</>}



      {/* Right Side - Chat Area */}
      {!activeGroup&&<div className={`${!showContactsOnMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
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
            {messageLoading ? (
  Array.from({ length: 6 }).map((_, idx) => (
    <div
      key={idx}
      className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse flex-1 p-2 sm:p-4 overflow-y-auto  bg-[#1a1e23]`}
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
) :(
            <div 
            ref={scrollRef}
            style={{
              scrollbarWidth: "none",      // Firefox
              msOverflowStyle: "none",     // IE and Edge
              overflowY: "auto",
            }} className="flex-1 p-2 sm:p-4 overflow-y-auto  bg-[#1a1e23]">
              <div  className="space-y-4">
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
                          {
                            message?.video && message.video.match(/\.(mp4|webm|ogg)$/)&& (
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
                               <a target='_blank' className='cursor-pointer' href={message.file}><span className="text-xs truncate">{message.file}</span></a>
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
                ))}
                            {activeUser?.some(
        (item) =>
          (item.authUserId === activeContact?._id && item.selectedId === authUser?._id) &&
          !(item.authUserId === authUser?._id && item.selectedId === activeContact?._id)
      )&&messageSendingLoading && (
    <div className={`flex justify-end  items-center py-2`}>
      <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
      </div>
    </div>
  )}
              </div>
            </div>
     )
}
            {/* Message Input Area */}
            <div className="p-2 sm:p-4  bottom-0 bg-[#1a1e23] border-t border-gray-800">
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
        ) : (<>
          
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
      }
    </div>
  );
};

export default ChatHomePage;