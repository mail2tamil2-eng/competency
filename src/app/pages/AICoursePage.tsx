import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ArrowRight, Upload, FileText, Sparkles, BookOpen, Plus, Trash2,
  Edit2, Check, X, RefreshCw, Globe, ChevronDown, ChevronUp, Link,
  MessageSquare, ClipboardList, HelpCircle, FileEdit, Send, Image,
  Calendar, Tag, Layers, Eye, Bold, Italic, List, ListOrdered, Wand2,
  AlertTriangle, GripVertical, Folder, HelpCircle as QuizIcon, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Breadcrumb } from '../components/Breadcrumb';
import { toast } from 'sonner';

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500" />

            <div className="p-6">
              {/* Icon + title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-base font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
                </div>
              </div>

              {/* Warning note */}
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">
                <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-200 transition-all"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = 'assignment' | 'page' | 'url' | 'form' | 'feedback' | 'quiz';

type ActivityConfig = {
  enabled: boolean;
  count: number;
  questions?: number; // quiz only: questions per quiz
};

type CourseItem = {
  id: string;
  type: 'lesson' | ActivityType;
  title: string;
  content: string;
  questions?: number;
  url?: string;
};

type CourseSection = {
  id: string;
  title: string;
  description: string;
  items: CourseItem[];
};

