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

    // Create token with default options
    const token = await client.tokens.create();

    // Format the response with all available servers
    const response = {
      iceServers: [
        // Include Google STUN servers as fallback
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
        // Add Twilio's TURN servers
        ...(token.iceServers?.map(server => ({
          urls: Array.isArray(server.urls) ? server.urls : [server.urls],
          username: server.username || '',
          credential: server.credential || ''
        })) || [])
      ],
      ttl: 3600,
      date_created: new Date()
    };

    // Add security headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Credentials': 'true'
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