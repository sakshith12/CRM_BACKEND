console.log('🔧 Testing backend setup...');

try {
  require('dotenv').config();
  console.log('✅ dotenv loaded');
  
  const express = require('express');
  console.log('✅ express loaded');
  
  const cors = require('cors');
  console.log('✅ cors loaded');
  
  console.log('✅ All dependencies loaded successfully');
  console.log('📍 Current directory:', process.cwd());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔑 Resend API Key configured:', !!process.env.RESEND_API_KEY);
  console.log('🗄️ Supabase URL configured:', !!process.env.SUPABASE_URL);
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
