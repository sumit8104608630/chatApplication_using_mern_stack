import React, { useState, useRef, useEffect } from 'react';
import { Phone, X, MicOff, Mic, PhoneOff } from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import { usePeer } from './Peer';

function VoiceCall({ incomingCall, rejectCall, acceptIncomingCall }) {
  const { socket, authUser } = authStore();
  const { remoteStream } = usePeer();
  const [callActive, setCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  
  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.play().catch(e => console.error("Error playing local audio:", e));
      }
      await acceptIncomingCall();
      setCallActive(true);
      startTimer();
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };
  
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio:", e));
    }
  }, [remoteStream]);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);
  
  const startTimer = () => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
  };
  
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
      setIsMuted(!isMuted);
    }
  };
  
  const endActiveCall = () => {
    socket.emit("endCall", { to: incomingCall._id, from: authUser._id });
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
    setCallActive(false);
    rejectCall();
  };

  const Avatar = () => (
    incomingCall.profilePhoto
      ? <img src={incomingCall.profilePhoto} alt={incomingCall.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500" />
      : <div className="w-16 h-16 rounded-full bg-[#0e7970] ring-2 ring-teal-500 flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">{incomingCall.name?.charAt(0).toUpperCase()}</span>
        </div>
  );

  if (callActive) {
    return (
      <div className="fixed top-6 right-6 w-72 bg-[#1a1e23] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
          <Avatar />
          <div className="text-center">
            <p className="text-white font-semibold text-base">{incomingCall.name}</p>
            <p className="text-teal-400 text-xs mt-0.5 font-mono">{callDuration}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-6 pb-6">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={endActiveCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
            title="End Call"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </button>
        </div>

        <audio ref={localAudioRef} autoPlay playsInline muted className="hidden" />
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 w-72 bg-[#1a1e23] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
        <Avatar />
        <div className="text-center">
          <p className="text-white font-semibold text-base">{incomingCall.name}</p>
          <p className="text-gray-400 text-xs mt-0.5">Incoming voice call…</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 px-6 pb-6">
        <button
          onClick={rejectCall}
          className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
          title="Decline"
        >
          <PhoneOff className="h-5 w-5 text-red-400" />
        </button>
        <button
          onClick={acceptCall}
          className="w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center transition-colors shadow-lg"
          title="Accept"
        >
          <Phone className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}

export default VoiceCall;