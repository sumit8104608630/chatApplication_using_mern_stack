import React from 'react';
import { Phone, MicOff, Mic, PhoneOff } from 'lucide-react';

export default function VoiceCall({ incomingCall, callActive, isMuted, callDuration, onAccept, onReject, onToggleMute, onEndCall }) {

  const Avatar = () => (
    incomingCall?.callerInfo?.profilePhoto
      ? <img src={incomingCall.callerInfo.profilePhoto} alt={incomingCall.callerInfo.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500" />
      : <div className="w-16 h-16 rounded-full bg-[#0e7970] ring-2 ring-teal-500 flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">
            {incomingCall?.callerInfo?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
  );

  // Active call UI
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
        <div className="flex items-center justify-center gap">