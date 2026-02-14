export type StepStatus = 'pending' | 'loading' | 'completed' | 'error';

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
  content: string;
}

export interface WorkflowData {
  auditReport: string;
  step1Result: string;
  step2Result: string;
  step3Result: string;
  step4Result: string;
  step5Result: string;
}

export interface PromptTemplates {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
}