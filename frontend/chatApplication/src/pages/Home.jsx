import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Send, PlusCircle,
  File, X, Clock, Check,
  Trash2, CheckCheck, Download, VideoIcon,
  MessageSquare, Loader
} from 'lucide-react';
import { messageStore } from '../store/message.store.js';
import { authStore } from '../store/userAuth.store.js';
import { groupStore } from '../store/group.store';
import GroupMessages from './GroupMessages.jsx';
import { groupMessageStore } from '../store/groupMessage.store.js';
import { debounce } from '../utils/debounce.js';
import DropDownMenu from '../components/DropDownMenu.jsx';
import ChatContainer from '../components/ChatContainer.jsx';
import BlockedUserPopup from '../components/BlockedPopUp.jsx';
import IncomingCallPopup from '../components/IncomingCallPopup.jsx';
const ChatHomePage = () => {
  const { get_all_groupMessage, setSelectedGroup, groupSubScribe, selectedGroup, unGroupSubScribe } = groupMessageStore();
  const { filterGroupLoading, groups, filterGroupArray, filter_groups } = groupStore();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const { get_online_user, activeUser, selectUser, socket, getActiveUser, deleteActiveUser, authUser, delete_authUserMatchId } = authStore();
  const {
    get_all_contacts, contacts, send_message, getAll_messages, update_message_array_to_seen,
    locallyUpdate_toSeen, clear_notification, filter_contacts, filterArray, filterLoading,
    messages, setSelectedUser, subScribe, selectedUser, unSubScribe, messageLoading,
    locallyUpdateMessage, messageSendingLoading, get_Notify, notify, notifyMessage,
    getNewContact, unSubScrContact
  } = messageStore();

  // ── Chat UI state ───────────────────────────────────────────────────────────
  const [activeTab,             setActiveTab]             = useState('contacts');
  const [activeGroup,           setActiveGroup]           = useState(null);
  const [searchInputValue,      setValue]                 = useState({ inputValue: "" });
  const [ShowMenu,              setShowMenu]              = useState(null);
  const [message,               setMessage]               = useState({ receiverId: "", message: "", status: "", file: null, image: null, video: null });
  const [showFilePopup,         setShowFilePopup]         = useState(false);
  const [selectedFile,          setSelectedFile]          = useState(null);
  const [filePreview,           setFilePreview]           = useState(null);
  const [fullViewImage,         setFullViewImage]         = useState(null);
  const [activeContact,         setActiveContact]         = useState(null);
  const [showBlockedPopup,      setShowBlockedPopup]      = useState(false);
  const [showContactsOnMobile,  setShowContactsOnMobile] = useState(true);
  const [activeMenuId,          setActiveMenuId]          = useState(null);
    const [incomingSignal, setIncomingSignal] = useState(null);
    const [caller, setCaller]       = useState(null);
    const [callState, setCallState] = useState(null)





    

  useEffect(()=>{
        socket.on("incoming-call", ({to, from, signal }) => {
              console.log(signal)
            if(to==authUser._id){
              console.log(signal)
                setCaller(from);
      setIncomingSignal(signal);
      setCallState("incoming");
            }
    
    });
  },[socket])


// ✅ Keep the popup alive, just update state
const handleAcceptCall  = () => setCallState("active");
const handleDeclineCall = () => setCallState(null); 








  // ─── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => { get_all_contacts(); }, [get_all_contacts]);

  useEffect(() => {
    if (activeTab === "contacts") setActiveGroup(null);
    else if (activeTab === "groups") setActiveContact(null);
  }, [activeTab]);

  useEffect(() => {
    socket.emit("join-groups", groups?.map(group => group._id).join(","));
  }, [groups, socket]);

  useEffect(() => { get_Notify(); }, [get_Notify]);

  useEffect(() => {
    notifyMessage();
    return () => { socket.off("newNotification"); };
  }, [notifyMessage, socket, selectedUser, activeContact]);

  useEffect(() => {
    notifyMessage();
    subScribe();
    return () => {
      unSubScribe();
      if (activeContact) deleteActiveUser(activeContact.id);
    };
  }, [selectedUser, unSubScribe, subScribe, activeContact, deleteActiveUser, contacts, notifyMessage]);

  useEffect(() => {
    getNewContact();
    return () => { unSubScrContact(); };
  }, [getNewContact, unSubScrContact, socket]);

  useEffect(() => {
    if (selectedGroup) groupSubScribe();
    return () => { unGroupSubScribe(); };
  }, [selectedGroup, groupSubScribe, unGroupSubScribe]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // ─── Active user tracking ──────────────────────────────────────────────────
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const fromContactToUser = activeUser?.some(item => item.authUserId === activeContact?._id && item.selectedId === authUser?._id);
    const fromUserToContact = activeUser?.some(item => item.authUserId === authUser?._id && item.selectedId === activeContact?._id);
    if (fromContactToUser && fromUserToContact) locallyUpdate_toSeen();
  }, [isMounted, activeUser, activeContact?._id, authUser?._id, locallyUpdate_toSeen]);

  useEffect(() => {
    delete_authUserMatchId(authUser._id);
    return () => { deleteActiveUser({ authUserId: authUser._id, selectedId: activeContact?._id }); };
  }, [activeContact?._id, deleteActiveUser, authUser?._id, delete_authUserMatchId]);

  useEffect(() => {
    if (get_online_user.includes(activeContact?._id)) locallyUpdateMessage(activeContact?._id);
  }, [get_online_user, activeContact, locallyUpdateMessage]);

  useEffect(() => { getActiveUser(); }, [getActiveUser]);

  // ─── Contact / Group handlers ──────────────────────────────────────────────
  const handleGroupClick = (groupInfo) => {
    setSelectedGroup(groupInfo._id);
    get_all_groupMessage(groupInfo._id);
    setActiveContact(null);
    setShowContactsOnMobile(false);
    setActiveGroup(groupInfo);
  };

  const handleContactClick = (contactDetail, blocked) => {
    setActiveGroup(null);
    contactDetail["block"] = blocked;
    if (get_online_user.includes(contactDetail._id)) locallyUpdateMessage(contactDetail._id);
    clear_notification(contactDetail._id);
    if (activeContact) deleteActiveUser({ authUserId: authUser._id, selectedId: activeContact._id });
    if (get_online_user.includes(authUser._id)) update_message_array_to_seen(contactDetail._id);
    setSelectedUser(contactDetail._id);
    selectUser(contactDetail._id, authUser._id);
    setActiveContact(contactDetail);
    setMessage(prev => ({ ...prev, receiverId: contactDetail._id }));
    getAll_messages(contactDetail._id);
    setShowContactsOnMobile(false);
    socket.off("newNotification");
  };

  const handleBackToContacts = () => {
    deleteActiveUser({ authUserId: authUser._id, selectedId: activeContact?._id });
    setActiveContact(null);
    setSelectedUser(null);
    setSelectedGroup(null);
    setActiveGroup(null);
    setShowContactsOnMobile(true);
  };

  // ─── File download ─────────────────────────────────────────────────────────
  const handleDownloadFile = async (fileUrl) => {
    try {
      const response = await fetch(fileUrl, { method: 'GET', mode: 'cors', cache: 'no-cache', credentials: 'same-origin', headers: { 'Content-Type': 'application/octet-stream' }, redirect: 'follow' });
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      let fileName = fileUrl.split('/').pop() || 'download';
      const cd = response.headers.get('content-disposition');
      if (cd) { const m = cd.match(/filename="(.+)"/); if (m?.length === 2) fileName = m[1]; }
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl; link.download = fileName;
      document.body.appendChild(link); link.click();
      URL.revokeObjectURL(objectUrl); document.body.removeChild(link);
    } catch (error) { console.error("Download failed:", error); }
  };

  // ─── Message helpers ───────────────────────────────────────────────────────
  const getContactMessageStatus = (contact) => {
    const msgs = messages.filter(msg => msg.sender === contact.userId?._id || msg.receiver === contact.userId?._id);
    if (!msgs.length) return null;
    const latest = msgs[msgs.length - 1];
    return { latestMessage: latest.text, isUnread: latest.status !== 'seen' && !latest.isOwn, status: latest.status };
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";
    return new Date(parseInt(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleInputChange = (e) => setMessage(prev => ({ ...prev, message: e.target.value }));

  const handleSendMessage = () => {
    try {
      if (authUser.blockedBy.includes(activeContact?._id)) {
        setShowBlockedPopup(true);
        setMessage({ receiverId: "", message: "", status: "", file: null, image: null, video: null });
        return;
      }
      const messageToSend = { ...message };
      if (get_online_user.includes(activeContact?._id) && activeUser) {
        const seen_bool = activeUser?.some(item => item.authUserId === activeContact?._id && item.selectedId === authUser?._id && !(item.authUserId === authUser?._id && item.selectedId === activeContact?._id));
        message["status"] = seen_bool ? "seen" : "received";
      } else {
        message["status"] = "sent";
      }
      const new_format = new FormData();
      new_format.append("message", messageToSend.message);
      new_format.append("receiverId", message.receiverId);
      new_format.append("file", message.file);
      new_format.append("status", message.status);
      new_format.append("image", message.image);
      new_format.append("video", message.video);
      send_message(new_format);
      setMessage(prev => ({ ...prev, message: "", status: "", file: null, image: null, video: null }));
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) { console.log(error); }
  };

  // ─── File attachment handlers ──────────────────────────────────────────────
  const toggleFilePopup = () => setShowFilePopup(!showFilePopup);

  const handleFileSelection = (type) => {
    if (fileInputRef.current) {
      const map = { image: 'image/*', file: 'application/pdf', video: 'video/*' };
      fileInputRef.current.setAttribute('accept', map[type] || '*/*');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        setMessage(prev => ({ ...prev, image: file }));
        reader.onloadend = () => setFilePreview({ type: 'image', url: reader.result });
      } else if (file.type.startsWith('video/')) {
        setMessage(prev => ({ ...prev, video: file }));
        reader.onloadend = () => setFilePreview({ type: 'video', url: reader.result });
      } else {
        setMessage(prev => ({ ...prev, file }));
        reader.onloadend = () => setFilePreview({ type: 'file', url: reader.result });
      }
      reader.readAsDataURL(file);
    }
    setShowFilePopup(false);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessage(prev => ({ ...prev, file: null }));
  };

  // ─── Notification / status rendering ──────────────────────────────────────
  const renderMessageStatus = (status, isOwn) => {
    if (!isOwn) return;
    switch (status) {
      case "sent":     return <Check className="h-3 w-3 ml-1 inline text-gray-400" />;
      case "received": return <CheckCheck className="h-3 w-3 ml-1 inline text-gray-400" />;
      case "seen":     return <CheckCheck className="h-3 w-3 ml-1 inline text-teal-400" />;
      default:         return <Clock className="h-3 w-3 ml-1 inline text-gray-400" />;
    }
  };

  const renderNotificationIndicator = (contact) => {
    const notification = notify?.find(item => item?.senderId == contact.userId?._id);
    if (!notification?.unseenCount == 0) {
      return (
        <span className="bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {notification?.unseenCount}
        </span>
      );
    }
  };

  // ─── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => setValue({ inputValue: e.target.value });

  const debouncedUserFilter = useMemo(
    () => debounce((inputValue) => {
      activeTab === "contacts" ? filter_contacts(inputValue, activeTab) : filter_groups(inputValue, activeTab);
    }, 500),
    [filter_contacts, activeTab]
  );

  useEffect(() => { debouncedUserFilter(searchInputValue.inputValue); }, [debouncedUserFilter, searchInputValue]);

  // ─── Message menu ──────────────────────────────────────────────────────────
  const handleDeleteMessage  = () => setActiveMenuId(null);
  const handleForwardMessage = () => setActiveMenuId(null);
  const toggleMenu           = (messageId) => setActiveMenuId(prev => prev === messageId ? null : messageId);
  const handleOutsideClick   = () => { if (activeMenuId !== null) setActiveMenuId(null); };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div onClick={handleOutsideClick} className="h-screen bg-[#1a1e23] z-0 flex flex-col md:flex-row">


      
{(callState === "incoming" || callState === "active") && caller && (
    <IncomingCallPopup
        caller={caller}
        incomingSignal={incomingSignal}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
    />
)}




      {/* ── Blocked popup ── */}
      {showBlockedPopup && <BlockedUserPopup onClose={() => setShowBlockedPopup(false)} />}

      {/* ── Left panel ── */}
      <div className={`${showContactsOnMobile ? 'flex' : 'hidden'} md:flex md:w-80 border-r border-gray-800 flex-col h-full md:h-screen`}>

        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Messages</h1>
          </div>

          <div className="mt-3 flex bg-gray-800 rounded-md p-1">
            <button className={`flex-1 py-2 text-sm font-medium rounded-md transition ${activeTab === 'contacts' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('contacts')}>Contacts</button>
            <button className={`flex-1 py-2 text-sm font-medium rounded-md transition ${activeTab === 'groups' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('groups')}>Groups</button>
          </div>

          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input onChange={handleSearch} value={searchInputValue.inputValue} type="text" className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" placeholder={activeTab === 'contacts' ? "Search contacts..." : "Search groups..."} />
          </div>
        </div>

        {/* Contacts list */}
        {activeTab === 'contacts' && (
          <div className="flex-1 overflow-y-auto">
            {filterLoading && searchInputValue.inputValue !== "" ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-2">
                <Loader className="w-8 h-8 text-white animate-spin" />
                <p className="text-gray-400 text-sm">Loading contacts...</p>
              </div>
            ) : filterArray?.length === 0 && searchInputValue.inputValue !== "" ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <Search className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-400">No contacts found</p>
                <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              (searchInputValue.inputValue !== "" ? filterArray : contacts).map((contact) => {
                const messageStatus = getContactMessageStatus(contact);
                return (
                  <div key={contact._id} className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${activeContact?._id === contact.userId._id ? 'bg-gray-800' : ''}`} onClick={() => handleContactClick(contact?.userId, contact?.block)}>
                    <div className="flex items-center">
                      <div className="relative">
                        {contact.save_contact && !authUser.blockedBy.includes(contact?.userId?._id) ? (
                          contact?.userId?.profilePhoto
                            ? <img src={contact?.userId?.profilePhoto} alt={contact?.userId?.name} className="w-12 h-12 rounded-full object-cover" />
                            : <div className="w-12 h-12 rounded-full bg-[#0e7970] flex items-center justify-center"><span className="text-white font-semibold text-lg">{contact?.userId?.name?.charAt(0).toUpperCase()}</span></div>
                        ) : (
                          <img src={contact?.userId?.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                        )}
                        {get_online_user.includes(contact?.userId?._id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1e23]" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          {contact?.save_contact ? <h3 className="text-white font-medium">{contact.name}</h3> : <h3 className="text-white font-medium">{contact.phone}</h3>}
                          {get_online_user.includes(contact?.userId?._id) ? <span className="text-xs text-green-500">Online</span> : <span className="text-xs text-gray-400">{formatLastSeen(contact?.userId?.lastSeen)}</span>}
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

        {/* Groups list */}
        {activeTab === 'groups' && (
          <div className="flex-1 overflow-y-auto">
            {filterGroupLoading && searchInputValue.inputValue !== "" ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-2">
                <Loader className="w-8 h-8 text-white animate-spin" />
                <p className="text-gray-400 text-sm">Loading groups...</p>
              </div>
            ) : filterGroupArray?.length === 0 && searchInputValue.inputValue !== "" ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <Search className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-400">No groups found</p>
                <p className="text-gray-500 text-sm mt-1">Create a new group to get started</p>
              </div>
            ) : (
              (searchInputValue.inputValue !== "" ? filterGroupArray : groups).map((group) => (
                <div key={group._id} className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${activeGroup === group._id ? 'bg-gray-800' : ''}`} onClick={() => handleGroupClick(group)}>
                  <div className="flex items-center">
                    <div className="relative">
                      {group.groupImage
                        ? <img src={group.groupImage} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
                        : <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">{group.name.substring(0, 2).toUpperCase()}</div>
                      }
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-white font-medium">{group.name}</h3>
                      <p className="text-sm truncate max-w-xs text-gray-500">{group.description || "Hey there! I'm using ChatApp."}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="p-4 flex justify-center">
              <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-4 py-2 text-sm font-medium flex items-center" onClick={() => navigate("/createGroup")}>
                <PlusCircle className="w-4 h-4 mr-2" />Create New Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Group chat panel ── */}
      {activeGroup && (
        <div className={`${!showContactsOnMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
          <GroupMessages setActiveTab={setActiveTab} activeGroup={activeGroup} handleDownloadFile={handleDownloadFile} handleBackToGroups={handleBackToContacts} handleContactClick={handleContactClick} setActiveGroup={setActiveGroup} />
        </div>
      )}

      {/* ── Empty states ── */}
      {!activeContact && !activeGroup && activeTab === "contacts" && (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#1a1e23] text-gray-400">
          <div className="mb-8"><MessageSquare className="w-24 h-24 text-teal-500 opacity-50" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to ChatApp</h2>
          <p className="text-center max-w-md px-6">Select a contact from the list to start messaging</p>
        </div>
      )}
      {!activeContact && !activeGroup && activeTab === "groups" && (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#1a1e23] text-gray-400">
          <div className="mb-8"><MessageSquare className="w-24 h-24 text-teal-500 opacity-50" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to ChatApp</h2>
          <p className="text-center max-w-md px-6">Select a Group from the list to start messaging</p>
        </div>
      )}

      {/* ── Direct message chat panel ── */}
      {!activeGroup && (
        <ChatContainer
          showContactsOnMobile={showContactsOnMobile}
          activeContact={activeContact}
          contacts={contacts}
          handleBackToContacts={handleBackToContacts}
          get_online_user={get_online_user}
          formatLastSeen={formatLastSeen}
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
          setShowFilePopup={setShowFilePopup}
        />
      )}
    </div>
  );
};

export default ChatHomePage;