import express from 'express';
import { z } from 'zod';
import { databaseService } from '../services/databaseService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all communications (optionally filter by campaign)
router.get('/', asyncHandler(async (req, res) => {
  const { campaign_id } = req.query;
  const communications = await databaseService.getInstance().getCommunications(campaign_id as string);
  res.json({ success: true, data: communications });
}));

// Log a new communication
const logCommunicationSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID'),
  customer_id: z.string().uuid('Invalid customer ID'),
  message: z.string().min(1, 'Message is required'),
  status: z.enum(['sent', 'delivered', 'failed']),
  sent_at: z.string().optional().default(() => new Date().toISOString()),
  delivery_receipt_at: z.string().optional(),
});

router.post('/', asyncHandler(async (req, res) => {
  const validatedData = logCommunicationSchema.parse(req.body);
  
  const communication = await databaseService.getInstance().logCommunication(validatedData);
  
  res.status(201).json({ 
    success: true, 
    data: communication 
  });
}));

export default router;