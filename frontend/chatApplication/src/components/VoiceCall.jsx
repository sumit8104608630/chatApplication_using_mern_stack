import React from 'react';
import { Phone, MicOff, Mic, PhoneOff } from 'lucide-react';

function VoiceCall({ incomingCall, onReject, onAccept, callActive, isMuted, callDuration, onToggleMute, onEndCall }) {

  const Avatar = () => (
    incomingCall?.callerInfo?.profilePhoto
      ? <img src={incomingCall.callerInfo.profilePhoto} alt={incomingCall.callerInfo.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500" />
      : <div className="w-16 h-16 rounded-full bg-[#0e7970] ring-2 ring-teal-500 flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">
            {incomingCall?.callerInfo?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
  );

  if (callActive) {
    return (
      <div className="fixed top-6 right-6 w-72 bg-[#1a1e23] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
          <Avatar />
          <div className="text-center">
            <p className="text-white font-semibold text-base">{incomingCall?.callerInfo?.name}</p>
            <p className="text-teal-400 text-xs mt-0.5 font-mono">{callDuration}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-6 pb-6">
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
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
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 w-72 bg-[#1a1e23] rounded-2xl shadow-2xl border border-gray-800 z-50 overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
        <Avatar />
        <div className="text-center">
          <p className="text-white font-semibold text-base">{incomingCall?.callerInfo?.name}</p>
          <p className="text-gray-400 text-xs mt-0.5">Incoming voice call…</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 px-6 pb-6">
        <button
          onClick={onReject}
          className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
          title="Decline"
        >
          <PhoneOff className="h-5 w-5 text-red-400" />
        </button>
        <button
          onClick={onAccept}
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