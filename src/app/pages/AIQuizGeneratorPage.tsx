import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Upload, FileText, Trash2, Edit2, Check, X, Sparkles, Brain, CheckCircle, History, User, Calendar, Hash, Tag, Globe, Languages } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Breadcrumb } from '../components/Breadcrumb';
import { toast } from 'sonner';

type QuestionType = 'multiple-choice' | 'true-false' | 'both';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

type GeneratedQuestion = {
  id: number;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string;
  difficulty: DifficultyLevel;
};

type LanguageQuestionMap = Record<string, GeneratedQuestion[]>;

type GenerationHistory = {
  id: number;
  userName: string;
  userEmail: string;
  generatedDate: string;
  generatedTime: string;
  questionType: string;
  numberOfQuestions: number;
  category: string;
  addedToCourse: boolean;
};

export function AIQuizGeneratorPage() {
  const navigate = useNavigate();

  // Form State
  const [sourceText, setSourceText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedCourseFile, setSelectedCourseFile] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('both');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState('5');
  const [numberOfMCQuestions, setNumberOfMCQuestions] = useState('3');
  const [numberOfTFQuestions, setNumberOfTFQuestions] = useState('2');
  const [isGenerating, setIsGenerating] = useState(false);

  // Single language selection
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const availableLanguages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español - Internacional', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
    { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'te', label: 'Telugu', flag: '🇮🇳' },
    { code: 'kn', label: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', label: 'Malayalam', flag: '🇮🇳' },
  ];

  // Results State
  const [showResults, setShowResults] = useState(false);
  const [questionsByLanguage, setQuestionsByLanguage] = useState<LanguageQuestionMap>({});
  const [languageOrder, setLanguageOrder] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<{ lang: string; id: number } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);

  // Multi-select state — per language
  const [selectedIdsByLang, setSelectedIdsByLang] = useState<Record<string, Set<number>>>({});
  // Collapsed state per language box
  const [collapsedLangs, setCollapsedLangs] = useState<Set<string>>(new Set());

  // Translate modal state
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [translateTargets, setTranslateTargets] = useState<Set<string>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const translateModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTranslateModal) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (translateModalRef.current && !translateModalRef.current.contains(e.target as Node)) {
        setShowTranslateModal(false);
        setTranslateTargets(new Set());
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTranslateModal]);

  // History State
  const [showHistory, setShowHistory] = useState(false);

  // Global Selection State
  const [addToCourse, setAddToCourse] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('General Knowledge');
  const [newCategory, setNewCategory] = useState('');

  const availableCategories = [
    'General Knowledge', 'Science & Technology', 'Mathematics', 'History',
    'Geography', 'Business', 'Computer Science', 'Language Arts'
  ];

  const availableCourseFiles = [
    { id: 1, name: 'Information Security Management System.pdf' },
    { id: 2, name: 'Cyber Security Basics.pptx' },
    { id: 3, name: 'Data Protection Guidelines.pdf' },
    { id: 4, name: 'Network Security Fundamentals.pptx' }
  ];

  const generationHistory: GenerationHistory[] = [
    { id: 1, userName: 'John Smith', userEmail: 'john.smith@example.com', generatedDate: '2026-04-19', generatedTime: '10:30 AM', questionType: 'Both (3 MC, 2 TF)', numberOfQuestions: 5, category: 'Computer Science', addedToCourse: true },
    { id: 2, userName: 'Sarah Johnson', userEmail: 'sarah.j@example.com', generatedDate: '2026-04-18', generatedTime: '02:15 PM', questionType: 'Multiple Choice', numberOfQuestions: 10, category: 'Science & Technology', addedToCourse: false },
    { id: 3, userName: 'Michael Chen', userEmail: 'mchen@example.com', generatedDate: '2026-04-18', generatedTime: '09:45 AM', questionType: 'True/False', numberOfQuestions: 8, category: 'General Knowledge', addedToCourse: true },
    { id: 4, userName: 'Emily Davis', userEmail: 'emily.davis@example.com', generatedDate: '2026-04-17', generatedTime: '04:20 PM', questionType: 'Both (6 MC, 4 TF)', numberOfQuestions: 10, category: 'Mathematics', addedToCourse: true },
    { id: 5, userName: 'David Wilson', userEmail: 'dwilson@example.com', generatedDate: '2026-04-17', generatedTime: '11:00 AM', questionType: 'Multiple Choice', numberOfQuestions: 15, category: 'Business', addedToCourse: false }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      toast.success('File uploaded successfully');
    }
  };

  const generateQuestionsForLanguage = (
    mcCount: number,
    tfCount: number,
    difficulty: DifficultyLevel,
    language: string,
    singleType?: QuestionType
  ): GeneratedQuestion[] => {
    const questions: GeneratedQuestion[] = [];
    let qId = 1;
    const langSuffix = language !== 'English' ? ` [${language}]` : '';

    if (singleType === 'multiple-choice') {
      for (let i = 0; i < mcCount; i++) {
        questions.push({ id: qId++, type: 'multiple-choice', question: `Sample multiple choice question ${i + 1} about the topic?${langSuffix}`, options: [`Option A - First answer choice${langSuffix}`, `Option B - Second answer choice${langSuffix}`, `Option C - Third answer choice${langSuffix}`, `Option D - Fourth answer choice${langSuffix}`], correctAnswer: `Option A - First answer choice${langSuffix}`, difficulty });
      }
    } else if (singleType === 'true-false') {
      for (let i = 0; i < mcCount; i++) {
        questions.push({ id: qId++, type: 'true-false', question: `Sample true/false statement ${i + 1} about the topic?${langSuffix}`, options: ['True', 'False'], correctAnswer: 'True', difficulty });
      }
    } else {
      for (let i = 0; i < mcCount; i++) {
        questions.push({ id: qId++, type: 'multiple-choice', question: `Sample multiple choice question ${i + 1} about the topic?${langSuffix}`, options: [`Option A - First answer choice${langSuffix}`, `Option B - Second answer choice${langSuffix}`, `Option C - Third answer choice${langSuffix}`, `Option D - Fourth answer choice${langSuffix}`], correctAnswer: `Option A - First answer choice${langSuffix}`, difficulty });
      }
      for (let i = 0; i < tfCount; i++) {
        questions.push({ id: qId + i, type: 'true-false', question: `Sample true/false statement ${i + 1} about the topic?${langSuffix}`, options: ['True', 'False'], correctAnswer: 'True', difficulty });
      }
    }
    return questions;
  };

  const handleGenerate = async () => {
    if (!sourceText && !uploadedFile && !selectedCourseFile) {
      toast.error('Input required', { description: 'Please provide source text, upload a file, or select a course file' });
      return;
    }

    if (questionType === 'both') {
      const mcCount = parseInt(numberOfMCQuestions);
      const tfCount = parseInt(numberOfTFQuestions);
      if (!numberOfMCQuestions || mcCount < 1 || !numberOfTFQuestions || tfCount < 1) {
        toast.error('Invalid number', { description: 'Please enter valid numbers for both question types' });
        return;
      }
      if ((mcCount + tfCount) > 50) {
        toast.error('Limit exceeded', { description: 'Total questions cannot exceed 50' });
        return;
      }
    } else {
      const count = parseInt(numberOfQuestions);
      if (!numberOfQuestions || count < 1) {
        toast.error('Invalid number', { description: 'Please enter a valid number of questions' });
        return;
      }
      if (count > 50) {
        toast.error('Limit exceeded', { description: 'Maximum 50 questions allowed' });
        return;
      }
    }

    const confirmed = window.confirm('⚠️ Token Usage Notice\n\nOnce you generate questions, tokens will be consumed and cannot be refunded.\n\nDo you want to proceed with question generation?');
    if (!confirmed) return;

    setIsGenerating(true);

    setTimeout(() => {
      const questions = questionType === 'both'
        ? generateQuestionsForLanguage(parseInt(numberOfMCQuestions), parseInt(numberOfTFQuestions), difficultyLevel, selectedLanguage)
        : generateQuestionsForLanguage(parseInt(numberOfQuestions), 0, difficultyLevel, selectedLanguage, questionType);

      setQuestionsByLanguage({ [selectedLanguage]: questions });
      setLanguageOrder([selectedLanguage]);
      setShowResults(true);
      setIsGenerating(false);
      toast.success('Questions generated!', { description: `${questions.length} questions in ${selectedLanguage}` });
    }, 2000);
  };

  const handleTranslate = () => {
    if (translateTargets.size === 0) {
      toast.error('Select a language', { description: 'Please choose at least one language to translate to' });
      return;
    }

    setIsTranslating(true);
    const sourceQuestions = questionsByLanguage[languageOrder[0]] ?? [];
    const targets = Array.from(translateTargets);

    setTimeout(() => {
      const newSets: LanguageQuestionMap = {};
      targets.forEach(target => {
        newSets[target] = sourceQuestions.map((q, i) => {
          const langSuffix = ` [${target}]`;
          return {
            ...q,
            id: i + 1,
            question: q.question.replace(/\[.*?\]/, '').trimEnd() + langSuffix,
            options: q.options?.map(o => o.replace(/\[.*?\]/, '').trimEnd() + langSuffix),
            correctAnswer: q.correctAnswer.replace(/\[.*?\]/, '').trimEnd() + langSuffix,
          };
        });
      });

      setQuestionsByLanguage(prev => ({ ...prev, ...newSets }));
      setLanguageOrder(prev => [...prev, ...targets]);
      setIsTranslating(false);
      setShowTranslateModal(false);
      setTranslateTargets(new Set());
      toast.success(`Translated to ${targets.length} language${targets.length > 1 ? 's' : ''}!`, {
        description: `${sourceQuestions.length} questions × ${targets.length} languages`
      });
    }, 1800);
  };

  const handleEditQuestion = (lang: string, question: GeneratedQuestion) => {
    setEditingKey({ lang, id: question.id });
    setEditingQuestion({ ...question });
  };

  const handleSaveEdit = () => {
    if (editingKey && editingQuestion) {
      setQuestionsByLanguage(prev => ({
        ...prev,
        [editingKey.lang]: prev[editingKey.lang].map(q => q.id === editingQuestion.id ? editingQuestion : q),
      }));
      setEditingKey(null);
      setEditingQuestion(null);
      toast.success('Question updated');
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (lang: string, id: number) => {
    if (!window.confirm('Delete this question?\n\nThis action cannot be undone.')) return;
    setQuestionsByLanguage(prev => ({
      ...prev,
      [lang]: prev[lang].filter(q => q.id !== id),
    }));
    setSelectedIdsByLang(prev => { const cur = new Set(prev[lang] ?? []); cur.delete(id); return { ...prev, [lang]: cur }; });
    toast.success('Question deleted');
  };

  const getSelectedIds = (lang: string): Set<number> => selectedIdsByLang[lang] ?? new Set();

  const toggleSelectQuestion = (lang: string, id: number) => {
    setSelectedIdsByLang(prev => {
      const cur = new Set(prev[lang] ?? []);
      cur.has(id) ? cur.delete(id) : cur.add(id);
      return { ...prev, [lang]: cur };
    });
  };

  const toggleSelectAll = (lang: string) => {
    const ids = (questionsByLanguage[lang] ?? []).map(q => q.id);
    const cur = getSelectedIds(lang);
    const allSelected = ids.every(id => cur.has(id));
    setSelectedIdsByLang(prev => ({
      ...prev,
      [lang]: allSelected ? new Set() : new Set(ids),
    }));
  };

  const handleDeleteSelected = (lang: string) => {
    const sel = getSelectedIds(lang);
    const count = sel.size;
    if (count === 0) return;
    if (!window.confirm(`Delete ${count} selected question${count > 1 ? 's' : ''}?\n\nThis action cannot be undone.`)) return;
    setQuestionsByLanguage(prev => ({
      ...prev,
      [lang]: (prev[lang] ?? []).filter(q => !sel.has(q.id)),
    }));
    setSelectedIdsByLang(prev => ({ ...prev, [lang]: new Set() }));
    toast.success(`${count} question${count > 1 ? 's' : ''} deleted`);
  };

  const toggleCollapse = (lang: string) => {
    setCollapsedLangs(prev => {
      const next = new Set(prev);
      next.has(lang) ? next.delete(lang) : next.add(lang);
      return next;
    });
  };

  const handleSubmitQuestions = () => {
    const category = selectedCategory === 'new' ? newCategory : selectedCategory;
    if (selectedCategory === 'new' && !newCategory) {
      toast.error('Category name required', { description: 'Please enter a name for the new category' });
      return;
    }
    const totalQ = Object.values(questionsByLanguage).reduce((sum, qs) => sum + qs.length, 0);
    if (addToCourse) {
      toast.success('Added to Course', { description: `${totalQ} question(s) added to course successfully` });
    }
    toast.success('Added to Question Bank', { description: `${totalQ} question(s) added to "${category}" category` });
    handleCancel();
  };

  const handleCancel = () => {
    setShowResults(false);
    setSourceText('');
    setUploadedFile(null);
    setSelectedCourseFile('');
    setNumberOfQuestions('5');
    setNumberOfMCQuestions('3');
    setNumberOfTFQuestions('2');
    setQuestionsByLanguage({});
    setLanguageOrder([]);
    setSelectedIdsByLang({});
    setCollapsedLangs(new Set());
    setSelectedCategory('General Knowledge');
    setNewCategory('');
    setAddToCourse(false);
    setSelectedLanguage('English');
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const totalQuestions = Object.values(questionsByLanguage).reduce((sum, qs) => sum + qs.length, 0);
  const alreadyTranslatedLanguages = new Set(languageOrder);
  const translateOptions = availableLanguages.filter(l => !alreadyTranslatedLanguages.has(l.label));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Quiz Generator</h1>
                <p className="text-sm text-gray-500">Generate questions automatically using AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${showHistory ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <History className="w-4 h-4" />
                {showHistory ? 'Hide History' : 'View History'}
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Breadcrumb items={[{ label: 'Courses', path: '/courses' }, { label: 'AI Quiz Generator', path: '/ai-quiz-generator' }]} />
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-12">
        {showHistory ? (
          /* History Table */
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Generation History</h2>
                  <p className="text-gray-600">Track all AI quiz generations and their handlers</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"><div className="flex items-center gap-2"><User className="w-4 h-4" />User</div></th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"><div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Date & Time</div></th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Question Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"><div className="flex items-center gap-2"><Hash className="w-4 h-4" />Questions</div></th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"><div className="flex items-center gap-2"><Tag className="w-4 h-4" />Category</div></th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Added to Course</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generationHistory.map((record, index) => (
                    <motion.tr key={record.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{record.userName.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{record.userName}</div>
                            <div className="text-xs text-gray-500">{record.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.generatedDate}</div>
                        <div className="text-xs text-gray-500">{record.generatedTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900">{record.questionType}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{record.numberOfQuestions}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">{record.category}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.addedToCourse
                          ? <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" />Yes</span>
                          : <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"><X className="w-4 h-4 mr-1" />No</span>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : !showResults ? (
          /* Generation Form */
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Generate Questions</h2>
                  <p className="text-gray-600">Provide content and configure generation settings</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Source Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Source Text</label>
                  <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Enter or paste your content here to generate questions from..." className="w-full h-40 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y" />
                  <p className="text-xs text-gray-500 mt-1">{sourceText.length} characters</p>
                </div>

                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center"><span className="px-3 bg-white text-sm text-gray-500 font-medium">OR</span></div></div>

                {/* Upload File */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload File</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    <input type="file" id="file-upload" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" onChange={handleFileUpload} className="hidden" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploadedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-10 h-10 text-purple-600" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                            <p className="text-xs text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); setUploadedFile(null); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">Upload a document</p>
                          <p className="text-xs text-gray-500 mt-1">PDF, DOC, TXT, PPT (Max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center"><span className="px-3 bg-white text-sm text-gray-500 font-medium">OR</span></div></div>

                {/* Select Course Files */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Course Files</label>
                  <select value={selectedCourseFile} onChange={(e) => setSelectedCourseFile(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white">
                    <option value="">Choose from existing course files...</option>
                    {availableCourseFiles.map(file => <option key={file.id} value={file.name}>{file.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Question Type</label>
                    <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white">
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True or False</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                    <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value as DifficultyLevel)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Number of Questions */}
                {questionType === 'both' ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Number of Multiple Choice Questions</span></label>
                        <input type="number" value={numberOfMCQuestions} onChange={(e) => setNumberOfMCQuestions(e.target.value)} min="1" max="50" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                        <p className="text-xs text-gray-500 mt-1">Max: 50 questions</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div>Number of True/False Questions</span></label>
                        <input type="number" value={numberOfTFQuestions} onChange={(e) => setNumberOfTFQuestions(e.target.value)} min="1" max="50" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                        <p className="text-xs text-gray-500 mt-1">Max: 50 questions</p>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-amber-800"><strong>Note:</strong> Total combined questions cannot exceed 50. Currently: {parseInt(numberOfMCQuestions || '0') + parseInt(numberOfTFQuestions || '0')} questions</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Questions</label>
                    <input type="number" value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(e.target.value)} min="1" max="50" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    <p className="text-xs text-gray-500 mt-1">Max: 50 questions</p>
                  </motion.div>
                )}

                {/* Output Language — single select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-purple-500" />Output Language</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Choose the language for the generated questions. You can translate to additional languages on the results page.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {availableLanguages.map(lang => {
                      const isSelected = selectedLanguage === lang.label;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setSelectedLanguage(lang.label)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <span className="text-base leading-none">{lang.flag}</span>
                          <span className="truncate">{lang.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-purple-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Token Warning */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-900 mb-1">Important: Token Usage</h4>
                    <p className="text-sm text-red-800">Once you click "Generate Questions", tokens will be consumed from your account. <strong>Tokens are non-refundable</strong> and cannot be returned even if you cancel or modify the questions after generation.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancel</button>
                <button onClick={handleGenerate} disabled={isGenerating} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50">
                  {isGenerating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Questions</>}
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Questions Generated Successfully!</h2>
                    <p className="text-purple-100 mb-3">Review and edit questions. Use Translate to create additional language sets.</p>
                    <div className="flex flex-wrap gap-2">
                      {languageOrder.map(lang => {
                        const langObj = availableLanguages.find(l => l.label === lang);
                        const count = questionsByLanguage[lang]?.length ?? 0;
                        return (
                          <span key={lang} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm border border-white/30">
                            <span>{langObj?.flag}</span>
                            <span>{lang}</span>
                            <span className="bg-white/30 rounded-full px-1.5 py-0.5 text-xs font-bold">{count}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-bold">{totalQuestions}</div>
                  <div className="text-sm text-purple-100">Total Questions</div>
                  <div className="text-xs text-purple-200 mt-1">{languageOrder.length} language{languageOrder.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Translate Button row */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{languageOrder.length} question set{languageOrder.length !== 1 ? 's' : ''}</p>
              <div className="relative" ref={translateModalRef}>
                <button
                  onClick={() => { setShowTranslateModal(prev => !prev); setTranslateTargets(new Set()); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Languages className="w-4 h-4" />
                  {isTranslating ? 'Translating...' : 'Translate'}
                  {isTranslating && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                </button>

                {showTranslateModal && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-indigo-800 flex items-center gap-2"><Languages className="w-4 h-4" />Translate to Language</p>
                        {translateTargets.size > 0 && (
                          <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">{translateTargets.size} selected</span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-600 mt-0.5">Select multiple — each gets its own question set</p>
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                      {translateOptions.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-gray-400 text-center">All languages already added</li>
                      ) : translateOptions.map(lang => {
                        const isChecked = translateTargets.has(lang.label);
                        return (
                          <li key={lang.code}>
                            <button
                              type="button"
                              onClick={() => {
                                setTranslateTargets(prev => {
                                  const next = new Set(prev);
                                  next.has(lang.label) ? next.delete(lang.label) : next.add(lang.label);
                                  return next;
                                });
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${isChecked ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 pointer-events-none"
                              />
                              <span className="text-base w-5">{lang.flag}</span>
                              <span className="flex-1">{lang.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {translateOptions.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-100">
                        <button onClick={handleTranslate} disabled={translateTargets.size === 0 || isTranslating} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Languages className="w-4 h-4" />
                          {translateTargets.size === 0 ? 'Select languages...' : `Translate to ${translateTargets.size} language${translateTargets.size > 1 ? 's' : ''}`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Individual Language Boxes */}
            <div className="space-y-4">
              {languageOrder.map((lang, langIndex) => {
                const langObj = availableLanguages.find(l => l.label === lang);
                const questions = questionsByLanguage[lang] ?? [];
                const selIds = getSelectedIds(lang);
                const isCollapsed = collapsedLangs.has(lang);
                const isOriginal = langIndex === 0;

                return (
                  <motion.div
                    key={lang}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: langIndex * 0.08 }}
                    className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden"
                  >
                    {/* Box Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{langObj?.flag}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{lang}</h3>
                              {!isOriginal && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-200">
                                  <Languages className="w-3 h-3" />Translated
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Bulk delete bar */}
                          {selIds.size > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                              <span className="text-sm font-medium text-red-700">{selIds.size} selected</span>
                              <button onClick={() => handleDeleteSelected(lang)} className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />Delete Selected
                              </button>
                              <button onClick={() => setSelectedIdsByLang(prev => ({ ...prev, [lang]: new Set() }))} className="p-1 text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          )}
                          {/* Collapse toggle */}
                          <button onClick={() => toggleCollapse(lang)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Select All */}
                      {!isCollapsed && questions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`select-all-${lang}`}
                            checked={questions.length > 0 && questions.every(q => selIds.has(q.id))}
                            onChange={() => toggleSelectAll(lang)}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                          />
                          <label htmlFor={`select-all-${lang}`} className="text-sm text-gray-600 cursor-pointer select-none">
                            Select all ({questions.length})
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Questions list */}
                    {!isCollapsed && (
                      <div className="p-5 space-y-3">
                        {questions.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">All questions deleted</p>
                          </div>
                        ) : questions.map((question, index) => (
                          <div
                            key={`${lang}-${question.id}`}
                            className={`rounded-xl border p-4 transition-all ${selIds.has(question.id) ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200 hover:shadow-sm'}`}
                          >
                            <div className="flex items-start gap-3">
                              <input type="checkbox" checked={selIds.has(question.id)} onChange={() => toggleSelectQuestion(lang, question.id)} className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer flex-shrink-0" />
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                {editingKey?.lang === lang && editingKey?.id === question.id && editingQuestion ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">Question</label>
                                      <textarea value={editingQuestion.question} onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y bg-white text-sm" rows={2} />
                                    </div>
                                    {editingQuestion.type === 'multiple-choice' && editingQuestion.options && (
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Options</label>
                                        <div className="space-y-2">
                                          {editingQuestion.options.map((option, idx) => (
                                            <input key={idx} value={option} onChange={(e) => { const o = [...editingQuestion.options!]; o[idx] = e.target.value; setEditingQuestion({ ...editingQuestion, options: o }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white" />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">Correct Answer</label>
                                      <select value={editingQuestion.correctAnswer} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white">
                                        {editingQuestion.options?.map(option => <option key={option} value={option}>{option}</option>)}
                                      </select>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />Save</button>
                                      <button onClick={handleCancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm flex items-center gap-1.5"><X className="w-3.5 h-3.5" />Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <p className="text-gray-900 font-medium text-sm mb-1.5">{question.question}</p>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getDifficultyColor(question.difficulty)}`}>{question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}</span>
                                          <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-300 font-medium">{question.type === 'multiple-choice' ? 'Multiple Choice' : 'True/False'}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 ml-3">
                                        <button onClick={() => handleEditQuestion(lang, question)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDeleteQuestion(lang, question.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      {question.options?.map((option, idx) => (
                                        <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${option === question.correctAnswer ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                                          <span className="font-medium text-gray-600">{String.fromCharCode(65 + idx)}.</span>
                                          <span className="text-gray-900">{option}</span>
                                          {option === question.correctAnswer && <CheckCircle className="w-3.5 h-3.5 text-green-600 ml-auto" />}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Question Settings */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all">
                  <input type="checkbox" checked={addToCourse} onChange={(e) => setAddToCourse(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" />
                  <div className="flex-1">
                    <span className="text-base font-semibold text-gray-900 block">Add to Course</span>
                    <span className="text-sm text-gray-600">Add all {totalQuestions} questions ({languageOrder.length} language set{languageOrder.length !== 1 ? 's' : ''}) to the current course</span>
                  </div>
                </label>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); if (e.target.value !== 'new') setNewCategory(''); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white">
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="new">+ Create New Category</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">All {totalQuestions} questions will be added to this category</p>
                </div>
                {selectedCategory === 'new' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Category Name</label>
                    <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Enter category name..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-2">
              <button onClick={handleCancel} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancel & Return</button>
              <button onClick={handleSubmitQuestions} disabled={totalQuestions === 0} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Check className="w-4 h-4" />
                Submit All Questions ({totalQuestions})
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
