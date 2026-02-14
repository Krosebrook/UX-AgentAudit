import React, { useState, useCallback } from 'react';
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
  Undo2
} from 'lucide-react';
import { WorkflowStep, WorkflowData, StepStatus, PromptTemplates } from './types';
import { runGeminiStep } from './services/geminiService';
import { INITIAL_STEPS, DEFAULT_PROMPT_TEMPLATES } from './constants';
import ReactMarkdown from 'react-markdown';

const SETTINGS_TAB_ID = 99;

const App: React.FC = () => {
  const [auditReport, setAuditReport] = useState<string>('');
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [prompts, setPrompts] = useState<PromptTemplates>(DEFAULT_PROMPT_TEMPLATES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleAuditReportChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAuditReport(e.target.value);
  };

  const handlePromptChange = (key: keyof PromptTemplates, value: string) => {
    setPrompts(prev => ({ ...prev, [key]: value }));
  };

  const resetSinglePrompt = (key: keyof PromptTemplates) => {
    setPrompts(prev => ({ ...prev, [key]: DEFAULT_PROMPT_TEMPLATES[key] }));
  };

  const resetPrompts = () => {
    if (window.confirm("Are you sure you want to reset all prompts to their default values?")) {
      setPrompts(DEFAULT_PROMPT_TEMPLATES);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">UX Audit Agent</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
              Gemini 3 Flash Powered
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold">Workflow Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">Dismiss</button>
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
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
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
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm' 
                      : step.status === 'pending' 
                        ? 'text-slate-400 cursor-not-allowed' 
                        : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`mr-3 ${activeTab === step.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {getStepIcon(step.id)}
                    </span>
                    <span className="truncate">{step.title}</span>
                  </div>
                  {step.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                  {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </button>
              ))}
            </nav>

             <div className="pt-2">
                <button
                  onClick={() => setActiveTab(SETTINGS_TAB_ID)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === SETTINGS_TAB_ID
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Prompt Settings
                </button>
             </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={runWorkflow}
                disabled={isProcessing || !auditReport.trim()}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                   isProcessing || !auditReport.trim()
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200'
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
                className="mt-3 w-full flex items-center justify-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">Workflow Guide</h4>
              <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
                <li>Paste your UX Audit text.</li>
                <li>(Optional) Adjust Prompts in Settings.</li>
                <li>Run the Agent Workflow.</li>
                <li>Review the AI-generated analysis.</li>
              </ol>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
              
              {/* Content Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                <h2 className="text-lg font-semibold text-slate-800">
                  {activeTab === 0 ? "Input Audit Report" : 
                   activeTab === SETTINGS_TAB_ID ? "Prompt Configuration" :
                   steps.find(s => s.id === activeTab)?.title}
                </h2>
                {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'completed' && (
                  <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">
                    Completed
                  </span>
                )}
              </div>

              {/* Content Body */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {activeTab === 0 && (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-amber-700">
                            Please paste the text content of your UX Audit Report below. The AI agents will analyze this text to generate the subsequent artifacts.
                          </p>
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={auditReport}
                      onChange={handleAuditReportChange}
                      placeholder="Paste your UX Audit Report text here..."
                      className="flex-1 w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm leading-relaxed resize-none shadow-inner"
                      spellCheck={false}
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                       <span>{auditReport.length} characters</span>
                       <span>Ready to analyze</span>
                    </div>
                  </div>
                )}

                {activeTab === SETTINGS_TAB_ID && (
                   <div className="space-y-8 animate-fadeIn">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-800 flex items-start">
                         <Settings className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                         <div>
                            <p className="font-semibold mb-1">Customize Gemini Instructions</p>
                            <p>Here you can edit the prompt templates for each step. The application will automatically append the necessary context (e.g., the Audit Report, previous step output) to your custom instructions.</p>
                         </div>
                      </div>

                      {steps.map((step) => {
                         const promptKey = `step${step.id}` as keyof PromptTemplates;
                         return (
                            <div key={step.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                               <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-bold text-slate-700 flex items-center">
                                     <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full mr-2 text-xs">
                                        {step.id}
                                     </span>
                                     {step.title}
                                  </h3>
                                  <button
                                     onClick={() => resetSinglePrompt(promptKey)}
                                     className="text-xs text-slate-400 hover:text-indigo-600 flex items-center transition-colors px-2 py-1 hover:bg-slate-50 rounded"
                                     title="Reset this prompt to default"
                                  >
                                     <RotateCcw className="w-3 h-3 mr-1.5" />
                                     Reset
                                  </button>
                               </div>
                               <textarea
                                  value={prompts[promptKey]}
                                  onChange={(e) => handlePromptChange(promptKey, e.target.value)}
                                  rows={5}
                                  className="w-full p-3 border border-slate-300 rounded-md text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                               />
                               <p className="text-xs text-slate-400 mt-2 text-right">
                                  Step Context (automatically appended)
                               </p>
                            </div>
                         );
                      })}

                      <div className="flex justify-end pt-4">
                         <button
                            onClick={resetPrompts}
                            className="flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                         >
                            <Undo2 className="w-4 h-4 mr-2" />
                            Reset All to Defaults
                         </button>
                      </div>
                   </div>
                )}

                {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && (
                  <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
                     {steps.find(s => s.id === activeTab)?.status === 'pending' && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                          <div className="bg-slate-100 p-4 rounded-full mb-3">
                            <Play className="w-8 h-8 text-slate-300 ml-1" />
                          </div>
                          <p>Waiting for workflow to reach this step...</p>
                        </div>
                     )}
                     
                     {steps.find(s => s.id === activeTab)?.status === 'loading' && (
                        <div className="flex flex-col items-center justify-center h-64 text-indigo-600">
                           <Loader2 className="w-10 h-10 animate-spin mb-4" />
                           <p className="font-medium animate-pulse">AI Agent is thinking...</p>
                           <p className="text-xs text-slate-500 mt-2">{steps.find(s => s.id === activeTab)?.description}</p>
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
                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                           <AlertCircle className="w-10 h-10 mb-2" />
                           <p className="font-medium">Generation Failed</p>
                           <p className="text-sm text-slate-500 mt-1">Check your API key or try again.</p>
                        </div>
                     )}
                  </div>
                )}
              </div>
              
              {/* Footer Actions for Content */}
              {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'completed' && (
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end rounded-b-xl">
                  <button 
                    onClick={() => {navigator.clipboard.writeText(steps.find(s => s.id === activeTab)?.content || '')}}
                    className="text-sm text-slate-600 hover:text-indigo-600 font-medium flex items-center transition-colors"
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