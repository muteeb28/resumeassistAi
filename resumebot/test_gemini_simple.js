
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const modelName = "gemini-1.5-flash"; // Testing the target model
const model = genAI.getGenerativeModel({ model: modelName });

async function test() {
    console.log(`Testing model: ${modelName}`);
    console.log(`Key ending: ...${apiKey ? apiKey.slice(-5) : 'NONE'}`);
    try {
        const prompt = "Explain 'Hello World' in 5 words.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("FAILURE:");
        console.error("Message:", error.message);
    }
}

test();
