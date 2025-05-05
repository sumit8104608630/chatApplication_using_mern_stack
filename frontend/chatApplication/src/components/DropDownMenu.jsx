import { useState, useRef, useEffect } from 'react';
import { Forward, Trash2, UserX, Users, Search, Check } from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import { messageStore } from '../store/message.store';

// Dummy contacts data


export default function DropDownMenu({ 
  message, 
  setShowMenu,
  setActiveMenuId,
  handleForwardMessage,
  activeContactId
}) {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showForwardOptions, setShowForwardOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const deleteOptionsRef = useRef(null);
  const forwardOptionsRef = useRef(null);
  const {forWardMessage} = messageStore()
  const { deleteMessage ,contacts,  notifyMessage
  } = messageStore();
  const { authUser ,socket,activeUser,get_online_user } = authStore();
  // Filter contacts based on search query
  const filteredContacts = contacts?.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (deleteOptionsRef.current && !deleteOptionsRef.current.contains(event.target)) {
        setShowDeleteOptions(false);
      }
      if (forwardOptionsRef.current && !forwardOptionsRef.current.contains(event.target)) {
        setShowForwardOptions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteForMe = async(messageId, userId, receiverId) => {
    console.log(messageId, userId);
    let obj = {
        receiverId: receiverId,
        messageId,
        arrayOfId: [userId]
    };
    deleteMessage(obj);
  };

  useEffect(()=>{
    notifyMessage();
return ()=>{
  socket.off("newNotification")
}
},[notifyMessage,socket])

  const handleDeleteForEveryone = async(messageId, userId, receiverId) => {
    let obj = {
        receiverId: receiverId,
        messageId,
        arrayOfId: [userId, receiverId]
    };
    deleteMessage(obj);
  };

  const handleContactSelection = (contactId,message) => {

    let message_obj = {
      receiver:contactId,
      message:message.text,
      status:"sent",
      sender:authUser._id,
      file:message.file,
      images:message.image,
      video:message.video,
    }


    if (get_online_user.includes(activeContactId)&&activeContactId===contactId && activeUser) {
      const seen_bool = activeUser?.some(
        (item) =>
          (item.authUserId === activeContactId && item.selectedId === authUser?._id) &&
          !(item.authUserId === authUser?._id && item.selectedId === activeContactId)
      );
        if (seen_bool) {
        //  clear_notification(activeContact?._id)

        message_obj["status"] = "seen";

        } else {
          message_obj["status"] = "received";
        }
      }
      else {
        
        message_obj["status"] = "sent";
      }



    if (selectedContacts.some((item)=>(item.contactId === contactId))) {
      setSelectedContacts(selectedContacts.filter(item => item.contactId != contactId));
    } else {
      setSelectedContacts([...selectedContacts, {contactId,message_obj}]);
    }
  };

  const handleForwardToSelected = () => {
    // Here you would normally implement the actual forward logic
    console.log('Forwarding message to:', selectedContacts);
    let messageObjectArray=selectedContacts.map(item=>item.message_obj)
    console.log(messageObjectArray)
    // Reset state
    let obj={
      arrOfMessage:messageObjectArray,
      activeContactId
    }
    forWardMessage(obj)
    messageObjectArray=[];
    setSelectedContacts([]);
    setShowForwardOptions(false);
    setShowMenu(null);
    setActiveMenuId(null);
  };
  return (
    <div 
      onMouseOver={() => setShowMenu(message.id)} 
      onMouseLeave={() => {
        // Check if the mouse is not over dropdowns before hiding menu
        if (!showDeleteOptions && !showForwardOptions) {
          setActiveMenuId(null);
          setShowMenu(null);
        }
      }}
      onClick={(e) => e.stopPropagation()} 
      className="w-28 bg-gray-900 rounded-md shadow-lg z-20"
    >
      <div className="relative" ref={forwardOptionsRef}>
        <button 
          onClick={() => setShowForwardOptions(!showForwardOptions)}
          className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-600 hover:text-gray-100 transition-colors duration-150 rounded-t-md"
        >
          <Forward size={14} className="mr-2" />
          Forward
        </button>
        
        {showForwardOptions && (
          <div 
            className={`absolute ${message?.isOwn?"right-full":"left-full"}  top-0 w-64 bg-gray-800 rounded-md shadow-lg z-20`}
          >
            <div className="p-3">
              <div className="flex items-center bg-gray-700 rounded-md px-2 mb-2">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-sm py-2 px-2 text-white focus:outline-none"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact._id}
                    onClick={() => handleContactSelection(contact?.userId._id,message)}
                    className="flex items-center p-2 hover:bg-gray-700 rounded-md cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={contact?.userId?.profilePhoto}
                        alt={contact.name}
                        className="w-8 h-8 rounded-full"
                      />
               
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-white">{contact.name}</p>
                      <p className="text-xs text-gray-400">{contact.lastSeen}</p>
                    </div>
                    {selectedContacts?.some((item)=>item?.contactId===contact?.userId?._id) && (
                      <Check size={16} className="text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleForwardToSelected}
                disabled={selectedContacts.length === 0}
                className={`w-full py-2 mt-2 rounded-md text-sm font-medium ${
                  selectedContacts.length > 0 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Forward to {selectedContacts.length > 0 ? `(${selectedContacts.length})` : ''}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={deleteOptionsRef}>
        <button 
          onMouseOver={() => setShowDeleteOptions(true)}
          onMouseLeave={() => setShowDeleteOptions(false)}
          onClick={() => {}}
          className={`w-full flex items-center justify-between px-4 py-2 text-sm text-white hover:bg-gray-600 hover:text-gray-100 transition-colors duration-150 ${!showDeleteOptions ? 'rounded-b-md' : ''}`}
        >
          <div className="flex items-center">
            <Trash2 size={14} className="mr-2" />
            Delete
          </div>
          <svg 
            className={`w-4 h-4 transform ${showDeleteOptions ? 'rotate-180' : ''} transition-transform duration-200`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDeleteOptions && (
          <div 
            onMouseOver={() => setShowDeleteOptions(true)}
            onMouseLeave={() => setShowDeleteOptions(false)}
            className={`absolute ${message.isOwn ? "right-full ml-1" : "left-full mr-1"} top-0 w-44 bg-gray-800 rounded-md shadow-lg z-20`}
          >
            <button 
              onClick={() => {
                handleDeleteForMe(message.id, authUser._id, activeContactId);
                setShowDeleteOptions(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-600 hover:text-gray-100 transition-colors duration-150 rounded-t-md"
            >
              <UserX size={14} className="mr-2" />
              Delete for me
            </button>
            {(!message.isOwn || message.status !== "seen") && (
              <button 
                onClick={() => {
                  handleDeleteForEveryone(message.id, authUser._id, activeContactId);
                  setShowDeleteOptions(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-600 hover:text-gray-100 transition-colors duration-150 rounded-b-md"
              >
                <Users size={14} className="mr-2" />
                Delete for everyone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}