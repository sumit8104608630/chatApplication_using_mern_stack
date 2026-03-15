import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff } from 'lucide-react';

const CallingPopup = ({
  contact,      // the person being called { name, profilePhoto, ... }
  callOn,       // bool — false = ringing/connecting, true = call is live
  localStream,  // MediaStream from getUserMedia
  remoteStream, // MediaStream from usePeer()
  onEndCall,    // () => void
}) => {
  const [isMuted, setIsMuted]     = useState(false);
  const [duration, setDuration]   = useState(0);
  const remoteAudioRef            = useRef(null);
  const timerRef                  = useRef(null);

  // play remote audio as soon as stream arrives
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(console.error);
    }
  }, [remoteStream]);

  // call duration timer — starts once call is live
  useEffect(() => {
    if (callOn) {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callOn]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => {
        t.enabled = !t.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  const handleEnd = () => {
    console.log('call end');
    onEndCall();
  };

  const contactName = contact?.name || contact?.fullName || contact?.phone || 'Unknown';
  const avatar      = contact?.profilePhoto;

  return (
    <>
      {/* hidden audio element — plays remote voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

        {/* popup card */}
        <div
          className="relative w-80 rounded-3xl overflow-hidden flex flex-col items-center py-10 px-8 gap-6"
          style={{
            background: 'linear-gradient(160deg, #0f1923 0%, #122333 60%, #0a1a1a 100%)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,158,117,0.15)',
          }}
        >
          {/* animated ring */}
          <div className="relative flex items-center justify-center">
            {/* pulse rings — only show when ringing */}
            {!callOn && (
              <>
                <span className="absolute w-28 h-28 rounded-full border border-teal-500/30 animate-ping" style={{ animationDuration: '1.8s' }} />
                <span className="absolute w-24 h-24 rounded-full border border-teal-400/20 animate-ping" style={{ animationDuration: '2.4s' }} />
              </>
            )}
            {/* avatar */}
            {avatar ? (
              <img
                src={avatar}
                alt={contactName}
                className="w-20 h-20 rounded-full object-cover border-2 border-teal-500/50 relative z-10"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white relative z-10 border-2 border-teal-500/50"
                style={{ background: 'linear-gradient(135deg, #0e7970, #0f5c55)' }}
              >
                {contactName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* name */}
          <div className="text-center">
            <p className="text-white text-xl font-semibold tracking-wide"
               style={{ fontFamily: "'Syne', sans-serif" }}>
              {contactName}
            </p>
            <p className="text-teal-400 text-sm mt-1 tracking-widest uppercase font-medium">
              {callOn ? formatDuration(duration) : 'Calling…'}
            </p>
          </div>

          {/* controls */}
          <div className="flex items-center gap-6 mt-2">

            {/* mute */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-13 h-13 rounded-full flex items-center justify-center transition-all duration-200
                  ${isMuted
                    ? 'bg-red-500/20 border border-red-500/50'
                    : 'bg-white/10 border border-white/20 group-hover:bg-white/20'}`}
                style={{ width: 52, height: 52 }}
              >
                {isMuted
                  ? <MicOff className="h-5 w-5 text-red-400" />
                  : <Mic    className="h-5 w-5 text-white" />
                }
              </div>
              <span className="text-xs text-gray-400">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* end call */}
            <button
              onClick={handleEnd}
              title="End call"
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className="rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-150 shadow-lg"
                style={{ width: 64, height: 64, boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-gray-400">End</span>
            </button>

          </div>
        </div>
      </div>
    </>
  );
};

export default CallingPopup;