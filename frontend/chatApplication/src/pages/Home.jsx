import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search,
  MoreVertical,
  Phone,
  Video,
  Send,
  PlusCircle,
  Paperclip,
  Smile,
  ArrowLeft,
  Menu
} from 'lucide-react';
import { authStore } from '../store/userAuth.store';

const ChatHomePage = () => {
  const {authUser,checkAuth,isCheckingAuth} = authStore( );



  const [activeContact, setActiveContact] = useState(null);
  const [showContactsOnMobile, setShowContactsOnMobile] = useState(true);
  
  // Sample contacts data
  const contacts = [
    { id: 1, name: "Sarah Johnson", online: true, unread: 3, lastSeen: "Just now", profileImage: "https://i.pravatar.cc/150?img=1", lastMessage: "Can we meet tomorrow?" },
    { id: 2, name: "John Smith", online: false, unread: 0, lastSeen: "5m ago", profileImage: "https://i.pravatar.cc/150?img=2", lastMessage: "The meeting went well!" },
    { id: 3, name: "Emma Williams", online: true, unread: 0, lastSeen: "Just now", profileImage: "https://i.pravatar.cc/150?img=3", lastMessage: "Thanks for your help!" },
    { id: 4, name: "Michael Brown", online: false, unread: 1, lastSeen: "2h ago", profileImage: "https://i.pravatar.cc/150?img=4", lastMessage: "I'll send the files later" },
    { id: 5, name: "Jennifer Davis", online: false, unread: 0, lastSeen: "1d ago", profileImage: "https://i.pravatar.cc/150?img=5", lastMessage: "See you next week" }
  ];
  
  // Sample messages for the selected contact
  const messages = [
  
  ];

  const handleContactClick = (contactId) => {
    setActiveContact(contactId);
    // On mobile, switch to message view when a contact is selected
    setShowContactsOnMobile(false);
  };

  const handleBackToContacts = () => {
    setShowContactsOnMobile(true);
  };

  return (<>{isCheckingAuth?<>Loading...</>:
    <div className="h-screen bg-[#1a1e23] flex flex-col md:flex-row">
      {/* Left Side - Contacts List */}
      <div className={`${showContactsOnMobile ? 'flex' : 'hidden'} md:flex md:w-80 border-r border-gray-800 flex-col h-full md:h-screen`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <button className="md:hidden text-gray-400">
              <Menu className="h-5 w-5" />
            </button>
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
          {contacts.map((contact) => (
            <div 
              key={contact.id}
              className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${activeContact === contact.id ? 'bg-gray-800' : ''}`}
              onClick={() => handleContactClick(contact.id)}
            >
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={contact.profileImage}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1e23]"></div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium">{contact.name}</h3>
                    <span className="text-xs text-gray-400">{contact.lastSeen}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-400 truncate max-w-xs">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                <img
                  src={contacts.find(c => c.id === activeContact)?.profileImage}
                  alt={contacts.find(c => c.id === activeContact)?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <h3 className="text-white font-medium">{contacts.find(c => c.id === activeContact)?.name}</h3>
                  <p className="text-xs text-gray-400">
                    {contacts.find(c => c.id === activeContact)?.online ? 'Online' : 'Offline'}
                  </p>
                </div>
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
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-xs md:max-w-md">
                      {!message.isOwn && (
                        <img
                          src={contacts.find(c => c.id === message.sender)?.profileImage}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                        />
                      )}
                      <div>
                        <div className={`p-3 rounded-lg ${message.isOwn ? 'bg-teal-500 text-white' : 'bg-gray-800 text-white'}`}>
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className={`text-xs mt-1 ${message.isOwn ? 'text-right' : ''} text-gray-400`}>{message.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Message Input */}
            <div className="p-2 sm:p-4 border-t border-gray-800">
              <div className="flex items-center bg-gray-800 rounded-lg p-2">
                <button className="text-gray-400 hover:text-white p-1 sm:p-2">
                  <PlusCircle className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-white px-2 text-sm sm:text-base"
                />
                <button className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block">
                  <Smile className="h-5 w-5" />
                </button>
                <button className="bg-teal-500 text-white p-1 sm:p-2 rounded-lg">
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
    </div>}</>
  );
};

export default ChatHomePage;