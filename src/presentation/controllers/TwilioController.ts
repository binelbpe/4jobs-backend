import { Request, Response } from "express";
import twilio from "twilio";
import { v4 as uuidv4 } from "uuid";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const getTwilioToken = async (req: Request, res: Response) => {
  try {
    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return res.status(500).json({ error: 'Twilio configuration error' });
    }

    // Add rate limiting check here
    const roomName = `room-${uuidv4()}`;
    
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const videoGrant = new VideoGrant({ room: roomName });

    const token = new AccessToken(
      accountSid,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      { 
        identity: req.query.identity as string || 'user',
        ttl: 14400 // 4 hours token expiry
      }
    );

    token.addGrant(videoGrant);

    // Get Network Traversal Service token with longer TTL
    const ntsToken = await client.tokens.create({
      ttl: 14400 // 4 hours
    });

    // Format ICE servers with both TURN and STUN
    const iceServers = ntsToken.iceServers?.map(server => ({
      urls: server.urls,
      username: server.username || '',
      credential: server.credential || ''
    })) || [];

    // Add additional STUN servers for redundancy
    iceServers.push(
      {
        urls: 'stun:global.stun.twilio.com:3478',
        username: '',
        credential: ''
      },
      {
        urls: 'stun:stun1.l.google.com:19302',
        username: '',
        credential: ''
      }
    );

    res.json({
      username: ntsToken.username,
      ice_servers: iceServers,
      ttl: ntsToken.ttl.toString(),
      token: token.toJwt(),
      roomName: roomName
    });
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const endRoom = async (req: Request, res: Response) => {
  try {
    const { roomSid } = req.params;
    await client.video.v1.rooms(roomSid).update({ status: "completed" });
    res.json({ message: "Room ended successfully" });
  } catch (error) {
    console.error("Error ending room:", error);
    res.status(500).json({ error: "Failed to end room" });
  }
};
