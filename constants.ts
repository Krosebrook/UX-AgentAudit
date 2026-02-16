import { WorkflowStep, PromptTemplates } from './types';

export const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "1. Critical Analysis",
    description: "Identifying critical usability and accessibility issues.",
    purpose: "Analyze the raw audit report to identify the top 3 most severe usability or accessibility violations based on standard heuristics (e.g., WCAG, Nielsen).",
    expectedOutput: "A numbered list of 3 critical issues, each succinctly summarized under 100 words with citations to relevant guidelines.",
    exampleSystemRole: "You are an expert accessibility auditor with deep knowledge of WCAG 2.2 Level AA standards.",
    exampleUserPrompt: "Focus specifically on mobile navigation issues. Prioritize cross-referencing with academic journals (ACM/IEEE) and reputable UX research from NN/g or Baymard Institute for authoritative citations.",
    systemRoleExamples: [
      "Senior UX Researcher specializing in cognitive load and mental models from Stanford HCI group.",
      "Expert Accessibility Auditor with deep knowledge of WCAG 2.2 Level AAA standards.",
      "Senior Analyst at a world-renowned research firm like Baymard Institute or NN/g.",
      "ACM Digital Library contributor specialized in human-computer interaction (HCI).",
      "Heuristic Evaluation expert focusing on Nielsen's 10 principles and empirical evidence.",
      "Journal of Usability Studies reviewer focused on evidence-based design patterns.",
      "PhD Researcher in Applied Psychology with a focus on User Behavior and Decision Science.",
      "Lead Information Architect and former professor of Human-Centered Design at MIT.",
      "Director of Research at a top-tier UX lab, specializing in longitudinal usability studies.",
      "Senior Cognitive Scientist and author of peer-reviewed papers on visual attention and gaze tracking.",
      "UX Strategist with a background in Ethnomethodology and Qualitative Research methods.",
      "Principal UX Architect specializing in evidence-based design for medical and safety-critical systems."
    ],
    userPromptExamples: [
      "Identify 3 critical issues. For each, search 'ACM Transactions on Computer-Human Interaction' for relevant peer-reviewed studies. Cross-reference with 'Nielsen Norman Group' articles to provide both academic and industry justification.",
      "Focus on accessibility. Search 'site:w3.org WCAG 2.2' for specific violations. Ensure you cite the exact Success Criterion (e.g., SC 1.4.3 Contrast (Minimum)) and cross-reference with Nielsen's heuristic 'Visibility of System Status'.",
      "Analyze checkout friction. Search 'Baymard Institute checkout optimization' for benchmarks. Then search 'Journal of Usability Studies' for empirical data on 'form abandonment rates' to back up your claim.",
      "Evaluate the navigation. Search 'ACM Digital Library' for 'mobile hierarchy depth vs breadth'. Compare these academic findings with 'NN/g' guidelines on 'Hamburger Menus' and 'Mega Menus'.",
      "Assess cognitive load. Search 'Human Factors: The Journal of the Human Factors and Ergonomics Society' for 'visual clutter performance costs'. specific search: 'Hick's Law application in modern UI'.",
      "Review trust signals. Search 'MIS Quarterly' for 'online trust formation models'. Cross-reference these academic models with 'Baymard Institute' findings on 'security badges' and 'perceived security'.",
      "Investigate error handling. Search 'IEEE Software' for 'error message usability'. Compare with 'W3C/WAI' guidelines on 'Error Identification' and 'Error Suggestion' (SC 3.3.3).",
      "Analyze information density. Search 'International Journal of Human-Computer Studies' for 'screen density reading speed'. Cross-reference with 'Material Design' spacing guidelines to highlight discrepancies."
    ],
    status: 'pending',
    content: ''
  },
  {
    id: 2,
    title: "2. Improvement Proposals",
    description: "Proposing specific design and implementation improvements.",
    purpose: "Formulate concrete design or implementation solutions for the critical issues identified in the previous step.",
    expectedOutput: "A series of paragraphs (one per issue) proposing specific solutions that adhere to best practices without breaking existing functionality.",
    exampleSystemRole: "You are a Senior UI/UX Designer and Information Architect. You strictly adhere to evidence-based design.",
    exampleUserPrompt: "Propose solutions that minimize friction. You MUST cite specific design principles (e.g., Nielsen's Heuristics, Gestalt Laws) or standard interface guidelines (Material Design, HIG) to justify every recommendation.",
    systemRoleExamples: [
      "Senior UI/UX Designer specializing in mobile-first design systems and conversion optimization.",
      "Lead Frontend Engineer focusing on highly accessible and performant React UI components.",
      "Product Strategist looking for 'Quick Wins' with high business impact and low dev effort.",
      "React/Tailwind expert focused on implementing WAI-ARIA compliant design patterns.",
      "Interaction Designer specialized in micro-animations, feedback loops, and framer-motion.",
      "Design Systems Architect ensuring solutions are scalable across enterprise-level codebases."
    ],
    userPromptExamples: [
      "Provide a React component snippet for an accessible modal. Ensure it handles focus management (focus trap), closes on Escape, and uses 'aria-modal=\"true\"'.",
      "Include CSS for a sticky header using Tailwind CSS. Detail the specific utility classes (e.g., 'sticky top-0 z-50 bg-white/90 backdrop-blur') needed to maintain context while scrolling.",
      "Refactor the navigation using Bootstrap 5 classes. Provide the HTML structure using `navbar-expand-lg` and ensure the toggler meets WCAG contrast requirements.",
      "Propose an MVVM architectural pattern for the user settings module. Describe how the ViewModel will handle validation logic separating it from the View layer.",
      "Address form validation errors. Provide a React Hook Form example showing how to link error messages to inputs using 'aria-describedby' and how to set 'aria-invalid' dynamically.",
      "Implement a 'Dark Mode' toggle using raw CSS variables. Show how to define `--bg-primary` and `--text-primary` for both `:root` and `[data-theme='dark']` contexts.",
      "Fix Cumulative Layout Shift (CLS). Provide a CSS snippet using 'aspect-ratio' or specific height/width classes in Tailwind to reserve space for images before they load.",
      "Design a 'Load More' pattern using the Intersection Observer API. Provide a vanilla JavaScript snippet that triggers data fetching when the sentinel element scrolls into view.",
      "Refactor the complex data table. Provide a React component snippet showing how to use 'scope=\"col\"' and 'scope=\"row\"' correctly, and how to make it scrollable on mobile without trapping focus.",
      "Enhance visual feedback for interactive elements. Provide CSS for focus states (using ':focus-visible') that clearly distinguish the active element without relying solely on color."
    ],
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
    systemRoleExamples: [
      "Product Manager working in a fast-paced Agile Scrum environment with a focus on 'Definition of Done'.",
      "Technical Business Analyst translating design improvements into developer-ready JIRA tickets.",
      "Startup Founder prioritizing an MVP (Minimum Viable Product) roadmap using the Kano model.",
      "Customer Success Lead representing user pain points to the engineering team for fast resolution.",
      "Agile Coach ensuring stories meet the 'INVEST' criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable).",
      "Product Owner specialized in prioritizing backlogs using business value and technical risk metrics."
    ],
    userPromptExamples: [
      "Format the output as a Markdown table with columns: ID, User Story (As a... I want... So that...), Acceptance Criteria, Priority (P0, P1, P2), and Story Points (Fibonacci).",
      "Generate a CSV code block suitable for Jira import. Include headers: Summary, Description, Priority, Story Points, and Label ('UX Audit').",
      "Create a table with 'Business Value' (High/Med/Low) and 'Complexity' columns. Ensure Acceptance Criteria uses strict Gherkin (Given-When-Then) syntax.",
      "Group stories by 'Epic' (e.g., Navigation, Accessibility). For each story, include a field for 'Dependencies' and 'Estimated Hours'.",
      "Focus on detailed technical specifications. Include a 'Dev Notes' column in the table containing React component references and CSS utility classes to be used.",
      "Prioritize using the MoSCoW method. Output a Markdown table with columns: Priority (Must/Should/Could), Story, Acceptance Criteria, and QA Test Cases.",
      "Generate a JSON array of user story objects. Each object should have keys: 'id', 'title', 'story', 'acceptance_criteria' (array), 'priority', and 'points'.",
      "Create a 'Definition of Done' checklist for each story. Present the result as a Markdown table with a specific 'Accessibility Compliance' column (referencing WCAG criteria)."
    ],
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
    systemRoleExamples: [
      "Technical Writer creating developer-facing documentation for a modern React and TypeScript codebase.",
      "Designer-Developer Handoff Specialist creating a Figma-to-Code implementation guide.",
      "Internal Wiki Maintainer focused on long-term knowledge management and system architecture.",
      "API Documentation specialist focusing on REST/GraphQL endpoints, payloads, and integration steps.",
      "UX Writer focusing on microcopy, consistent brand voice, and accessible documentation standards.",
      "Compliance Officer ensuring technical documentation meets legal accessibility and security requirements."
    ],
    userPromptExamples: [
      "Format for a developer audience. Include a 'Component Usage' section with full Props definitions (Interface) and a React code example for the new patterns.",
      "Structure as a 'Technical Spec'. Include a section for 'API Endpoints' that might be affected and provide a Markdown schema for the new data payloads.",
      "Create an 'API Integration Guide' for the backend team. List the required REST endpoints, HTTP methods, and JSON request/response bodies needed to support the new UI.",
      "Write a 'Developer Handoff' guide. Include sections for 'CSS Variables', 'HCI Rationale', and 'Edge Case Handling' with specific code samples.",
      "Generate a 'State Management' specification. Explain how the new components interact with the global store (e.g., Redux/Context), including specific actions and state slices.",
      "Create a 'Visual Change Log'. Describe exactly what UI elements will move and provide a 'Before vs After' Markdown table for CSS class comparisons.",
      "Focus on implementation guidance. Include a 'Testing Plan' section for developers with specific Jest and React Testing Library code snippets.",
      "Write a 'Storybook Documentation' entry. Include the component description, a table of props (ArgTypes), and a list of 'Stories' covering different states (loading, error, empty).",
      "Structure the docs for a Design System wiki. Include a 'Design Tokens' table, accessibility notes, and a 'Best Practices' section for using the updated components."
    ],
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
    systemRoleExamples: [
      "Lead QA Engineer specializing in WCAG 2.2 compliance and regression testing for large-scale web applications.",
      "Senior SDET focused on converting User Stories into automated Cypress/Playwright test specifications.",
      "Quality Assurance Manager responsible for validating 'Definition of Done' and preventing scope creep.",
      "Accessibility Test Lead ensuring all new UI components meet WCAG 2.2 Level AA success criteria (e.g., contrast, keyboard nav).",
      "Risk Analysis Specialist identifying potential regressions in critical user flows (Checkout, Login) caused by UI updates.",
      "Test Strategist focusing on performance budgets (LCP, CLS) and mobile responsiveness verification."
    ],
    userPromptExamples: [
      "Review the User Stories for 'Testability'. Flag any acceptance criteria that use subjective terms (e.g., 'smooth', 'easy'). Propose concrete, measurable replacements.",
      "Perform a 'Regression Risk Assessment'. Identify 3 existing features that might break due to these changes. Create a Markdown table with columns: 'Risk Area', 'Impact', and 'Mitigation Strategy'.",
      "Verify WCAG 2.2 Level AA compliance. For each user story, list the specific Success Criteria (e.g., SC 1.4.3 Contrast) that must be tested. Format as a checklist.",
      "Generate a 'Test Plan' for the proposed changes. Include sections for: Unit Tests, Integration Tests, and Manual Accessibility Checks (e.g., Screen Reader verification).",
      "Check for 'Happy Path' vs. 'Edge Case' coverage. List 3 specific edge cases (e.g., network failure, large font sizes) that are missing from the acceptance criteria.",
      "Validate the 'Definition of Done'. Ensure it includes requirements for: passing Axe-core scans, 90% test coverage, and design review sign-off."
    ],
    status: 'pending',
    content: ''
  }
];

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
  step1: {
    systemRole: "You are a senior UX researcher and technical writer. All findings MUST be supported by citations to authoritative sources without exception. You must prioritize and cross-reference high-authority sources such as academic journals (e.g., ACM Digital Library, IEEE Xplore, MIS Quarterly), industry leaders (e.g., Nielsen Norman Group (NN/g), Baymard Institute), and formal standards (e.g., W3C/WAI, WCAG 2.2). Your objective is to provide robust UX justification through an evidence-based lens. Every point you make must be grounded in recognized research or standards.",
    userPrompt: "Using the following audit report as context, identify and succinctly summarise the three most critical usability or accessibility issues. All findings MUST be supported by citations to authoritative sources. Prioritize peer-reviewed academic journals such as the ACM Digital Library and IEEE Xplore. When citing accessibility issues, you MUST explicitly mention the specific WCAG 2.2 Success Criterion number (e.g., 1.4.3 Contrast (Minimum)) and briefly explain its relevance. When citing industry best practices, cross-reference with Nielsen's 10 Usability Heuristics and reputable sources like Nielsen Norman Group (NN/g) or Baymard Institute. Present your summary as a numbered list, each item under 100 words."
  },
  step2: {
    systemRole: "You are a Senior UI/UX Designer and Information Architect. Your proposals MUST be grounded in established design principles and standard interaction patterns. You are required to explicitly cite Nielsen's 10 Usability Heuristics, Gestalt Principles, or specific guidelines from Material Design/Human Interface Guidelines to justify every improvement. Avoid subjective opinions; rely on proven HCI laws (e.g., Fitts's Law, Hick's Law).",
    userPrompt: "For each identified issue, propose a concrete design or implementation improvement. You MUST justify your proposal by citing a specific design principle (e.g., 'Visibility of System Status', 'Law of Proximity') or a standard UI pattern. Explain why this specific pattern is the correct solution based on the cited principle. Ensure the solution is technically feasible and addresses the root cause."
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