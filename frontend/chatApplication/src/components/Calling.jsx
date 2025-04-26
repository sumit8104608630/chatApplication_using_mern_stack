import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, Mic, MicOff } from 'lucide-react';
import { usePeer } from './Peer'; // Import the peer context

export default function CallerInterface({ callData, endCall, localStream, callOn }) {
  const { remoteStream } = usePeer(); // Get the remote stream from context
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState('dialing'); // dialing, connected, ended
  const [callDuration, setCallDuration] = useState("00:00");
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);
  
  // Connect local stream to audio element
  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
      // Explicitly call play to ensure audio starts
      localAudioRef?.current.play().catch(e => {
        console.error("Error playing local audio:", e);
      });
    }
  }, [localStream]);
  
  // Connect remote stream to audio element when it becomes available
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      console.log("Setting remote stream to audio element in CallerInterface");
      remoteAudioRef.current.srcObject = remoteStream;
      // Explicitly call play to ensure audio starts
      remoteAudioRef.current.play().catch(e => {
        console.error("Error playing remote audio:", e);
      });
    }
  }, [remoteStream]);
  
  // Debug audio tracks
  useEffect(() => {
    if (localStream) {
      console.log("Local audio tracks:", localStream.getAudioTracks().map(t => ({ 
        enabled: t.enabled, 
        muted: t.muted,
        readyState: t.readyState
      })));
    }
    
    if (remoteStream) {
      console.log("Remote audio tracks:", remoteStream.getAudioTracks().map(t => ({ 
        enabled: t.enabled, 
        muted: t.muted,
        readyState: t.readyState
      })));
    }
  }, [localStream, remoteStream]);
  
  // Start the timer when status changes to connected
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
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);
  
  // Update call status when callOn changes
  useEffect(() => {
    if (callOn) {
      setCallStatus('connected');
    }
  }, [callOn]);
  
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const handleEndCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    endCall();
  };
  
  return (
    <div className="fixed top-4 right-4 w-80 bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800 z-50">
      {/* Header */}
      <div className="bg-teal-500 px-4 py-2 flex items-center justify-between">
        <span className="text-white font-medium flex items-center">
          <Phone className="mr-2 h-4 w-4" />
          {callStatus === 'dialing' ? 'Calling...' : 
           callStatus === 'connected' ? 'On Call' : 'Call Ended'}
        </span>
        <button 
          onClick={handleEndCall}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Recipient information */}
      <div className="px-4 py-3 flex items-center">
        <img
          src={callData.profilePhoto || "/api/placeholder/48/48"}
          className="w-10 h-10 rounded-full object-cover mr-3"
          alt={callData.name}
        />
        <div>
          <p className="font-medium text-white">{callData.name}</p>
          <p className="text-xs text-gray-400">
            {callStatus === 'dialing' ? 'Ringing...' : 
             callStatus === 'connected' ? `Duration: ${callDuration}` : 'Call ended'}
          </p>
        </div>
      </div>
      
      {/* Action buttons */}
      {callStatus !== 'ended' && (
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
            onClick={handleEndCall}
            className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 text-red-500 font-medium transition-colors flex items-center justify-center border-l border-gray-700"
          >
            <X className="mr-2 h-4 w-4" />
            End Call
          </button>
        </div>
      )}
      
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