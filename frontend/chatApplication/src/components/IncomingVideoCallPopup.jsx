import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Camera, CameraOff, Volume2, Maximize, Minimize } from 'lucide-react';
import { usePeer } from "../components/Peer";
import { authStore } from '../store/userAuth.store';

const IncomingVideoCallPopup = ({ caller, onAccept, onDecline, incomingSignal }) => {
  const { createAnswer, setAnswer, resetPeer, remoteStream, setCallTarget } = usePeer();
  const { socket, authUser } = authStore();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef       = useRef(null);
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState(null);
  const [callState, setCallState] = useState(() => {
    const saved = sessionStorage.getItem("activeCall");
    if (saved) {
      try {
        const { callStatus, callTargetId } = JSON.parse(saved);
        if (callStatus === "ongoing" && callTargetId === caller?._id) return "active";
      } catch (e) {}
    }
    return "incoming";
  });
  const [muted,     setMuted]     = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds,   setSeconds]   = useState(0);
  const [isAutoAccepting, setIsAutoAccepting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Set call target for reload protection ─────────────────────────────────
  useEffect(() => {
    if (caller?._id) {
      setCallTarget(caller._id);
    }
  }, [caller?._id, setCallTarget]);

  // ── Call Accept/Decline ───────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const answer = await createAnswer(incomingSignal, stream, caller._id, true);

      const saved = JSON.parse(sessionStorage.getItem("activeCall") || "{}");
      sessionStorage.setItem("activeCall", JSON.stringify({
          ...saved,
          callTargetId: caller._id,
          callRole: "callee",
          callStatus: "ongoing",
          callType: "video",
          callStartedAt: Date.now(),
      }));

      socket.emit("call-accepted", { to: caller, signal: answer });
      setCallState("active");
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      if (onAccept) onAccept();
    } catch (err) {
      alert("Camera and Microphone access are required for video calls.");
      onDecline();
    }
  }, [socket, incomingSignal, caller, createAnswer, onAccept, onDecline]);

  // ── Reconnection Logic ────────────────────────────────────────────────────
  useEffect(() => {
    if (isAutoAccepting || callState === "active" || callState === "ended") return;

    const saved = sessionStorage.getItem("activeCall");
    if (saved) {
        try {
            const { callTargetId, callStatus } = JSON.parse(saved);
            if (callStatus === "ongoing" && callTargetId === caller?._id) {
                setIsAutoAccepting(true);
                setTimeout(() => {
                    handleAccept();
                }, 0);
            }
        } catch (e) {}
    }
  }, [caller, handleAccept, isAutoAccepting, callState]);

  // ── Stream Synchronization ────────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [callState, cameraOff, localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      
      const playPromise = remoteVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay prevented silently
        });
      }
    }
  }, [remoteStream, callState]);

  // ── Socket Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleEnded = () => {
      setCallState("ended");
      sessionStorage.removeItem("activeCall");
      setTimeout(onDecline, 1500);
    };
    socket.on("call-ended", handleEnded);
    return () => socket.off("call-ended", handleEnded);
  }, [socket, onDecline]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      resetPeer();
    };
  }, []);

  // ── UI Handlers ───────────────────────────────────────────────────────────
  const handleEnd = useCallback(() => {
    socket.emit("call-ended", { to: caller._id });
    onDecline();
  }, [socket, caller, onDecline]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = muted);
    setMuted(m => !m);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = cameraOff);
    setCameraOff(c => !c);
  }, [cameraOff]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const formatTime = (s) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const name = caller?.name || caller?.userId?.name || 'Unknown';
  const isActive = callState === "active";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center transition-all duration-500 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-8'}`}>
      
      {/* Main Video Container */}
      <div className={`relative w-full h-full ${isFullscreen ? 'max-w-none rounded-none' : 'max-w-6xl rounded-2xl md:rounded-3xl'} aspect-video bg-gray-900 overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center`}>
        
        {isActive && remoteStream ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover bg-gray-950"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-4 text-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-teal-500 mb-2 md:mb-4 shadow-xl">
              <img 
                src={caller?.profilePhoto || "/default-avatar.png"} 
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">{name}</h2>
            <p className="text-teal-400 text-base md:text-lg uppercase tracking-widest animate-pulse">
              {isActive ? (isAutoAccepting ? "Reconnecting..." : "Connecting...") : "Incoming Video Call..."}
            </p>
          </div>
        )}

        {/* Local Video Preview (Picture-in-Picture) */}
        {isActive && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 w-28 sm:w-36 md:w-48 aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden border-2 border-teal-500 shadow-xl z-20">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {cameraOff && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <CameraOff className="text-gray-500 w-5 h-5 md:w-6 md:h-6" />
              </div>
            )}
          </div>
        )}

        {/* Overlay Info */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 bg-black/20 backdrop-blur-sm p-2 rounded-lg">
          <h2 className="text-white text-base md:text-xl font-semibold drop-shadow-lg truncate max-w-[120px] sm:max-w-none">{name}</h2>
          {isActive && (
            <p className="text-teal-400 font-mono text-xs md:text-sm mt-0.5 md:mt-1">{formatTime(seconds)}</p>
          )}
        </div>

        {/* Status Messages */}
        {callState === "ended" && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-center">
            <p className="text-red-500 text-xl md:text-2xl font-bold uppercase tracking-widest animate-bounce">
              Call Ended
            </p>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-6 md:gap-10 px-6 sm:px-8 md:px-10 py-3 md:py-5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-20 transition-opacity hover:opacity-100 opacity-95 sm:opacity-90">
          
          {!isActive ? (
            <>
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button 
                  onClick={onDecline}
                  className="p-4 md:p-5 rounded-full bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30"
                >
                  <PhoneOff className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <span className="text-gray-400 text-[10px] md:text-xs">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button 
                  onClick={handleAccept}
                  className="p-4 md:p-5 rounded-full bg-teal-500 text-white hover:bg-teal-600 active:scale-95 transition-all shadow-lg shadow-teal-500/30 animate-bounce"
                >
                  <Phone className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <span className="text-gray-400 text-[10px] md:text-xs">Accept</span>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={toggleMute}
                className={`p-3 md:p-4 rounded-full transition-all ${muted ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'}`}
              >
                {muted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
              </button>

              <button 
                onClick={toggleCamera}
                className={`p-3 md:p-4 rounded-full transition-all ${cameraOff ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'}`}
              >
                {cameraOff ? <CameraOff className="w-5 h-5 md:w-6 md:h-6" /> : <Camera className="w-5 h-5 md:w-6 md:h-6" />}
              </button>

              <button 
                onClick={handleEnd}
                className="p-4 md:p-5 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-600/30"
              >
                <PhoneOff className="w-6 h-6 md:w-7 md:h-7" />
              </button>

              <button 
                onClick={toggleFullscreen}
                className="hidden sm:flex p-3 md:p-4 rounded-full bg-gray-800/80 text-gray-300 hover:bg-gray-700 transition-all"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 md:w-6 md:h-6" /> : <Maximize className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default IncomingVideoCallPopup;
