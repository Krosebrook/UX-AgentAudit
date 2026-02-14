import { WorkflowStep, PromptTemplates } from './types';

export const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "1. Critical Analysis",
    description: "Identifying critical usability and accessibility issues.",
    status: 'pending',
    content: ''
  },
  {
    id: 2,
    title: "2. Improvement Proposals",
    description: "Proposing specific design and implementation improvements.",
    status: 'pending',
    content: ''
  },
  {
    id: 3,
    title: "3. User Stories",
    description: "Converting improvements into backlog-ready user stories.",
    status: 'pending',
    content: ''
  },
  {
    id: 4,
    title: "4. Documentation",
    description: "Creating technical documentation for the changes.",
    status: 'pending',
    content: ''
  },
  {
    id: 5,
    title: "5. QA Verification",
    description: "Quality assurance check of the generated documentation.",
    status: 'pending',
    content: ''
  }
];

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
  step1: `You are a senior UX researcher and technical writer. Using the following audit report as context, identify and succinctly summarise the three most critical usability or accessibility issues, citing the relevant guidelines (e.g., Nielsen’s heuristics, WCAG 2.2). Present your summary as a numbered list, each item under 100 words.`,
  
  step2: `Continuing as a senior UX researcher, propose one specific design or implementation improvement for each issue identified in the previous analysis. For each improvement, explain how it adheres to recognised best practices and how it can be implemented without breaking existing functionality. Use a concise paragraph (3–4 sentences) per improvement.`,
  
  step3: `Now act as a product manager and convert the improvements from the previous proposal into user stories suitable for a development backlog. For each user story, include a title, a brief description, and acceptance criteria. Organise the stories in a bulleted list and ensure they reference the corresponding usability issue.`,
  
  step4: `Switch to the role of a technical writer. Update or create a 'UI/UX Improvements' section in the project documentation by incorporating the user stories from the previous step. Use clear headings, markdown formatting, and a professional tone. Highlight the rationale behind each change and reference the guidelines that support them. Ensure the documentation does not alter existing functionality but provides clear guidance for implementation.`,
  
  step5: `As a QA lead, perform a quality check on the updated documentation provided below. Verify that it aligns with the audit findings context implied, follows professional documentation style, and addresses critical issues. Summarise any remaining gaps or open questions in a brief report (max 200 words) and suggest next steps.`
};