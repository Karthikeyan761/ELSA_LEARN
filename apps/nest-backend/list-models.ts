const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './.env' });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API Key found.");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
     // The SDK doesn't have a direct listModels without an auth'd client, 
     // but we can try to use a very common one.
     console.log("Using API Key:", apiKey.substring(0, 10) + "...");
     const model = genAI.getGenerativeModel({ model: "gemini-pro" });
     const result = await model.generateContent("Hello!");
     console.log("Success with gemini-pro:", result.response.text());
  } catch (err) {
     console.error("Error with gemini-pro:", err.message);
  }

  try {
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
     const result = await model.generateContent("Hello!");
     console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (err) {
     console.error("Error with gemini-1.5-flash:", err.message);
  }
}

main();
