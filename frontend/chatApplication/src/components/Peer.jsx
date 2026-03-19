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
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.ekiga.net" },
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
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
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

    iceCandidates.current  = [];
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
      console.log("[Peer] ontrack fired:", event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      updateRemoteStream(stream);
    };

    peer.onconnectionstatechange = () => {
      console.log("[Peer] connection:", peer.connectionState);
      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        updateRemoteStream(null);
      }
    };

    peer.oniceconnectionstatechange = () =>
      console.log("[Peer] ICE:", peer.iceConnectionState);

    peer.onsignalingstatechange = () =>
      console.log("[Peer] signaling:", peer.signalingState);

    peerRef.current = peer;
    return peer;
  }, [socket, updateRemoteStream]);

  // ── createOffer — caller side ──────────────────────────────────────────────
  const createOffer = useCallback(
    async (stream, targetId) => {
      callTargetRef.current = targetId;

      const peer = buildPeer();

      stream.getAudioTracks().forEach((track) => {
        console.log("[Peer] Adding local audio track:", track.label);
        peer.addTrack(track, stream);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      return offer;
    },
    [buildPeer]
  );

  // ── createAnswer — callee side ─────────────────────────────────────────────
  // BUG 1 FIX — flushIceCandidates moved to AFTER setRemoteDescription so
  // candidates are not added while remoteDescription is still null.
  const createAnswer = useCallback(
    async (offer, stream, targetId) => {
      callTargetRef.current = targetId;

      const peer = buildPeer();

      stream.getAudioTracks().forEach((track) => {
        console.log("[Peer] Adding local audio track:", track.label);
        peer.addTrack(track, stream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIceCandidates(); // ← correct position: after setRemoteDescription

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    },
    [buildPeer, flushIceCandidates]
  );

  // ── setAnswer — caller applies callee's answer ─────────────────────────────
  // BUG 2 FIX — replaced throw with a warning + early return so an accidental
  // double-call doesn't crash the caller's async chain silently.
const setAnswer = useCallback(async (answer) => {
    const peer = peerRef.current;
    console.log("🔧 setAnswer called, peer exists:", !!peer, "answer type:", answer?.type);
    if (!peer) {
        console.warn("[Peer] setAnswer — no active peer, ignoring");
        return;
    }
    console.log("🔧 peer signalingState before setRemoteDescription:", peer.signalingState);
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("🔧 setRemoteDescription done, flushing ICE...");
    await flushIceCandidates();
    console.log("🔧 ICE flush done");
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
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[Peer] addIceCandidate error:", err);
      }
    };

    socket.on("ice-candidate", handleIceCandidate);
    return () => socket.off("ice-candidate", handleIceCandidate);
  }, [socket]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      peerRef.current?.close();
    };
  }, []);

  return (
    <PeerContext.Provider
      value={{ remoteStream, createOffer, createAnswer, setAnswer, resetPeer }}
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