type GeneratedCourse = {
  shortName: string;
  description: string;
  startDate: string;
  thumbnailGradient: string;
  sections: CourseSection[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Business & Management', 'Computer Science & IT', 'Data Science & Analytics',
  'Design & Creative Arts', 'Engineering & Technology', 'Health & Medicine',
  'Humanities & Social Sciences', 'Language & Communication', 'Law & Compliance',
  'Mathematics & Statistics', 'Personal Development', 'Science & Research',
];

const LANGUAGES = [
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

const ACTIVITIES: { type: ActivityType; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { type: 'quiz',       label: 'Quiz',       icon: HelpCircle,    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { type: 'assignment', label: 'Assignment', icon: ClipboardList, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { type: 'page',       label: 'Page',       icon: FileText,      color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  { type: 'url',        label: 'URL',        icon: Link,          color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  { type: 'form',       label: 'Form',       icon: FileEdit,      color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { type: 'feedback',   label: 'Feedback',   icon: MessageSquare, color: 'text-pink-700',   bg: 'bg-pink-50',   border: 'border-pink-200' },
];

const GRADIENTS = [
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-500',
  'from-fuchsia-500 to-purple-600',
];

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Preview Modal ────────────────────────────────────────────────────────────

type PreviewTarget = { title: string; type: string; description: string; items?: { title: string; type: string }[] };

function PreviewModal({ target, onClose }: { target: PreviewTarget; onClose: () => void }) {
  const ACTIVITY_COLORS: Record<string, { bg: string; text: string }> = {
    lesson:     { bg: 'bg-blue-50',   text: 'text-blue-600' },
    quiz:       { bg: 'bg-green-50',  text: 'text-green-600' },
    assignment: { bg: 'bg-orange-50', text: 'text-orange-600' },
    page:       { bg: 'bg-blue-50',   text: 'text-blue-600' },
    url:        { bg: 'bg-purple-50', text: 'text-purple-600' },
    form:       { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    feedback:   { bg: 'bg-pink-50',   text: 'text-pink-600' },
  };

  const typeColor = ACTIVITY_COLORS[target.type.toLowerCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-3 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">{target.title}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor.bg} ${typeColor.text} border-current/20`}>
                  {target.type.charAt(0).toUpperCase() + target.type.slice(1)}
                </span>
              </div>
              <p className="text-sm text-blue-500 font-medium">Read-only preview.</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 pb-6">
            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{target.description}</p>

            {/* Items list (for sections) */}
            {target.items && target.items.length > 0 && (
              <div className="space-y-2 mb-5">
                {target.items.map((item, i) => {
                  const c = ACTIVITY_COLORS[item.type] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-800">{item.title}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Decorative content placeholder */}
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-teal-400 via-cyan-400 to-teal-500 flex items-center justify-center" style={{ minHeight: 320 }}>
              <div className="w-full h-full p-6 flex flex-col gap-4">
                {/* Mock course content illustration */}
                <div className="grid grid-cols-4 gap-3">
                  {['bg-yellow-300', 'bg-yellow-200', 'bg-white/40', 'bg-teal-300'].map((c, i) => (
                    <div key={i} className={`${c} rounded-lg h-14`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="bg-white/20 rounded-lg flex flex-col gap-2 p-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-300" />
                    <div className="w-full h-2 rounded bg-white/40" />
                    <div className="w-3/4 h-2 rounded bg-white/30" />
                    <div className="w-full h-2 rounded bg-white/40" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {[1,2,3].map(j => (
                      <div key={j} className="flex items-center gap-2 bg-teal-700/40 rounded-lg px-3 py-2">
                        <div className="w-5 h-5 rounded-full border-2 border-white/60 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <div className="flex-1 h-2 rounded bg-white/50" />
                      </div>
                    ))}
                    <div className="bg-white/20 rounded-lg h-8" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[0,1,2].map(k => (
                    <div key={k} className="bg-white/20 rounded-lg h-12 flex items-center justify-center gap-1">
                      <div className="w-3 h-3 rounded-full border-2 border-white/60" />
                      <div className="w-3 h-3 rounded-full border-2 border-white/60" />
                      <div className="w-3 h-3 rounded-full border-2 border-white/60" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

function RichTextEditor({
  value, onChange, placeholder, rows = 5,
  onEnhance, enhancing,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  onEnhance?: () => void;
  enhancing?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const insertAt = (before: string, after = '') => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || 'text';
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const insertLine = (prefix: string) => {
    const el = ref.current;
    if (!el) return;
    const pos = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(pos + prefix.length, pos + prefix.length); }, 0);
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <button type="button" onClick={() => insertAt('**', '**')} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertAt('_', '_')} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button type="button" onClick={() => insertLine('• ')} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="Bullet list"><List className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => insertLine('1. ')} className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></button>
        {onEnhance && (
          <>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={onEnhance}
              disabled={enhancing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-medium transition-colors disabled:opacity-60 ml-auto"
            >
              {enhancing
                ? <><div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />Enhancing...</>
                : <><Wand2 className="w-3 h-3" />Enhance with AI</>}
            </button>
          </>
        )}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-y focus:outline-none bg-white"
      />
    </div>
  );
}

// ─── Publish Success Modal ────────────────────────────────────────────────────

function PublishSuccessModal({
  courseName,
  onCreateNew,
  onClose,
}: {
  courseName: string;
  onCreateNew: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 24 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md px-10 py-12 flex flex-col items-center text-center overflow-hidden"
        >
          {/* Green check icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.2 }}
            >
              <Check className="w-9 h-9 text-green-500 stroke-[2.5]" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Course Published Successfully!</h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Your course <span className="font-semibold text-gray-700">&ldquo;{courseName || 'Untitled Course'}&rdquo;</span> has been created and published to Demo site.
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3 w-full justify-center mb-5">
            <button
              onClick={onCreateNew}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-800 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Create a new course
            </button>
            <button
              onClick={() => window.open('https://demo.example.com', '_blank')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              Visit LMS site
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>

          {/* View all courses link */}
          <button
            onClick={() => { onClose(); }}
            className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            View all courses
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Topic types (Step 2) ────────────────────────────────────────────────────

type TopicPage = { id: string; title: string };
type TopicItem = {
  id: string;
  title: string;
  pages: TopicPage[];
  quiz: { enabled: boolean; questions: number } | null;
};

const SOURCE_CHAR_LIMIT = 2000;
const GOALS_CHAR_LIMIT  = 2000;
const ACCEPTED_FILE_TYPES = '.pdf,.docx,.pptx,.txt,.odt,.rtf,.md,.csv,.epub';

// ─── Main Component ───────────────────────────────────────────────────────────

export function AICoursePage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1 state ──
  const [courseName, setCourseName]         = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [sourceText, setSourceText]         = useState('');
  const [uploadedFiles, setUploadedFiles]   = useState<File[]>([]);
  const [audience, setAudience]             = useState('');
  const [teachingGoals, setTeachingGoals]   = useState('');
  const [numberOfTopics, setNumberOfTopics] = useState('');
  const [language, setLanguage]             = useState('English');
  const [includeTopicQuiz, setIncludeTopicQuiz]         = useState(false);
  const [topicQuizQuestions, setTopicQuizQuestions]     = useState(3);
  const [finalQuizEnabled, setFinalQuizEnabled]         = useState(false);
  const [finalQuizQuestions, setFinalQuizQuestions]     = useState(10);
  const [finalFeedbackEnabled, setFinalFeedbackEnabled] = useState(false);
  const [finalFeedbackQuestions, setFinalFeedbackQuestions] = useState(3);
  const [topicQuizTypes, setTopicQuizTypes]             = useState<Set<'mcq' | 'truefalse'>>(() => new Set(['mcq']));
  const [finalQuizTypes, setFinalQuizTypes]             = useState<Set<'mcq' | 'truefalse'>>(() => new Set(['mcq']));
  const [quizSequence, setQuizSequence]                 = useState<'linear' | 'free'>('linear');
  const [courseVisibility, setCourseVisibility]         = useState<'show' | 'hide'>('show');
  const [durationValue, setDurationValue]               = useState('');
  const [durationUnit, setDurationUnit]                 = useState<'hours' | 'minutes'>('hours');
  const [startDay, setStartDay]       = useState(10);
  const [startMonth, setStartMonth]   = useState(8);
  const [startYear, setStartYear]     = useState(2026);
  const [startHour, setStartHour]     = useState(11);
  const [startMinute, setStartMinute] = useState(7);
  const [endEnabled, setEndEnabled]   = useState(false);
  const [endDay, setEndDay]           = useState(10);
  const [endMonth, setEndMonth]       = useState(8);
  const [endYear, setEndYear]         = useState(2027);
  const [endHour, setEndHour]         = useState(11);
  const [endMinute, setEndMinute]     = useState(7);
  const [isMandatory, setIsMandatory] = useState(false);
  const [enhancingSource, setEnhancingSource] = useState(false);
  const [enhancingGoals, setEnhancingGoals]   = useState(false);
  const [step1Errors, setStep1Errors]         = useState<Record<string, string>>({});
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  // ── Step 2 state ──
  const [topics, setTopics]                           = useState<TopicItem[]>([]);
  const [editingTopicId, setEditingTopicId]           = useState<string | null>(null);
  const [editingTopicDraft, setEditingTopicDraft]     = useState('');
  const [regeneratingTopicId, setRegeneratingTopicId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId]             = useState<string | null>(null);
  const [editingPageDraft, setEditingPageDraft]       = useState('');

  // activities kept for compat — not shown in UI
  const [activities] = useState<Record<ActivityType, ActivityConfig>>({
    quiz:       { enabled: false, count: 1, questions: 10 },
    assignment: { enabled: false, count: 2 },
    page:       { enabled: false, count: 1 },
    url:        { enabled: false, count: 1 },
    form:       { enabled: false, count: 1 },
    feedback:   { enabled: false, count: 1 },
  });

  // ── Generation state ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [itemEditName, setItemEditName] = useState('');
  const [itemEditDesc, setItemEditDesc] = useState('');
  const [itemEditContent, setItemEditContent] = useState('');
  const [itemContentBlocks, setItemContentBlocks] = useState<{ id: string; type: 'text' | 'image'; value: string }[]>([]);
  const [aiEditItem, setAiEditItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  const [aiEditItemPrompt, setAiEditItemPrompt] = useState('');
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);

  // ── Confirm dialog state ──
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const openConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel = 'Delete') => {
    setConfirmDialog({ open: true, title, message, confirmLabel, onConfirm });
  };
  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

  // ── Helpers ──
  const langObj       = LANGUAGES.find(l => l.label === language);
  const sourceOverLimit = sourceText.length > SOURCE_CHAR_LIMIT;
  const goalsOverLimit  = teachingGoals.length > GOALS_CHAR_LIMIT;
  const canContinue   = courseCategory && (sourceText.trim() || uploadedFiles.length > 0) && teachingGoals.trim() && !sourceOverLimit && !goalsOverLimit;

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const valid = files.filter(f => f.size <= 100 * 1024 * 1024);
    if (valid.length < files.length) toast.error('Some files exceed 100 MB and were skipped');
    setUploadedFiles(prev => [...prev, ...valid]);
    toast.success(`${valid.length} file${valid.length > 1 ? 's' : ''} added`);
    e.target.value = '';
  };

  const removeFile = (name: string) => setUploadedFiles(prev => prev.filter(f => f.name !== name));

  const handleEnhanceSource = () => {
    if (!sourceText.trim()) { toast.error('Enter some source text first'); return; }
    setEnhancingSource(true);
    setTimeout(() => {
      setSourceText(prev => prev + '\n\nThis content has been enhanced with additional context, clearer explanations, and structured learning points to improve the overall quality of the generated course material.');
      setEnhancingSource(false);
      toast.success('Source text enhanced');
    }, 1800);
  };

  const handleEnhanceGoals = () => {
    if (!teachingGoals.trim()) { toast.error('Enter teaching goals first'); return; }
    setEnhancingGoals(true);
    setTimeout(() => {
      setTeachingGoals(prev => prev + '\n• Apply knowledge through hands-on exercises and real-world scenarios\n• Demonstrate understanding through assessments and practical tasks\n• Evaluate outcomes against measurable performance benchmarks');
      setEnhancingGoals(false);
      toast.success('Teaching goals enhanced');
    }, 1800);
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!courseCategory) errors.category = 'This field is required.';
    if (!sourceText.trim() && !uploadedFiles.length) errors.source = 'Please provide either Source Text or upload a supporting document to generate the course.';
    if (sourceOverLimit) errors.sourceLimit = 'Character limit exceeded.';
    if (!teachingGoals.trim()) errors.goals = 'This field is required.';
    if (goalsOverLimit) errors.goalsLimit = 'Character limit exceeded.';
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const TOPIC_NAMES = ['Introduction to Fundamentals', 'Core Concepts & Principles', 'Advanced Techniques', 'Practical Applications', 'Assessment & Review'];

  const makeTopicPages = (topicTitle: string): TopicPage[] => [
    { id: uid(), title: `${topicTitle} Overview` },
    { id: uid(), title: `${topicTitle} Content` },
    { id: uid(), title: `${topicTitle} Content (continued)` },
    { id: uid(), title: `Recap / Summary` },
  ];

  const buildMockTopics = (): TopicItem[] => {
    const count = parseInt(numberOfTopics) || 3;
    return Array.from({ length: count }, (_, i) => {
      const title = TOPIC_NAMES[i % TOPIC_NAMES.length];
      return {
        id: uid(),
        title,
        pages: makeTopicPages(title),
        quiz: includeTopicQuiz ? { enabled: true, questions: topicQuizQuestions } : null,
      };
    });
  };

  const handleContinue = () => {
    if (!validateStep1()) return;
    setIsGeneratingTopics(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setTopics(buildMockTopics());
      setGeneratedCourse(null);
      setIsGeneratingTopics(false);
      setStep(2);
    }, 1800);
  };

  // ── Topic (Step 2) helpers ──
  const addTopic = () => {
    const title = `New Topic ${topics.length + 1}`;
    setTopics(prev => [...prev, { id: uid(), title, pages: makeTopicPages(title), quiz: includeTopicQuiz ? { enabled: true, questions: topicQuizQuestions } : null }]);
  };

  const deleteTopic = (id: string) => {
    openConfirm('Delete Topic', 'This topic and all its pages will be removed.', () => {
      setTopics(prev => prev.filter(t => t.id !== id));
      closeConfirm();
    });
  };

  const saveTopicTitle = (id: string) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, title: editingTopicDraft } : t));
    setEditingTopicId(null);
    setEditingTopicDraft('');
  };

  const savePageTitle = (topicId: string, pageId: string) => {
    setTopics(prev => prev.map(t => t.id === topicId
      ? { ...t, pages: t.pages.map(p => p.id === pageId ? { ...p, title: editingPageDraft } : p) }
      : t
    ));
    setEditingPageId(null);
    setEditingPageDraft('');
  };

  const deletePage = (topicId: string, pageId: string) => {
    setTopics(prev => prev.map(t => t.id === topicId
      ? { ...t, pages: t.pages.filter(p => p.id !== pageId) }
      : t
    ));
  };

  const regenerateTopic = (id: string) => {
    setRegeneratingTopicId(id);
    setTimeout(() => {
      setTopics(prev => prev.map(t => {
        if (t.id !== id) return t;
        return { ...t, pages: makeTopicPages(t.title), quiz: includeTopicQuiz ? { enabled: true, questions: topicQuizQuestions } : null };
      }));
      setRegeneratingTopicId(null);
      toast.success('Topic regenerated');
    }, 1200);
  };

  const buildMockCourse = (): GeneratedCourse => {
    const name = courseName || `AI-Generated Course: ${courseCategory}`;
    const shortName = name.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase() + '-AI';
    const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

    const sections: CourseSection[] = topics.map((topic, i) => {
      const items: CourseItem[] = topic.pages.map(p => ({
        id: uid(), type: 'lesson', title: p.title,
        content: `This page covers: ${p.title}. Comprehensive content exploring key ideas and practical applications for ${topic.title}.`,
      }));
      if (topic.quiz) {
        items.push({ id: uid(), type: 'quiz', title: `Knowledge Check: ${topic.title}`, content: `Quiz for ${topic.title}.`, questions: topic.quiz.questions });
      }
      return {
        id: uid(),
        title: `Section ${i + 1}: ${topic.title}`,
        description: `Explore ${topic.title} in depth through structured lessons and activities.`,
        items,
      };
    });

    if (finalQuizEnabled && sections.length) {
      sections.push({
        id: uid(),
        title: 'Final Exam / Quiz',
        description: 'Final assessment covering all course topics.',
        items: [{ id: uid(), type: 'quiz', title: 'Final Exam', content: 'Comprehensive final assessment.', questions: finalQuizQuestions }],
      });
    }
    if (finalFeedbackEnabled && sections.length) {
      sections.push({
        id: uid(),
        title: 'Course Feedback',
        description: 'Share your experience and help us improve.',
        items: [{ id: uid(), type: 'feedback', title: 'Course Feedback Survey', content: 'Share your feedback on this course.' }],
      });
    }

    return {
      shortName,
      description: `This AI-generated course on ${courseCategory} is designed for ${audience || 'learners'}. Learners will gain comprehensive knowledge through structured lessons and assessments.`,
      startDate: new Date().toISOString().split('T')[0],
      thumbnailGradient: gradient,
      sections,
    };
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedCourse(buildMockCourse());
      setIsGenerating(false);
      toast.success('Course generated!');
      setTimeout(() => document.getElementById('generated-course')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 2500);
  };

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleAddSection = () => {
    if (!generatedCourse) return;
    const newSection: CourseSection = {
      id: uid(),
      title: `Section ${generatedCourse.sections.length + 1}: New Topic`,
      description: 'Add a description for this section.',
      items: [{ id: uid(), type: 'lesson', title: 'New Lesson', content: 'Add lesson content here.' }],
    };
    setGeneratedCourse(prev => prev ? { ...prev, sections: [...prev.sections, newSection] } : prev);
    toast.success('Section added');
  };

  const handleDeleteSection = (sectionId: string) => {
    const section = generatedCourse?.sections.find(s => s.id === sectionId);
    openConfirm(
      'Delete Section',
      `"${section?.title ?? 'This section'}" and all ${section?.items.length ?? 0} item${(section?.items.length ?? 0) !== 1 ? 's' : ''} inside it will be permanently deleted.`,
      () => {
        setGeneratedCourse(prev => prev ? { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) } : prev);
        toast.success('Section deleted');
        closeConfirm();
      }
    );
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    const item = generatedCourse?.sections.find(s => s.id === sectionId)?.items.find(i => i.id === itemId);
    openConfirm(
      'Delete Item',
      `"${item?.title ?? 'This item'}" will be permanently removed from this section.`,
      () => {
        setGeneratedCourse(prev => {
          if (!prev) return prev;
          return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s) };
        });
        toast.success('Item deleted');
        closeConfirm();
      }
    );
  };

  const handleAddItem = (sectionId: string) => {
    const newItem: CourseItem = { id: uid(), type: 'lesson', title: 'New Lesson', content: 'Add lesson content here.' };
    setGeneratedCourse(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s) };
    });
    toast.success('Item added');
  };

  const handleRegenerate = (id: string) => {
    setRegeneratingId(id);
    setTimeout(() => {
      setRegeneratingId(null);
      toast.success('Regenerated successfully');
    }, 1500);
  };

  const startEditSection = (sectionId: string) => {
    const s = generatedCourse?.sections.find(s => s.id === sectionId);
    if (s) { setEditingSection(sectionId); setEditDraft(s.title); }
  };

  const saveEditSection = () => {
    if (!editingSection) return;
    setGeneratedCourse(prev => prev ? { ...prev, sections: prev.sections.map(s => s.id === editingSection ? { ...s, title: editDraft } : s) } : prev);
    setEditingSection(null);
    setEditDraft('');
    toast.success('Section updated');
  };

  const startEditItem = (sectionId: string, itemId: string) => {
    const item = generatedCourse?.sections.find(s => s.id === sectionId)?.items.find(i => i.id === itemId);
    if (item) {
      setAiEditItem(null); setAiEditItemPrompt('');
      setEditingItem({ sectionId, itemId });
      setItemEditName(item.title);
      setItemEditDesc(item.content ?? '');
      const body = `This lesson covers: ${item.title}.\n\nKey concepts include foundational principles, practical applications, and real-world examples relevant to ${courseCategory}.\n\n1. Core Concepts\nUnderstanding the fundamental ideas and their importance.\n\n2. Practical Application\nApplying knowledge through guided exercises and case studies.\n\n3. Assessment\nEvaluate understanding through quizzes and assignments.`;
      setItemEditContent(body);
      setItemContentBlocks([{ id: uid(), type: 'text', value: body }]);
    }
  };

  const saveEditItem = () => {
    if (!editingItem) return;
    setGeneratedCourse(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === editingItem.sectionId ? { ...s, items: s.items.map(i => i.id === editingItem.itemId ? { ...i, title: itemEditName, content: itemEditDesc } : i) } : s) };
    });
    setEditingItem(null);
    setItemEditName(''); setItemEditDesc(''); setItemEditContent(''); setItemContentBlocks([]);
    toast.success('Item updated');
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setShowPublishSuccess(true);
    }, 2000);
  };

  // Close insert menu on outside click
  useEffect(() => {
    if (!showInsertMenu) return;
    const handler = (e: MouseEvent) => {
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target as Node)) {
        setShowInsertMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showInsertMenu]);

  // ── Activity icon helper ──
  const getActivityMeta = (type: CourseItem['type']) => ACTIVITIES.find(a => a.type === type) ?? { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Lesson' };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
      {previewTarget && <PreviewModal target={previewTarget} onClose={() => setPreviewTarget(null)} />}
      {showPublishSuccess && (
        <PublishSuccessModal
          courseName={courseName || generatedCourse?.shortName || courseCategory}
          onCreateNew={() => { setShowPublishSuccess(false); navigate('/ai-course-generator'); window.location.reload(); }}
          onClose={() => { setShowPublishSuccess(false); navigate('/courses'); }}
        />
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => step === 2 ? setStep(1) : navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Course Generator</h1>
              <p className="text-sm text-gray-500">Generate a complete course with AI</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {([1, 2] as const).map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === s ? 'bg-purple-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step === s ? 'text-purple-700' : 'text-gray-400'}`}>
                  {s === 1 ? 'Course Details' : 'Topic Outline'}
                </span>
                {s < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="px-6 py-4">
        <Breadcrumb items={[{ label: 'Courses', path: '/courses' }, { label: 'AI Course Generator', path: '/ai-course-generator' }]} />
      </div>

      <main className="px-6 pb-16">

        {/* ═══════════════════════════════ STEP 1 ════════════════════════════════ */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Course Details</h2>
                  <p className="text-gray-500 text-sm">Fill in the details to guide AI course generation</p>
                </div>
              </div>

              <div className="space-y-6">

                {/* Course Name — optional */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course Name <span className="text-gray-400 font-normal text-xs">(Optional — AI will generate if left blank)</span>
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    placeholder="Leave blank to auto-generate a name..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Course Category — mandatory */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseCategory}
                    onChange={e => { setCourseCategory(e.target.value); setStep1Errors(p => ({ ...p, category: '' })); }}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white transition-colors ${step1Errors.category ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-purple-500'}`}
                  >
                    <option value="">Select a category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {step1Errors.category && <p className="text-xs text-red-500 mt-1">{step1Errors.category}</p>}
                </div>

                {/* Source Text — conditional */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Source Text <span className="text-gray-400 font-normal text-xs">(Required if no file uploaded)</span>
                    </label>
                    <span className={`text-xs font-medium tabular-nums ${sourceOverLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                      {sourceText.length} / {SOURCE_CHAR_LIMIT}
                    </span>
                  </div>
                  <RichTextEditor
                    value={sourceText}
                    onChange={v => { setSourceText(v); setStep1Errors(p => ({ ...p, source: '', sourceLimit: '' })); }}
                    placeholder="Enter or paste your source content here. The AI will use this to generate the course..."
                    rows={6}
                    onEnhance={handleEnhanceSource}
                    enhancing={enhancingSource}
                  />
                  {sourceOverLimit && <p className="text-xs text-red-500 mt-1 font-medium">Character limit exceeded.</p>}
                </div>

                {/* OR divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-white text-sm text-gray-500 font-medium">OR</span></div>
                </div>

                {/* Upload Files — conditional, multiple */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Upload File <span className="text-gray-400 font-normal text-xs">(Required if no source text — multiple files allowed)</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-purple-400 ${step1Errors.source && !uploadedFiles.length && !sourceText.trim() ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
                    <input
                      type="file"
                      id="course-files"
                      accept={ACCEPTED_FILE_TYPES}
                      multiple
                      onChange={handleFilesUpload}
                      className="hidden"
                    />
                    <label htmlFor="course-files" className="cursor-pointer">
                      <Upload className="w-9 h-9 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Click to upload files</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, TXT, ODT, RTF, MD, CSV, EPUB · Max 100 MB each</p>
                    </label>
                  </div>
                  {/* File list */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {uploadedFiles.map(f => (
                        <div key={f.name} className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                          <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className="text-sm text-gray-800 flex-1 truncate">{f.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                          <button type="button" onClick={() => removeFile(f.name)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {sourceText.trim() && uploadedFiles.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1"><Check className="w-3 h-3" />Both sources provided — AI will use content from both</p>
                  )}
                  {step1Errors.source && <p className="text-xs text-red-500 mt-1">{step1Errors.source}</p>}
                </div>

                {/* Course Audience — optional */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course Audience <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                    placeholder="e.g. Beginner software developers with 1-2 years of experience..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Teaching Goals — mandatory, 2000 char limit */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Teaching Goals <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs font-medium tabular-nums ${goalsOverLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                      {teachingGoals.length} / {GOALS_CHAR_LIMIT}
                    </span>
                  </div>
                  <RichTextEditor
                    value={teachingGoals}
                    onChange={v => { setTeachingGoals(v); setStep1Errors(p => ({ ...p, goals: '', goalsLimit: '' })); }}
                    placeholder="Define the learning goals for this course...&#10;• Understand core concepts&#10;• Apply skills in real scenarios&#10;• Evaluate and analyze results"
                    rows={5}
                    onEnhance={handleEnhanceGoals}
                    enhancing={enhancingGoals}
                  />
                  {goalsOverLimit && <p className="text-xs text-red-500 mt-1 font-medium">Character limit exceeded.</p>}
                  {step1Errors.goals && <p className="text-xs text-red-500 mt-1">{step1Errors.goals}</p>}
                </div>

                {/* No. of Topics + Topic Sequence + Language — inline row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* No. of Topics */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      No. of Topics <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={numberOfTopics}
                      onChange={e => setNumberOfTopics(e.target.value)}
                      placeholder="Default: 3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  {/* Topic Sequence — dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topic Sequence</label>
                    <div className="relative">
                      <select
                        value={quizSequence}
                        onChange={e => setQuizSequence(e.target.value as 'linear' | 'free')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white appearance-none"
                      >
                        <option value="linear">Linear</option>
                        <option value="free">Free</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Select Language — dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Select Language <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={language}
                        onChange={e => { setLanguage(e.target.value); setStep1Errors(p => ({ ...p, language: '' })); }}
                        className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white appearance-none transition-colors ${step1Errors.language ? 'border-red-400' : 'border-gray-200 focus:border-purple-500'}`}
                      >
                        {LANGUAGES.map(l => (
                          <option key={l.code} value={l.label}>{l.flag} {l.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {step1Errors.language && <p className="text-xs text-red-500 mt-1">{step1Errors.language}</p>}
                  </div>

                </div>

                {/* Course Visibility + Course Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Course Visibility */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Visibility</label>
                    <div className="relative">
                      <select
                        value={courseVisibility}
                        onChange={e => setCourseVisibility(e.target.value as 'show' | 'hide')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white appearance-none"
                      >
                        <option value="show">Show</option>
                        <option value="hide">Hide</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                      Course will be created for the defined user
                    </p>
                  </div>

                  {/* Course Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Course Duration <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="9999"
                        value={durationValue}
                        onChange={e => setDurationValue(e.target.value)}
                        placeholder=""
                        className="flex-1 min-w-0 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                      <div className="relative flex-shrink-0">
                        <select
                          value={durationUnit}
                          onChange={e => setDurationUnit(e.target.value as 'hours' | 'minutes')}
                          className="px-4 py-3 pr-8 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white appearance-none"
                        >
                          <option value="hours">Hours</option>
                          <option value="minutes">Minutes</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Course Dates + Is Mandatory */}
                {(() => {
                  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                  const days   = Array.from({ length: 31 }, (_, i) => i + 1);
                  const years  = Array.from({ length: 10 }, (_, i) => 2024 + i);
                  const hours  = Array.from({ length: 24 }, (_, i) => i);
                  const mins   = Array.from({ length: 60 }, (_, i) => i);
                  const pad    = (n: number) => String(n).padStart(2, '0');
                  const selCls = 'px-2.5 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed';
                  return (
                    <div className="space-y-4">
                      {/* Course start date */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-semibold text-gray-700">Course Start Date</label>
                          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center cursor-help" title="The date and time from which the course is available to enrolled users.">
                            <span className="text-gray-500 text-xs font-bold leading-none">?</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="relative">
                            <select value={startDay} onChange={e => setStartDay(+e.target.value)} className={selCls}>
                              {days.map(d => <option key={d} value={d}>{pad(d)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={startMonth} onChange={e => setStartMonth(+e.target.value)} className={`${selCls} pr-7`}>
                              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={startYear} onChange={e => setStartYear(+e.target.value)} className={selCls}>
                              {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={startHour} onChange={e => setStartHour(+e.target.value)} className={selCls}>
                              {hours.map(h => <option key={h} value={h}>{pad(h)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={startMinute} onChange={e => setStartMinute(+e.target.value)} className={selCls}>
                              {mins.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <button type="button" className="p-2 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors" title="Pick from calendar">
                            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Course end date */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-semibold text-gray-700">Course End Date</label>
                          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center cursor-help" title="The date after which the course is no longer accessible. Leave disabled for no end date.">
                            <span className="text-gray-500 text-xs font-bold leading-none">?</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={endEnabled}
                              onChange={e => setEndEnabled(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-purple-600"
                            />
                            <span className={`text-sm font-medium ${endEnabled ? 'text-gray-800' : 'text-gray-400'}`}>Enable</span>
                          </label>
                          <div className="relative">
                            <select value={endDay} onChange={e => setEndDay(+e.target.value)} disabled={!endEnabled} className={selCls}>
                              {days.map(d => <option key={d} value={d}>{pad(d)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={endMonth} onChange={e => setEndMonth(+e.target.value)} disabled={!endEnabled} className={`${selCls} pr-7`}>
                              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={endYear} onChange={e => setEndYear(+e.target.value)} disabled={!endEnabled} className={selCls}>
                              {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={endHour} onChange={e => setEndHour(+e.target.value)} disabled={!endEnabled} className={selCls}>
                              {hours.map(h => <option key={h} value={h}>{pad(h)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select value={endMinute} onChange={e => setEndMinute(+e.target.value)} disabled={!endEnabled} className={selCls}>
                              {mins.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <button type="button" disabled={!endEnabled} className="p-2 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Pick from calendar">
                            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Is Mandatory */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Is Mandatory</label>
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            checked={isMandatory}
                            onChange={e => setIsMandatory(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-purple-600"
                          />
                          <span className={`text-sm font-medium transition-colors ${isMandatory ? 'text-gray-900' : 'text-gray-500'}`}>Mandatory Course</span>
                        </label>
                      </div>
                    </div>
                  );
                })()}

                {/* Quiz & Feedback toggles */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Quiz &amp; Feedback Options</label>

                  {/* Include Quiz for Topics */}
                  <div className={`rounded-xl border transition-all ${includeTopicQuiz ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${includeTopicQuiz ? 'bg-green-100 border border-green-200' : 'bg-gray-100 border border-gray-200'}`}>
                        <HelpCircle className={`w-3.5 h-3.5 ${includeTopicQuiz ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium flex-1 ${includeTopicQuiz ? 'text-gray-900' : 'text-gray-400'}`}>Include Quiz for Topics</span>
                      <button type="button" onClick={() => setIncludeTopicQuiz(v => !v)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${includeTopicQuiz ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${includeTopicQuiz ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    {includeTopicQuiz && (
                      <div className="px-4 pb-3 pt-0 border-t border-green-200 mt-0 flex items-center gap-4 flex-wrap">
                        {/* No. of Questions */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">No. of Questions</span>
                          <div className="flex items-center gap-0.5 bg-white border border-green-200 rounded-lg px-1.5 py-0.5">
                            <button type="button" onClick={() => setTopicQuizQuestions(q => Math.max(1, q - 1))} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm font-bold">−</button>
                            <span className="w-6 text-center text-sm font-bold text-gray-900">{topicQuizQuestions}</span>
                            <button type="button" onClick={() => setTopicQuizQuestions(q => Math.min(100, q + 1))} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm font-bold">+</button>
                          </div>
                        </div>
                        {/* Question Type */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Question Type</span>
                          <div className="relative flex-1 max-w-[200px]">
                            <select
                              className="w-full px-3 py-1.5 border border-green-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 bg-white appearance-none"
                              value=""
                              onChange={e => {
                                const val = e.target.value as 'mcq' | 'truefalse';
                                if (!val) return;
                                setTopicQuizTypes(prev => {
                                  const next = new Set(prev);
                                  if (next.has(val)) { if (next.size > 1) next.delete(val); }
                                  else next.add(val);
                                  return next;
                                });
                              }}
                            >
                              <option value="" disabled>
                                {[...(topicQuizTypes.has('mcq') ? ['MCQ'] : []), ...(topicQuizTypes.has('truefalse') ? ['True/False'] : [])].join(', ')}
                              </option>
                              <option value="mcq">MCQ {topicQuizTypes.has('mcq') ? '✓' : ''}</option>
                              <option value="truefalse">True / False {topicQuizTypes.has('truefalse') ? '✓' : ''}</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {topicQuizTypes.has('mcq') && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full font-medium">
                                MCQ
                                <button type="button" onClick={() => setTopicQuizTypes(prev => { const n = new Set(prev); if (n.size > 1) n.delete('mcq'); return n; })} className="hover:text-green-900 leading-none">×</button>
                              </span>
                            )}
                            {topicQuizTypes.has('truefalse') && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full font-medium">
                                T/F
                                <button type="button" onClick={() => setTopicQuizTypes(prev => { const n = new Set(prev); if (n.size > 1) n.delete('truefalse'); return n; })} className="hover:text-green-900 leading-none">×</button>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final Quiz */}
                  <div className={`rounded-xl border transition-all ${finalQuizEnabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${finalQuizEnabled ? 'bg-blue-100 border border-blue-200' : 'bg-gray-100 border border-gray-200'}`}>
                        <ClipboardList className={`w-3.5 h-3.5 ${finalQuizEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium flex-1 ${finalQuizEnabled ? 'text-gray-900' : 'text-gray-400'}`}>Final Quiz</span>
                      <button type="button" onClick={() => setFinalQuizEnabled(v => !v)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${finalQuizEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${finalQuizEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    {finalQuizEnabled && (
                      <div className="px-4 pb-3 pt-0 border-t border-blue-200 mt-0 flex items-center gap-4 flex-wrap">
                        {/* No. of Questions */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">No. of Questions</span>
                          <div className="flex items-center gap-0.5 bg-white border border-blue-200 rounded-lg px-1.5 py-0.5">
                            <button type="button" onClick={() => setFinalQuizQuestions(q => Math.max(1, q - 1))} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm font-bold">−</button>
                            <span className="w-6 text-center text-sm font-bold text-gray-900">{finalQuizQuestions}</span>
                            <button type="button" onClick={() => setFinalQuizQuestions(q => Math.min(100, q + 1))} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm font-bold">+</button>
                          </div>
                        </div>
                        {/* Question Type */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Question Type</span>
                          <div className="relative flex-1 max-w-[200px]">
                            <select
                              className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 bg-white appearance-none"
                              value=""
                              onChange={e => {
                                const val = e.target.value as 'mcq' | 'truefalse';
                                if (!val) return;
                                setFinalQuizTypes(prev => {
                                  const next = new Set(prev);
                                  if (next.has(val)) { if (next.size > 1) next.delete(val); }
                                  else next.add(val);
                                  return next;
                                });
                              }}
                            >
                              <option value="" disabled>
                                {[...(finalQuizTypes.has('mcq') ? ['MCQ'] : []), ...(finalQuizTypes.has('truefalse') ? ['True/False'] : [])].join(', ')}
                              </option>
                              <option value="mcq">MCQ {finalQuizTypes.has('mcq') ? '✓' : ''}</option>
                              <option value="truefalse">True / False {finalQuizTypes.has('truefalse') ? '✓' : ''}</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {finalQuizTypes.has('mcq') && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-medium">
                                MCQ
                                <button type="button" onClick={() => setFinalQuizTypes(prev => { const n = new Set(prev); if (n.size > 1) n.delete('mcq'); return n; })} className="hover:text-blue-900 leading-none">×</button>
                              </span>
                            )}
                            {finalQuizTypes.has('truefalse') && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-medium">
                                T/F
                                <button type="button" onClick={() => setFinalQuizTypes(prev => { const n = new Set(prev); if (n.size > 1) n.delete('truefalse'); return n; })} className="hover:text-blue-900 leading-none">×</button>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final Feedback */}
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${finalFeedbackEnabled ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${finalFeedbackEnabled ? 'bg-pink-100 border border-pink-200' : 'bg-gray-100 border border-gray-200'}`}>
                      <MessageSquare className={`w-3.5 h-3.5 ${finalFeedbackEnabled ? 'text-pink-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium flex-1 ${finalFeedbackEnabled ? 'text-gray-900' : 'text-gray-400'}`}>Final Feedback</span>
                    {finalFeedbackEnabled && (
                      <div className="flex items-center gap-1.5 mr-2">
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">No. of Questions</span>
                        <div className="flex items-center gap-0.5 bg-white border border-pink-200 rounded-lg px-1.5 py-0.5">
                          <button type="button" onClick={() => setFinalFeedbackQuestions(q => Math.max(1, q - 1))} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm font-bold">−</button>
                          <span className="w-6 text-center text-sm font-bold text-gray-900">{finalFeedbackQuestions}</span>
                          <button type="button" onClick={() => setFinalFeedbackQuestions(q => Math.min(100, q + 1))} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm font-bold">+</button>
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={() => setFinalFeedbackEnabled(v => !v)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${finalFeedbackEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${finalFeedbackEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>


              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                  <ArrowLeft className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleContinue}
                  disabled={isGeneratingTopics || !canContinue}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingTopics
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating Topics...</>
                    : <>Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════ STEP 2 — TOPIC OUTLINE + COURSE ═══════ */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold leading-none">i</span>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                The generated outline serves as the structure of your course. You can regenerate or delete any topic. Once you are satisfied, click <strong>Generate Course</strong> to build the full Moodle course structure.
              </p>
            </div>

            {/* Topic outline cards */}
            <div className="space-y-3">
              {topics.map((topic, tIdx) => (
                <div key={topic.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Topic header */}
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 border-b border-gray-100">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    {editingTopicId === topic.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          autoFocus
                          value={editingTopicDraft}
                          onChange={e => setEditingTopicDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveTopicTitle(topic.id); if (e.key === 'Escape') setEditingTopicId(null); }}
                          className="flex-1 text-sm font-semibold text-gray-900 border-b-2 border-purple-400 focus:outline-none bg-transparent"
                        />
                        <button onClick={() => saveTopicTitle(topic.id)} className="p-1 bg-green-600 text-white rounded hover:bg-green-700"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditingTopicId(null)} className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900">Topic {tIdx + 1}: {topic.title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingTopicId(topic.id); setEditingTopicDraft(topic.title); }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit title"
                      ><Edit2 className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={() => regenerateTopic(topic.id)}
                        disabled={regeneratingTopicId === topic.id}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
                        title="Regenerate topic"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingTopicId === topic.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => deleteTopic(topic.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete topic"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Default page structure */}
                  <div className="px-4 py-3 space-y-1">
                    {topic.pages.map((page) => (
                      <div key={page.id} className="flex items-center gap-2.5 group/page rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors">
                        <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3 h-3 text-blue-500" />
                        </div>
                        {editingPageId === page.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              value={editingPageDraft}
                              onChange={e => setEditingPageDraft(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') savePageTitle(topic.id, page.id); if (e.key === 'Escape') setEditingPageId(null); }}
                              className="flex-1 text-xs text-gray-800 border-b border-purple-400 focus:outline-none bg-transparent py-0.5"
                            />
                            <button onClick={() => savePageTitle(topic.id, page.id)} className="p-0.5 bg-green-600 text-white rounded flex-shrink-0"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setEditingPageId(null)} className="p-0.5 bg-gray-200 text-gray-600 rounded flex-shrink-0"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs text-gray-600 flex-1">{page.title}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/page:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setEditingPageId(page.id); setEditingPageDraft(page.title); }}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              ><Edit2 className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => deletePage(topic.id, page.id)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              ><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                            <span className="text-xs text-gray-400 border border-gray-100 rounded px-1.5 py-0.5 flex-shrink-0">Page</span>
                          </>
                        )}
                      </div>
                    ))}
                    {/* Knowledge Check (quiz) */}
                    {topic.quiz && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-600 flex-1">Knowledge Check</span>
                        <span className="text-xs text-green-600 border border-green-200 rounded px-1.5 py-0.5 flex-shrink-0">{topic.quiz.questions} Qs</span>
                        <span className="text-xs text-gray-400 border border-gray-100 rounded px-1.5 py-0.5 flex-shrink-0">Quiz</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Final Quiz card (if enabled) */}
              {finalQuizEnabled && (
                <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-50">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-blue-900">Final Exam / Quiz</span>
                    <span className="text-xs text-blue-600 bg-white border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">{finalQuizQuestions} Questions</span>
                  </div>
                </div>
              )}

              {/* Final Feedback card (if enabled) */}
              {finalFeedbackEnabled && (
                <div className="bg-white rounded-xl border border-pink-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-pink-50">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-pink-600" />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-pink-900">Course Feedback</span>
                    <span className="text-xs text-pink-600 bg-white border border-pink-200 rounded-full px-2.5 py-0.5 font-medium">{finalFeedbackQuestions} Questions</span>
                  </div>
                </div>
              )}
            </div>

            {/* Add new topic */}
            <button
              onClick={addTopic}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Topic
            </button>

            {/* Generate + Publish action bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-3 flex-wrap">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || topics.length === 0}
                  className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
                    : <><Sparkles className="w-4 h-4" />Generate Course</>}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!generatedCourse || isPublishing}
                  className="flex items-center gap-2 px-7 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPublishing
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Publishing...</>
                    : <>Publish <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>

            {/* ── Generated course output (appears after Generate is clicked) ── */}
            {(isGenerating || generatedCourse) && (
              <div id="generated-course">
                {isGenerating && !generatedCourse ? (
                  <div className="bg-white rounded-xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-purple-600">AI is building your full course...</p>
                    <p className="text-xs text-gray-400">Generating {topics.length} sections with content</p>
                  </div>
                ) : generatedCourse ? (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* ── Course Title + Description ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 pt-6 pb-5">
                  {/* Title row */}
                  <div className="flex items-center gap-2 mb-1">
                    {editingSection === '__title__' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input autoFocus value={editDraft} onChange={e => setEditDraft(e.target.value)}
                          className="flex-1 text-2xl font-bold text-gray-900 border-b-2 border-purple-400 focus:outline-none bg-transparent pb-0.5" />
                        <button onClick={() => { setCourseName(editDraft); setEditingSection(null); setEditDraft(''); }} className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setEditingSection(null); setEditDraft(''); }} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-gray-900">{courseName || `AI Course: ${courseCategory}`}</h1>
                        <button onClick={() => { setEditingSection('__title__'); setEditDraft(courseName || `AI Course: ${courseCategory}`); }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-blue-600 leading-relaxed mb-5">{generatedCourse.description}</p>

                  {/* Stat tiles */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { icon: Folder,    label: 'Sections',   value: generatedCourse.sections.length,   color: 'text-blue-500' },
                      { icon: FileText,  label: 'Lessons',    value: generatedCourse.sections.reduce((a, s) => a + s.items.filter(i => i.type === 'lesson').length, 0), color: 'text-blue-500' },
                      { icon: Layers,    label: 'Activities', value: generatedCourse.sections.reduce((a, s) => a + s.items.filter(i => i.type !== 'lesson' && i.type !== 'quiz').length, 0), color: 'text-blue-500' },
                      { icon: HelpCircle,label: 'Quizzes',    value: generatedCourse.sections.reduce((a, s) => a + s.items.filter(i => i.type === 'quiz').length, 0), color: 'text-green-500' },
                    ].map(tile => {
                      const Icon = tile.icon;
                      return (
                        <div key={tile.label} className="border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${tile.color} flex-shrink-0`} />
                          <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">{tile.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{tile.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Section accordion list ── */}
                <div className="space-y-2">
                  {generatedCourse.sections.map((section) => {
                    const isExpanded = !collapsedSections.has(section.id);
                    const isAiEditing = editingSection === section.id;

                    return (
                      <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                        {/* Section row */}
                        <div className="flex items-center gap-3 px-4 py-4">
                          {/* Drag handle */}
                          <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />

                          {/* Title + description */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm leading-snug">{section.title}</p>
                            <p className="text-xs text-blue-500 mt-0.5 truncate">{section.description}</p>
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setPreviewTarget({ title: section.title, type: 'Section', description: section.description, items: section.items.map(i => ({ title: i.title, type: i.type })) })}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => startEditSection(section.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <span className="px-1.5 py-0.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded cursor-default select-none">H5P</span>
                            <button
                              onClick={() => setEditingSection(isAiEditing ? null : `ai-${section.id}`)}
                              className={`p-1.5 rounded transition-colors ${editingSection === `ai-${section.id}` ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                              title="Edit with AI"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteSection(section.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => toggleSection(section.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* AI Edit prompt */}
                        <AnimatePresence>
                          {editingSection === `ai-${section.id}` && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="border-t border-gray-100 bg-purple-50/50 px-4 py-4">
                              <p className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 mb-2">
                                <Sparkles className="w-3.5 h-3.5" />Edit Section with AI
                              </p>
                              <input
                                autoFocus
                                value={editDraft}
                                onChange={e => setEditDraft(e.target.value)}
                                placeholder="e.g., Rename to Advanced Topics"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-purple-400"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => { setEditingSection(null); setEditDraft(''); }} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button
                                  onClick={() => { setEditingSection(null); setEditDraft(''); toast.success('Section updated with AI'); }}
                                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors font-medium flex items-center gap-1.5"
                                >
                                  Apply <span className="text-xs text-purple-500">~11 credits</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Inline edit section title */}
                        <AnimatePresence>
                          {editingSection === section.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Section Title</p>
                                <input autoFocus value={editDraft} onChange={e => setEditDraft(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-purple-400" />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setEditingSection(null); setEditDraft(''); }} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button onClick={saveEditSection} className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">Done</button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Expanded: lesson/activity items */}
                        <AnimatePresence>
                          {isExpanded && editingSection !== section.id && editingSection !== `ai-${section.id}` && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="border-t border-gray-100">
                              {section.items.map((item) => {
                                const meta = item.type === 'lesson'
                                  ? { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Page' }
                                  : item.type === 'quiz'
                                  ? { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Quiz' }
                                  : getActivityMeta(item.type);
                                const Icon = meta.icon;
                                const isEditingThis = editingItem?.sectionId === section.id && editingItem?.itemId === item.id;

                                return (
                                  <div key={item.id} className="border-b border-gray-100 last:border-0">
                                    {/* Item row — always visible */}
                                    <div className={`flex items-center gap-3 px-6 py-3 transition-colors group ${isEditingThis ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                                      <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                        <button
                                          onClick={() => setPreviewTarget({ title: item.title, type: item.type, description: item.content })}
                                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 mt-0.5 transition-colors"
                                        >
                                          <Eye className="w-3 h-3" />Preview
                                        </button>
                                      </div>
                                      {/* Action icons — visible on hover or when editing this item */}
                                      <div className={`flex items-center gap-1 transition-opacity ${isEditingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <button onClick={() => startEditItem(section.id, item.id)} className={`p-1 rounded transition-colors ${isEditingThis ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button
                                          onClick={() => {
                                            const isOpen = aiEditItem?.sectionId === section.id && aiEditItem?.itemId === item.id;
                                            if (isOpen) { setAiEditItem(null); setAiEditItemPrompt(''); }
                                            else { setAiEditItem({ sectionId: section.id, itemId: item.id }); setAiEditItemPrompt(''); setEditingItem(null); }
                                          }}
                                          className={`p-1 rounded transition-colors ${aiEditItem?.sectionId === section.id && aiEditItem?.itemId === item.id ? 'text-purple-600 bg-purple-100' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`}
                                          title="Edit with AI"
                                        ><Sparkles className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDeleteItem(section.id, item.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                      <span className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 flex-shrink-0 ml-1">{meta.label}</span>
                                    </div>

                                    {/* AI Edit Activity panel */}
                                    <AnimatePresence>
                                      {aiEditItem?.sectionId === section.id && aiEditItem?.itemId === item.id && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="mx-6 mb-4 rounded-xl bg-purple-50/70 border border-purple-100 px-4 py-4">
                                            <p className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 mb-3">
                                              <Sparkles className="w-4 h-4" />Edit Activity with AI
                                            </p>
                                            <input
                                              autoFocus
                                              value={aiEditItemPrompt}
                                              onChange={e => setAiEditItemPrompt(e.target.value)}
                                              placeholder="e.g., Add more detail to the description"
                                              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20"
                                            />
                                            <div className="flex justify-end gap-2 mt-3">
                                              <button
                                                onClick={() => { setAiEditItem(null); setAiEditItemPrompt(''); }}
                                                className="px-4 py-2 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors"
                                              >Cancel</button>
                                              <button
                                                onClick={() => {
                                                  setAiEditItem(null);
                                                  setAiEditItemPrompt('');
                                                  toast.success('Activity updated with AI');
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors font-medium"
                                              >
                                                Apply <span className="text-purple-400 text-xs">~3 credits</span>
                                              </button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* Inline expanded edit panel */}
                                    <AnimatePresence>
                                      {isEditingThis && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-6 pt-3 pb-5 bg-white border-t border-gray-100 space-y-4">
                                            {/* Type badge */}
                                            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md ${meta.bg} ${meta.color} border border-current/10`}>
                                              {meta.label}
                                            </span>

                                            {/* NAME */}
                                            <div>
                                              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
                                              <input
                                                autoFocus
                                                value={itemEditName}
                                                onChange={e => setItemEditName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                                              />
                                            </div>

                                            {/* DESCRIPTION */}
                                            <div>
                                              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                                              <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/20">
                                                {/* mini toolbar */}
                                                <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                                                  <button type="button" className="p-1 rounded text-gray-500 hover:bg-gray-200 text-xs">↺</button>
                                                  <button type="button" className="p-1 rounded text-gray-500 hover:bg-gray-200 text-xs">↻</button>
                                                  <select className="text-xs text-gray-600 border-0 bg-transparent focus:outline-none px-1 py-0.5 rounded hover:bg-gray-200 cursor-pointer">
                                                    <option>Paragraph</option><option>Heading 1</option><option>Heading 2</option>
                                                  </select>
                                                  <div className="w-px h-3.5 bg-gray-300 mx-0.5" />
                                                  <button type="button" className="p-1 rounded text-gray-600 hover:bg-gray-200 font-bold text-xs">B</button>
                                                  <button type="button" className="p-1 rounded text-gray-500 hover:bg-gray-200 italic text-xs">I</button>
                                                  <button type="button" className="p-1 rounded text-gray-500 hover:bg-gray-200 text-xs underline">U</button>
                                                  <div className="w-px h-3.5 bg-gray-300 mx-0.5" />
                                                  <button type="button" className="p-1 rounded text-gray-500 hover:bg-gray-200"><List className="w-3 h-3" /></button>
                                                  <button type="button" className="p-1 rounded text-gray-500 hover:bg-gray-200"><ListOrdered className="w-3 h-3" /></button>
                                                </div>
                                                <textarea
                                                  value={itemEditDesc}
                                                  onChange={e => setItemEditDesc(e.target.value)}
                                                  rows={3}
                                                  className="w-full px-3 py-2.5 text-sm text-gray-800 focus:outline-none resize-none"
                                                />
                                              </div>
                                            </div>

                                            {/* CONTENT */}
                                            <div>
                                              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Content</label>
                                              {/* hidden image input */}
                                              <input
                                                ref={contentImageInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  const reader = new FileReader();
                                                  reader.onload = ev => {
                                                    const dataUrl = ev.target?.result as string;
                                                    setItemContentBlocks(prev => [
                                                      ...prev,
                                                      { id: uid(), type: 'image', value: dataUrl },
                                                      { id: uid(), type: 'text', value: '' },
                                                    ]);
                                                    setShowInsertMenu(false);
                                                  };
                                                  reader.readAsDataURL(file);
                                                  e.target.value = '';
                                                }}
                                              />
                                              <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/20">
                                                {/* Toolbar */}
                                                <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
                                                  <button type="button" className="p-1.5 rounded text-gray-500 hover:bg-gray-200 text-sm leading-none">↺</button>
                                                  <button type="button" className="p-1.5 rounded text-gray-500 hover:bg-gray-200 text-sm leading-none">↻</button>
                                                  <select className="text-xs text-gray-600 border-0 bg-transparent focus:outline-none px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">
                                                    <option>Paragraph</option>
                                                    <option>Heading 1</option>
                                                    <option>Heading 2</option>
                                                    <option>Heading 3</option>
                                                  </select>
                                                  <div className="w-px h-4 bg-gray-300 mx-0.5" />
                                                  <button type="button" className="p-1.5 rounded text-gray-700 hover:bg-gray-200 font-bold text-xs">B</button>
                                                  <button type="button" className="p-1.5 rounded text-gray-500 hover:bg-gray-200 italic text-xs">I</button>
                                                  <button type="button" className="p-1.5 rounded text-gray-500 hover:bg-gray-200">
                                                    <Link className="w-3.5 h-3.5" />
                                                  </button>
                                                  <div className="w-px h-4 bg-gray-300 mx-0.5" />
                                                  <button type="button" className="p-1.5 rounded text-gray-500 hover:bg-gray-200"><List className="w-3.5 h-3.5" /></button>
                                                  <button type="button" className="p-1.5 rounded text-gray-500 hover:bg-gray-200"><ListOrdered className="w-3.5 h-3.5" /></button>
                                                  <div className="w-px h-4 bg-gray-300 mx-0.5" />
                                                  {/* Insert dropdown */}
                                                  <div className="relative" ref={insertMenuRef}>
                                                    <button
                                                      type="button"
                                                      onClick={() => setShowInsertMenu(v => !v)}
                                                      className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium border transition-colors ${showInsertMenu ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-100 bg-white'}`}
                                                    >
                                                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                                        <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity=".7"/>
                                                        <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity=".7"/>
                                                        <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".7"/>
                                                        <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".7"/>
                                                      </svg>
                                                      <ChevronDown className="w-3 h-3" />
                                                    </button>
                                                    <AnimatePresence>
                                                      {showInsertMenu && (
                                                        <motion.div
                                                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                                          transition={{ duration: 0.12 }}
                                                          className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-1.5 overflow-hidden"
                                                        >
                                                          {[
                                                            { icon: Image,     label: 'Insert Image',      action: () => contentImageInputRef.current?.click() },
                                                            { icon: Link,      label: 'Insert Link',       action: () => { setShowInsertMenu(false); toast.info('Add link URL'); } },
                                                            { icon: FileText,  label: 'Insert Table',      action: () => { setItemContentBlocks(prev => [...prev, { id: uid(), type: 'text', value: '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n' }]); setShowInsertMenu(false); } },
                                                            { icon: ListOrdered, label: 'Insert Code Block', action: () => { setItemContentBlocks(prev => [...prev, { id: uid(), type: 'text', value: '\n```\n// code here\n```\n' }]); setShowInsertMenu(false); } },
                                                          ].map(({ icon: Icon, label, action }) => (
                                                            <button
                                                              key={label}
                                                              type="button"
                                                              onClick={action}
                                                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                                            >
                                                              <Icon className="w-4 h-4 text-gray-400" />
                                                              {label}
                                                            </button>
                                                          ))}
                                                        </motion.div>
                                                      )}
                                                    </AnimatePresence>
                                                  </div>
                                                </div>

                                                {/* Block editor area */}
                                                <div className="min-h-48 bg-white">
                                                  {itemContentBlocks.map((block, bIdx) =>
                                                    block.type === 'image' ? (
                                                      <div key={block.id} className="relative group/img px-3 py-2">
                                                        <img
                                                          src={block.value}
                                                          alt="Inserted"
                                                          className="w-full rounded-lg border border-gray-200 object-cover max-h-80"
                                                        />
                                                        <button
                                                          type="button"
                                                          onClick={() => setItemContentBlocks(prev => prev.filter(b => b.id !== block.id))}
                                                          className="absolute top-4 right-4 opacity-0 group-hover/img:opacity-100 transition-opacity p-1 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
                                                        >
                                                          <X className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <textarea
                                                        key={block.id}
                                                        value={block.value}
                                                        onChange={e => setItemContentBlocks(prev => prev.map(b => b.id === block.id ? { ...b, value: e.target.value } : b))}
                                                        placeholder={bIdx === 0 ? 'Start typing content…' : ''}
                                                        rows={block.value.split('\n').length + 2}
                                                        className="w-full px-4 py-3 text-sm text-blue-700 leading-relaxed focus:outline-none resize-none border-0 border-b border-gray-100 last:border-0"
                                                      />
                                                    )
                                                  )}
                                                  {itemContentBlocks.length === 0 && (
                                                    <textarea
                                                      value={itemEditContent}
                                                      onChange={e => setItemEditContent(e.target.value)}
                                                      rows={10}
                                                      placeholder="Start typing content…"
                                                      className="w-full px-4 py-3 text-sm text-blue-700 leading-relaxed focus:outline-none resize-y"
                                                    />
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-end gap-3 pt-1">
                                              <button
                                                onClick={() => { setEditingItem(null); setItemEditName(''); setItemEditDesc(''); setItemEditContent(''); setItemContentBlocks([]); setShowInsertMenu(false); }}
                                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                              >Cancel</button>
                                              <button
                                                onClick={saveEditItem}
                                                className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                              >Done</button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* ── Create New Section with AI ── */}
                <button
                  onClick={handleAddSection}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all"
                >
                  <Sparkles className="w-4 h-4" />Create New Section with AI
                </button>

              </motion.div>
                ) : null}
              </div>
            )}

          </motion.div>
        )}
      </main>
    </div>
  );
}

