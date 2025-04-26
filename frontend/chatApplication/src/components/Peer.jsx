import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authStore } from '../store/userAuth.store.js';

const PeerContext = createContext(null);

export const PeerProvider = ({ children }) => {
  const peerRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const { socket } = authStore();
  
  // Store the active call target ID for routing ICE candidates
  const activeCallTargetRef = useRef(null);

  // Initialize peer connection with ICE servers
  const initializePeer = useCallback(() => {
    if (peerRef.current) {
      // Clean up existing connection if any
      peerRef.current.close();
    }
    
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    });

    // Handle ICE candidate events
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate", event.candidate);
        // Emit the candidate to the other peer through the server
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: activeCallTargetRef.current
        });
      }
    };

    // Handle incoming tracks (audio/video)
    peer.ontrack = (event) => {
      console.log("Received remote track", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    // Add connection state debugging
    peer.onconnectionstatechange = () => {
      console.log("Connection state changed:", peer.connectionState);
    };
    
    peer.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peer.iceConnectionState);
    };
    
    peer.onsignalingstatechange = () => {
      console.log("Signaling state:", peer.signalingState);
    };

    peerRef.current = peer;
    return peer;
  }, [socket]);

  // Create offer for outgoing calls
  const createOffer = useCallback(async (stream) => {
    try {
      const peer = initializePeer();
      
      // Add local tracks to the connection
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });

      // Create and set local description
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      console.log("Created offer:", offer);
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }, [initializePeer]);

  // Create answer for incoming calls
  const create_answer = useCallback(async (offer, stream) => {
    try {
      const peer = initializePeer();
      
      // Add local tracks to the connection
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });

      // Set remote description (the offer)
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create and set local description (the answer)
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      console.log("Created answer:", answer);
      return answer;
    } catch (error) {
      console.error("Error creating answer:", error);
      throw error;
    }
  }, [initializePeer]);

  // Set remote answer for established connections
  const setRemoteAnswer = useCallback(async (answer) => {
    try {
      const peer = peerRef.current;
      if (peer && answer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Set remote answer");
      }
    } catch (error) {
      console.error("Error setting remote answer:", error);
      throw error;
    }
  }, []);

  // Add a function to send local stream to the peer connection
  const sendStream = useCallback(async (stream) => {
    try {
      const peer = peerRef.current;
      if (peer && stream) {
        // Get existing senders
        const senders = peer.getSenders();
        if (senders.length === 0) {
          // If no senders exist, add tracks
          stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
          });
        } else {
          // If senders exist, replace tracks
          senders.forEach((sender, idx) => {
            if (idx < stream.getTracks().length) {
              sender.replaceTrack(stream.getTracks()[idx]);
            }
          });
        }
        console.log("Stream sent to peer connection");
      }
    } catch (error) {
      console.error("Error sending stream:", error);
    }
  }, []);

  // Set active call target for ICE candidates
  const setActiveCallTarget = useCallback((targetId) => {
    console.log("Setting active call target:", targetId);
    activeCallTargetRef.current = targetId;
  }, []);

  // Listen for ICE candidates from the server
  useEffect(() => {
    const handleIceCandidate = async ({ candidate }) => {
      try {
        const peer = peerRef.current;
        if (peer && candidate) {
          // Check if remote description is set before adding ICE candidate
          if (peer.remoteDescription) {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("Added ICE candidate");
          } else {
            console.log("Delayed ICE candidate - remote description not set yet");
            // Could implement a queue for delayed candidates if needed
          }
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    };

    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket]);

  return (
    <PeerContext.Provider value={{ 
      peer: peerRef.current,
      remoteStream,
      createOffer,
      create_answer,
      setRemoteAnswer,
      sendStream,
      setActiveCallTarget
    }}>
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return context;
};