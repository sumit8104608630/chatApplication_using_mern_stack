import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { usePeer } from './Peer';
import { authStore } from '../store/userAuth.store';

const IncomingCallPopup = ({ caller, onAccept, onDecline, incomingSignal }) => {
  const { socket }                                        = authStore();
  const { createAnswer, resetPeer, remoteStream }         = usePeer();

  // ── Refs — declared at top before any function that uses them ─────────────
  const audioRef       = useRef(null);
  const timerRef       = useRef(null);
  const localStreamRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [visible,   setVisible]   = useState(false);
  const [callState, setCallState] = useState("incoming"); // incoming | active
  const [seconds,   setSeconds]   = useState(0);
  const [muted,     setMuted]     = useState(false);

  // ── Fade in on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // ── Attach remote audio when stream arrives ───────────────────────────────
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

useEffect(() => {
    const handleEnded = () => {
        clearInterval(timerRef.current);
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        resetPeer();
        onDecline();
    };
    socket.on("call-ended", handleEnded);
    return () => socket.off("call-ended", handleEnded); // ← named, won't nuke CallingPopup's listener
}, [socket, resetPeer, onDecline]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Accept ────────────────────────────────────────────────────────────────
const handleAccept = useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        console.log("📲 createAnswer called, caller._id:", caller._id);
        const answer = await createAnswer(incomingSignal, stream, caller._id);
        console.log("📲 answer created, type:", answer?.type);
        console.log("📲 emitting call-accepted to:", caller._id, "full caller obj:", caller);
        socket.emit("call-accepted", { to: caller, signal: answer });
        setCallState("active");
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        if (onAccept) onAccept();
    } catch (err) {
        console.error("Accept call error:", err);
    }
}, [socket, incomingSignal, caller, createAnswer, onAccept]);






  // ── Decline / End ─────────────────────────────────────────────────────────

  // ── Mute — actually toggles the real audio track ─────────────────────────
  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = muted; // if currently muted → re-enable; if not → disable
    });
    setMuted(m => !m);
  }, [muted]);
//------reject call--------------//


// Replace handleEnd with this
const handleEnd = useCallback(() => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    resetPeer();

    if (callState === "incoming") {
        // Not yet accepted — this is a rejection, not a hang-up
        socket.emit("call-rejected", { to: caller._id });
    } else {
        // Already active — normal end call
        socket.emit("call-ended", { to: caller._id });
    }

    onDecline();
}, [resetPeer, socket, caller, callState, onDecline]);


  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (s) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const isActive = callState === "active";
  const name     = caller?.name ?? 'Unknown';
  const initial  = name.charAt(0).toUpperCase();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Hidden audio output */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-80 rounded-2xl overflow-hidden shadow-2xl bg-[#1a1e23] border border-gray-700">

        {/* Animated top bar */}
        <div className={`h-1 w-full ${isActive ? 'bg-teal-400' : 'bg-teal-500 animate-pulse'}`} />

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-4">

          {/* Avatar */}
          <div className="relative">
            {!isActive && (
              <div className="absolute inset-0 rounded-full bg-teal-500 opacity-20 animate-ping scale-110" />
            )}
            {caller?.profilePhoto ? (
              <img
                src={caller.profilePhoto}
                alt={name}
                className="w-20 h-20 rounded-full object-cover border-4 border-teal-500 relative z-10"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#0e7970] flex items-center justify-center border-4 border-teal-500 relative z-10">
                <span className="text-white font-bold text-2xl">{initial}</span>
              </div>
            )}
          </div>

          {/* Name + status */}
          <div className="text-center">
            <p className="text-gray-400 text-sm tracking-widest uppercase">
              {isActive ? 'On Call' : 'Incoming Call'}
            </p>
            <h2 className="text-white text-xl font-semibold mt-1">{name}</h2>

            {isActive ? (
              // Timer — only shown when active
              <p className="text-teal-400 text-sm mt-1 font-mono tracking-widest">
                {formatTime(seconds)}
              </p>
            ) : (
              // Animated dots while ringing
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-gray-400 text-sm">Audio Call</span>
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

          {/* Buttons — different layout before and after accepting */}
          {!isActive ? (
            /* Pre-accept: Decline + Accept */
            <div className="flex gap-12 mt-2">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleEnd}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
                <span className="text-gray-400 text-xs">Decline</span>
              </div>

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
          ) : (
            /* Active call: Mute + End */
            <div className="flex items-end gap-8 mt-2">
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

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleEnd}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 active:scale-95 flex items-center justify-center transition-all"
                >
                  <PhoneOff className="h-6 w-6 text-white" />
                </button>
                <span className="text-gray-500 text-xs">End call</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;