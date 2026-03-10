import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, Mic, MicOff, PhoneOff } from 'lucide-react';
import { usePeer } from './Peer';
import { authStore } from '../store/userAuth.store';

export default function CallerInterface({ callData, endCall, localStream, callOn }) {
  const { remoteStream } = usePeer();
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState('dialing');
  const [callDuration, setCallDuration] = useState("00:00");
  const { authUser } = authStore();
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.play().catch(e => console.error("Error playing local audio:", e));
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio:", e));
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callStatus === 'connected') {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus]);

  useEffect(() => {
    if (callOn) setCallStatus('connected');
  }, [callOn]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    endCall();
  };

  const Avatar = () => (
    callData.profilePhoto
      ? <img src={callData.profilePhoto} alt={callData.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500" />
      : <div className="w-16 h-16 rounded-full bg-[#0e7970] ring-2 ring-teal-500 flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">{callData.name?.charAt(0).toUpperCase()}</span>
        </div>
  );

  return (
    <div className="fixed top-6 right-6 w-72 bg-[#1a1e23] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
        <Avatar />
        <div className="text-center">
          <p className="text-white font-semibold text-base">{callData.name}</p>
          <p className="text-xs mt-0.5">
            {callStatus === 'dialing'
              ? <span className="text-yellow-400 animate-pulse">Ringing…</span>
              : callStatus === 'connected'
              ? <span className="text-teal-400 font-mono">{callDuration}</span>
              : <span className="text-gray-500">Call ended</span>
            }
          </p>
        </div>
      </div>

      {callStatus !== 'ended' && (
        <div className="flex items-center justify-center gap-4 px-6 pb-6">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
            title="End Call"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      <audio ref={localAudioRef} autoPlay playsInline muted className="hidden" />
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}