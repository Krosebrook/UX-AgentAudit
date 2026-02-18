import { WorkflowStep, PromptTemplates } from './types';

export const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "1. Critical Analysis",
    description: "Analyzing the input to identify critical issues or violations.",
    purpose: "Analyze the source document (Audit Report, Code, Contract, etc.) to identify the top 3 most severe issues, violations, or risks based on relevant domain standards.",
    expectedOutput: "A numbered list of 3 critical issues, each succinctly summarized under 100 words with citations to relevant standards or laws.",
    exampleSystemRole: "You are an expert accessibility auditor with deep knowledge of WCAG 2.2 Level AA standards.",
    exampleUserPrompt: "Focus specifically on mobile navigation issues. Prioritize cross-referencing with academic journals and reputable research.",
    systemRoleExamples: [
      "Senior UX Researcher specializing in cognitive load and mental models.",
      "Expert Accessibility Auditor with deep knowledge of WCAG 2.2 Level AA.",
      "Senior Software Engineer specializing in scalable distributed systems and security.",
      "Lead Legal Counsel specializing in SaaS contracts and GDPR compliance.",
      "Senior Editor and Content Strategist focusing on brand voice and clarity.",
      "Cybersecurity Analyst focused on OWASP Top 10 vulnerabilities.",
      "Clinical Research Associate ensuring FDA compliance in medical documentation."
    ],
    userPromptExamples: [
      "Identify 3 critical UX issues. Search 'ACM Transactions on Computer-Human Interaction' for peer-reviewed studies. Cross-reference with 'Nielsen Norman Group' articles to provide both academic and industry justification.",
      "Focus on accessibility. Search 'site:w3.org WCAG 2.2' for specific violations. Ensure you cite the exact Success Criterion (e.g., SC 1.4.3) and cross-reference with 'IEEE Transactions on Visualization and Computer Graphics' for visual accessibility research.",
      "Analyze checkout friction. Search 'Baymard Institute checkout optimization' for benchmarks. Then search 'Journal of Usability Studies' for empirical data on 'form abandonment rates' to back up your claim.",
      "Evaluate the navigation. Search 'ACM Digital Library' for 'mobile hierarchy depth vs breadth'. Compare these academic findings with 'NN/g' guidelines on 'Hamburger Menus' and 'Mega Menus'.",
      "Assess cognitive load. Search 'Human Factors: The Journal of the Human Factors and Ergonomics Society' for 'visual clutter performance costs'. Specific search: 'Hick's Law application in modern UI'.",
      "Analyze code security. Search 'IEEE Transactions on Software Engineering' for 'static analysis reliability'. Cross-reference with 'OWASP Top 10' vulnerabilities.",
      "Review contract indemnification. Search 'Harvard Law Review' for 'commercial indemnification standards'. Compare with standard clause libraries."
    ],
    status: 'pending',
    content: ''
  },
  {
    id: 2,
    title: "2. Improvement Proposals",
    description: "Proposing specific solutions and improvements.",
    purpose: "Formulate concrete solutions (design patterns, code refactors, re-drafts) for the critical issues identified in the previous step.",
    expectedOutput: "A series of paragraphs proposing specific solutions that adhere to best practices without breaking existing functionality.",
    exampleSystemRole: "You are a Senior UI/UX Designer and Information Architect who strictly follows evidence-based design.",
    exampleUserPrompt: "Propose solutions that minimize friction. You MUST cite specific design principles (e.g., Nielsen's Heuristics, Gestalt Principles) or standard interface guidelines to justify every recommendation.",
    systemRoleExamples: [
      "Senior UI/UX Designer specializing in mobile-first design systems.",
      "Principal Backend Engineer focused on microservices patterns.",
      "Legal Contract Specialist drafting protective clauses.",
      "Content Marketing Manager focused on conversion optimization.",
      "DevOps Engineer specializing in CI/CD pipelines.",
      "React/Tailwind expert focused on component accessibility."
    ],
    userPromptExamples: [
      "Propose a React component snippet for an accessible modal. Ensure it handles focus management.",
      "Refactor the Python function to use list comprehensions and proper type hinting.",
      "Rewrite the liability clause to limit damages to 12 months of fees.",
      "Propose an MVVM architectural pattern for the module.",
      "Suggest alternative headlines that use 'Power Words' to increase CTR.",
      "Design a database schema normalization plan to reach 3NF."
    ],
    status: 'pending',
    content: ''
  },
  {
    id: 3,
    title: "3. User Stories / Tasks",
    description: "Converting improvements into actionable items.",
    purpose: "Translate the technical improvement proposals into actionable user stories, engineering tasks, or action items suitable for a backlog.",
    expectedOutput: "A bulleted list of stories/tasks, where each includes a title, description, and acceptance criteria.",
    exampleSystemRole: "You are a Product Manager working in an Agile Scrum environment.",
    exampleUserPrompt: "Write the user stories using Gherkin syntax (Given-When-Then).",
    systemRoleExamples: [
      "Product Manager working in a fast-paced Agile Scrum environment.",
      "Engineering Manager breaking down technical debt into tasks.",
      "Legal Operations Manager creating a contract negotiation playbook.",
      "Content Manager creating a publishing calendar and brief.",
      "Scrum Master ensuring stories meet the 'INVEST' criteria."
    ],
    userPromptExamples: [
      "Format the output as a Markdown table with columns: ID, Title, User Story format, Acceptance Criteria, Priority (P1-P5), and Story Points (Fibonacci).",
      "Generate detailed Jira tickets including 'Summary', 'Description', 'Priority', 'Story Points', and 'Labels' fields for each item.",
      "Create GitHub Issues using markdown checklists for Acceptance Criteria. Include a 'Technical Notes' section for implementation details.",
      "List legal action items as a table with columns: 'Clause Reference', 'Required Action', 'Risk Level', and 'Owner'.",
      "Structure as a prioritized backlog grouped by 'Epics' (e.g., Accessibility, Performance, Security).",
      "For each story, include a 'Rationale' field linking back to the specific design principle or heuristic cited in the audit."
    ],
    status: 'pending',
    content: ''
  },
  {
    id: 4,
    title: "4. Documentation",
    description: "Creating technical or process documentation.",
    purpose: "Generate professional documentation, specifications, or guidelines based on the proposed changes.",
    expectedOutput: "Markdown-formatted documentation with clear headings, rationale, and implementation guidance.",
    exampleSystemRole: "You are a Technical Writer creating developer-facing documentation.",
    exampleUserPrompt: "Structure the documentation as a 'Migration Guide'.",
    systemRoleExamples: [
      "Technical Writer creating developer-facing documentation.",
      "Internal Wiki Maintainer focused on knowledge management.",
      "Compliance Officer writing policy updates.",
      "API Documentation specialist focusing on REST endpoints.",
      "Head of Operations documenting new standard operating procedures."
    ],
    userPromptExamples: [
      "Format for a developer audience. Include a 'Component Usage' section with props definitions.",
      "Create an 'API Integration Guide' with JSON request/response examples.",
      "Draft a 'Policy Memo' to be sent to all employees explaining the new compliance rule.",
      "Write a 'Style Guide' entry for the new voice and tone requirements.",
      "Generate a 'State Management' specification for Redux."
    ],
    status: 'pending',
    content: ''
  },
  {
    id: 5,
    title: "5. QA Verification",
    description: "Quality assurance check of the generated artifacts.",
    purpose: "Simulate a Lead Reviewer to verify the generated documentation and stories against the original context and standards.",
    expectedOutput: "A brief quality report highlighting gaps, confirming alignment, or suggesting final tweaks.",
    exampleSystemRole: "You are a QA Lead responsible for acceptance testing.",
    exampleUserPrompt: "Check if the acceptance criteria in the user stories are testable.",
    systemRoleExamples: [
      "Lead QA Engineer specializing in regression testing.",
      "Senior Legal Partner reviewing associate work.",
      "Editor-in-Chief reviewing articles for publication.",
      "Security Auditor verifying compliance with ISO 27001.",
      "Senior Architect reviewing design documents."
    ],
    userPromptExamples: [
      "Verify that all acceptance criteria are objectively testable and explicitly confirm that the proposed solution meets WCAG 2.2 Level AA requirements.",
      "Review the User Stories for 'Testability'. Flag subjective terms.",
      "Verify that the contract clauses do not contradict the Master Services Agreement.",
      "Check the code snippets for syntax errors or deprecated methods.",
      "Ensure the documentation follows the 'Microsoft Manual of Style'.",
      "Perform a 'Regression Risk Assessment' for the proposed changes."
    ],
    status: 'pending',
    content: ''
  }
];

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
  step1: {
    systemRole: "You are a senior auditor and subject matter expert. All findings MUST be supported by citations to authoritative sources without exception. You must prioritize and cross-reference high-authority sources relevant to the specific domain of the input document (e.g., ACM/IEEE for code, NN/g for UX, Commercial Law/GDPR for contracts). Your objective is to provide robust justification through an evidence-based lens. When using Google Search, you MUST prioritize and explicitly favor results from peer-reviewed academic journals, industry leaders, and formal standards.",
    userPrompt: "Using the following input document as context, identify and succinctly summarise the three most critical issues, violations, or risks. All findings MUST be supported by citations to authoritative sources. Prioritize peer-reviewed academic journals or official standard bodies (e.g., W3C, ISO, NIST). Present your summary as a numbered list, each item under 100 words."
  },
  step2: {
    systemRole: "You are a Senior Architect and Problem Solver. Your proposals MUST be grounded in established principles, standard patterns, and research findings relevant to the domain. You are required to explicitly cite specific design laws (e.g., Fitts's Law, Hick's Law), usability heuristics (e.g., Nielsen's), or authoritative guidelines (e.g., WCAG, Material Design) to justify every improvement. Avoid subjective opinions; rely on proven methodologies and evidence-based design.",
    userPrompt: "For each identified issue, propose a concrete solution or improvement. You MUST justify your proposal by citing a specific design principle, standard UI pattern, or research finding and explain why this specific pattern is the correct solution. Ensure the solution is technically feasible and addresses the root cause."
  },
  step3: {
    systemRole: "You are a Product Manager or Team Lead.",
    userPrompt: "Convert the improvements from the previous proposal into actionable items (User Stories, Tasks, or Requirements) suitable for a backlog. For each item, include a title, a brief description, and acceptance criteria. Organise them in a bulleted list."
  },
  step4: {
    systemRole: "You are a Technical Writer or Documentation Specialist.",
    userPrompt: "Update or create a 'Improvements & Guidelines' section in the project documentation by incorporating the items from the previous step. Use clear headings, markdown formatting, and a professional tone. Highlight the rationale behind each change and reference the guidelines that support them."
  },
  step5: {
    systemRole: "You are a Lead Reviewer or QA Manager.",
    userPrompt: "Perform a quality check on the updated documentation provided below. Verify that it aligns with the original findings context, follows professional standards, and addresses critical issues. Summarise any remaining gaps or open questions in a brief report."
  }
};