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
  ],
};

export const PeerProvider = ({ children }) => {
  const peerRef         = useRef(null);
  const callTargetRef   = useRef(null);
  const iceCandidates   = useRef([]);
  const remoteStreamRef = useRef(null);        // ← NEW: ref to avoid stale closure

  const [remoteStream, setRemoteStream] = useState(null);
  const { socket } = authStore();

  // ── stable setter that always works even inside stale closures
  const updateRemoteStream = useCallback((stream) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
  }, []);

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

  const buildPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    iceCandidates.current = [];
    remoteStreamRef.current = null;       // ← reset on new call
    setRemoteStream(null);                // ← reset state too

    const peer = new RTCPeerConnection(ICE_SERVERS);

    // ── ICE → forward to other peer
    peer.onicecandidate = ({ candidate }) => {
      if (candidate && socket && callTargetRef.current) {
        socket.emit("ice-candidate", {
          candidate,
          to: callTargetRef.current,
        });
      }
    };

    // ── Remote track arrived — wire to a NEW MediaStream
    peer.ontrack = (event) => {
      console.log("[Peer] ontrack fired:", event.track.kind);

      // Always build a fresh MediaStream so the audio element re-triggers
      if (!remoteStreamRef.current) {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        updateRemoteStream(stream);        // ← use stable updater
      } else {
        remoteStreamRef.current.addTrack(event.track);
        updateRemoteStream(remoteStreamRef.current);
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("[Peer] connection:", peer.connectionState);
      // Clean up on failure
      if (peer.connectionState === "failed" || peer.connectionState === "closed") {
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

  // ── createOffer (caller)
  const createOffer = useCallback(async (stream, targetId) => {
    callTargetRef.current = targetId;

    const peer = buildPeer();

    stream.getAudioTracks().forEach((track) => {
      console.log("[Peer] Adding local audio track:", track.label);
      peer.addTrack(track, stream);
    });

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  }, [buildPeer]);

  // ── createAnswer (callee)
  const createAnswer = useCallback(async (offer, stream, targetId) => {
    callTargetRef.current = targetId;

    const peer = buildPeer();

    stream.getAudioTracks().forEach((track) => {
      console.log("[Peer] Adding local audio track:", track.label);
      peer.addTrack(track, stream);
    });

    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIceCandidates();

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  }, [buildPeer, flushIceCandidates]);

  // ── setAnswer (caller applies callee's answer)
  const setAnswer = useCallback(async (answer) => {
    const peer = peerRef.current;
    if (!peer) throw new Error("[Peer] No active peer connection");

    await peer.setRemoteDescription(new RTCSessionDescription(answer));
    await flushIceCandidates();
  }, [flushIceCandidates]);

  // ── ICE candidates from socket
  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;

      const peer = peerRef.current;

      if (!peer || !peer.remoteDescription) {
        console.log("[Peer] Queuing ICE candidate");
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

  // ── Cleanup
  useEffect(() => {
    return () => {
      peerRef.current?.close();
    };
  }, []);

  return (
    <PeerContext.Provider
      value={{ remoteStream, createOffer, createAnswer, setAnswer }}
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