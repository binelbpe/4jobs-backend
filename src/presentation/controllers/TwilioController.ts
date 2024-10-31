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

    console.log('Initializing Twilio token generation with:', {
      accountSid: `${accountSid.slice(0, 5)}...`,
      hasAuthToken: !!authToken,
      identity: req.query.identity
    });

    // Create a unique room name
    const roomName = `room-${uuidv4()}`;
    console.log('Created Twilio room:', roomName);

    // Create an Access Token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    // Create Video grant
    const videoGrant = new VideoGrant({
      room: roomName
    });
    console.log('Created Twilio video grant for room:', roomName);

    // Create access token with identity
    const token = new AccessToken(
      accountSid,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      { identity: req.query.identity as string || 'user' }
    );
    console.log('Created Twilio access token for identity:', req.query.identity);

    // Add video grant to token
    token.addGrant(videoGrant);

    // Get Network Traversal Service token
    const ntsToken = await client.tokens.create({
      ttl: 86400 // 24 hours
    });
    console.log('Received Twilio NTS token with:', {
      hasIceServers: ntsToken.iceServers?.length || 0,
      ttl: ntsToken.ttl,
      username: ntsToken.username ? 'present' : 'missing'
    });

    // Format response
    const response = {
      username: ntsToken.username,
      ice_servers: ntsToken.iceServers?.map(server => ({
        urls: server.url || server.urls,
        username: server.username,
        credential: server.credential
      })),
      date_updated: ntsToken.dateUpdated,
      account_sid: ntsToken.accountSid,
      ttl: ntsToken.ttl.toString(),
      date_created: ntsToken.dateCreated,
      password: ntsToken.password,
      token: token.toJwt(),
      roomName: roomName
    };

    console.log('Sending Twilio configuration:', {
      iceServers: response.ice_servers?.length || 0,
      hasToken: !!response.token,
      roomName: response.roomName,
      ttl: response.ttl
    });

    res.json(response);
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add endpoint to end room
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
