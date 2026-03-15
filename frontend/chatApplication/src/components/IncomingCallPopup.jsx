import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';

const IncomingCallPopup = ({ incomingCall, onAccept, onReject }) => {
  const [ringing, setRinging] = useState(true);

  // pulse the ring animation every 1.8s
  useEffect(() => {
    const id = setInterval(() => setRinging(r => !r), 900);
    return () => clearInterval(id);
  }, []);

  const callerName =
    incomingCall?.name ||
    incomingCall?.fullName ||
    incomingCall?.phone ||
    'Unknown';

  const avatar = incomingCall?.profilePhoto;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-80 rounded-3xl flex flex-col items-center py-10 px-8 gap-6"
        style={{
          background:
            'linear-gradient(160deg, #0f1923 0%, #122333 60%, #0a1a1a 100%)',
          boxShadow:
            '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,158,117,0.15)',
        }}
      >
        {/* label */}
        <p
          className="text-teal-400 text-xs tracking-widest uppercase font-semibold"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Incoming call
        </p>

        {/* avatar + pulse rings */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute w-28 h-28 rounded-full border border-teal-500/30 animate-ping"
            style={{ animationDuration: '1.8s' }}
          />
          <span
            className="absolute w-24 h-24 rounded-full border border-teal-400/20 animate-ping"
            style={{ animationDuration: '2.4s' }}
          />
          {avatar ? (
            <img
              src={avatar}
              alt={callerName}
              className="w-20 h-20 rounded-full object-cover border-2 border-teal-500/50 relative z-10"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white relative z-10 border-2 border-teal-500/50"
              style={{
                background: 'linear-gradient(135deg, #0e7970, #0f5c55)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {callerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* name */}
        <p
          className="text-white text-xl font-semibold tracking-wide text-center"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {callerName}
        </p>

        {/* accept / reject buttons */}
        <div className="flex items-center gap-10 mt-2">

          {/* reject */}
          <button
            onClick={onReject}
            title="Decline"
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-150"
              style={{
                width: 60,
                height: 60,
                boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
              }}
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-gray-400">Decline</span>
          </button>

          {/* accept */}
          <button
            onClick={onAccept}
            title="Accept"
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="rounded-full flex items-center justify-center bg-teal-500 hover:bg-teal-400 active:scale-95 transition-all duration-150"
              style={{
                width: 60,
                height: 60,
                boxShadow: '0 8px 24px rgba(29,158,117,0.4)',
              }}
            >
              <Phone className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-gray-400">Accept</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;