import { WorkflowStep, PromptTemplates } from './types';

export const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "1. Critical Analysis",
    description: "Identifying critical usability and accessibility issues.",
    purpose: "Analyze the raw audit report to identify the top 3 most severe usability or accessibility violations based on standard heuristics (e.g., WCAG, Nielsen).",
    expectedOutput: "A numbered list of 3 critical issues, each succinctly summarized under 100 words with citations to relevant guidelines.",
    exampleSystemRole: "You are an expert accessibility auditor with deep knowledge of WCAG 2.2 Level AA standards.",
    exampleUserPrompt: "Focus specifically on mobile navigation issues. Ignore contrast warnings for now. For each issue, cite the specific WCAG success criterion.",
    status: 'pending',
    content: ''
  },
  {
    id: 2,
    title: "2. Improvement Proposals",
    description: "Proposing specific design and implementation improvements.",
    purpose: "Formulate concrete design or implementation solutions for the critical issues identified in the previous step.",
    expectedOutput: "A series of paragraphs (one per issue) proposing specific solutions that adhere to best practices without breaking existing functionality.",
    exampleSystemRole: "You are a Senior UI/UX Designer specializing in conversion rate optimization (CRO) and mobile-first design.",
    exampleUserPrompt: "Propose solutions that minimize friction. Suggest specific UI patterns (e.g., sticky headers, bottom navigation) that address the identified issues.",
    status: 'pending',
    content: ''
  },
  {
    id: 3,
    title: "3. User Stories",
    description: "Converting improvements into backlog-ready user stories.",
    purpose: "Translate the technical improvement proposals into actionable user stories suitable for a product development backlog.",
    expectedOutput: "A bulleted list of user stories, where each story includes a title, a brief description, and clear acceptance criteria.",
    exampleSystemRole: "You are a Product Manager working in an Agile Scrum environment.",
    exampleUserPrompt: "Write the user stories using Gherkin syntax (Given-When-Then). Include 'Priority' and 'Estimated Story Points' fields for each story.",
    status: 'pending',
    content: ''
  },
  {
    id: 4,
    title: "4. Documentation",
    description: "Creating technical documentation for the changes.",
    purpose: "Generate professional technical documentation or a 'UI/UX Improvements' section that incorporates the new user stories.",
    expectedOutput: "Markdown-formatted documentation with clear headings, rationale, and implementation guidance, ready for a wiki or knowledge base.",
    exampleSystemRole: "You are a Technical Writer creating developer-facing documentation for a legacy codebase.",
    exampleUserPrompt: "Structure the documentation as a 'Migration Guide'. Include a section on 'Breaking Changes' if the proposed improvements alter current workflows.",
    status: 'pending',
    content: ''
  },
  {
    id: 5,
    title: "5. QA Verification",
    description: "Quality assurance check of the generated documentation.",
    purpose: "Simulate a QA Lead review to verify the generated documentation against the original audit context and professional standards.",
    expectedOutput: "A brief quality report (max 200 words) highlighting any gaps, confirming alignment with the audit, or suggesting final tweaks.",
    exampleSystemRole: "You are a QA Lead responsible for acceptance testing and regression suites.",
    exampleUserPrompt: "Check if the acceptance criteria in the user stories are testable. Flag any ambiguous terms like 'user-friendly' or 'fast' that cannot be objectively measured.",
    status: 'pending',
    content: ''
  }
];

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
  step1: {
    systemRole: "You are a senior UX researcher and technical writer.",
    userPrompt: "Using the following audit report as context, identify and succinctly summarise the three most critical usability or accessibility issues, citing the relevant guidelines (e.g., Nielsen’s heuristics, WCAG 2.2). Present your summary as a numbered list, each item under 100 words."
  },
  step2: {
    systemRole: "You are a senior UX researcher.",
    userPrompt: "Propose one specific design or implementation improvement for each issue identified in the previous analysis. For each improvement, explain how it adheres to recognised best practices and how it can be implemented without breaking existing functionality. Use a concise paragraph (3–4 sentences) per improvement."
  },
  step3: {
    systemRole: "You are a product manager.",
    userPrompt: "Convert the improvements from the previous proposal into user stories suitable for a development backlog. For each user story, include a title, a brief description, and acceptance criteria. Organise the stories in a bulleted list and ensure they reference the corresponding usability issue."
  },
  step4: {
    systemRole: "You are a technical writer.",
    userPrompt: "Update or create a 'UI/UX Improvements' section in the project documentation by incorporating the user stories from the previous step. Use clear headings, markdown formatting, and a professional tone. Highlight the rationale behind each change and reference the guidelines that support them. Ensure the documentation does not alter existing functionality but provides clear guidance for implementation."
  },
  step5: {
    systemRole: "You are a QA lead.",
    userPrompt: "Perform a quality check on the updated documentation provided below. Verify that it aligns with the audit findings context implied, follows professional documentation style, and addresses critical issues. Summarise any remaining gaps or open questions in a brief report (max 200 words) and suggest next steps."
  }
};