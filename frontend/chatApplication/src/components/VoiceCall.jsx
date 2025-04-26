import React, { useState, useRef, useEffect } from 'react';
import { Phone, X, MicOff, Mic, PhoneOff } from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import { usePeer } from './Peer'; // Import the peer context

function VoiceCall({ incomingCall, rejectCall, acceptIncomingCall }) {
  const { socket, authUser } = authStore();
  const { remoteStream } = usePeer(); // Get the remote stream from context
  const [callActive, setCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  
  // Accept the call
  const acceptCall = async () => {
    try {
      // Get user media stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        // Explicitly call play
        localAudioRef.current.play().catch(e => {
          console.error("Error playing local audio:", e);
        });
      }
      
      await acceptIncomingCall(); // Use the provided function
      
      setCallActive(true);
      startTimer();
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };
  
  // Connect the remote stream to the audio element when it becomes available
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      console.log("Setting remote stream to audio element");
      remoteAudioRef.current.srcObject = remoteStream;
      // Explicitly call play
      remoteAudioRef.current.play().catch(e => {
        console.error("Error playing remote audio:", e);
      });
    }
  }, [remoteStream]);
  
  // Debug audio tracks
  useEffect(() => {
    if (localStreamRef.current) {
      console.log("Local audio tracks in VoiceCall:", localStreamRef.current.getAudioTracks().map(t => ({ 
        enabled: t.enabled, 
        muted: t.muted,
        readyState: t.readyState
      })));
    }
    
    if (remoteStream) {
      console.log("Remote audio tracks in VoiceCall:", remoteStream.getAudioTracks().map(t => ({ 
        enabled: t.enabled, 
        muted: t.muted,
        readyState: t.readyState
      })));
    }
  }, [localStreamRef.current, remoteStream]);
  
  // Start the call timer
  const startTimer = () => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
  };
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Toggle mute state
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // End the active call
  const endActiveCall = () => {
    socket.emit("endCall", {
      to: incomingCall._id,
      from: authUser._id
    });
    
    // Clean up
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setCallActive(false);
    rejectCall(); // Use the provided function to clean up state
  };
  
  // If call is active, show the active call UI
  if (callActive) {
    return (
      <div className="fixed top-4 right-4 w-80 bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800 z-50">
        {/* Header */}
        <div className="bg-teal-500 px-4 py-2 flex items-center justify-between">
          <span className="text-white font-medium flex items-center">
            <Phone className="mr-2 h-4 w-4" />
            Voice Call
          </span>
          <button
            onClick={endActiveCall}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
        
        {/* User information */}
        <div className="px-4 py-3 flex items-center">
          <img
            src={incomingCall.profilePhoto || "/api/placeholder/48/48"}
            alt={incomingCall.name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div>
            <p className="font-medium text-white">{incomingCall.name}</p>
            <p className="text-xs text-gray-400">Call duration: {callDuration}</p>
          </div>
        </div>
        
        {/* Call controls */}
        <div className="flex border-t border-gray-800">
          <button
            onClick={toggleMute}
            className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center ${
              isMuted ? 'bg-red-800 hover:bg-red-900 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Mute
              </>
            )}
          </button>
          <button
            onClick={endActiveCall}
            className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 text-red-500 font-medium transition-colors flex items-center justify-center border-l border-gray-700"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Call
          </button>
        </div>
        
        {/* Audio elements with proper attributes */}
        <audio 
          ref={localAudioRef} 
          autoPlay 
          playsInline 
          muted 
          className="hidden" 
        />
        <audio 
          ref={remoteAudioRef} 
          autoPlay 
          playsInline 
          className="hidden" 
        />
      </div>
    );
  }
  
  // If there's an incoming call but not accepted yet, show the incoming call UI
  return (
    <div className="fixed top-4 right-4 w-80 bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800 z-50">
      {/* Header */}
      <div className="bg-teal-500 px-4 py-2 flex items-center justify-between">
        <span className="text-white font-medium flex items-center">
          <Phone className="mr-2 h-4 w-4" />
          Incoming Voice Call
        </span>
        <button
          onClick={rejectCall}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Caller information */}
      <div className="px-4 py-3 flex items-center">
        <img
          src={incomingCall.profilePhoto || "/api/placeholder/48/48"}
          alt={incomingCall.name}
          className="w-10 h-10 rounded-full object-cover mr-3"
        />
        <div>
          <p className="font-medium text-white">{incomingCall.name}</p>
          <p className="text-xs text-gray-400">is calling you</p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex border-t border-gray-800">
        <button
          onClick={acceptCall}
          className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 text-teal-500 font-medium transition-colors flex items-center justify-center"
        >
          <Phone className="mr-2 h-4 w-4" />
          Accept
        </button>
        <button
          onClick={rejectCall}
          className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 text-red-500 font-medium transition-colors flex items-center justify-center border-l border-gray-700"
        >
          <X className="mr-2 h-4 w-4" />
          Decline
        </button>
      </div>
    </div>
  );
}

export default VoiceCall;