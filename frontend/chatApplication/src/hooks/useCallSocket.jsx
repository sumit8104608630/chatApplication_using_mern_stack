// ─────────────────────────────────────────────────────────────────────────────
// useCallSocket.js — drop in src/hooks/
// Handles WebRTC offer/answer/ICE via your existing Socket.io server
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from "react" ;
import { authStore } from "../store/userAuth.store";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
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
  ],
};

export function useCallSocket() {
  const { socket, authUser } = authStore();

  const pcRef             = useRef(null);
  const localStreamRef    = useRef(null);
  const iceCandidateQueue = useRef([]); // queue ICE until remoteDescription is set

  // ── Shared UI state ────────────────────────────────────────────────────────
  const [incomingCall, setIncomingCall] = useState(null); // { from, offer, callerInfo }
  const [activeCall,   setActiveCall]   = useState(null); // { with: userInfo }
  const [callStatus,   setCallStatus]   = useState(null); // dialing|connected|ended|declined
  const [isMuted,      setIsMuted]      = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callRejected, setCallRejected] = useState(null);

  const timerRef = useRef(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const d = Math.floor((Date.now() - start) / 1000);
      const m = String(Math.floor(d / 60)).padStart(2, "0");
      const s = String(d % 60).padStart(2, "0");
      setCallDuration(`${m}:${s}`);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setCallDuration("00:00");
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    iceCandidateQueue.current = [];
    stopTimer();
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
  }, [stopTimer]);

  // ── Mic access ─────────────────────────────────────────────────────────────
  const getMicStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  // ── Build RTCPeerConnection ────────────────────────────────────────────────
  const buildPeer = useCallback((targetUserId) => {
    if (pcRef.current) pcRef.current.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Send our ICE candidates to the other peer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit("ice-candidate", { candidate, to: targetUserId });
      }
    };

    // Receive remote audio
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      setRemoteStream(stream);
      setCallStatus("connected");
      startTimer();
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "disconnected" || state === "failed") {
        cleanup();
        setCallStatus("ended");
      }
    };

    return pc;
  }, [socket, cleanup, startTimer]);

  // ── Drain ICE queue after remoteDescription is set ────────────────────────
  const drainIceQueue = async () => {
    for (const candidate of iceCandidateQueue.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("ICE drain error:", e);
      }
    }
    iceCandidateQueue.current = [];
  };

  // ── Socket event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // RECEIVER: incoming call with offer
    socket.on("incoming-call", ({ from, offer, callerInfo }) => {
      setIncomingCall({ from, offer, callerInfo });
    });

    // CALLER: receiver accepted — set remote description
    socket.on("call-accepted", async ({ answer }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await drainIceQueue();
        // callStatus will flip to "connected" via ontrack
      } catch (e) {
        console.error("setRemoteDescription (answer) error:", e);
      }
    });

    // Either side: declined
    socket.on("decline", () => {
      cleanup();
      setCallStatus("declined");
    });

    // ICE candidate from the other peer — queue if not ready
    socket.on("ice-candidate", async ({ candidate }) => {
      if (!pcRef.current) return;
      if (pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("addIceCandidate error:", e);
        }
      } else {
        iceCandidateQueue.current.push(candidate);
      }
    });

    // Call ended by the other side
    socket.on("endCall", () => {
      cleanup();
      setCallStatus("ended");
    });

    socket.on("user-busy", ({ to }) => {
      setCallRejected({ busy: true, to });
    });

    socket.on("user-unavailable", ({ to }) => {
      setCallRejected({ unavailable: true, to });
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("decline");
      socket.off("ice-candidate");
      socket.off("endCall");
    };
  }, [socket, cleanup]);

  // ── CALLER: start a call ───────────────────────────────────────────────────
  const startCall = useCallback(async (targetUser) => {
    try {
      const stream = await getMicStream();
      const pc     = buildPeer(targetUser._id);

      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", {
        to: targetUser._id,
        from: authUser._id,
        offer,
        callerInfo: { name: authUser.name, profilePhoto: authUser.profilePhoto },
      });

      setActiveCall({ with: targetUser });
      setCallStatus("dialing");
    } catch (err) {
      console.error("startCall error:", err);
      cleanup();
    }
  }, [socket, authUser, buildPeer, cleanup]);

  // ── RECEIVER: accept the call ──────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { from, offer } = incomingCall;

    try {
      const stream = await getMicStream();
      const pc     = buildPeer(from);

      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

      // Set remote description (offer from caller)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Drain any ICE candidates that arrived before we were ready
      await drainIceQueue();

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("accept-call", {
        from: authUser._id,
        to: from,
        answer,
      });

      setActiveCall({ with: incomingCall.callerInfo });
      setIncomingCall(null);
    } catch (err) {
      console.error("acceptCall error:", err);
      cleanup();
    }
  }, [socket, authUser, incomingCall, buildPeer, cleanup]);

  // ── RECEIVER: decline ─────────────────────────────────────────────────────
  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    socket.emit("decline", { to: incomingCall.from });
    setIncomingCall(null);
  }, [socket, incomingCall]);

  // ── Either side: end call ─────────────────────────────────────────────────
  const endCall = useCallback((targetUserId) => {
    socket.emit("endCall", { to: targetUserId, from: authUser._id });
    cleanup();
    setCallStatus("ended");
  }, [socket, authUser, cleanup]);

  // ── Toggle mute ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  }, []);

  return {
    // State
    incomingCall,   // not null → show VoiceCall
    activeCall,     // not null → show CallerInterface
    callStatus,     // "dialing" | "connected" | "ended" | "declined"
    isMuted,
    callDuration,
    localStream,
    remoteStream,
    callRejected,

    // Actions
    startCall,      // startCall(targetUser)
    acceptCall,
    declineCall,
    endCall,        // endCall(targetUserId)
    toggleMute,
  };
}