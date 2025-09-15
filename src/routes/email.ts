import express from 'express';
import { z } from 'zod';
import { emailService } from '../services/emailService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Email validation schema
const emailSchema = z.object({
  to: z.string().email('Invalid email address'),
  from: z.string().email('Invalid sender email'),
  subject: z.string().min(1, 'Subject is required'),
  text: z.string().optional(),
  html: z.string().optional(),
});

// Send single email
router.post('/send', asyncHandler(async (req, res) => {
  const validatedData = emailSchema.parse(req.body);
  
  const result = await emailService.sendEmail(validatedData);
  
  res.json({
    success: result.success,
    messageId: result.messageId,
    error: result.error
  });
}));

// Test email service
router.post('/test', asyncHandler(async (req, res) => {
  const result = await emailService.testEmailService();
  
  res.json(result);
}));

// Get email service status
router.get('/status', asyncHandler(async (req, res) => {
  res.json({
    configured: !!process.env.RESEND_API_KEY,
    service: 'Resend',
    environment: process.env.NODE_ENV || 'development'
  });
}));

export default router;
