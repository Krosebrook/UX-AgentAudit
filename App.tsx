import React, { useState, useCallback, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  ClipboardList,
  UserSquare,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  Settings,
  Save,
  Undo2,
  Check,
  Upload,
  Info,
  Sun,
  Moon,
  Bot,
  Target,
  FileOutput,
  Lightbulb
} from 'lucide-react';
import { WorkflowStep, WorkflowData, StepStatus, PromptTemplates, PromptTemplate } from './types';
import { runGeminiStep } from './services/geminiService';
import { INITIAL_STEPS, DEFAULT_PROMPT_TEMPLATES } from './constants';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const SETTINGS_TAB_ID = 99;
const STORAGE_KEY = 'ux_audit_prompts';
const THEME_KEY = 'ux_audit_theme';

const App: React.FC = () => {
  const [auditReport, setAuditReport] = useState<string>('');
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  
  // Initialize prompts from localStorage or use defaults
  const [prompts, setPrompts] = useState<PromptTemplates>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration logic: Check if data is in old format (values are strings)
        // If step1 is a string, assume old format and migrate
        if (parsed.step1 && typeof parsed.step1 === 'string') {
          console.log("Migrating legacy prompt settings to new format...");
          const migrated: any = {};
          (Object.keys(DEFAULT_PROMPT_TEMPLATES) as Array<keyof PromptTemplates>).forEach(key => {
            migrated[key] = {
              systemRole: DEFAULT_PROMPT_TEMPLATES[key].systemRole,
              userPrompt: parsed[key] || DEFAULT_PROMPT_TEMPLATES[key].userPrompt
            };
          });
          return migrated as PromptTemplates;
        }
        return parsed;
      }
      return DEFAULT_PROMPT_TEMPLATES;
    } catch (e) {
      console.error("Failed to load prompts from storage", e);
      return DEFAULT_PROMPT_TEMPLATES;
    }
  });

  // Initialize theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      }
    } catch (e) {
      console.error("Failed to load theme", e);
    }
    return 'light';
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAuditReportChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAuditReport(e.target.value);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsReadingFile(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        setUploadProgress(5); // Started loading

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';

          // Update progress based on processed pages (5% to 100%)
          const progress = 5 + Math.round((i / pdf.numPages) * 95);
          setUploadProgress(progress);
        }
        
        if (!fullText.trim()) {
          throw new Error("Could not extract text from PDF. The file might be scanned or image-based.");
        }
        
        setAuditReport(fullText);
      } else {
        // Assume text file
        setUploadProgress(10);
        const text = await file.text();
        setUploadProgress(100);
        // Small delay to make the 100% visible briefly
        await new Promise(resolve => setTimeout(resolve, 300));
        setAuditReport(text);
      }
    } catch (err: any) {
      console.error("File upload error", err);
      setError(err.message || "Failed to read file. Please ensure it is a valid text or PDF file.");
    } finally {
      setIsReadingFile(false);
      setUploadProgress(0);
      // Reset input value to allow re-uploading same file if needed
      event.target.value = '';
    }
  };

  const handlePromptChange = (stepKey: keyof PromptTemplates, field: keyof PromptTemplate, value: string) => {
    setPrompts(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [field]: value
      }
    }));
    setSaveStatus('idle'); // Reset save status on edit
  };

  const resetSinglePrompt = (key: keyof PromptTemplates) => {
    setPrompts(prev => ({ ...prev, [key]: DEFAULT_PROMPT_TEMPLATES[key] }));
    setSaveStatus('idle');
  };

  const resetPrompts = () => {
    if (window.confirm("Are you sure you want to reset all prompts to their default values?")) {
      setPrompts(DEFAULT_PROMPT_TEMPLATES);
      setSaveStatus('idle');
    }
  };

  const savePrompts = () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      // Simulate a brief delay for better UX
      setTimeout(() => {
        setSaveStatus('saved');
        // Reset back to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
    } catch (e) {
      console.error("Failed to save prompts", e);
      setError("Failed to save settings to local storage.");
      setSaveStatus('idle');
    }
  };

  const updateStepStatus = (id: number, status: StepStatus, content?: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === id) {
        return { 
          ...step, 
          status, 
          content: content !== undefined ? content : step.content 
        };
      }
      return step;
    }));
  };

  const runWorkflow = useCallback(async () => {
    if (!auditReport.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setActiveTab(1); // Switch to first step view

    // Reset all steps
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending', content: '' })));

    let currentWorkflowData: WorkflowData = {
      auditReport: auditReport,
      step1Result: '',
      step2Result: '',
      step3Result: '',
      step4Result: '',
      step5Result: '',
    };

    try {
      // Step 1
      updateStepStatus(1, 'loading');
      const res1 = await runGeminiStep(1, currentWorkflowData, prompts);
      currentWorkflowData.step1Result = res1;
      updateStepStatus(1, 'completed', res1);

      // Step 2
      updateStepStatus(2, 'loading');
      setActiveTab(2);
      const res2 = await runGeminiStep(2, currentWorkflowData, prompts);
      currentWorkflowData.step2Result = res2;
      updateStepStatus(2, 'completed', res2);

      // Step 3
      updateStepStatus(3, 'loading');
      setActiveTab(3);
      const res3 = await runGeminiStep(3, currentWorkflowData, prompts);
      currentWorkflowData.step3Result = res3;
      updateStepStatus(3, 'completed', res3);

      // Step 4
      updateStepStatus(4, 'loading');
      setActiveTab(4);
      const res4 = await runGeminiStep(4, currentWorkflowData, prompts);
      currentWorkflowData.step4Result = res4;
      updateStepStatus(4, 'completed', res4);

      // Step 5
      updateStepStatus(5, 'loading');
      setActiveTab(5);
      const res5 = await runGeminiStep(5, currentWorkflowData, prompts);
      currentWorkflowData.step5Result = res5;
      updateStepStatus(5, 'completed', res5);

    } catch (err: any) {
      setError(err.message || "An error occurred during the workflow.");
      // Mark current loading step as error
      setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  }, [auditReport, prompts]);

  const resetWorkflow = () => {
    setSteps(INITIAL_STEPS);
    setAuditReport('');
    setActiveTab(0);
    setError(null);
    setIsProcessing(false);
  };

  const getStepIcon = (id: number) => {
    switch (id) {
      case 1: return <ClipboardList className="w-5 h-5" />;
      case 2: return <UserSquare className="w-5 h-5" />;
      case 3: return <CheckCircle2 className="w-5 h-5" />;
      case 4: return <BookOpen className="w-5 h-5" />;
      case 5: return <ShieldCheck className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">UX Audit Agent</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block text-xs font-medium px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
              Gemini 3 Flash Powered
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold">Workflow Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-4">
            <nav className="space-y-1">
               <button
                  onClick={() => setActiveTab(0)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 0 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Audit Input
                </button>
              
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  disabled={step.status === 'pending' && !isProcessing}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === step.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-sm' 
                      : step.status === 'pending' 
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`mr-3 ${activeTab === step.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {getStepIcon(step.id)}
                    </span>
                    <span className="truncate">{step.title}</span>
                  </div>
                  {step.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />}
                  {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />}
                </button>
              ))}
            </nav>

             <div className="pt-2">
                <button
                  onClick={() => setActiveTab(SETTINGS_TAB_ID)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === SETTINGS_TAB_ID
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Prompt Settings
                </button>
             </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={runWorkflow}
                disabled={isProcessing || !auditReport.trim()}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                   isProcessing || !auditReport.trim()
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Workflow
                  </>
                )}
              </button>

              <button
                onClick={resetWorkflow}
                disabled={isProcessing}
                className="mt-3 w-full flex items-center justify-center py-3 px-4 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
            
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
              <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">Workflow Guide</h4>
              <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
                <li>Paste your UX Audit text.</li>
                <li>(Optional) Adjust Prompts in Settings.</li>
                <li>Run the Agent Workflow.</li>
                <li>Review the AI-generated analysis.</li>
              </ol>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[600px] flex flex-col transition-colors duration-200">
              
              {/* Content Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl transition-colors duration-200">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {activeTab === 0 ? "Input Audit Report" : 
                   activeTab === SETTINGS_TAB_ID ? "Prompt Configuration" :
                   steps.find(s => s.id === activeTab)?.title}
                </h2>
                {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'completed' && (
                  <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-800">
                    Completed
                  </span>
                )}
              </div>

              {/* Content Body */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {activeTab === 0 && (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-600/50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-amber-400 dark:text-amber-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-amber-700 dark:text-amber-200">
                            Please paste the text content of your UX Audit Report below. Alternatively, upload a file to extract text automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* File Upload Section */}
                    <div className="flex items-center justify-between p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30 transition-colors">
                      <div className="flex items-center space-x-3">
                         <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                            <FileText className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Import Report File</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">Supports .txt and .pdf formats</p>
                         </div>
                      </div>
                      <label className={`relative overflow-hidden cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md transition-colors ${
                        isReadingFile 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-wait' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500'
                      }`}>
                         {isReadingFile && (
                           <div 
                             className="absolute left-0 top-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40 transition-all duration-200" 
                             style={{ width: `${uploadProgress}%` }}
                           />
                         )}
                         <div className="relative flex items-center z-10">
                            {isReadingFile ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                            )}
                            <span>{isReadingFile ? `Processing ${uploadProgress}%...` : 'Upload File'}</span>
                         </div>
                         <input 
                           type="file" 
                           className="sr-only" 
                           accept=".txt,.pdf" 
                           onChange={handleFileUpload}
                           disabled={isReadingFile}
                         />
                      </label>
                    </div>

                    <textarea
                      value={auditReport}
                      onChange={handleAuditReportChange}
                      placeholder="Paste your UX Audit Report text here..."
                      className="flex-1 w-full p-4 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm leading-relaxed resize-none shadow-inner bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
                      spellCheck={false}
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
                       <span>{auditReport.length} characters</span>
                       <span>Ready to analyze</span>
                    </div>
                  </div>
                )}

                {activeTab === SETTINGS_TAB_ID && (
                   <div className="space-y-8 animate-fadeIn">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg p-4 text-sm text-indigo-800 dark:text-indigo-300 flex items-start">
                         <Settings className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                         <div>
                            <p className="font-semibold mb-1">Customize Gemini Instructions</p>
                            <p>Edit the <strong>System Role</strong> to define the AI's persona, and the <strong>User Instructions</strong> to control the specific task. Context (e.g., Audit Report) is automatically appended.</p>
                         </div>
                      </div>

                      {steps.map((step) => {
                         const promptKey = `step${step.id}` as keyof PromptTemplates;
                         return (
                            <div key={step.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                               <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center">
                                     <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 w-6 h-6 flex items-center justify-center rounded-full mr-2 text-xs">
                                        {step.id}
                                     </span>
                                     {step.title}
                                  </h3>
                                  <button
                                     onClick={() => resetSinglePrompt(promptKey)}
                                     className="text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                                     title="Revert this prompt to the original system default"
                                  >
                                     <RotateCcw className="w-3 h-3 mr-1.5" />
                                     Reset Default
                                  </button>
                               </div>
                               
                               <div className="grid grid-cols-1 gap-4">
                                  {/* System Role Input */}
                                  <div>
                                    <div className="flex items-center mb-2">
                                       <label className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                          <Bot className="w-3 h-3 mr-1" />
                                          System Role / Persona
                                       </label>
                                       <div className="group relative ml-2">
                                          <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
                                          <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900 dark:bg-slate-800 text-slate-50 text-xs rounded-lg shadow-xl z-20 text-center leading-relaxed font-normal normal-case tracking-normal">
                                             Defines the AI's persona. Context is automatically appended to the user instructions.
                                             <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                                          </div>
                                       </div>
                                    </div>
                                    <textarea
                                      value={prompts[promptKey].systemRole}
                                      onChange={(e) => handlePromptChange(promptKey, 'systemRole', e.target.value)}
                                      rows={2}
                                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                                      placeholder="e.g. You are a senior UX Researcher..."
                                    />
                                    <div className="mt-2 space-y-2">
                                       <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/50">
                                          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                             <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 block mb-0.5">Step Purpose</span>
                                             <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.purpose}</p>
                                          </div>
                                       </div>
                                       
                                       <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-md border border-amber-100 dark:border-amber-800/30">
                                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                          <div>
                                             <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">Example Persona</span>
                                             <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{step.exampleSystemRole}"</p>
                                          </div>
                                       </div>
                                    </div>
                                  </div>

                                  {/* User Prompt Editor */}
                                  <div>
                                     <label className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Task Instructions
                                    </label>
                                     <div className="border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                                         <CodeMirror
                                            value={prompts[promptKey].userPrompt}
                                            height="200px"
                                            theme={theme === 'dark' ? 'dark' : 'light'}
                                            extensions={[markdown()]}
                                            onChange={(val) => handlePromptChange(promptKey, 'userPrompt', val)}
                                            basicSetup={{
                                                lineNumbers: false,
                                                foldGutter: false,
                                                highlightActiveLine: false,
                                                autocompletion: true,
                                            }}
                                            className="text-sm"
                                         />
                                     </div>
                                     
                                     {/* Expected Output with Icon */}
                                     <div className="mt-3 space-y-2">
                                       <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/50">
                                          <FileOutput className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                             <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 block mb-0.5">Expected Output</span>
                                             <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.expectedOutput}</p>
                                          </div>
                                       </div>
                                       
                                       <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-md border border-amber-100 dark:border-amber-800/30">
                                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                          <div>
                                             <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">Example Instructions</span>
                                             <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{step.exampleUserPrompt}"</p>
                                          </div>
                                       </div>
                                     </div>
                                     
                                     <div className="mt-2 text-right">
                                        <span className="text-xs text-slate-400 dark:text-slate-500 inline-flex items-center bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                                          <Info className="w-3 h-3 mr-1" /> Context from previous step is automatically appended
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         );
                      })}

                      <div className="flex justify-end pt-4 space-x-3 border-t border-slate-100 dark:border-slate-800 mt-6 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur py-4 -mx-6 px-6 transition-colors">
                         <button
                            onClick={resetPrompts}
                            className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Reset all prompt settings to default values"
                         >
                            <Undo2 className="w-4 h-4 mr-2" />
                            Reset All
                         </button>
                         <button
                            onClick={savePrompts}
                            disabled={saveStatus !== 'idle'}
                            title="Save current prompt configurations to local storage"
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm ${
                              saveStatus === 'saved'
                                ? 'bg-green-600 hover:bg-green-700 cursor-default'
                                : saveStatus === 'saving'
                                ? 'bg-indigo-400 cursor-wait'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                         >
                            {saveStatus === 'saving' ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : saveStatus === 'saved' ? (
                              <Check className="w-4 h-4 mr-2" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Prompts'}
                         </button>
                      </div>
                   </div>
                )}

                {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && (
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:text-indigo-500 dark:hover:prose-a:text-indigo-300 transition-colors">
                     {steps.find(s => s.id === activeTab)?.status === 'pending' && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-600">
                          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                            <Play className="w-8 h-8 text-slate-300 dark:text-slate-600 ml-1" />
                          </div>
                          <p>Waiting for workflow to reach this step...</p>
                        </div>
                     )}
                     
                     {steps.find(s => s.id === activeTab)?.status === 'loading' && (
                        <div className="flex flex-col items-center justify-center h-64 text-indigo-600 dark:text-indigo-400">
                           <Loader2 className="w-10 h-10 animate-spin mb-4" />
                           <p className="font-medium animate-pulse">AI Agent is thinking...</p>
                           <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{steps.find(s => s.id === activeTab)?.description}</p>
                        </div>
                     )}

                     {steps.find(s => s.id === activeTab)?.status === 'completed' && (
                        <div className="animate-fadeIn">
                           <ReactMarkdown>
                              {steps.find(s => s.id === activeTab)?.content || ''}
                           </ReactMarkdown>
                        </div>
                     )}
                     
                     {steps.find(s => s.id === activeTab)?.status === 'error' && (
                        <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400">
                           <AlertCircle className="w-10 h-10 mb-2" />
                           <p className="font-medium">Generation Failed</p>
                           <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Check your API key or try again.</p>
                        </div>
                     )}
                  </div>
                )}
              </div>
              
              {/* Footer Actions for Content */}
              {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'completed' && (
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end rounded-b-xl transition-colors">
                  <button 
                    onClick={() => {navigator.clipboard.writeText(steps.find(s => s.id === activeTab)?.content || '')}}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center transition-colors"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;