import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, Camera, CameraOff, Maximize, Minimize } from 'lucide-react';
import { usePeer } from "../components/Peer";
import { authStore } from '../store/userAuth.store';

const VideoCalling = ({ contact, onClose }) => {
  const { createOffer, setAnswer, resetPeer, remoteStream } = usePeer();
  const { socket, authUser } = authStore();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef       = useRef(null);
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState(null);
  const [callState, setCallState] = useState("calling");
  const [muted,     setMuted]     = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speaker,   setSpeaker]   = useState(true);
  const [seconds,   setSeconds]   = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Media helper ──────────────────────────────────────────────────────────
  const getMedia = async () => {
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
      return stream;
    } catch (err) {
      console.error("[VideoCalling] Failed to get media access:", err);
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert("Video calling requires HTTPS to work on most browsers.");
      } else {
        alert("Camera and Microphone access are required for video calls.");
      }
      onClose();
      throw err;
    }
  };

  // ── Start call on mount ───────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    try {
      const stream = await getMedia();
      const offer  = await createOffer(stream, contact.userId._id, true);

      // Persist call state: calling
      sessionStorage.setItem("activeCall", JSON.stringify({
          callTargetId: contact.userId._id,
          callRole: "caller",
          callStatus: "calling",
          callType: "video",
          callStartedAt: Date.now(),
      }));

      socket.emit("call-user", {
          to:     contact.userId._id,
          from:   authUser,
          signal: offer,
          callType: "video"
      });
    } catch (e) {
      console.error("Start video call failed", e);
    }
  }, [socket, authUser, createOffer, contact, onClose]);

  useEffect(() => {
    const handleAnswer = ({ signal }) => {
        // Update status: ongoing
        const saved = JSON.parse(sessionStorage.getItem("activeCall") || "{}");
        sessionStorage.setItem("activeCall", JSON.stringify({
            ...saved,
            callStatus: "ongoing"
        }));

        setAnswer(signal).then(() => {
            setCallState("active");
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        });
    };
    socket.on("accepted_answer", handleAnswer);
    return () => socket.off("accepted_answer", handleAnswer);
  }, [socket, setAnswer]);

  useEffect(() => {
    startCall();
    return () => {
      clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      resetPeer();
    };
  }, []);

  // ── Synchronize Streams to Video Elements ──────────────────────────────────
  useEffect(() => {
    // Sync local stream whenever possible (e.g., on mount or when camera toggled)
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [callState, cameraOff, localStream]);

  useEffect(() => {
    // Sync remote stream whenever it becomes available or video element mounts
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      
      const playPromise = remoteVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.warn("[VideoCalling] Remote autoplay failed:", error));
      }
    }
  }, [remoteStream, callState]);

  // ── Socket Event Handlers ─────────────────────────────────────────────────
  useEffect(() => {
    const handleEnd = (status) => {
      setCallState(status);
      sessionStorage.removeItem("activeCall");
      setTimeout(onClose, 1500);
    };

    socket.on("call-rejected", () => handleEnd("rejected"));
    socket.on("call-ended", () => handleEnd("ended"));
    
    return () => {
      socket.off("call-rejected");
      socket.off("call-ended");
    };
  }, [socket, onClose]);

  // ── UI Handlers ───────────────────────────────────────────────────────────
  const handleEnd = useCallback(() => {
    socket.emit("call-ended", { to: contact.userId._id });
    sessionStorage.removeItem("activeCall");
    onClose();
  }, [socket, contact, onClose]);

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

  const name = contact?.name || contact?.userId?.name || 'Unknown';

  return (
    <div className={`fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center transition-all duration-500 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-8'}`}>
      
      {/* Main Video Container */}
      <div className={`relative w-full h-full ${isFullscreen ? 'max-w-none rounded-none' : 'max-w-6xl rounded-2xl md:rounded-3xl'} aspect-video bg-gray-900 overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center`}>
        
        {remoteStream ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover bg-gray-950"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-4 text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-teal-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold animate-pulse">
              {name.charAt(0).toUpperCase()}
            </div>
            <p className="text-gray-400 text-base md:text-lg">
              {callState === "calling" ? `Calling ${name}...` : `Connecting...`}
            </p>
          </div>
        )}

        {/* Local Video Preview (Picture-in-Picture) */}
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

        {/* Overlay Info */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 bg-black/20 backdrop-blur-sm p-2 rounded-lg">
          <h2 className="text-white text-base md:text-xl font-semibold drop-shadow-lg truncate max-w-[120px] sm:max-w-none">{name}</h2>
          {callState === "active" && (
            <p className="text-teal-400 font-mono text-xs md:text-sm mt-0.5 md:mt-1">{formatTime(seconds)}</p>
          )}
        </div>

        {/* Status Messages */}
        {(callState === "rejected" || callState === "ended") && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-center">
            <p className="text-red-500 text-xl md:text-2xl font-bold uppercase tracking-widest animate-bounce">
              {callState === "rejected" ? "Call Declined" : "Call Ended"}
            </p>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 md:gap-8 px-4 sm:px-6 md:px-8 py-3 md:py-4 bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-20 transition-opacity hover:opacity-100 opacity-95 sm:opacity-90">
          
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

        </div>
      </div>
    </div>
  );
};

export default VideoCalling;
