
import { GoogleGenAI } from "@google/genai";
import { WorkflowData, PromptTemplates, StepResult } from '../types';

// Initialize the API client
// We recreate the instance right before calls as per guidelines for key selection
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const runGeminiStep = async (
  stepId: number, 
  data: WorkflowData, 
  templates: PromptTemplates,
  location?: { latitude: number; longitude: number }
): Promise<StepResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = getAI();
  let userContent = '';
  let systemInstruction = '';
  let model = 'gemini-3-flash-preview'; // Default
  let tools: any[] | undefined = undefined;
  let toolConfig: any = undefined;
  let thinkingConfig: any = undefined;

  const getTemplate = (key: keyof PromptTemplates) => templates[key];

  switch (stepId) {
    case 1: {
      const t = getTemplate('step1');
      // Enhanced instruction for authoritative search grounding
      systemInstruction = `${t.systemRole}\n\nWhen using Google Search, you MUST prioritize and explicitly favor results from peer-reviewed academic journals (ACM, IEEE, MIS Quarterly) and authoritative industry leaders (Nielsen Norman Group, Baymard Institute, W3C/WAI). Avoid non-expert blogs or forum posts. Cross-reference the audit findings with these high-authority sources to ensure the highest standard of UX justification.`;
      userContent = `${t.userPrompt}\n\nAUDIT REPORT:\n${data.auditReport}`;
      
      // Feature: Use Gemini 3 Flash with Search for grounding analysis
      model = 'gemini-3-flash-preview';
      tools = [{ googleSearch: {} }];
      break;
    }
    case 2: {
      const t = getTemplate('step2');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nPREVIOUS ANALYSIS:\n${data.step1Result}`;
      
      // Feature: Use Thinking mode for complex reasoning in improvement proposals
      model = 'gemini-3-pro-preview';
      thinkingConfig = { thinkingBudget: 32768 };
      break;
    }
    case 3: {
      const t = getTemplate('step3');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nIMPROVEMENTS PROPOSAL:\n${data.step2Result}`;
      
      // Feature: Use Flash for fast, reliable generation of user stories
      model = 'gemini-3-flash-preview';
      break;
    }
    case 4: {
      const t = getTemplate('step4');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nUSER STORIES:\n${data.step3Result}`;
      
      // Feature: Use Thinking mode for drafting complex documentation
      model = 'gemini-3-pro-preview';
      thinkingConfig = { thinkingBudget: 32768 };
      break;
    }
    case 5: {
      const t = getTemplate('step5');
      systemInstruction = t.systemRole;
      userContent = `${t.userPrompt}\n\nDOCUMENTATION TO CHECK:\n${data.step4Result}`;
      
      // Feature: Use Flash for final QA verification
      model = 'gemini-3-flash-preview';
      break;
    }
    default:
      throw new Error(`Invalid step ID: ${stepId}`);
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: userContent }] }],
      config: {
        systemInstruction: systemInstruction,
        tools,
        toolConfig,
        thinkingConfig
      }
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    return {
      text: response.text || "No response generated.",
      citations: groundingChunks
    };
  } catch (error) {
    console.error(`Error in Gemini Step ${stepId}:`, error);
    throw new Error(`Failed to generate content for step ${stepId}. Please check your configuration and try again.`);
  }
};
