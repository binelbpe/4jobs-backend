import { Request, Response } from 'express';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

interface TwilioTokenResponse {
  iceServers: Array<{
    url?: string;
    urls?: string | string[];
    username?: string;
    credential?: string;
  }>;
  ttl: number;
  date_created: Date;
}

export const getTwilioToken = async (req: Request, res: Response) => {
  try {
    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    // Create token with default options
    const token = await client.tokens.create();

    console.log('Twilio token created:', {
      iceServers: token.iceServers?.length,
      ttl: token.ttl
    });

    // Format the response
    const response: TwilioTokenResponse = {
      iceServers: token.iceServers?.map(server => ({
        urls: server.url || server.urls,
        username: server.username,
        credential: server.credential
      })) || [],
      ttl: 3600, // 1 hour
      date_created: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    res.status(500).json({ 
      error: 'Failed to generate Twilio token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 