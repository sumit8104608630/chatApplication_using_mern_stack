import { useState, useRef, useEffect } from 'react';
import { Forward, Trash2, UserX, Users } from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import { messageStore } from '../store/message.store';

export default function DropDownMenu({ 
  message, 
  setShowMenu,
  setActiveMenuId,
  handleForwardMessage,
  activeContactId
}) {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const deleteOptionsRef = useRef(null);
  const {deleteMessage}=messageStore()
    const {authUser}=authStore()
  // Handle clicks outside delete options dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (deleteOptionsRef.current && !deleteOptionsRef.current.contains(event.target)) {
        setShowDeleteOptions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleDeleteForMe =async(messageId,userId,receiverId)=>{
    console.log(messageId,userId)
    let obj={
        receiverId:receiverId,
        messageId,
        arrayOfId:[userId]
    }
    deleteMessage(obj)
  }
  const handleDeleteForEveryone=async(messageId,userId,receiverId)=>{
    let obj={
        receiverId:receiverId,
        messageId,
        arrayOfId:[userId,receiverId]
    }
    deleteMessage(obj)
  }



  return (
    <div 
      onMouseOver={() => setShowMenu(message.id)} 
      onMouseLeave={() => {
        // Check if the mouse is not over delete options before hiding menu
        if (!showDeleteOptions) {
          setActiveMenuId(null);
          setShowMenu(null);
        }
      }}
      onClick={(e) => e.stopPropagation()} 
      className="w-28 bg-gray-900 rounded-md shadow-lg z-10"
    >
      <button 
        onClick={() => handleForwardMessage(message)}
        className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-600 hover:text-gray-100 transition-colors duration-150 rounded-t-md"
      >
        <Forward size={14} className="mr-2" />
        Forward
      </button>
      <div className="relative" ref={deleteOptionsRef}>
        <button 
        onMouseOver={() => setShowDeleteOptions(true)}
        onMouseLeave={() =>{ setShowDeleteOptions(false)
            
        }
        }
          onClick={()=>{}}
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
            on onMouseLeave={() => {setShowDeleteOptions(false)
            }}
          className={`absolute ${message.isOwn?"right-full ml-1":"left-full mr-1"} top-0  w-44 bg-gray-800 rounded-md shadow-lg z-20`}>
            <button 
              onClick={() => {
                handleDeleteForMe(message.id,authUser._id,activeContactId);
                setShowDeleteOptions(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-600 hover:text-gray-100 transition-colors duration-150 rounded-t-md"
            >
              <UserX size={14} className="mr-2" />
              Delete for me
            </button>
         {!message.isOwn|| message.status != "seen"&&  <button 
              onClick={() => {
                handleDeleteForEveryone(message.id,authUser._id,activeContactId);
                setShowDeleteOptions(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-600 hover:text-gray-100 transition-colors duration-150 rounded-b-md"
            >
              <Users size={14} className="mr-2" />
              Delete for everyone
            </button>}
          </div>
        )}
      </div>
    </div>
  );
}