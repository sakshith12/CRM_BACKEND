import express from 'express';
import { z } from 'zod';
import { databaseService } from '../services/databaseService';
import { emailService } from '../services/emailService';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all campaigns
router.get('/', asyncHandler(async (req, res) => {
  const campaigns = await databaseService.getInstance().getCampaigns();
  res.json({ success: true, data: campaigns });
}));

// Create new campaign and send emails
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  objective: z.string().min(1, 'Campaign objective is required'),
  audience_rules: z.any(), // Allow any audience rules structure
  message: z.string().min(1, 'Campaign message is required'),
});

router.post('/', asyncHandler(async (req, res) => {
  const validatedData = createCampaignSchema.parse(req.body);
  
  // Get all customers for audience calculation
  const customers = await databaseService.getInstance().getCustomers();
  
  // Create campaign in database
  const campaignData = {
    ...validatedData,
    audience_rules: validatedData.audience_rules || {},
    audience_size: customers.length,
    sent: 0,
    delivered: 0,
    failed: 0,
    status: 'draft', // Add the missing status field
  };
  
  const campaign = await databaseService.getInstance().createCampaign(campaignData);
  
  // Send emails to all customers
  let sent = 0;
  let delivered = 0;
  let failed = 0;
  
  for (const customer of customers) {
    sent++;
    // Fetch latest customer name from DB by email
    const dbCustomer = await databaseService.getInstance().getCustomerByEmail(customer.email);
      let customerName = dbCustomer && dbCustomer.name ? dbCustomer.name : (customer.name || '');
      // Force string conversion and fallback
      if (!customerName || typeof customerName !== 'string') customerName = 'Valued Customer';
    // Debug logs for personalization
    console.log('--- Debug Campaign Email Personalization ---');
    console.log('Original message:', validatedData.message);
    console.log('customer:', customer);
    console.log('dbCustomer:', dbCustomer);
      console.log('Resolved customerName:', customerName, '| Type:', typeof customerName);
    // Test regex match and replacement
    // Manual split/join replacement for {name}
    let personalizedMessage = validatedData.message;
    if (personalizedMessage.includes('{name}')) {
      personalizedMessage = personalizedMessage.split('{name}').join(customerName);
      console.log('Manual replacement for {name} done.');
    } else if (personalizedMessage.includes('{ name }')) {
      personalizedMessage = personalizedMessage.split('{ name }').join(customerName);
      console.log('Manual replacement for { name } done.');
    } else if (personalizedMessage.includes('[[name]]')) {
      personalizedMessage = personalizedMessage.split('[[name]]').join(customerName);
      console.log('Manual replacement for [[name]] done.');
    } else if (personalizedMessage.includes('[[ name ]]')) {
      personalizedMessage = personalizedMessage.split('[[ name ]]').join(customerName);
      console.log('Manual replacement for [[ name ]] done.');
    } else {
      console.warn('No supported name placeholder found in message!');
    }
    console.log('Personalized message:', personalizedMessage);
    // Send email
    const emailResult = await emailService.sendEmail({
      to: customer.email,
      from: 'onboarding@resend.dev',
      subject: `Campaign: ${validatedData.name}`,
      text: personalizedMessage,
      html: `<p>${personalizedMessage}</p>`,
    });
    const isDelivered = emailResult.success;
    if (isDelivered) {
      delivered++;
    } else {
      failed++;
    }
    // Log communication
    await databaseService.getInstance().logCommunication({
      campaign_id: campaign.id,
      customer_id: customer.id,
      message: personalizedMessage,
      status: isDelivered ? 'delivered' : 'failed',
      sent_at: new Date().toISOString(),
      delivery_receipt_at: isDelivered ? new Date().toISOString() : undefined,
    });
  }
  
  // Update campaign with final counts
  const updatedCampaign = await databaseService.getInstance().updateCampaign(campaign.id, {
    sent,
    delivered,
    failed,
  });
  
  res.status(201).json({ 
    success: true, 
    data: updatedCampaign,
    stats: { sent, delivered, failed }
  });
}));

// Get campaign by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // This would need to be implemented in databaseService
  res.json({ 
    success: true, 
    message: 'Get campaign by ID endpoint - to be implemented' 
  });
}));

// Update campaign
const updateCampaignSchema = z.object({
  sent: z.number().optional(),
  delivered: z.number().optional(),
  failed: z.number().optional(),
  status: z.string().optional(),
});

router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const validatedData = updateCampaignSchema.parse(req.body);
  
  const updatedCampaign = await databaseService.getInstance().updateCampaign(id, validatedData);
  
  res.json({ 
    success: true, 
    data: updatedCampaign 
  });
}));

// Get communications for a campaign
router.get('/:id/communications', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const communications = await databaseService.getInstance().getCommunications(id);
  
  res.json({ 
    success: true, 
    data: communications 
  });
}));

export default router;
