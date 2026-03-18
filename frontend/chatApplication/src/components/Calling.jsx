// CallingPopup.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { usePeer } from "../components/Peer";
import { authStore } from '../store/userAuth.store';
const CallingPopup = ({ contact, onClose }) => {
    const { createOffer, createAnswer, setAnswer, resetPeer, remoteStream } = usePeer();
    const { get_online_user, activeUser, selectUser, socket, getActiveUser, deleteActiveUser, authUser, delete_authUserMatchId } = authStore();
    const [callState, setCallState] = useState("idle"); // idle | calling | incoming | active

  const [connected, setConnected] = useState(false);
  const [muted, setMuted]         = useState(false);
  const [speaker, setSpeaker]     = useState(false);
  const [seconds, setSeconds]     = useState(0);
  const timerRef = useRef(null);
  const [localStream, setLocalStream]       = useState(null);

    const getMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    localStreamRef.current = stream; // ← add this line
    return stream;
  };

    const stopMic = useCallback(() => {
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
  }, [localStream]);

  const startCall = useCallback(async () => {
    const stream = await getMic();
    const offer  = await createOffer(stream, contact.userId._id);

    socket.emit("call-user", {
      to:     contact.userId._id,
      from:   authUser,
      signal: offer,
    });
    setCallState("calling",offer);
  }, [socket, authUser, createOffer]);

useEffect(() => {
  socket.on("accepted_answer", ({ to, signal }) => {
    if (to._id == authUser._id) {
        setAnswer(signal).then(() => {
            setCallState("active");
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        });
    }
});

    return () => socket.off("accepted_answer"); // cleanup
}, [socket]);

  useEffect(()=>{
    startCall()
  },[])




  const audioRef = useRef(null);
useEffect(() => {
    if (remoteStream && audioRef.current) {
        audioRef.current.srcObject = remoteStream;
    }
}, [remoteStream]);








  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleEnd = () => {
    clearInterval(timerRef.current);
    onClose();
  };
// ✅ Fix — actually disable the track
const localStreamRef = useRef(null); // store stream in ref, not state

const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
        t.enabled = muted; // flip: if currently muted, re-enable; vice versa
    });
    setMuted(m => !m);
}, [muted]);

useEffect(() => {
    socket.on("call-ended", () => {
        clearInterval(timerRef.current);
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        resetPeer();
        onClose();
    });
    return () => socket.off("call-ended");
}, [socket]);


  const toggleSpeaker = useCallback(() => {
    setSpeaker(s => !s);
    if (audioRef.current?.setSinkId) {
        audioRef.current.setSinkId(speaker ? '' : 'default');
    }
}, [speaker]);

  const name = contact?.name || contact?.userId?.name || contact?.phone || 'Unknown';
  const photo = contact?.userId?.profilePhoto;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e2530] border border-gray-700 rounded-2xl p-8 w-72 flex flex-col items-center gap-5 shadow-2xl">
        <audio ref={audioRef} autoPlay playsInline />

        {/* Avatar with pulse rings */}
        <div className="relative flex items-center justify-center">
          <span className="absolute w-24 h-24 rounded-full bg-teal-500/20 animate-ping" />
          <span className="absolute w-20 h-20 rounded-full bg-teal-500/10 animate-ping [animation-delay:400ms]" />
          {photo ? (
            <img src={photo} alt={name}
              className="w-20 h-20 rounded-full object-cover relative z-10 border-2 border-teal-500" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-teal-700 flex items-center justify-center text-white text-3xl font-semibold relative z-10">
              {initial}
            </div>
          )}
        </div>

        {/* Name + status */}
        <div className="text-center">
          <p className="text-white text-lg font-medium">{name}</p>
          {callState === "active" ? (
            <p className="text-teal-400 text-sm mt-1 font-mono tracking-widest">
              {formatTime(seconds)}
            </p>
          ) : (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-gray-400 text-sm">Calling</span>
              <span className="flex gap-0.5 ml-1">
                {[0, 200, 400].map(delay => (
                  <span key={delay}
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-end gap-8 mt-2">
          {/* Mute */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={ toggleMute }
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                muted ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <span className="text-gray-500 text-xs">Mute</span>
          </div>

          {/* End call */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleEnd}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 active:scale-95 flex items-center justify-center transition-all"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
            <span className="text-gray-500 text-xs">End call</span>
          </div>

          {/* Speaker */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={ toggleSpeaker}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                speaker ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <span className="text-gray-500 text-xs">Speaker</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CallingPopup;