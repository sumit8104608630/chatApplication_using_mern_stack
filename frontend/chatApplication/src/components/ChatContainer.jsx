import React, { useState, useRef, useEffect } from 'react';
import Calling from "../components/Calling"
import { 
  ArrowLeft, 
  MoreVertical, 
  Download, 
  File, 
  Trash2,
  PlusCircle, 
  UserMinus,
  Ban,
  Paperclip, 
  Image as ImageIcon, 
  VideoIcon, 
  X, 
  Unlock,
  Smile, 
  Send,
  Phone,
  Video,
  Forward,
  Search,
} from 'lucide-react';
import DropDownMenu from './DropDownMenu';
import ViewProfile from '../pages/ViewProfilePage';
import { messageStore } from '../store/message.store';
import { usePeer } from "../components/Peer";

// ── Forward Message Popup ────────────────────────────────────────────────────
const ForwardMessagePopup = ({ message, contacts, onForward, onClose }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  const filtered = contacts.filter(c => {
    const name = c.name || c.userId?.name || c.phone || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e2530] w-full max-w-sm mx-4 rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-gray-700">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Forward className="h-5 w-5 text-teal-400" />
            <h2 className="text-white font-semibold text-base">Forward message</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message preview */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs mb-1">Forwarding:</p>
            {message?.image && message.image.match(/\.(jpeg|jpg|gif|png)$/) ? (
              <img src={message.image} alt="forward preview" className="h-16 rounded object-cover" />
            ) : message?.video ? (
              <p className="text-gray-300 text-sm">📹 Video</p>
            ) : message?.file ? (
              <p className="text-gray-300 text-sm">📎 File</p>
            ) : (
              <p className="text-gray-300 text-sm truncate">{message?.text || '—'}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 gap-2">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="bg-transparent text-white text-sm focus:outline-none flex-1 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto max-h-64">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No contacts found</p>
          ) : (
            filtered.map(contact => {
              const id    = contact.userId?._id || contact._id;
              const name  = contact.name || contact.userId?.name || contact.phone || 'Unknown';
              const photo = contact.userId?.profilePhoto;
              const isSelected = selected.includes(id);

              return (
                <div
                  key={id}
                  onClick={() => toggleSelect(id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-500/10' : 'hover:bg-gray-800'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {photo ? (
                      <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white font-semibold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <span className="text-white text-sm flex-1 truncate">{name}</span>

                  {/* Radio circle */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-500'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-700 flex items-center justify-between gap-3">
          <p className="text-gray-400 text-xs">
            {selected.length > 0 ? `${selected.length} selected` : 'Select contacts'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onForward(selected, message); onClose(); }}
              disabled={selected.length === 0}
              className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Forward className="h-4 w-4" />
              Forward
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── ChatContainer ────────────────────────────────────────────────────────────
const ChatContainer = ({
  showContactsOnMobile,
  activeContact,
  contacts,
  handleBackToContacts,
  get_online_user,
  formatLastSeen,
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
  setShowFilePopup,
  setCallingContact,
  setVideoCallingContact,
}) => {

  const [showEmojiPicker,   setShowEmojiPicker]   = useState(false);
  const [toggleViewProfile, setToggle]             = useState(false);
  const [isOpen,            setIsOpen]             = useState(false);

  // ── Forward popup state ──────────────────────────────────────────────────
  const [forwardPopup,      setForwardPopup]       = useState(false);
  const [forwardMessage,    setForwardMsg]          = useState(null);

  const emojiPickerRef = useRef(null);
  const dropdownRef    = useRef(null);
  const { delete_message, subScribe, unSubScribe, unBlockUser } = messageStore();

  const commonEmojis = [
    '😊','😂','🥰','😍','😎','😢','😡','👍',
    '👏','🙏','🔥','❤️','💯','✅','⭐','🎉',
    '🤔','😜','🤣','😇','😴','🤗','🤨','🤓',
    '💪','👀','🙄','😘','😋','🤩','😭','🤷‍♂️',
  ];
  const handleVoiceCall = (contact) => {
    if (currentContact) setCallingContact(currentContact);
  };

  const handleVideoCall = (contact) => {
    if (currentContact) setVideoCallingContact(currentContact);
  };

  useEffect(() => {
    subScribe();
    return () => { unSubScribe(); };
  }, [subScribe, unSubScribe]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const currentContact = contacts.find(c => c.userId._id === activeContact?._id);
  const isSaved = currentContact?.save_contact;

  if (!activeContact || !currentContact) return null;

  const handleUnblock     = (contactId) => unBlockUser({ unblockedId: contactId });
  const toggleDropdown    = () => setIsOpen(!isOpen);
  const handleEmoji       = () => { setShowEmojiPicker(!showEmojiPicker); if (showFilePopup) setShowFilePopup(false); };
  const insertEmoji       = (emoji) => handleInputChange({ target: { value: message.message + emoji } });
  const handleViewProfile = () => setToggle(true);
  const deleteChat        = (id) => delete_message({ receiverId: id });

  // ── Open forward popup — called from DropDownMenu ────────────────────────
  const openForwardPopup = (msg) => {
    setForwardMsg(msg);
    setForwardPopup(true);
    setActiveMenuId(null);
  };

  const handleForward = (recipientIds, msg) => {
    handleForwardMessage(recipientIds, msg);
  };

  return (
    <div className={`${!showContactsOnMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>

      {/* ── Forward message popup ── */}
      {forwardPopup && (
        <ForwardMessagePopup
          message={forwardMessage}
          contacts={contacts}
          onForward={handleForward}
          onClose={() => { setForwardPopup(false); setForwardMsg(null); }}
        />
      )}

      {activeContact ? (
        <>
          {/* ── Chat Header ── */}
          <div className="px-3 py-3 sm:px-4 border-b border-gray-800 flex justify-between items-center flex-shrink-0">

            <div className="flex items-center min-w-0 flex-1">
              {!showContactsOnMobile && (
                <button className="mr-2 text-gray-400 md:hidden flex-shrink-0" onClick={handleBackToContacts}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {contacts.find(c => c.userId._id === activeContact._id) && (
                <button onClick={handleViewProfile} className="cursor-pointer flex items-center min-w-0">
                  <img
                    src={
                      activeContact &&
                      contacts.find(c => c.userId._id === activeContact._id)?.save_contact &&
                      !authUser.blockedBy.includes(activeContact?._id)
                        ? contacts.find(c => c.userId._id === activeContact._id)?.userId.profilePhoto
                        : "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1773148437/charcha_bb47gj.jpg"
                    }
                    alt={contacts.find(c => c.userId._id === activeContact._id)?.userId.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="ml-2 sm:ml-3 text-start min-w-0">
                    <h3 className="text-white font-medium text-sm sm:text-base truncate max-w-[110px] xs:max-w-[150px] sm:max-w-xs">
                      {contacts.find(c => c.userId._id === activeContact._id)?.save_contact
                        ? contacts.find(c => c.userId._id === activeContact._id)?.name
                        : contacts.find(c => c.userId._id === activeContact._id)?.phone}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {get_online_user.includes(activeContact._id)
                        ? 'Online'
                        : 'Last seen ' + formatLastSeen(contacts.find(c => c.userId._id === activeContact._id)?.userId.lastSeen)}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {toggleViewProfile && (
              <ViewProfile isSaved={isSaved} contact={activeContact} toggleViewProfile={toggleViewProfile} setToggle={setToggle} />
            )}

            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-1">
              <button
                onClick={() => handleVoiceCall(activeContact)}
                title="Voice call"
                className="p-2 rounded-full text-gray-400 hover:text-teal-400 hover:bg-gray-700 active:scale-95 transition-all"
              >
                <Phone className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => handleVideoCall(activeContact)}
                title="Video call"
                className="p-2 rounded-full text-gray-400 hover:text-teal-400 hover:bg-gray-700 active:scale-95 transition-all"
              >
                <Video className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </button>
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={toggleDropdown}
                  title="More options"
                  className="p-2 rounded-full text-gray-400 cursor-pointer hover:text-white hover:bg-gray-700 active:scale-95 transition-all"
                >
                  <MoreVertical className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                </button>
                {isOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-20">
                    <ul className="divide-y divide-gray-700">
                      <li>
                        <button onClick={() => setIsOpen(false)} className="flex items-center cursor-pointer w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                          <UserMinus className="h-4 w-4 mr-3" />Remove Contact
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { deleteChat(activeContact._id); setIsOpen(false); }} className="flex items-center cursor-pointer w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-700">
                          <Trash2 className="h-4 w-4 mr-3" />Delete Chat
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Messages ── */}
          {messageLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse flex-1 p-2 sm:p-4 overflow-y-auto bg-[#1a1e23]`}>
                <div className="flex max-w-xs md:max-w-md">
                  {idx % 2 === 0 && <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 self-end" />}
                  <div className={`bg-gray-700 p-3 text-white ${idx % 2 === 0 ? 'rounded-r-lg rounded-tl-lg' : 'rounded-l-lg rounded-tr-lg'} w-40`}>
                    <div className="h-3 bg-gray-600 rounded mb-2" />
                    <div className="h-3 bg-gray-600 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div ref={scrollRef} style={{ scrollbarWidth: "none", msOverflowStyle: "none", overflowY: "auto" }} className="flex-1 p-2 sm:p-4 overflow-y-auto bg-[#1a1e23]">
              <div className="space-y-4">
                {messages?.map((message) => (
                  <div key={message.id}>
                    {!message?.deletedFor?.includes(authUser._id) && (
                      <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div>
                          {ShowMenu && ShowMenu === message.id && message.isOwn && (
                            <div className="flex justify-end items-end">
                              <button onMouseOver={() => setShowMenu(message.id)} onMouseLeave={() => setShowMenu(null)} onClick={(e) => { e.stopPropagation(); toggleMenu(message.id); }} className="text-white flex hover:bg-opacity-50 p-2">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          )}
                          {activeMenuId === message.id && message.isOwn && (
                            <DropDownMenu
                              message={message}
                              showMenu={ShowMenu}
                              setShowMenu={setShowMenu}
                              setActiveMenuId={setActiveMenuId}
                              handleForwardMessage={() => openForwardPopup(message)}
                              handleDeleteMessage={handleDeleteMessage}
                              activeContactId={activeContact._id}
                            />
                          )}
                        </div>

                        <div className="flex max-w-xs md:max-w-md relative group">
                          {!message.isOwn && (
                            <img
                              src={contacts.find(c => c.userId._id === message.sender)?.save_contact ? contacts.find(c => c.userId._id === message.sender)?.userId.profilePhoto : "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1773148437/charcha_bb47gj.jpg"}
                              alt="avatar"
                              className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                            />
                          )}
                          <div className="relative">
                            <div onMouseOver={() => setShowMenu(message.id)} onMouseLeave={() => setShowMenu(null)} className={`${message.isOwn ? 'bg-teal-500 p-3 rounded-l-lg rounded-tr-lg' : 'bg-gray-800 p-3 rounded-r-lg rounded-tl-lg'} text-white relative`}>
                              <p className="text-sm">{message.text}</p>
                              {message?.image && message.image.match(/\.(jpeg|jpg|gif|png)$/) && (
                                <div className="relative mt-2">
                                  <img onClick={() => setFullViewImage(message?.image)} src={message.image} alt="Shared image" className="rounded max-w-56 h-auto cursor-pointer" />
                                  {!message.isOwn && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDownloadFile(message.image, `image-${Date.now()}.jpg`); }} className="absolute bottom-2 right-2 bg-black bg-opacity-50 p-1 rounded-full text-white hover:bg-opacity-70">
                                      <Download className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                              {message?.video && message.video.match(/\.(mp4|webm|ogg)$/) && <video src={message.video} controls className="w-40 rounded" />}
                              {fullViewImage && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setFullViewImage(null)}>
                                  <div className="max-w-4xl max-h-screen p-4 relative">
                                    <img src={fullViewImage} alt="Full view" className="max-w-full max-h-[90vh] object-contain" />
                                    <button onClick={(e) => { e.stopPropagation(); handleDownloadFile(fullViewImage); }} className="absolute bottom-6 right-6 bg-black bg-opacity-60 p-2 rounded-full text-white">
                                      <Download className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              {message.file && !message.file.match(/\.(jpeg|jpg|gif|png)$/) && (
                                <div className="mt-2 bg-gray-700 p-2 w-56 rounded flex items-center justify-between">
                                  <div className="flex items-center flex-1 overflow-hidden">
                                    <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <a target="_blank" className="cursor-pointer" href={message.file}><span className="text-xs truncate">{message.file}</span></a>
                                  </div>
                                  <button onClick={() => handleDownloadFile(message.file, message.file)} className="text-white ml-2 flex-shrink-0 p-1 hover:bg-gray-600 rounded">
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${message.isOwn ? 'text-right' : ''} text-gray-400`}>
                              {message?.isOwn && <span className="mr-1">{renderMessageStatus(message?.status, message?.isOwn)}</span>}
                              {message.time}
                            </p>
                          </div>
                        </div>

                        {!message.isOwn && (
                          <div>
                            {ShowMenu && ShowMenu === message.id && (
                              <div className="flex justify-start items-end">
                                <button onMouseOver={() => setShowMenu(message.id)} onMouseLeave={() => setShowMenu(null)} onClick={(e) => { e.stopPropagation(); toggleMenu(message.id); }} className="text-white flex hover:bg-opacity-50 p-2">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            )}
                            {activeMenuId === message.id && (
                              <DropDownMenu
                                message={message}
                                showMenu={ShowMenu}
                                setShowMenu={setShowMenu}
                                setActiveMenuId={setActiveMenuId}
                                handleForwardMessage={() => openForwardPopup(message)}
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

                {activeUser?.some(item => item.authUserId === activeContact?._id && item.selectedId === authUser?._id && !(item.authUserId === authUser?._id && item.selectedId === activeContact?._id)) && messageSendingLoading && (
                  <div className="flex justify-end items-center py-2">
                    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "600ms" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Message Input Area ── */}
          <div className="p-2 sm:p-4 bottom-0 bg-[#1a1e23] border-t border-gray-800">
            {filePreview && (
              <div className="mb-2 relative">
                <div className="relative inline-block">
                  {filePreview.type === 'image' && <img src={filePreview.url} alt="Preview" className="h-24 max-w-full rounded object-cover border border-gray-700" />}
                  {filePreview.type === 'video' && <video src={filePreview.url} className="h-24 max-w-full rounded object-cover border border-gray-700" controls />}
                  {filePreview.type === 'file' && (
                    <div className="flex items-center p-3 rounded-md border border-gray-300 bg-gray-50 shadow-sm max-w-xs">
                      <div className="flex-shrink-0 text-red-500">
                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h8l6-6V4a2 2 0 00-2-2H4zm9 11v3H4V4h12v7h-3a1 1 0 00-1 1z" /></svg>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-gray-800 truncate">{filePreview.name}</span>
                        <span className="text-xs text-gray-500">{filePreview.name}</span>
                      </div>
                    </div>
                  )}
                  <button onClick={removeSelectedFile} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-lg">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {contacts.find(item => item?.userId?._id === activeContact?._id).block ? (
              <div className="bg-red-900/60 text-white py-2 px-3 flex items-center justify-between gap-2">
                <div className="flex items-center min-w-0">
                  <Ban className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" />
                  <span className="text-sm truncate">You've blocked this contact. Unblock to resume chatting.</span>
                </div>
                <button onClick={() => handleUnblock(activeContact._id)} className="bg-gray-700 cursor-pointer hover:bg-gray-600 text-white text-sm px-3 py-1 rounded-md flex items-center flex-shrink-0">
                  <Unlock className="h-4 w-4 mr-1" /><span>Unblock</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center bg-gray-800 rounded-lg p-2 relative">
                <button className="text-gray-400 hover:text-white p-1 sm:p-2" onClick={toggleFilePopup}>
                  <PlusCircle className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block">
                  <Paperclip className="h-5 w-5" />
                </button>

                {showFilePopup && (
                  <div className="absolute bottom-12 left-0 bg-gray-900 rounded-lg shadow-lg p-3 flex flex-col space-y-2 border border-gray-700 w-52 z-10">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-white text-sm font-medium">Select file type</h4>
                      <button onClick={toggleFilePopup} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
                    </div>
                    <button onClick={() => handleFileSelection('image')} className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded text-white text-sm"><ImageIcon className="h-5 w-5 text-teal-500" /><span>Upload Image</span></button>
                    <button onClick={() => handleFileSelection('file')} className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded text-white text-sm"><File className="h-5 w-5 text-teal-500" /><span>Upload File</span></button>
                    <button onClick={() => handleFileSelection('video')} className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded text-white text-sm"><VideoIcon className="h-5 w-5 text-teal-500" /><span>Video</span></button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  </div>
                )}

                <input
                  onChange={(e) => handleInputChange(e)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && (message.message || selectedFile)) { e.preventDefault(); handleSendMessage(activeContact); } }}
                  type="text"
                  value={message.message}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-0 text-white px-2 text-sm sm:text-base"
                />

                {selectedFile && !filePreview && (
                  <div className="bg-gray-700 px-2 py-1 rounded text-xs text-white flex items-center mr-2">
                    <File className="h-3 w-3 mr-1 text-gray-400" />
                    <span className="truncate max-w-20">{selectedFile.name}</span>
                    <button onClick={removeSelectedFile} className="ml-1 text-gray-400 hover:text-white"><X className="h-3 w-3" /></button>
                  </div>
                )}

                <div>
                  {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-12 right-0 sm:right-12 bg-gray-900 rounded-lg shadow-lg p-3 border border-gray-700 z-10">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white text-sm font-medium">Choose an emoji</h4>
                        <button onClick={handleEmoji} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-8 gap-1 w-64">
                        {commonEmojis.map((emoji, index) => (
                          <button key={index} onClick={() => insertEmoji(emoji)} className="text-xl hover:bg-gray-800 rounded p-1 transition-colors">{emoji}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={handleEmoji} className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block">
                    <Smile className="h-5 w-5" />
                  </button>
                </div>

                <button
                  onClick={() => { handleSendMessage(activeContact); setShowEmojiPicker(false); }}
                  className="bg-teal-500 text-white p-1 sm:p-2 rounded-lg"
                  disabled={!message.message && !selectedFile}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#1a1e23]">
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Send className="h-8 w-8 text-teal-500" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-white">Select a conversation</h3>
            <p className="mt-2 text-gray-400 max-w-sm">Choose from your existing conversations or start a new one.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;