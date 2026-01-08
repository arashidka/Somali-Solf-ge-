
import { GoogleGenAI } from "@google/genai";
import { FileData } from "./types";

const SYSTEM_INSTRUCTION = `You are a Somali Musicology Engine. Identify the tonic (Do), isolate the melody, and transcribe it into solfège notation (Do, Re, Mi...) with octave superscripts (e.g., Do²) and duration symbols (♩, ♪). If lyrics are present, perform Somali STT or phonetic approximation.

For every measure, you MUST provide precise start and end timestamps. Use any of these formats: [MM:SS], (MM:SS), or MM:SS.sss.

Ensure the output strictly follows this template:
================ Somali Solfège Sheet ================
Title: [Generated]
Scale: [Detected] | Time: [Detected] | Tempo: [BPM]
Confidence: [Vocal: X% | Melody: Y% | Lyrics: Z%]
--------------------------------------------------------------------------
Measure [N] ([Start_Timestamp] - [End_Timestamp]):
Solfège: [Solfège Symbols]
Lyrics:  [Somali Lyrics]
==========================================================================`;

export const processMediaFile = async (fileData: FileData): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY. Please configure your Gemini API key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: fileData.base64,
              mimeType: fileData.mimeType,
            },
          },
          {
            text: "Analyze this media file and generate the Somali Solfège Sheet as per your system instructions. Be precise with timestamps.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // Even lower temperature for strict format adherence
      },
    });

    if (!response.text) {
      throw new Error("Empty response from the AI service.");
    }

    return response.text;
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw new Error("The AI failed to process the media. Please ensure the file is valid and under 25MB.");
  }
};
