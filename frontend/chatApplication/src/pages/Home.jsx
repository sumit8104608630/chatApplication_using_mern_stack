import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { 
  Search, MoreVertical, Phone, Video, Send, PlusCircle, Paperclip, 
  Smile, ArrowLeft, Menu, Image, File, X, Clock, Check, 
  Trash2, CheckCheck, Forward, Download,VideoIcon
} from 'lucide-react';
import { messageStore } from '../store/message.store.js';
import { authStore } from '../store/userAuth.store.js';
import { groupStore } from '../store/group.store';
import GroupMessages from './GroupMessages.jsx';
import { groupMessageStore } from '../store/groupMessage.store.js';
import { debounce } from '../utils/debounce.js';
import { Loader } from 'lucide-react';
import VoiceCall from '../components/VoiceCall.jsx';
import CallerInterface from '../components/Calling.jsx';
import { usePeer } from '../components/Peer.jsx';
import DropDownMenu from '../components/DropDownMenu.jsx';
import ChatContainer from '../components/ChatContainer.jsx';

const ChatHomePage = () => {
  const{get_all_groupMessage,setSelectedGroup,groupSubScribe,selectedGroup,unGroupSubScribe}=groupMessageStore();
      const {filterGroupLoading,groups,filterGroupArray,filter_groups}=groupStore()
    const navigate=useNavigate()
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const { get_online_user, activeUser, selectUser,socket, getActiveUser, deleteActiveUser, authUser,delete_authUserMatchId } = authStore();
  const { 
     get_all_contacts, contacts, send_message, getAll_messages,update_message_array_to_seen,locallyUpdate_toSeen,clear_notification,filter_contacts,filterArray,filterLoading,
    messages, setSelectedUser, subScribe, selectedUser, unSubScribe,messageLoading,locallyUpdateMessage,messageSendingLoading,get_Notify,notify,notifyMessage,getNewContact,unSubScrContact
  } = messageStore();
  const [activeTab, setActiveTab] = useState('contacts');
  const [activeGroup, setActiveGroup] = useState(null);
  const [searchInputValue,setValue]=useState({
    inputValue:"",
  })
  const [ShowMenu,setShowMenu]=useState(null)
  const [incomingCall,setIncoming]=useState(false)
  const { peer, createOffer, create_answer, setRemoteAnswer, sendStream, setActiveCallTarget, remoteStream } = usePeer();
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
  const [calling,setCalling]=useState(null)
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


useEffect(()=>{
  socket.emit("join-groups",groups?.map(group=>group._id).join(",")
);

},[groups,socket])


  useEffect(() => {
    get_Notify()
  },[get_Notify])

useEffect(()=>{
  notifyMessage();
return ()=>{
  socket.off("newNotification")
}
},[notifyMessage,socket,selectedUser ,activeContact ])

  useEffect(() => {
    subScribe();
    return () => {
      unSubScribe();
      if(activeContact){
        deleteActiveUser(activeContact.id);
      }
    }
  }, [selectedUser, unSubScribe, subScribe, activeContact, deleteActiveUser]);


  useEffect(()=>{
    getNewContact();

    return ()=>{
      unSubScrContact()
    }
  },[getNewContact,unSubScrContact,socket])
  useEffect(() => {
    
    if (selectedGroup) {
      groupSubScribe();
    }
    
    // Clean up when component unmounts or selectedGroup changes
    return () => {
      unGroupSubScribe();
    };
  }, [selectedGroup,groupSubScribe,unGroupSubScribe]); // Only depend on selectedGroup
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
      msg => msg.sender === contact.userId?._id || msg.receiver === contact.userId?._id
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
  setSelectedGroup(groupInfo._id)
  get_all_groupMessage(groupInfo._id)
  setActiveContact(null)
  setShowContactsOnMobile(false);

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
      console.log(activeContact)
      deleteActiveUser({
        authUserId: authUser._id,
        selectedId: activeContact._id
      });    
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

  //console.log(activeUser)

  useEffect(() => {
    delete_authUserMatchId(authUser._id);    // First delete the current active user
    return()=>       {
      deleteActiveUser({
        authUserId: authUser._id,
        selectedId: activeContact?._id
      });

        }
  }, [activeContact?._id,deleteActiveUser,authUser?._id,delete_authUserMatchId]);
  useEffect(()=>{
return()=>{
  socket.off("newNotification")

}
  },[socket])

  useEffect(()=>{
    if(get_online_user.includes(activeContact?._id)){
      locallyUpdateMessage(activeContact?._id)
    }
  },[get_online_user,activeContact])

  const handleBackToContacts = () => {
    deleteActiveUser({
      authUserId: authUser._id,
      selectedId: activeContact?._id
    });
    setActiveContact(null)
    setSelectedUser(null);
    setSelectedGroup(null);
    setActiveGroup(null)
    setShowContactsOnMobile(true);
   
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
   let notification= notify?.find(item=>item?.senderId==contact.userId?._id)
    if(!notification?.unseenCount==0){
   return <span className="bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {notification?.unseenCount }
        </span>
    }
  };

  const handleSearch=(e)=>{

    const searchValue=e.target.value;
    setValue({inputValue:searchValue})
  }

  const debouncedUserFilter=useMemo(()=>debounce((inputValue)=>{activeTab==="contacts"?filter_contacts(inputValue,activeTab):filter_groups(inputValue,activeTab)},500),[filter_contacts,activeTab])
  useEffect(()=>{
    debouncedUserFilter(searchInputValue.inputValue)
  },[debouncedUserFilter,searchInputValue])
  

  useEffect(() => {
    getActiveUser()
  }, [getActiveUser]);

 

  const [myStream, setMyStream] = useState(null);

    const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMyStream(stream);
    } catch (error) {
      console.error("Error getting user media:", error);
    }
  }, []);
  
  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);
  
  // Make a call to another user
  const handleCall = useCallback(async (to, from) => {
    if (!calling) {
      try {
        // Set active call target for ICE candidates
        setActiveCallTarget(to._id);
        
        // Get media first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setMyStream(stream);
        
        // Pass stream to createOffer
        const offer = await createOffer(stream);
        
        socket.emit("call-user", {
          to: to._id,
          from: from,
          offer
        });
        
        to.from = from._id;
        setCalling(to);
      } catch (error) {
        console.error("Error making call:", error);
      }
    }
  }, [calling, createOffer, socket, setActiveCallTarget]);
  
  // Handle incoming calls
  const [callOn,setOn]=useState(false)

  useEffect(() => {
    socket.on("incoming-call", ({ from, to, offer }) => {
      if (to === authUser._id) {
        console.log("Incoming call received", offer);
        from.offer = offer;
        setIncoming(from);
      }
    });
    socket.on("call-accepted", async ({ answer }) => {
      console.log("Call accepted, connecting...", answer);
      await setRemoteAnswer(answer);
      
      // Send our stream to the other person
      if (myStream) {
        await sendStream(myStream);
        setOn(true)
      }
    });
    
    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
    };
  }, [socket, authUser, setRemoteAnswer, myStream, sendStream]);
  
  // Handle ended calls
  useEffect(() => {
    socket.on("endCall", ({ to }) => {
      if (to === authUser?._id) {
        setIncoming(null);
        setCalling(null);
        console.log("Call ended");
      }
    });
    
    socket.on("decline", ({ to }) => {
      if (to === authUser._id) {
        console.log("Call declined");
        setCalling(null);
      }
    });
    
    return () => {
      socket.off("endCall");
      socket.off("decline");
    };
  }, [socket, authUser]);
  
  // Handle accepting an incoming call
  
