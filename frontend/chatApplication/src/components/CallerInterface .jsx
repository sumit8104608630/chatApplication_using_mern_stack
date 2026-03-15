import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { usePeer } from './Peer.jsx';

export default function CallerInterface({ callData, callOn, endCall, localStream }) {
  const { remoteStream } = usePeer();
  const remoteAudioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [secs, setSecs] = useState(0);

  // ✅ Wire remote audio — plays the voice
  useEffect(() => {
    if (!remoteAudioRef.current || !remoteStream) return;
    remoteAudioRef.current.srcObject = remoteStream;
    remoteAudioRef.current
      .play()
      .catch(e => console.error("[CallerInterface] play failed:", e.message));
  }, [remoteStream]);

  // ✅ Timer — only runs when connected
  useEffect(() => {
    if (!callOn) { setSecs(0); return; }
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [callOn]);

  const duration = `${String(Math.floor(secs / 60)).padStart(2,'0')}:${String(secs % 60).padStart(2,'0')}`;

  // ✅ Mute toggle using localStream directly
  const handleMute = () => {
    if (!localStream) return;
    const next = !isMuted;
    localStream.getAudioTracks().forEach(t => (t.enabled = !next));
    setIsMuted(next);
  };

  const Avatar = () => (
    callData?.profilePhoto
      ? <img src={callData.profilePhoto} alt={callData.name}
             className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500" />
      : <div className="w-16 h-16 rounded-full bg-[#0e7970] ring-2 ring-teal-500 flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">
            {callData?.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
  );

  return (
    <div className="fixed top-6 right-6 w-72 bg-[#1a1e23] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden">

      {/* ✅ This plays the remote voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
        <Avatar />
        <div className="text-center">
          <p className="text-white font-semibold text-base">{callData?.name}</p>
          <p className="text-xs mt-0.5">
            {!callOn
              ? <span className="text-yellow-400 animate-pulse">Ringing…</span>
              : <span className="text-teal-400 font-mono">{duration}</span>
            }
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-6 pb-6">
        <button
          onClick={handleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* ✅ endCall directly from prop — no wrapper needed */}
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
          title="End Call"
        >
          <PhoneOff className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}