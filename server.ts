import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // OCR ID Card Recognition
  app.post("/api/ocr", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: "Image is required" });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Extract the following details from this student ID card: Student ID Number, Full Name, Course/Branch, and Expiry Date. Return as JSON." },
              { inlineData: { data: image, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              studentId: { type: Type.STRING },
              name: { type: Type.STRING },
              course: { type: Type.STRING },
              expiryDate: { type: Type.STRING }
            }
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  // AI Performance Analysis & Recommendations
  app.post("/api/analyze-performance", async (req, res) => {
    try {
      const { studentData } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: `Analyze this student's performance and provide detailed study recommendations and career guidance. Student data: ${JSON.stringify(studentData)}` }
            ]
          }
        ],
        config: {
          systemInstruction: "You are an AI Academic Advisor. Analyze the given marks and attendance to provide personalized, encouraging, and actionable study tips and career insights. Return the response in Markdown format.",
        }
      });

      res.json({ analysis: response.text });
    } catch (error) {
      console.error("Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze performance" });
    }
  });

  // MindBolt AI Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, studentData } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are MindBolt AI, a hyper-intelligent, energetic, and helpful academic assistant for students at this institution. 
          You are knowledgeable about the campus, academic regularity, performance analysis, and career guidance.
          User context: ${JSON.stringify(studentData || 'Not logged in')}.
          Be direct, encouraging, and use a modern, professional yet slightly edgy tech-startup tone.`,
        },
        history: history || []
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  // AI Marks Parser for Faculty
  app.post("/api/ai/parse-marks", async (req, res) => {
    try {
      const { text, subject } = req.body;
      
      const prompt = `Act as an academic data processor. Parse the following unstructured student marks text for the subject "${subject}". 
      Return ONLY a JSON array of objects with "studentId", "name", and "marks" (number 0-100).
      If data is missing, guess or use "Unknown". 
      Only return the JSON array, no markdown blocks or extra text.
      Text: ${text}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const responseText = result.text?.trim() || "[]";
      
      // Clean up potential markdown formatting
      const jsonString = responseText.replace(/```json|```/g, '');
      const parsedData = JSON.parse(jsonString);
      
      res.json({ data: parsedData });
    } catch (error) {
      console.error("AI Marks Parse Error:", error);
      res.status(500).json({ error: "Failed to parse marks text" });
    }
  });

  // AI Attendance Voice/Text Parser
  app.post("/api/ai/parse-attendance", async (req, res) => {
    try {
      const { text, subject, className, hour, course } = req.body;
      
      const prompt = `Act as an academic registrar. Parse this attendance report for:
      Course: ${course}
      Subject: ${subject}
      Class: ${className}
      Hour: ${hour}
      
      Unstructured Report: "${text}"
      
      Instructions:
      1. Identify which students are PRESENT and which are ABSENT.
      2. If the report says "everyone present except...", list all IDs.
      3. Return ONLY a JSON object: { "present": ["ID1", "ID2"], "absent": ["ID3"], "summary": "Short description" }.
      4. Use IDs like "USN001", "USN002", etc.
      Only return JSON, no markdown.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const responseText = result.text?.trim() || "{}";
      const jsonString = responseText.replace(/```json|```/g, '');
      const parsedData = JSON.parse(jsonString);
      
      res.json({ data: parsedData });
    } catch (error) {
      console.error("AI Attendance Error:", error);
      res.status(500).json({ error: "AI failed to parse attendance" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
