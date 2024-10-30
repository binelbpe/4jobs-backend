import { Request, Response } from 'express';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

const client = twilio(accountSid, authToken);

export const getTwilioToken = async (req: Request, res: Response) => {
  try {
    if (!accountSid || !authToken || !apiKey || !apiSecret) {
      console.error('Missing Twilio credentials');
      return res.status(500).json({ error: 'Twilio configuration error' });
    }

    // Create token with Network Traversal Service
    const token = await client.tokens.create({
      ttl: 3600
    });

    // Log token creation but not sensitive data
    console.log('Twilio token created:', {
      timestamp: new Date().toISOString(),
      iceServers: token.iceServers?.length || 0
    });

    // Format and sanitize the response
    const response = {
      iceServers: token.iceServers?.map(server => ({
        urls: server.url || server.urls,
        username: server.username,
        credential: server.credential
      })) || [],
      ttl: token.ttl || 3600,
      date_created: token.dateCreated || new Date()
    };

    // Cache control headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json(response);
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    
    // Don't expose internal error details to client
    res.status(500).json({ 
      error: 'Failed to generate token',
      code: 'TWILIO_TOKEN_ERROR'
    });
  }
}; 