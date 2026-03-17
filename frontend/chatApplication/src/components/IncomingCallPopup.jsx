import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { usePeer } from './Peer'; 
import { authStore } from '../store/userAuth.store';
const IncomingCallPopup = ({ caller, onAccept, onDecline,incomingSignal }) => {
  const [visible, setVisible] = useState(false);
  const [localStream, setLocalStream]       = useState(null);
  const {socket}=authStore()
      const { createOffer, createAnswer, setAnswer, resetPeer, remoteStream } = usePeer();
    const [callState, setCallState] = useState("idle"); // idle | calling | incoming | active

  useEffect(() => {
    console.log("caller",caller)
    setTimeout(() => setVisible(true), 10);
  }, []);

  const getMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    return stream;
  };



  const stopMic = useCallback(() => {
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
  }, [localStream]);

const audioRef = useRef(null);

useEffect(() => {
    if (remoteStream && audioRef.current) {
        audioRef.current.srcObject = remoteStream;
    }
}, [remoteStream]);

  const handleAccept = useCallback(async () => {
    const stream = await getMic();
    const answer = await createAnswer(incomingSignal, stream, caller._id);

    socket.emit("call-accepted", { to: caller, signal: answer });
    setCallState("active");
  }, [socket, incomingSignal, createAnswer]);

  const handleDecline = () => {
    console.log("end call");
    onDecline();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <audio ref={audioRef} autoPlay playsInline />

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-80 rounded-2xl overflow-hidden shadow-2xl bg-[#1a1e23] border border-gray-700">
        
        {/* Animated top bar */}
        <div className="h-1 w-full bg-teal-500 animate-pulse" />

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-4">

          {/* Avatar with pulse ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-teal-500 opacity-20 animate-ping scale-110" />
            {caller?.profilePhoto ? (
              <img
                src={caller.profilePhoto}
                alt={caller.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-teal-500 relative z-10"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#0e7970] flex items-center justify-center border-4 border-teal-500 relative z-10">
                <span className="text-white font-bold text-2xl">
                  {caller?.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
            )}
          </div>

          {/* Caller info */}
          <div className="text-center">
            <p className="text-gray-400 text-sm tracking-widest uppercase">Incoming Call</p>
            <h2 className="text-white text-xl font-semibold mt-1">{caller?.name ?? 'Unknown'}</h2>
            <div className="flex items-center justify-center gap-1 mt-1 text-teal-400 text-sm">
              <Video className="w-3 h-3" />
              <span>Video Call</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-12 mt-2">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleDecline}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <span className="text-gray-400 text-xs">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAccept}
                className="w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-teal-500/30"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
              <span className="text-gray-400 text-xs">Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;