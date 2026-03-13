import React from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';

export default function CallerInterface({ callData, isMuted, callStatus, callDuration, onToggleMute, onEndCall }) {

  const Avatar = () => (
    callData?.profilePhoto
      ? <img src={callData.profilePhoto} alt={callData.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500" />
      : <div className="w-16 h-16 rounded-full bg-[#0e7970] ring-2 ring-teal-500 flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">{callData?.name?.charAt(0).toUpperCase()}</span>
        </div>
  );

  return (
    <div className="fixed top-6 right-6 w-72 bg-[#1a1e23] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
        <Avatar />
        <div className="text-center">
          <p className="text-white font-semibold text-base">{callData?.name}</p>
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
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
            title="End Call"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}