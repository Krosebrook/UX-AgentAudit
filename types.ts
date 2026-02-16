
export type StepStatus = 'pending' | 'loading' | 'completed' | 'error';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  purpose: string;
  expectedOutput: string;
  exampleSystemRole: string;
  exampleUserPrompt: string;
  systemRoleExamples: string[];
  userPromptExamples: string[];
  status: StepStatus;
  content: string;
  citations?: GroundingChunk[];
}

export interface WorkflowData {
  auditReport: string;
  step1Result: string;
  step2Result: string;
  step3Result: string;
  step4Result: string;
  step5Result: string;
}

export interface PromptTemplate {
  systemRole: string;
  userPrompt: string;
}

export interface PromptTemplates {
  step1: PromptTemplate;
  step2: PromptTemplate;
  step3: PromptTemplate;
  step4: PromptTemplate;
  step5: PromptTemplate;
}

export interface StepResult {
  text: string;
  citations?: GroundingChunk[];
}
