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

  let userContent = '';
  let systemInstruction = '';
  
  // Helper to get template safely
  const getTemplate = (key: keyof PromptTemplates) => {
    return templates[key];
  };

  switch (stepId) {
    case 1: {
      const t = getTemplate('step1');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nAUDIT REPORT:\n${data.auditReport}`;
      break;
    }
    case 2: {
      const t = getTemplate('step2');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nPREVIOUS ANALYSIS:\n${data.step1Result}`;
      break;
    }
    case 3: {
      const t = getTemplate('step3');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nIMPROVEMENTS PROPOSAL:\n${data.step2Result}`;
      break;
    }
    case 4: {
      const t = getTemplate('step4');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nUSER STORIES:\n${data.step3Result}`;
      break;
    }
    case 5: {
      const t = getTemplate('step5');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nDOCUMENTATION TO CHECK:\n${data.step4Result}`;
      break;
    }
    default:
      throw new Error(`Invalid step ID: ${stepId}`);
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userContent,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error(`Error in Gemini Step ${stepId}:`, error);
    throw new Error(`Failed to generate content for step ${stepId}. Please try again.`);
  }
};