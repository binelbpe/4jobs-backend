import { Request, Response } from 'express';
import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

const client = twilio(apiKeySid, apiKeySecret, { accountSid });

export const getTwilioToken = async (req: Request, res: Response) => {
  try {
    if (!accountSid || !apiKeySid || !apiKeySecret) {
      console.error('Missing Twilio credentials');
      return res.status(500).json({ error: 'Twilio configuration error' });
    }

    // Create a unique room name
    const roomName = `room-${uuidv4()}`;

    // Create a Video room
    const room = await client.video.v1.rooms.create({
      uniqueName: roomName,
      type: 'peer-to-peer', // Use P2P mode
      maxParticipants: 2,   // Limit to 2 participants
    });

    // Create an Access Token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    // Create Video grant
    const videoGrant = new VideoGrant({
      room: roomName
    });

    // Create access token
    const token = new AccessToken(
      accountSid,
      apiKeySid,
      apiKeySecret,
      { identity: req.query.identity as string || 'user' }
    );

    // Add video grant to token
    token.addGrant(videoGrant);

    // Generate the token
    const accessToken = token.toJwt();

    const response = {
      token: accessToken,
      roomName: roomName,
      roomSid: room.sid,
      expires: Date.now() + (3600 * 1000) // 1 hour from now
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};

// Add endpoint to end room
export const endRoom = async (req: Request, res: Response) => {
  try {
    const { roomSid } = req.params;

    await client.video.v1.rooms(roomSid)
      .update({ status: 'completed' });

    res.json({ message: 'Room ended successfully' });
  } catch (error) {
    console.error('Error ending room:', error);
    res.status(500).json({ error: 'Failed to end room' });
  }
}; 