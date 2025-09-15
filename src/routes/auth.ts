import express from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { databaseService } from '../services/databaseService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth login
const googleLoginSchema = z.object({
  token: z.string().min(1, 'Google token is required'),
});

router.post('/google', asyncHandler(async (req, res) => {
  const { token } = googleLoginSchema.parse(req.body);
  
  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token'
      });
    }
    
    // Extract user information
    const userData = {
      google_id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      avatar_url: payload.picture,
    };
    
    // Upsert user in database
  const user = await databaseService.getInstance().upsertUser(userData);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      }
    });
    
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}));

// Get current user (would need JWT middleware)
router.get('/me', asyncHandler(async (req, res) => {
  // This would require JWT authentication middleware
  res.json({
    success: true,
    message: 'Get current user endpoint - requires JWT middleware'
  });
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

export default router;
