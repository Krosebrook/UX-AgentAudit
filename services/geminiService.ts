import { GoogleGenAI } from "@google/genai";
import { WorkflowData, PromptTemplates } from '../types';

// Initialize the API client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3-flash-preview';

export const runGeminiStep = async (stepId: number, data: WorkflowData, templates: PromptTemplates): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  let prompt = '';

  switch (stepId) {
    case 1:
      prompt = `${templates.step1}\n\nAUDIT REPORT:\n${data.auditReport}`;
      break;
    case 2:
      prompt = `${templates.step2}\n\nPREVIOUS ANALYSIS:\n${data.step1Result}`;
      break;
    case 3:
      prompt = `${templates.step3}\n\nIMPROVEMENTS PROPOSAL:\n${data.step2Result}`;
      break;
    case 4:
      prompt = `${templates.step4}\n\nUSER STORIES:\n${data.step3Result}`;
      break;
    case 5:
      prompt = `${templates.step5}\n\nDOCUMENTATION TO CHECK:\n${data.step4Result}`;
      break;
    default:
      throw new Error(`Invalid step ID: ${stepId}`);
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error(`Error in Gemini Step ${stepId}:`, error);
    throw new Error(`Failed to generate content for step ${stepId}. Please try again.`);
  }
};