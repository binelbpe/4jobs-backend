import { Request, Response } from 'express';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const getTwilioToken = async (req: Request, res: Response) => {
  try {
    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return res.status(500).json({ error: 'Twilio configuration error' });
    }

    // Create token with Network Traversal Service enabled
    const token = await client.tokens.create();

    // Log the servers we got from Twilio (for debugging)
    console.log('Twilio ICE Servers:', token.iceServers?.map(server => ({
      urls: server.urls || server.url,
      type: server.urls?.toString().includes('turn') ? 'TURN' : 'STUN'
    })));

    // Format the response
    const response = {
      iceServers: [
        // Twilio's STUN/TURN servers come first
        ...(token.iceServers?.map(server => ({
          urls: server.urls || server.url,
          username: server.username || '',
          credential: server.credential || ''
        })) || []),
        // Fallback STUN servers
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
      ],
      ttl: token.ttl || 3600,
      date_created: token.dateCreated
    };

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json(response);
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      code: 'TWILIO_TOKEN_ERROR'
    });
  }
}; 