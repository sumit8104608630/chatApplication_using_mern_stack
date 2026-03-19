import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { usePeer } from "../components/Peer";
import { authStore } from '../store/userAuth.store';

const CallingPopup = ({ contact, onClose }) => {
  const { createOffer, setAnswer, resetPeer, remoteStream } = usePeer();
  const { socket, authUser } = authStore();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef       = useRef(null);
  const audioRef       = useRef(null);
  const localStreamRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState("calling");
  const [muted,     setMuted]     = useState(false);
  const [speaker,   setSpeaker]   = useState(true);
  const [seconds,   setSeconds]   = useState(0);

  // ── Mic helper ────────────────────────────────────────────────────────────
  const getMic = async () => {
    try {
      // Improved constraints for better mobile compatibility and audio quality
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("[Calling] Failed to get microphone access:", err);
      
      // Check if it's a security/HTTPS issue
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert("WebRTC (Calling) requires HTTPS to work on most browsers. Please use a secure connection.");
      } else {
        alert("Microphone access is required for calls. Please ensure you have granted permission in your browser settings.");
      }
      throw err;
    }
  };

  // ── Start call on mount ───────────────────────────────────────────────────
const startCall = useCallback(async () => {
    const stream = await getMic();
    const offer  = await createOffer(stream, contact.userId._id);
    console.log("📞 call-user emitted to:", contact.userId._id);
    console.log("📞 offer type:", offer.type);
    socket.emit("call-user", {
        to:     contact.userId._id,
        from:   authUser,
        signal: offer,
    });
}, [socket, authUser, createOffer, contact]);

useEffect(() => {
    const handleAnswer = ({ signal }) => {
        console.log("✅ accepted_answer received, signal type:", signal?.type);
        setAnswer(signal).then(() => {
            console.log("✅ setAnswer done — switching to active");
            setCallState("active");
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        });
    };
    socket.on("accepted_answer", handleAnswer);
    return () => socket.off("accepted_answer", handleAnswer);
}, [socket, setAnswer]);












  
  useEffect(() => {
    startCall();
  }, []);  // run once on mount only

  // ── Remote audio ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      // On some mobile browsers, audio doesn't start automatically even with autoPlay
      audioRef.current.play().catch(err => {
        console.warn("[Audio] play() failed, waiting for user gesture:", err);
      });
    }
  }, [remoteStream]);

  // ── call-rejected — callee declined ──────────────────────────────────────
  useEffect(() => {
    const handleRejected = () => {
      clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      resetPeer();
      setCallState("rejected");
      setTimeout(onClose, 1500);
    };

    socket.on("call-rejected", handleRejected);
    return () => socket.off("call-rejected", handleRejected);
  }, [socket, resetPeer, onClose]);

  // ── call-ended — callee hung up mid-call ──────────────────────────────────
  useEffect(() => {
    const handleEnded = () => {
      clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      resetPeer();
      onClose();
    };

    socket.on("call-ended", handleEnded);
    return () => socket.off("call-ended", handleEnded);
  }, [socket, resetPeer, onClose]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEnd = useCallback(() => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    resetPeer();
    socket.emit("call-ended", { to: contact.userId._id });
    onClose();
  }, [resetPeer, socket, contact, onClose]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = muted; // currently muted → re-enable; not muted → disable
    });
    setMuted(m => !m);
  }, [muted]);

  const toggleSpeaker = useCallback(() => {
    setSpeaker(s => !s);
    if (audioRef.current?.setSinkId) {
      audioRef.current.setSinkId(speaker ? '' : 'default');
    }
  }, [speaker]);

  const formatTime = (s) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // ── Derived display values ────────────────────────────────────────────────
  const name    = contact?.name || contact?.userId?.name || contact?.phone || 'Unknown';
  const photo   = contact?.userId?.profilePhoto;
  const initial = name.charAt(0).toUpperCase();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e2530] border border-gray-700 rounded-2xl p-8 w-72 flex flex-col items-center gap-5 shadow-2xl">

        <audio ref={audioRef} autoPlay playsInline />

        {/* Avatar with pulse rings */}
        <div className="relative flex items-center justify-center">
          {callState === "calling" && (
            <>
              <span className="absolute w-24 h-24 rounded-full bg-teal-500/20 animate-ping" />
              <span className="absolute w-20 h-20 rounded-full bg-teal-500/10 animate-ping [animation-delay:400ms]" />
            </>
          )}
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-20 h-20 rounded-full object-cover relative z-10 border-2 border-teal-500"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-teal-700 flex items-center justify-center text-white text-3xl font-semibold relative z-10">
              {initial}
            </div>
          )}
        </div>

        {/* Name + status */}
        <div className="text-center">
          <p className="text-white text-lg font-medium">{name}</p>

          {/* BUG FIX: status text was rendered OUTSIDE the card div — now inside */}
          {callState === "rejected" && (
            <p className="text-red-400 text-sm mt-1">Call declined</p>
          )}
          {callState === "active" && (
            <p className="text-teal-400 text-sm mt-1 font-mono tracking-widest">
              {formatTime(seconds)}
            </p>
          )}
          {callState === "calling" && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-gray-400 text-sm">Calling</span>
              <span className="flex gap-0.5 ml-1">
                {[0, 200, 400].map(delay => (
                  <span
                    key={delay}
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Controls — hidden while rejected */}
        {callState !== "rejected" && (
          <div className="flex items-end gap-8 mt-2">
            {/* Mute */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleMute}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  muted
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <span className="text-gray-500 text-xs">{muted ? 'Unmute' : 'Mute'}</span>
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
                onClick={toggleSpeaker}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  speaker
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Volume2 className="h-5 w-5" />
              </button>
              <span className="text-gray-500 text-xs">Speaker</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CallingPopup;