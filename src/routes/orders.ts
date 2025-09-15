import express from 'express';
import { z } from 'zod';
import { databaseService } from '../services/databaseService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all orders (optionally filter by customer)
router.get('/', asyncHandler(async (req, res) => {
  const { customer_id } = req.query;
  const orders = await databaseService.getInstance().getOrders(customer_id as string);
  res.json({ success: true, data: orders });
}));

// Create new order
const createOrderSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  order_date: z.string().optional().default(() => new Date().toISOString()),
  status: z.string().default('pending'),
});

router.post('/', asyncHandler(async (req, res) => {
  const validatedData = createOrderSchema.parse(req.body);
  
  const order = await databaseService.getInstance().createOrder({
    ...validatedData,
    total_amount: validatedData.amount,
  });
  
  res.status(201).json({ 
    success: true, 
    data: order 
  });
}));

export default router;