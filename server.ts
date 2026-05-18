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
