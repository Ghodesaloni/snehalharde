const express = require("express");
const router = express.Router();
const { AccessToken, RoomAgentDispatch, RoomConfiguration } = require("livekit-server-sdk");

// Token generation endpoint for Candidate Live Interview
router.all("/token", async (req, res) => {
  try {
    const API_KEY = process.env.LIVEKIT_API_KEY || "APInMsF4Zfvtpf4";
    const API_SECRET = process.env.LIVEKIT_API_SECRET || "fDPrINGnzH8u4anxN0AtUecjsjQu0nKr6VtCCm4Vhgp";
    const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://avahire-interview-odja2ewy.livekit.cloud";
    const AGENT_NAME = process.env.AGENT_NAME || "my-agent";

    const body = req.method === "POST" ? (req.body || {}) : (req.query || {});

    const participantName = body.participant_name || body.name || "Candidate";
    const roomCode = body.code || body.room_name || body.room || "demo-session";
    const roomName = roomCode.startsWith("interview_") ? roomCode : `interview_${roomCode}`;
    const participantIdentity = body.participant_identity || body.identity || `cand_${roomCode}_${Math.floor(Math.random() * 100000)}`;

    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      ttl: "2h",
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const roomConfig = new RoomConfiguration();
    if (AGENT_NAME) {
      roomConfig.agents = [new RoomAgentDispatch({ agentName: AGENT_NAME })];
    }
    at.roomConfig = roomConfig;

    const participantToken = await at.toJwt();

    return res.json({
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName,
      participantIdentity,
      participantToken,
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return res.status(500).json({
      error: "Failed to generate interview room token",
      details: error.message,
    });
  }
});

module.exports = router;
