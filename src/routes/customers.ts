import express from 'express';
import { z } from 'zod';
import { databaseService } from '../services/databaseService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all customers
router.get('/', asyncHandler(async (req, res) => {
  const customers = await databaseService.getInstance().getCustomers();
  res.json({ success: true, data: customers });
}));

// Create/upsert customer (compatible with Google OAuth)
const upsertCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
});

router.post('/', asyncHandler(async (req, res) => {
  const validatedData = upsertCustomerSchema.parse(req.body);
  
  const customer = await databaseService.getInstance().upsertCustomer({
    name: validatedData.name,
    email: validatedData.email,
    phone: validatedData.phone || undefined,
  });
  
  res.status(201).json({ 
    success: true, 
    data: customer 
  });
}));

// Get customer by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // This would need to be implemented in databaseService
  res.json({ 
    success: true, 
    message: 'Get customer by ID endpoint - to be implemented' 
  });
}));

export default router;
