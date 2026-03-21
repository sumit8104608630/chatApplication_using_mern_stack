import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { authStore } from "../store/userAuth.store.js";

const PeerContext = createContext(null);

  // ─── Constants ─────────────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    // --- TURN Servers (Primary) ---
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "9abe2392a35d2cc1474c2eee",
      credential: "5ZR0R5WRC7DmLLmn",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "9abe2392a35d2cc1474c2eee",
      credential: "5ZR0R5WRC7DmLLmn",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "9abe2392a35d2cc1474c2eee",
      credential: "5ZR0R5WRC7DmLLmn",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "9abe2392a35d2cc1474c2eee",
      credential: "5ZR0R5WRC7DmLLmn",
    },
    // --- STUN Servers (Fallback) ---
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.relay.metered.ca:80" },
  ],
};

// ─── Peer Provider Component ────────────────────────────────────────────────
export const PeerProvider = ({ children }) => {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const peerRef       = useRef(null);
  const callTargetRef = useRef(null);
  const iceCandidates = useRef([]);
  const remoteStreamRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [remoteStream, setRemoteStream] = useState(null);
  const { socket } = authStore();

  // ── Remote Stream Management ──────────────────────────────────────────────
  const updateRemoteStream = useCallback((stream) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
  }, []);

  // ── ICE Candidate Management ──────────────────────────────────────────────
  const flushIceCandidates = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) return;

    while (iceCandidates.current.length > 0) {
      const candidate = iceCandidates.current.shift();
      try {
        await peer.addIceCandidate(candidate);
      } catch (err) {
        // Silent catch for queued candidates
      }
    }
  }, []);

  // ── Peer Connection Lifecycle ─────────────────────────────────────────────
  const buildPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    remoteStreamRef.current = null;
    setRemoteStream(null);

    const peer = new RTCPeerConnection(ICE_SERVERS);

    // Forward local ICE candidates to the remote peer
    peer.onicecandidate = ({ candidate }) => {
      if (candidate && socket && callTargetRef.current) {
        socket.emit("ice-candidate", {
          candidate,
          to: callTargetRef.current,
        });
      }
    };

    // Handle incoming media tracks
    peer.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      
      const existingTracks = remoteStreamRef.current.getTracks();
      if (!existingTracks.find(t => t.id === event.track.id)) {
        remoteStreamRef.current.addTrack(event.track);
      }

      updateRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
    };

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        updateRemoteStream(null);
      }
    };

    peerRef.current = peer;
    return peer;
  }, [socket, updateRemoteStream]);

  // ── Call Target Management ────────────────────────────────────────────────
  const setCallTarget = useCallback((targetId) => {
    callTargetRef.current = targetId;
  }, []);

  // ── Signaling Actions ─────────────────────────────────────────────────────
  const createOffer = useCallback(
    async (stream, targetId, isVideo = false) => {
      setCallTarget(targetId);
      iceCandidates.current = [];

      const peer = buildPeer();

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
      
      await peer.setLocalDescription(offer);
      return offer;
    },
    [buildPeer, setCallTarget]
  );

  const createAnswer = useCallback(
    async (offer, stream, targetId, isVideo = false) => {
      const peer = buildPeer();
      setCallTarget(targetId);

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        await flushIceCandidates();

        const answer = await peer.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo,
        });
        
        await peer.setLocalDescription(answer);
        return answer;
      } catch (err) {
        throw err;
      }
    },
    [buildPeer, flushIceCandidates, setCallTarget]
  );

const setAnswer = useCallback(async (answer) => {
    const peer = peerRef.current;
    if (!peer) return;
    if (peer.signalingState === "stable") return;

    try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        await flushIceCandidates();
    } catch (err) {
        // Handle answer error silently
    }
}, [flushIceCandidates]);

  const resetPeer = useCallback(() => {
    callTargetRef.current = null;
    iceCandidates.current  = [];
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    remoteStreamRef.current = null;
    updateRemoteStream(null);
  }, [updateRemoteStream]);

  // ── Socket Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;

      const peer = peerRef.current;

      if (!peer || !peer.remoteDescription) {
        iceCandidates.current.push(candidate);
        return;
      }

      try {
        await peer.addIceCandidate(candidate);
      } catch (err) {
        // Handle ICE error silently
      }
    };

    socket.on("ice-candidate", handleIceCandidate);
    return () => socket.off("ice-candidate", handleIceCandidate);
  }, [socket]);

  // ── Browser Lifecycle / Reload Protection ──────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const savedCall = sessionStorage.getItem("activeCall");
      if (peerRef.current || callTargetRef.current || savedCall) {
        e.preventDefault();
        e.returnValue = "You are in an active call process. Reloading now may cut the call. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    const handleUnload = () => {
      if (callTargetRef.current && socket) {
        socket.emit("call-ended", { to: callTargetRef.current });
        sessionStorage.removeItem("activeCall");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [socket]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      peerRef.current?.close();
    };
  }, []);

  return (
    <PeerContext.Provider
      value={{ remoteStream, createOffer, createAnswer, setAnswer, resetPeer, setCallTarget }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (!context) throw new Error("usePeer must be used within a PeerProvider");
  return context;
};