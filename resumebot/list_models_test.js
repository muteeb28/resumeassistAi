
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log(`Checking models for key ending in: ...${key ? key.slice(-5) : 'NONE'}`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function listModels() {
    try {
        const response = await axios.get(url);
        const models = response.data.models || [];

        // Print only "generateContent" supported models for clarity
        const generateModels = models.filter(m => m.supportedGenerationMethods.includes('generateContent'));

        fs.writeFileSync('models_new_key.json', JSON.stringify(generateModels, null, 2));
        console.log('--- MODELS WRITTEN TO models_new_key.json ---');

    } catch (error) {
        console.error('Error fetching models:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

listModels();
