import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Lightbulb,
  Sparkles,
  Zap,
  Users,
  Terminal,
  Layers,
  Search,
  MessageSquareCode,
  FileSearch,
  CheckSquare,
  Trash2,
  ArrowDownCircle,
  Link2,
  XCircle,
  Edit3,
  X,
  ExternalLink,
  MapPin,
  Globe
} from 'lucide-react';
import { WorkflowStep, WorkflowData, StepStatus, PromptTemplates, PromptTemplate, GroundingChunk } from './types';
import { runGeminiStep } from './services/geminiService';
import { INITIAL_STEPS, DEFAULT_PROMPT_TEMPLATES } from './constants';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const SETTINGS_TAB_ID = 99;
const STORAGE_KEY = 'universal_audit_prompts'; // Updated key
const THEME_KEY = 'universal_audit_theme'; // Updated key

const App: React.FC = () => {
  const [auditReport, setAuditReport] = useState<string>('');
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  
  // Internal state for settings tab step selection
  const [selectedSettingStep, setSelectedSettingStep] = useState<number>(1);
  const [reportCopied, setReportCopied] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Editing state for AI results
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  const editContainerRef = useRef<HTMLDivElement>(null);

  // Get user location on mount for maps grounding
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.log("Geolocation not available or denied", err)
      );
    }
  }, []);

  // Initialize prompts from localStorage or use defaults
  const [prompts, setPrompts] = useState<PromptTemplates>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Simple migration check if structure matches
        if (parsed.step1 && parsed.step1.systemRole) {
           return parsed as PromptTemplates;
        }
      }
      return DEFAULT_PROMPT_TEMPLATES;
    } catch (e) {
      return DEFAULT_PROMPT_TEMPLATES;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch (e) {}
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

  // Click outside to save logic for result editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
        if (isEditingResult) {
          handleSaveEdit();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingResult, editValue]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const progressPercentage = useMemo(() => {
    const completedCount = steps.filter(s => s.status === 'completed').length;
    return (completedCount / steps.length) * 100;
  }, [steps]);

  // Derive validation errors for all steps
  const validationIssues = useMemo(() => {
    const issues: { step: number; fields: string[] }[] = [];
    [1, 2, 3, 4, 5].forEach(id => {
      const key = `step${id}` as keyof PromptTemplates;
      const fields: string[] = [];
      if (!prompts[key].systemRole.trim()) fields.push('System Role');
      if (!prompts[key].userPrompt.trim()) fields.push('Task Instructions');
      if (fields.length > 0) {
        issues.push({ step: id, fields });
      }
    });
    return issues;
  }, [prompts]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    setUploadProgress(0);
    setError(null);
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
          setUploadProgress(5 + Math.round((i / pdf.numPages) * 95));
        }
        setAuditReport(fullText);
      } else {
        const text = await file.text();
        setAuditReport(text);
      }
    } catch (err: any) {
      setError(err.message || "Failed to read file.");
    } finally {
      setIsReadingFile(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const handlePromptChange = (stepKey: keyof PromptTemplates, field: keyof PromptTemplate, value: string) => {
    setPrompts(prev => ({ ...prev, [stepKey]: { ...prev[stepKey], [field]: value } }));
    setSaveStatus('idle');
  };

  const applyExample = (stepKey: keyof PromptTemplates, field: keyof PromptTemplate, value: string) => {
    setPrompts(prev => ({ ...prev, [stepKey]: { ...prev[stepKey], [field]: value } }));
    setSaveStatus('idle');
  };

  const resetSinglePrompt = (key: keyof PromptTemplates) => {
    setPrompts(prev => ({ ...prev, [key]: DEFAULT_PROMPT_TEMPLATES[key] }));
    setSaveStatus('idle');
  };

  const savePrompts = () => {
    if (validationIssues.length > 0) {
      setShowValidationErrors(true);
      setError(`Cannot save: ${validationIssues.length} step(s) have missing configuration fields.`);
      return;
    }

    setSaveStatus('saving');
    setError(null);
    setShowValidationErrors(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const copyAuditReport = () => {
    if (!auditReport.trim()) return;
    navigator.clipboard.writeText(auditReport);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  };

  const updateStepStatus = (id: number, status: StepStatus, content?: string, citations?: GroundingChunk[]) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status, content: content !== undefined ? content : step.content, citations: citations !== undefined ? citations : step.citations } : step));
  };

  const runWorkflow = useCallback(async () => {
    if (!auditReport.trim()) {
      setError("Please provide an input document before starting the workflow.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setActiveTab(1);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending', content: '', citations: [] })));
    let currentWorkflowData: WorkflowData = { auditReport, step1Result: '', step2Result: '', step3Result: '', step4Result: '', step5Result: '' };
    try {
      for (let i = 1; i <= 5; i++) {
        updateStepStatus(i, 'loading');
        setActiveTab(i);
        const res = await runGeminiStep(i, currentWorkflowData, prompts, userLocation);
        (currentWorkflowData as any)[`step${i}Result`] = res.text;
        updateStepStatus(i, 'completed', res.text, res.citations);
      }
    } catch (err: any) {
      setError(err.message || "Workflow failed.");
      setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  }, [auditReport, prompts, userLocation]);

  const resetWorkflow = () => {
    setSteps(INITIAL_STEPS);
    setAuditReport('');
    setActiveTab(0);
    setError(null);
    setIsProcessing(false);
    setIsEditingResult(false);
  };

  const startEditingResult = () => {
    const currentStep = steps.find(s => s.id === activeTab);
    if (currentStep && currentStep.status === 'completed') {
      setEditValue(currentStep.content);
      setIsEditingResult(true);
      setEditValidationError(null);
    }
  };

  const handleSaveEdit = () => {
    if (editValue.trim().length < 10) {
      setEditValidationError("Content is too short. Please provide at least 10 characters.");
      return;
    }
    updateStepStatus(activeTab, 'completed', editValue);
    setIsEditingResult(false);
    setEditValidationError(null);
  };

  const getStepIcon = (id: number) => {
    switch (id) {
      case 1: return <ClipboardList className="w-5 h-5" />;
      case 2: return <Lightbulb className="w-5 h-5" />;
      case 3: return <Layers className="w-5 h-5" />;
      case 4: return <BookOpen className="w-5 h-5" />;
      case 5: return <ShieldCheck className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  // Get current active settings step
  const currentStepSettings = INITIAL_STEPS.find(s => s.id === selectedSettingStep)!;
  const currentPromptKey = `step${selectedSettingStep}` as keyof PromptTemplates;
  const currentStepIssues = validationIssues.find(i => i.step === selectedSettingStep);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Workflow Agent</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1"><h3 className="font-semibold">Attention Required</h3><p className="text-sm mt-1">{error}</p></div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <nav className="space-y-1">
               <button onClick={() => setActiveTab(0)} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <FileText className="w-5 h-5 mr-3" /> Input Context
                </button>
              {steps.map((step) => (
                <button key={step.id} onClick={() => { setActiveTab(step.id); setIsEditingResult(false); }} disabled={step.status === 'pending' && !isProcessing} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === step.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-sm' : step.status === 'pending' ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <div className="flex items-center">
                    <span className={`mr-3 ${activeTab === step.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{getStepIcon(step.id)}</span>
                    <span className="truncate">{step.title}</span>
                  </div>
                  {step.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />}
                  {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </button>
              ))}
            </nav>

            <div className="pt-2">
              <button onClick={() => { setActiveTab(SETTINGS_TAB_ID); setIsEditingResult(false); }} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all relative ${activeTab === SETTINGS_TAB_ID ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Settings className="w-5 h-5 mr-3" /> 
                <span>Agent Settings</span>
                {validationIssues.length > 0 && showValidationErrors && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] font-bold text-white items-center justify-center">{validationIssues.length}</span>
                  </span>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={runWorkflow} 
                disabled={isProcessing || !auditReport.trim() || validationIssues.length > 0} 
                aria-busy={isProcessing} 
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                  isProcessing 
                  ? 'bg-indigo-400 cursor-wait animate-pulse' 
                  : !auditReport.trim() || validationIssues.length > 0
                    ? 'bg-slate-300 dark:bg-slate-700 opacity-50 grayscale-[0.3] cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95'
                }`}
              >
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><Play className="w-4 h-4 mr-2" /> Start Workflow</>}
              </button>
              <button onClick={resetWorkflow} disabled={isProcessing} className={`mt-3 w-full flex items-center justify-center py-3 px-4 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium transition-all ${isProcessing ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-9 relative">
            {isProcessing && (
              <div className="absolute -top-4 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden z-20">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                  style={{ width: `${progressPercentage}%` }} 
                />
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[600px] flex flex-col relative overflow-hidden transition-all">
              
              {/* Active Step Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {activeTab === 0 ? "Input Context" : activeTab === SETTINGS_TAB_ID ? "Prompt Configuration" : steps.find(s => s.id === activeTab)?.title}
                    </h2>
                    {isProcessing && activeTab > 0 && activeTab < SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'loading' && (
                      <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider animate-pulse border border-indigo-200 dark:border-indigo-800/50">
                        <Zap className="w-3 h-3" />
                        <span>Live API Processing</span>
                      </span>
                    )}
                  </div>
                  
                  {activeTab === SETTINGS_TAB_ID && (
                    <button 
                      onClick={savePrompts} 
                      disabled={saveStatus !== 'idle'} 
                      className={`flex items-center px-4 py-1.5 rounded-md text-xs font-bold text-white transition-all shadow-sm ${saveStatus === 'saved' ? 'bg-green-600' : (showValidationErrors && validationIssues.length > 0) ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}
                    >
                      {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : saveStatus === 'saved' ? <Check className="w-3 h-3 mr-1.5" /> : <Save className="w-3 h-3 mr-1.5" />}
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save All Prompts'}
                    </button>
                  )}

                  {activeTab > 0 && activeTab < SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'completed' && !isEditingResult && (
                    <button 
                      onClick={startEditingResult}
                      className="group relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-800/50"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Result</span>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
                        Manually refine AI generated output
                      </span>
                    </button>
                  )}
                </div>
                {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'completed' && !isEditingResult && (
                  <span className="ml-4 text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-800">Completed</span>
                )}
              </div>

              {/* Enhanced Content Body */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {activeTab === 0 && (
                  <div className="space-y-4 h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4">
                      <p className="text-sm text-amber-700 dark:text-amber-200">Paste your Audit Report, Code Snippet, Legal Contract, or any text to analyze. Content is required to begin the workflow.</p>
                    </div>
                    <label className={`flex items-center justify-between p-4 border border-dashed rounded-lg cursor-pointer transition-all ${isReadingFile ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-300' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 hover:border-indigo-400'}`}>
                      <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                        <Upload className={`w-5 h-5 ${isReadingFile ? 'animate-bounce text-indigo-600' : ''}`} />
                        <div><p className="text-sm font-medium">Upload File</p><p className="text-xs opacity-60">PDF or Text</p></div>
                      </div>
                      <input type="file" className="sr-only" accept=".txt,.pdf" onChange={handleFileUpload} disabled={isReadingFile} />
                    </label>
                    <textarea 
                      value={auditReport} 
                      onChange={(e) => setAuditReport(e.target.value)} 
                      placeholder="Paste your content here..." 
                      className={`flex-1 w-full p-4 border rounded-lg font-mono text-sm leading-relaxed resize-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all focus:ring-2 focus:ring-indigo-500 ${!auditReport.trim() ? 'border-amber-200 dark:border-amber-800/50' : 'border-slate-200 dark:border-slate-800'}`} 
                    />
                    
                    {/* Action Bar & Validation */}
                    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                      <div className="flex items-center space-x-4">
                        {!auditReport.trim() ? (
                          <div className="flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-800/50 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                            <span>Input is empty. Add content to proceed.</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                            <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                            <span>Valid content: {auditReport.length} characters</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {auditReport.trim() && (
                          <button 
                            onClick={() => setAuditReport('')}
                            className="flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Clear
                          </button>
                        )}
                        <button 
                          onClick={copyAuditReport}
                          disabled={!auditReport.trim()}
                          className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            !auditReport.trim() 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50' 
                            : reportCopied 
                              ? 'bg-green-600 text-white' 
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                          }`}
                        >
                          {reportCopied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <ClipboardList className="w-3.5 h-3.5 mr-1.5" />}
                          {reportCopied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === SETTINGS_TAB_ID && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Sub-tabs for Steps inside Settings */}
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                      {INITIAL_STEPS.map(step => {
                        const hasError = validationIssues.some(i => i.step === step.id);
                        return (
                          <button
                            key={step.id}
                            onClick={() => setSelectedSettingStep(step.id)}
                            className={`relative px-4 py-1.5 text-xs font-bold rounded-md transition-all ${selectedSettingStep === step.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            Step {step.id}
                            {hasError && showValidationErrors && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Persistent Summary Error Message */}
                    {showValidationErrors && validationIssues.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400 animate-in slide-in-from-top-4">
                        <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-sm leading-relaxed">
                          <p className="font-bold mb-1 uppercase tracking-tight text-xs">Prompt Validation Summary</p>
                          <ul className="list-disc list-inside space-y-1 opacity-90">
                            {validationIssues.map(issue => (
                              <li key={issue.step}>
                                <span className="font-semibold">Step {issue.step}:</span> Missing {issue.fields.join(' and ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 space-y-8 animate-in zoom-in-95">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${currentStepIssues && showValidationErrors ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                            {getStepIcon(selectedSettingStep)}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{currentStepSettings.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{currentStepSettings.description}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => resetSinglePrompt(currentPromptKey)} 
                          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset to Default</span>
                        </button>
                      </div>

                      {/* Guide Section for Purpose and Input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Target className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 uppercase tracking-tight">Step Purpose</h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                              {currentStepSettings.purpose}
                            </p>
                          </div>
                        </div>
                        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 flex items-start space-x-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 uppercase tracking-tight">Context Chain</h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              {selectedSettingStep === 1 
                                ? 'This step acts as the entry point, processing the original uploaded document directly.' 
                                : `This step receives the detailed output from Step ${selectedSettingStep - 1} as its primary instruction context.`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Side: System Persona & Library */}
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="flex items-center justify-between">
                              <span className={`flex items-center text-[10px] font-bold uppercase tracking-widest ${showValidationErrors && !prompts[currentPromptKey].systemRole.trim() ? 'text-red-500' : 'text-slate-400'}`}>
                                <Bot className={`w-3.5 h-3.5 mr-1.5 ${showValidationErrors && !prompts[currentPromptKey].systemRole.trim() ? 'text-red-500' : 'text-indigo-500'}`} />
                                System Persona / AI Role
                              </span>
                              <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" title="This defines the expertise and personality of the AI agent." />
                            </label>
                            <textarea 
                              value={prompts[currentPromptKey].systemRole} 
                              onChange={(e) => handlePromptChange(currentPromptKey, 'systemRole', e.target.value)} 
                              rows={3} 
                              className={`w-full p-4 border rounded-xl text-sm leading-relaxed bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner ${showValidationErrors && !prompts[currentPromptKey].systemRole.trim() ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10 dark:bg-red-900/5' : 'border-slate-200 dark:border-slate-800'}`} 
                              placeholder="e.g. You are a Senior Researcher..."
                            />
                            
                            {/* Descriptive explanation for Role */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                              <div className="flex items-center space-x-2 mb-1">
                                <Search className="w-3 h-3 text-indigo-500" />
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">AI Identity Guide</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Define the AI's professional background. A strong persona ensures the tone and technical depth match the specific needs of {currentStepSettings.title.split('. ')[1]}.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Users className="w-3.5 h-3.5 text-amber-500" />
                              <span>Role Library / Presets</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentStepSettings.systemRoleExamples.map((ex, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => applyExample(currentPromptKey, 'systemRole', ex)} 
                                  className="group text-left p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md">
                                      <Users className="w-3 h-3" />
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">{ex}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Task Instructions & Examples */}
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="flex items-center text-[10px] font-bold uppercase tracking-widest">
                              <Terminal className={`w-3.5 h-3.5 mr-1.5 ${showValidationErrors && !prompts[currentPromptKey].userPrompt.trim() ? 'text-red-500' : 'text-emerald-500'}`} />
                              <span className={showValidationErrors && !prompts[currentPromptKey].userPrompt.trim() ? 'text-red-500' : 'text-slate-400'}>Task Instructions / Prompt</span>
                            </label>
                            <div className={`border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm ${showValidationErrors && !prompts[currentPromptKey].userPrompt.trim() ? 'border-red-500 ring-2 ring-red-500' : 'border-slate-200 dark:border-slate-800'}`}>
                              <CodeMirror 
                                value={prompts[currentPromptKey].userPrompt} 
                                height="200px" 
                                theme={theme === 'dark' ? 'dark' : 'light'} 
                                extensions={[markdown()]} 
                                onChange={(val) => handlePromptChange(currentPromptKey, 'userPrompt', val)} 
                                basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }} 
                              />
                            </div>
                            
                            {/* Descriptive explanation for Output */}
                            <div className="p-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-800/30">
                              <div className="flex items-center space-x-2 mb-1">
                                <FileOutput className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Deliverable Requirements</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Expected format: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentStepSettings.expectedOutput}</span>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
                              <span>Instruction Variations</span>
                            </div>
                            <div className="space-y-2">
                              {currentStepSettings.userPromptExamples.map((ex, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => applyExample(currentPromptKey, 'userPrompt', ex)} 
                                  className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-all"
                                >
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{ex}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary Step Info */}
                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400">Step {selectedSettingStep}: Workflow Integration</span>
                        </div>
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Sequential Handoff Enabled</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-4 border-t transition-all z-10 rounded-b-xl">
                      {validationIssues.length > 0 && showValidationErrors && (
                         <div className="flex items-center px-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50 animate-in fade-in slide-in-from-right-4">
                           <AlertCircle className="w-4 h-4 mr-2" />
                           {validationIssues.length} Step(s) have missing configuration.
                         </div>
                      )}
                      <button 
                        onClick={savePrompts} 
                        disabled={saveStatus !== 'idle'} 
                        className={`flex items-center px-6 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-md active:scale-95 ${saveStatus === 'saved' ? 'bg-green-600' : (showValidationErrors && validationIssues.length > 0) ? 'bg-red-400 cursor-not-allowed opacity-80' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                        {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saveStatus === 'saved' ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {saveStatus === 'saving' ? 'Saving Configuration...' : saveStatus === 'saved' ? 'Saved Successfully' : 'Save All Prompts'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab > 0 && activeTab < SETTINGS_TAB_ID && (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    {steps.find(s => s.id === activeTab)?.status === 'loading' && (
                      <div className="flex flex-col items-center justify-center h-80 space-y-6 animate-in fade-in duration-500">
                        <div className="relative">
                          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                          <div className="relative bg-white dark:bg-slate-900 p-8 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-xl flex items-center justify-center">
                            <Zap className="w-12 h-12 text-indigo-600 animate-bounce" />
                            <div className="absolute inset-0 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">AI Reasoning in Progress...</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{steps.find(s => s.id === activeTab)?.description}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                        </div>
                      </div>
                    )}
                    {steps.find(s => s.id === activeTab)?.status === 'completed' && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-500 relative">
                        {isEditingResult ? (
                          <div ref={editContainerRef} className="space-y-4 animate-in zoom-in-95 duration-200">
                             <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                 <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                                 Direct Edit Mode
                               </div>
                               <button 
                                 onClick={() => setIsEditingResult(false)}
                                 className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                               >
                                 <X className="w-4 h-4 text-slate-400" />
                               </button>
                             </div>
                             
                             <div className={`border-2 rounded-xl overflow-hidden transition-all shadow-md focus-within:ring-4 focus-within:ring-indigo-500/20 ${editValidationError ? 'border-red-500 ring-2 ring-red-500/10' : 'border-indigo-100 dark:border-indigo-800'}`}>
                               <CodeMirror 
                                 value={editValue} 
                                 height="auto" 
                                 minHeight="300px"
                                 theme={theme === 'dark' ? 'dark' : 'light'} 
                                 extensions={[markdown()]} 
                                 onChange={(val) => { setEditValue(val); setEditValidationError(null); }} 
                                 placeholder="Enter your refined content here (Markdown supported)..."
                                 basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }} 
                               />
                             </div>

                             {editValidationError && (
                               <div className="flex items-center text-xs font-bold text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800/50 animate-in shake">
                                 <AlertCircle className="w-3.5 h-3.5 mr-2" />
                                 {editValidationError}
                               </div>
                             )}

                             <div className="flex justify-end items-center space-x-3 pt-2">
                               <p className="text-[10px] text-slate-400 italic">Click outside or press Ctrl+S to save changes</p>
                               <button 
                                 onClick={handleSaveEdit}
                                 className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                               >
                                 <Check className="w-3.5 h-3.5 mr-2" />
                                 Apply Refinements
                               </button>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div>
                              <ReactMarkdown>{steps.find(s => s.id === activeTab)?.content || ''}</ReactMarkdown>
                            </div>
                            
                            {/* Citations / Grounding Results */}
                            {steps.find(s => s.id === activeTab)?.citations && steps.find(s => s.id === activeTab)!.citations!.length > 0 && (
                              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-700">
                                <h4 className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                                  <Search className="w-4 h-4 mr-2 text-indigo-500" />
                                  AI Grounding References
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {steps.find(s => s.id === activeTab)!.citations!.map((chunk, idx) => (
                                    <a 
                                      key={idx} 
                                      href={chunk.web?.uri || chunk.maps?.uri} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-start p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
                                    >
                                      <div className="mr-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-500">
                                        {chunk.web ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                                          {chunk.web?.title || chunk.maps?.title || "Reference source"}
                                        </p>
                                        <div className="flex items-center mt-1 text-[9px] text-slate-400 truncate font-mono">
                                          <ExternalLink className="w-2.5 h-2.5 mr-1" />
                                          {(chunk.web?.uri || chunk.maps?.uri)?.replace(/^https?:\/\//, '')}
                                        </div>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {steps.find(s => s.id === activeTab)?.status === 'pending' && (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Play className="w-12 h-12 opacity-20 mb-4" />
                        <p className="font-medium">Run the workflow to generate content for this step.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {activeTab !== 0 && activeTab !== SETTINGS_TAB_ID && steps.find(s => s.id === activeTab)?.status === 'completed' && !isEditingResult && (
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t flex justify-end">
                  <button onClick={() => navigator.clipboard.writeText(steps.find(s => s.id === activeTab)?.content || '')} className="text-sm text-slate-600 hover:text-indigo-600 font-medium flex items-center transition-colors">
                    <ClipboardList className="w-4 h-4 mr-2" /> Copy Markdown
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