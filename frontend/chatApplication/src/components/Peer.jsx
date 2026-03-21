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

export const PeerProvider = ({ children }) => {
  const peerRef       = useRef(null);
  const callTargetRef = useRef(null);
  const iceCandidates = useRef([]);
  const remoteStreamRef = useRef(null);

  const [remoteStream, setRemoteStream] = useState(null);
  const { socket } = authStore();

  // ── Stable setter — safe inside stale closures ─────────────────────────────
  const updateRemoteStream = useCallback((stream) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
  }, []);

  // ── Flush queued ICE candidates (call AFTER setRemoteDescription) ──────────
  const flushIceCandidates = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) return;

    while (iceCandidates.current.length > 0) {
      const candidate = iceCandidates.current.shift();
      try {
        await peer.addIceCandidate(candidate);
      } catch (err) {
        console.error("[Peer] Failed to add queued ICE candidate:", err);
      }
    }
  }, []);

  // ── Build a fresh RTCPeerConnection ────────────────────────────────────────
  const buildPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    // DO NOT reset iceCandidates.current here because candidates might have
    // arrived while the phone was ringing (before Accept was clicked).
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

    // BUG 4 FIX — use the existing stream if provided, otherwise build one.
    // Using event.streams[0] is standard for RTCPeerConnection.
    peer.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      updateRemoteStream(stream);
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

  // ── Stable setter for call target ──────────────────────────────────────────
  const setCallTarget = useCallback((targetId) => {
    callTargetRef.current = targetId;
  }, []);

  // ── createOffer — caller side ──────────────────────────────────────────────
  const createOffer = useCallback(
    async (stream, targetId, isVideo = false) => {
      setCallTarget(targetId);
      iceCandidates.current = []; // Start fresh for a new call session

      const peer = buildPeer();

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      // Explicitly tell the browser we want to receive audio/video
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
      
      await peer.setLocalDescription(offer);
      return offer;
    },
    [buildPeer, setCallTarget]
  );

  // ── createAnswer — callee side ─────────────────────────────────────────────
  // BUG 1 FIX — flushIceCandidates moved to AFTER setRemoteDescription so
  // candidates are not added while remoteDescription is still null.
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
        console.error("[Peer] createAnswer failed:", err);
        throw err;
      }
    },
    [buildPeer, flushIceCandidates, setCallTarget]
  );

  // ── setAnswer — caller applies callee's answer ─────────────────────────────
  // BUG 2 FIX — replaced throw with a warning + early return so an accidental
  // double-call doesn't crash the caller's async chain silently.
const setAnswer = useCallback(async (answer) => {
    const peer = peerRef.current;
    if (!peer) return;
    
    // DEFENSIVE CHECK: If we are already stable, we've already applied an answer.
    if (peer.signalingState === "stable") return;

    try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        await flushIceCandidates();
    } catch (err) {
        console.error("[Peer] setRemoteDescription (answer) failed:", err);
    }
}, [flushIceCandidates]);

  // ── BUG 3 FIX — expose a cleanup helper so ChatHomePage can clear the ref
  // when the call ends, preventing stale ICE events from emitting to old peers.
  const resetPeer = useCallback(() => {
    callTargetRef.current = null;
    iceCandidates.current  = [];
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    updateRemoteStream(null);
  }, [updateRemoteStream]);

  // ── ICE candidates arriving from the socket ────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;

      const peer = peerRef.current;

      if (!peer || !peer.remoteDescription) {
        console.log("[Peer] Queuing ICE candidate (no remoteDescription yet)");
        iceCandidates.current.push(candidate);
        return;
      }

      try {
        console.log("[Peer] Adding ICE candidate from socket");
        await peer.addIceCandidate(candidate);
      } catch (err) {
        console.error("[Peer] addIceCandidate error:", err);
      }
    };

    socket.on("ice-candidate", handleIceCandidate);
    return () => socket.off("ice-candidate", handleIceCandidate);
  }, [socket]);

  // ── Prevent Page Reload during active calls ────────────────────────────────
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
      // If the user actually proceeds with the reload/close, notify the other peer
      if (callTargetRef.current && socket) {
        socket.emit("call-ended", { to: callTargetRef.current });
        // Clear storage so the other side doesn't try to reconnect to a dead socket
        sessionStorage.removeItem("activeCall");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleUnload); // pagehide is more reliable than unload
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [socket]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
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