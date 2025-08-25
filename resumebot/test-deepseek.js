// Test script to verify DeepSeek API integration
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.VITE_DEEPSEEK_API_KEY || 'sk-242c8f9f553641c58e7bcfc8b5f1338b'
});

async function testDeepSeekAPI() {
  console.log('🧪 Testing DeepSeek API connection...');
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a simple "API test successful!" message.'
        },
        {
          role: 'user',
          content: 'Please confirm the API is working.'
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    console.log('✅ DeepSeek API Response:');
    console.log(completion.choices[0].message.content);
    console.log('\n🎉 API integration is working successfully!');
    
  } catch (error) {
    console.error('❌ DeepSeek API Error:');
    console.error(error.message);
    
    if (error.message.includes('401')) {
      console.log('🔑 Check your API key in .env file');
    } else if (error.message.includes('network')) {
      console.log('🌐 Check your internet connection');
    }
  }
}

testDeepSeekAPI();