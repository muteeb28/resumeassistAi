
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-2.0-flash-001",
    "gemini-2.5-flash",
    "gemini-2.0-flash"
];

async function testModels() {
    console.log(`Testing models with key: ...${apiKey ? apiKey.slice(-5) : 'NONE'}`);

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`SUCCESS: ${modelName} responded: ${response.text().slice(0, 20)}...`);
            process.exit(0); // Exit on first success
        } catch (error) {
            console.log(`FAILURE: ${modelName}`);
            console.log(`Error: ${error.message.split('\n')[0]}`);
            if (error.message.includes('limit: 0')) {
                console.log(' -> Quota Limit is 0 (Disabled/Exhausted)');
            }
        }
    }
    console.log('\nAll tested models failed.');
}

testModels();