// When accepting a call:
const acceptIncomingCall = async () => {
  try {
    // Set active call target for ICE candidates
    setActiveCallTarget(incomingCall._id);
    
    // Get media first if not already obtained
    if (!myStream) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMyStream(stream);
    }
    
    // Pass stream to create_answer
    const answer = await create_answer(incomingCall.offer, myStream);
    
    socket.emit("accept-call", {
      from: authUser._id,
      to: incomingCall._id,
      answer
    });
  } catch (error) {
    console.error("Error accepting call:", error);
  }
};
  
  // Reject an incoming call
  const rejectCall = () => {
    socket.emit("decline", {
      to: incomingCall._id,
    });
    setIncoming(null);
    setOn(false)
  };
  
  // End an active call
  const endCall = () => {
    socket.emit("endCall", {
      to: calling._id,
      from: calling.from || authUser._id
    });
    setCalling(null);
    setOn(false)
  };








// In your main component where socket events are handled
useEffect(() => {
  // Existing socket event handlers...
  
  // Add ICE candidate handling
  socket.on("ice-candidate", async ({ candidate }) => {
    try {
      if (candidate) {
        await peer?.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added ICE candidate");
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  });
  
  return () => {
    // Existing socket event cleanup...
    socket.off("ice-candidate");
  };
}, [socket, peer]);


useEffect(() => {
  if (myStream) {
    console.log("Local stream tracks:", myStream.getTracks().map(t => ({
      kind: t.kind,
      enabled: t.enabled,
      readyState: t.readyState
    })));
  }
  
  if (remoteStream) {
    console.log("Remote stream tracks:", remoteStream.getTracks().map(t => ({
      kind: t.kind,
      enabled: t.enabled,
      readyState: t.readyState
    })));
  }
}, [myStream, remoteStream]);


// Add this to your component where you handle socket events
useEffect(() => {
  socket.on("ice-candidate", async ({ candidate }) => {
    try {
      if (candidate && peer?.remoteDescription) {
        await peer?.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added ICE candidate");
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  });
  
  return () => {
    socket.off("ice-candidate");
  };
}, [socket, peer]);





const [activeMenuId, setActiveMenuId] = useState(null);


const handleDeleteMessage = (messageId) => {
  setActiveMenuId(null);
  console.log("Message deleted:", messageId);
};

const handleForwardMessage = (message) => {
  console.log("Forward message:", message);
  setActiveMenuId(null);
  // Implementation for forwarding would go here
};

const toggleMenu = (messageId) => {
  if (activeMenuId === messageId) {
    setActiveMenuId(null);
  } else {
    setActiveMenuId(messageId);
  }
};


// const handleOutsideClick = () => {
//   if (activeMenuId !== null) {
//     setActiveMenuId(null);
//   }
// };


  return (
    <div  className="h-screen bg-[#1a1e23]  flex flex-col md:flex-row">
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
        onChange={(e)=>handleSearch(e)}
        value={searchInputValue.inputValue}
        type="text"
        className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        placeholder={activeTab === 'contacts' ? "Search contacts..." : "Search groups..."}
      />
    </div>
  </div>

  {/* Contacts List */}
  {activeTab === 'contacts' && (
    <div className="flex-1 overflow-y-auto">
      {filterLoading&& searchInputValue.inputValue!="" ? (
        // Loading state for contacts with Lucide icon
        <div className="flex flex-col items-center justify-center h-40 space-y-2">
          <Loader className="w-8 h-8 text-white animate-spin" />
          <p className="text-gray-400 text-sm">Loading contacts...</p>
        </div>
      ) : filterArray?.length === 0 && searchInputValue.inputValue!=""? (
        // Empty state when no contacts match search
        <div className="flex flex-col items-center justify-center h-40 text-center px-4">
          <Search className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-400">No contacts found</p>
          <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        // Contacts list
        (searchInputValue.inputValue !== "" ? filterArray : contacts).map((contact) => {
          const messageStatus = getContactMessageStatus(contact);
          
          return (
            <div 
              key={contact._id}
              className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${activeContact === contact._id ? 'bg-gray-800' : ''}`}
              onClick={() => handleContactClick(contact?.userId)}
            >
              <div className="flex items-center">
                <div className="relative">
                  {contact.save_contact ?
                    <img
                      src={contact?.userId?.profilePhoto}
                      alt={contact?.userId?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    /> :
                    <img
                      src="https://res.cloudinary.com/dcsmp3yjk/image/upload/v1742818111/chat_app/profilePhoto/kague1cmxe96oy0srft9.png"
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  }
                  {get_online_user.includes(contact?.userId?._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1e23]"></div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    {contact?.save_contact ?
                      <h3 className="text-white font-medium">{contact.name}</h3> :
                      <h3 className="text-white font-medium">{contact.phone}</h3>
                    }
                    {get_online_user.includes(contact?.userId?._id) ? 
                      <span className="text-xs text-green-500">Online</span> :
                      <span className="text-xs text-gray-400">{formatLastSeen(contact?.userId?.lastSeen)}</span>
                    }
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-sm truncate max-w-xs ${messageStatus?.isUnread ? 'text-white font-semibold' : 'text-gray-400'}`}>
                      {messageStatus?.latestMessage || contact?.userId?.status || "Hey there! I'm using ChatApp."}
                    </p>
                    {renderNotificationIndicator(contact)}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  )}
  
  {/* Groups List */}
  {activeTab === 'groups' && (
    <div className="flex-1 overflow-y-auto">
      {filterGroupLoading &&searchInputValue.inputValue !== "" ? (
        // Loading state for groups with Lucide icon
        <div className="flex flex-col items-center justify-center h-40 space-y-2">
          <Loader className="w-8 h-8 text-white animate-spin" />
          <p className="text-gray-400 text-sm">Loading groups...</p>
        </div>
      ) : filterGroupArray?.length === 0 && searchInputValue.inputValue!=""? (
        // Empty state when no groups
        <div className="flex flex-col items-center justify-center h-40 text-center px-4">
          <Users className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-400">No groups found</p>
          <p className="text-gray-500 text-sm mt-1">Create a new group to get started</p>
        </div>
      ) : (
        // Groups list
        (searchInputValue.inputValue !== "" ?filterGroupArray:groups).map((group) => {
          return (
            <div 
              key={group._id}
              className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${activeGroup === group._id ? 'bg-gray-800' : ''}`}
              onClick={() => handleGroupClick(group)}
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
                    <p className="text-sm truncate max-w-xs text-gray-500">
                      {group.description || "Hey there! I'm using ChatApp."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      
      {/* Create new group button */}
      <div className="p-4 flex justify-center">
        <button 
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-4 py-2 text-sm font-medium flex items-center"
          onClick={() => navigate("/createGroup")}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Group
        </button>
      </div>
    </div>
  )}
</div>

<>
{activeGroup&&<div className={`${!showContactsOnMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
  <GroupMessages setActiveTab={setActiveTab} activeGroup={activeGroup} handleDownloadFile={handleDownloadFile} handleBackToGroups={handleBackToContacts} handleContactClick={handleContactClick} setActiveGroup={setActiveGroup}/>
</div>}
</>

{incomingCall && (
        <VoiceCall 
        acceptIncomingCall={acceptIncomingCall}
          incomingCall={incomingCall}
          rejectCall={rejectCall}
          createOffer={create_answer} // Use create_answer from PeerContext
        />
      )}
{calling && (
        <CallerInterface 
        callOn={callOn}
          callData={calling}
          endCall={endCall}
          localStream={myStream}
        />
      )}


      {/* Right Side - Chat Area */}
      {!activeGroup&&
         <ChatContainer
         showContactsOnMobile={showContactsOnMobile}
         activeContact={activeContact}
         contacts={contacts}
         handleBackToContacts={handleBackToContacts}
         get_online_user={get_online_user}
         formatLastSeen={formatLastSeen}
         handleCall={handleCall}
         authUser={authUser}
         messageLoading={messageLoading}
         scrollRef={scrollRef}
         messages={messages}
         ShowMenu={ShowMenu}
         setShowMenu={setShowMenu}
         activeMenuId={activeMenuId}
         toggleMenu={toggleMenu}
         setActiveMenuId={setActiveMenuId}
         handleForwardMessage={handleForwardMessage}
         handleDeleteMessage={handleDeleteMessage}
         renderMessageStatus={renderMessageStatus}
         activeUser={activeUser}
         messageSendingLoading={messageSendingLoading}
         filePreview={filePreview}
         removeSelectedFile={removeSelectedFile}
         showFilePopup={showFilePopup}
         toggleFilePopup={toggleFilePopup}
         handleFileSelection={handleFileSelection}
         fileInputRef={fileInputRef}
         handleFileChange={handleFileChange}
         handleInputChange={handleInputChange}
         message={message}
         selectedFile={selectedFile}
         handleSendMessage={handleSendMessage}
         fullViewImage={fullViewImage}
         setFullViewImage={setFullViewImage}
         handleDownloadFile={handleDownloadFile}
       />
      }
    </div>
  );
};

export default ChatHomePage;
