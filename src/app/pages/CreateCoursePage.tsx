import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, ArrowLeft, ArrowRight, Info, Check, Music2, Save, Download, Eye, ChevronLeft, ChevronRight, X, CheckCircle2, FileDown, FileCheck, Play, Pause, Volume2, Maximize, SkipBack, SkipForward, RotateCcw, Menu as MenuIcon, HelpCircle, LogOut, ChevronDown, AlertCircle, Settings, Navigation, BarChart3, RotateCw, FileText, Video, GripVertical, Trash2, Edit2, Sparkles, List, Captions, FileAudio, FileUp, ChevronsDown, ChevronsUp, Copy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Breadcrumb } from '../components/Breadcrumb';
import { useCourseContext } from '../context/CourseContext';
import { toast } from 'sonner';

export function CreateCoursePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { canPublish, publishCourse, republishCourse, downloadCourse, createDraft, updateCourse, getCourse } = useCourseContext();
  
  // Check if we're editing an existing course
  const editingCourseId = location.state?.courseId;
  const editingCourse = editingCourseId ? getCourse(editingCourseId) : undefined;
  const isEditMode = !!editingCourse;
  const isPublishedAndEdited = isEditMode && editingCourse.status === 'published';
  const [contentType, setContentType] = useState<'ppt-pdf' | 'multi-format' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [courseName, setCourseName] = useState(editingCourse?.name || 'Information Security Management System 2');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<number | null>(editingCourseId || null);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Audio files - BOTH background music AND slide audio
  const [backgroundMusicFile, setBackgroundMusicFile] = useState<File | null>(null);
  const [enableBackgroundMusic, setEnableBackgroundMusic] = useState(false);
  const [slideAudioFiles, setSlideAudioFiles] = useState<{ [key: number]: File }>({});
  
  // Slide management
  type SlideData = {
    id: number;
    name: string;
    transition: string;
    transcript: string;
    enableTranscript: boolean;
    voiceGender: 'male' | 'female';
    seekBarControl?: 'enable' | 'hide';
    seekBarOption?: 'allowDrag' | 'afterCompletion' | 'readOnly';
    audioOption?: 'upload' | 'tts' | 'none';
    durationMode?: 'auto' | 'manual';
    manualDuration?: string;
  };
  // Initialize with empty slides - will be populated when file is uploaded
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [editingSlideName, setEditingSlideName] = useState('');
  
  // Text-to-speech state
  const [playingTranscriptId, setPlayingTranscriptId] = useState<number | null>(null);
  
  // Player element controls
  const [showPrevNextButtons, setShowPrevNextButtons] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  
  const [showPreview, setShowPreview] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const totalSlides = slides.length;
  
  // Preview Modal States
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showCCOverlay, setShowCCOverlay] = useState(false);
  
  // Course Progress State - for Resume/Restart functionality
  const [hasExitedCourse, setHasExitedCourse] = useState(false);
  const [lastSlidePosition, setLastSlidePosition] = useState(1);
  const [showResumeScreen, setShowResumeScreen] = useState(false);

  // SCORM Behaviour Controls
  const [navigationMode, setNavigationMode] = useState<'free' | 'linear'>('free');
  const [seekBarControl, setSeekBarControl] = useState<'enable' | 'hide'>('enable');
  const [seekBarOption, setSeekBarOption] = useState<'allowDrag' | 'afterCompletion' | 'readOnly'>('allowDrag');
  const [resumeOption, setResumeOption] = useState<'trackLocation' | 'trackSlide' | 'disable'>('trackLocation');
  const [scormExportVersion, setScormExportVersion] = useState('SCORM 1.2');
  const [showScormDropdown, setShowScormDropdown] = useState(false);
  const [showSeekBarDropdown, setShowSeekBarDropdown] = useState(false);

  // Collapsible sections state
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isSeekBarOpen, setIsSeekBarOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isPlayerControlsOpen, setIsPlayerControlsOpen] = useState(false);

  // Global Settings (Step 2)
  const [enableBookmarking, setEnableBookmarking] = useState(true);
  const [globalSlideTransition, setGlobalSlideTransition] = useState('none');
  const [globalDurationMode, setGlobalDurationMode] = useState<'auto' | 'manual'>('auto');
  const [slideDuration, setSlideDuration] = useState('');

  // Step 3: Per-slide editor state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isSlideSettingsOpen, setIsSlideSettingsOpen] = useState(false);
  const [isSeekbarSettingsOpen, setIsSeekbarSettingsOpen] = useState(false);
  const [showAllSlides, setShowAllSlides] = useState(false);

  // Toggle all player behaviour sections
  const allSectionsExpanded = isNavigationOpen && isSeekBarOpen && isResumeOpen && isPlayerControlsOpen;
  
  const toggleAllSections = () => {
    const newState = !allSectionsExpanded;
    setIsNavigationOpen(newState);
    setIsSeekBarOpen(newState);
    setIsResumeOpen(newState);
    setIsPlayerControlsOpen(newState);
  };

  const steps = [
    { id: 1, label: 'Course Detail' },
    { id: 2, label: 'Global Settings' },
    { id: 3, label: 'Generate Course' }
  ];

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      setIsSaving(true);
      // Simulate auto-save
      setTimeout(() => {
        setLastSaved(new Date());
        setIsSaving(false);
      }, 500);
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, []);

  // Load voices for text-to-speech
  useEffect(() => {
    // Load voices when they become available
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    // Some browsers load voices async
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
  }, []);

  // Cleanup speech synthesis on unmount or step change
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setPlayingTranscriptId(null);
    };
  }, [currentStep]);

  const getTimeSinceLastSaved = () => {
    const seconds = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleBackgroundMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackgroundMusicFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (currentStep === 1) {
        setUploadedFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      // If moving from Step 1 to Step 2 and file is uploaded but no slides yet, process it
      if (currentStep === 1 && uploadedFile && slides.length === 0) {
        // Simulate file processing - In production, this would be done by backend
        processUploadedFile(uploadedFile);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  // Simulate file processing to extract slides
  const processUploadedFile = (file: File) => {
    // In a real application, this would:
    // 1. Send file to backend API
    // 2. Backend processes PPT/PDF file
    // 3. Extracts slide count, titles, and preview images
    // 4. Returns structured slide data

    // For demo: Simulate extracting slides based on file type
    // In production, the actual number of slides would come from file parsing
    const defaultSlideNames = [
      'Introduction',
      'Overview',
      'Main Content',
      'Key Points',
      'Details',
      'Examples',
      'Summary',
      'Conclusion'
    ];

    const newSlides: SlideData[] = defaultSlideNames.map((name, index) => ({
      id: index + 1,
      name: name,
      transition: globalSlideTransition || 'none',
      transcript: '',
      enableTranscript: false,
      voiceGender: 'female' as const,
      seekBarControl: seekBarControl as 'enable' | 'hide',
      seekBarOption: seekBarOption as 'allowDrag' | 'afterCompletion' | 'readOnly',
      audioOption: 'none' as const,
      durationMode: globalDurationMode || 'auto' as const,
      manualDuration: slideDuration || ''
    }));

    setSlides(newSlides);
    toast.success(`File processed successfully!`, {
      description: `Extracted ${newSlides.length} slides from "${file.name}"`
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (!currentCourseId) {
        // Create new draft
        const newId = createDraft(courseName);
        setCurrentCourseId(newId);
      } else {
        // Update existing draft
        updateCourse(currentCourseId, { name: courseName, modules: slides.length });
      }
      setShowDraftModal(true);
    } catch (error) {
      toast.error('Failed to save draft. Please try again.');
    }
  };

  const handlePublishOrRepublish = async () => {
    try {
      // Validation
      if (!courseName.trim()) {
        toast.error('Course name required', { description: 'Please enter a course name before publishing.' });
        return;
      }

      if (!uploadedFile && !isEditMode) {
        toast.error('File required', { description: 'Please upload a PPT/PDF file before publishing.' });
        return;
      }

      setIsPublishing(true);
      
      // Check license before publishing new course
      if (!isEditMode && !canPublish()) {
        toast.error('License limit reached', { description: 'Please contact your Administrator to increase your license allocation.' });
        setIsPublishing(false);
        return;
      }

      // Create course if it doesn't exist
      let courseId = currentCourseId;
      if (!courseId) {
        courseId = createDraft(courseName);
        setCurrentCourseId(courseId);
      }

      // Update course details
      updateCourse(courseId, { name: courseName, modules: slides.length });

      // Publish or Republish
      let success;
      if (isPublishedAndEdited) {
        success = await republishCourse(courseId);
      } else {
        success = await publishCourse(courseId);
      }

      if (success) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      toast.error('Publishing failed', { description: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownload = async () => {
    if (currentCourseId) {
      await downloadCourse(currentCourseId);
    }
  };

  const handleSlideAudioChange = (slideNum: number, file: File | null) => {
    if (file) {
      setSlideAudioFiles(prev => ({ ...prev, [slideNum]: file }));
    } else {
      setSlideAudioFiles(prev => {
        const updated = { ...prev };
        delete updated[slideNum];
        return updated;
      });
    }
  };

  const handleDeleteSlide = (slideId: number) => {
    if (slides.length > 1) {
      const slideIndex = slides.findIndex(s => s.id === slideId);
      setSlides(slides.filter(s => s.id !== slideId));
      // Remove associated audio
      const updated = { ...slideAudioFiles };
      delete updated[slideId];
      setSlideAudioFiles(updated);

      // Adjust current slide index if needed
      if (slideIndex === currentSlideIndex && currentSlideIndex > 0) {
        setCurrentSlideIndex(currentSlideIndex - 1);
      } else if (currentSlideIndex >= slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, slides.length - 2));
      }

      toast.success('Slide deleted');
    }
  };

  const handleDuplicateSlide = (slideId: number) => {
    const slideIndex = slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) return;

    const slideToDuplicate = slides[slideIndex];
    const newSlideId = Math.max(...slides.map(s => s.id)) + 1;
    const newSlide = {
      ...slideToDuplicate,
      id: newSlideId,
      name: `${slideToDuplicate.name} (Copy)`
    };

    const newSlides = [...slides];
    newSlides.splice(slideIndex + 1, 0, newSlide);
    setSlides(newSlides);

    // Duplicate audio file if exists
    if (slideAudioFiles[slideId]) {
      setSlideAudioFiles(prev => ({
        ...prev,
        [newSlideId]: slideAudioFiles[slideId]
      }));
    }

    // Move to the duplicated slide
    setCurrentSlideIndex(slideIndex + 1);
    toast.success('Slide duplicated');
  };

  const handleRenameSlide = (slideId: number, newName: string) => {
    setSlides(slides.map(s => s.id === slideId ? { ...s, name: newName } : s));
    setEditingSlideId(null);
    toast.success('Slide renamed');
  };

  const handleTransitionChange = (slideId: number, transition: string) => {
    setSlides(slides.map(s => s.id === slideId ? { ...s, transition } : s));
  };

  // Text-to-speech function
  const handlePlayTranscript = (slideId: number) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide || !slide.transcript.trim()) return;

    // Stop any currently playing speech
    window.speechSynthesis.cancel();

    if (playingTranscriptId === slideId) {
      // If this transcript is playing, stop it
      setPlayingTranscriptId(null);
      return;
    }

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(slide.transcript);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Filter voices by gender preference
    const preferredVoices = voices.filter(voice => {
      const voiceName = voice.name.toLowerCase();
      if (slide.voiceGender === 'male') {
        return voiceName.includes('male') || voiceName.includes('man') || voiceName.includes('david') || voiceName.includes('james');
      } else {
        return voiceName.includes('female') || voiceName.includes('woman') || voiceName.includes('samantha') || voiceName.includes('karen');
      }
    });

    // Set voice (use preferred or fallback to first available)
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    } else if (voices.length > 0) {
      utterance.voice = voices[0];
    }

    // Set speech parameters
    utterance.rate = 1.0;
    utterance.pitch = slide.voiceGender === 'male' ? 0.9 : 1.1;
    utterance.volume = 1.0;

    // Event handlers
    utterance.onstart = () => {
      setPlayingTranscriptId(slideId);
    };

    utterance.onend = () => {
      setPlayingTranscriptId(null);
    };

    utterance.onerror = () => {
      setPlayingTranscriptId(null);
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  };

  const handleReorderSlides = (fromIndex: number, toIndex: number) => {
    const newSlides = [...slides];
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);
    setSlides(newSlides);
  };

  const transitionOptions = [
    { value: 'none', label: 'None' },
    { value: 'fade', label: 'Fade' },
    { value: 'push-up', label: 'Push Up' },
    { value: 'push-down', label: 'Push Down' },
    { value: 'push-left', label: 'Push Left' },
    { value: 'push-right', label: 'Push Right' },
    { value: 'wipe-left', label: 'Wipe Left' },
    { value: 'wipe-right', label: 'Wipe Right' },
    { value: 'split', label: 'Split' },
    { value: 'reveal', label: 'Reveal' },
    { value: 'cover-left', label: 'Cover Left' },
    { value: 'cover-right', label: 'Cover Right' },
  ];

  // Draggable Slide Item for drag and drop reordering
  const DraggableSlideItem = ({ slide, index }: { slide: SlideData; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isActive = currentSlideIndex === index;

    const [{ isDragging }, drag] = useDrag({
      type: 'SLIDE',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'SLIDE',
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          handleReorderSlides(item.index, index);
          item.index = index;
        }
      },
    });

    drag(drop(ref));

    return (
      <div
        ref={ref}
        className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
        } ${
          isActive
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-sm'
            : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
        onClick={() => setCurrentSlideIndex(index)}
      >
        <GripVertical className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-300 group-hover:text-gray-400'}`} />

        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isActive
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md'
            : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-blue-500'
        }`}>
          <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'}`}>
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
            {slide.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {slide.audioOption === 'upload' && (
              <div className="flex items-center gap-1">
                <Music2 className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">Audio</span>
              </div>
            )}
            {slide.audioOption === 'tts' && (
              <div className="flex items-center gap-1">
                <Captions className="w-3 h-3 text-purple-600" />
                <span className="text-xs text-purple-600">TTS</span>
              </div>
            )}
            {slide.audioOption === 'none' && (
              <div className="flex items-center gap-1">
                <X className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">No Audio</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Create New Course</h1>
                <Breadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Courses', href: '/courses' },
                    { label: 'Create New Course' }
                  ]}
                />
              </div>
            </div>
            
            {/* Auto-save indicator */}
            <div className="flex items-center gap-3">
              {isSaving ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Saved {getTimeSinceLastSaved()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep === step.id
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      currentStep === step.id ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-4 -mt-8 transition-all ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Course Details */}
          {currentStep === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-700 mb-8">
                Course Details
              </h2>

              {/* Content Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Content Type<span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* PPT/PDF to SCORM Option */}
                  <button
                    onClick={() => setContentType('ppt-pdf')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      contentType === 'ppt-pdf'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        contentType === 'ppt-pdf' ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                        <FileText className={`w-6 h-6 ${
                          contentType === 'ppt-pdf' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          PPT/PDF to SCORM
                          {contentType === 'ppt-pdf' && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Convert PowerPoint or PDF files into interactive SCORM courses with audio and navigation controls
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Multi-format Learning Content Option */}
                  <button
                    onClick={() => setContentType('multi-format')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      contentType === 'multi-format'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        contentType === 'multi-format' ? 'bg-purple-600' : 'bg-gray-100'
                      }`}>
                        <Video className={`w-6 h-6 ${
                          contentType === 'multi-format' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          Multi-format Learning Content
                          {contentType === 'multi-format' && (
                            <Check className="w-5 h-5 text-purple-600" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Create courses from videos, images, documents, and other multimedia content
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Show rest of the form only if content type is selected */}
              {contentType === 'ppt-pdf' && (
                <>
                  {/* Course Name Input */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Course Title<span className="text-red-500">*</span>
                    </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="Enter course name"
                />
              </div>

              {/* File Upload Area */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reference File Upload (PDF / PPT)<span className="text-red-500">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-cyan-400 transition-colors cursor-pointer bg-gray-50/50"
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      {/* Upload Icon */}
                      <div className="mb-4">
                        <svg
                          className="w-16 h-16 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>

                      {uploadedFile ? (
                        <div className="text-center">
                          <p className="text-gray-700 font-medium mb-2">
                            {uploadedFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setUploadedFile(null);
                            }}
                            className="mt-3 text-sm text-red-600 hover:text-red-700"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-700 font-medium mb-2">
                            Select a file or drag and drop here
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            PowerPoint or PDF, file size no more than 100MB
                          </p>
                          <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                            SELECT FILE
                          </button>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
                </>
              )}

              {/* Multi-format content message */}
              {contentType === 'multi-format' && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Multi-format Learning Content
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    This feature is coming soon! You'll be able to create courses from videos, images, documents, and other multimedia content.
                  </p>
                  <button
                    onClick={() => setContentType('ppt-pdf')}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-medium"
                  >
                    Try PPT/PDF to SCORM Instead
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Global Settings */}
          {currentStep === 2 && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Global Settings
                </h2>
                <p className="text-gray-600">
                  Configure default settings that apply across all slides in your course
                </p>
              </div>

              {/* Settings Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Background Music Card */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Music2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Background Music
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Optional audio track throughout course
                      </p>

                      <button
                        onClick={() => setEnableBackgroundMusic(!enableBackgroundMusic)}
                        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                          enableBackgroundMusic ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${
                            enableBackgroundMusic ? 'translate-x-8' : ''
                          }`}
                        />
                      </button>

                      {enableBackgroundMusic && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4"
                        >
                          <input
                            type="file"
                            id="background-music-upload"
                            accept=".mp3"
                            onChange={handleBackgroundMusicChange}
                            className="hidden"
                          />
                          <label htmlFor="background-music-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                              {backgroundMusicFile ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Music2 className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {backgroundMusicFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {(backgroundMusicFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setBackgroundMusicFile(null);
                                    }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-gray-700">Upload MP3</p>
                                  <p className="text-xs text-gray-500">Click to browse</p>
                                </div>
                              )}
                            </div>
                          </label>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Bookmarking Card */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Bookmarking
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Save learner progress for resuming later
                      </p>

                      <button
                        onClick={() => setEnableBookmarking(!enableBookmarking)}
                        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                          enableBookmarking ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${
                            enableBookmarking ? 'translate-x-8' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Slide Transition Card */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Slide Transition
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Default animation for all slides
                      </p>

                      <select
                        value={globalSlideTransition}
                        onChange={(e) => {
                          setGlobalSlideTransition(e.target.value);
                          setSlides(slides.map(s => ({ ...s, transition: e.target.value })));
                        }}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white text-sm"
                      >
                        {transitionOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Slide Duration Card */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-orange-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Slide Duration
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Default time per slide
                      </p>

                      <select
                        value={globalDurationMode}
                        onChange={(e) => setGlobalDurationMode(e.target.value as 'auto' | 'manual')}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm bg-white mb-3"
                      >
                        <option value="auto">Use Audio Duration</option>
                        <option value="manual">Enter Manually</option>
                      </select>

                      {globalDurationMode === 'manual' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative"
                        >
                          <input
                            type="number"
                            value={slideDuration}
                            onChange={(e) => setSlideDuration(e.target.value)}
                            placeholder="Enter duration"
                            min="1"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pr-20 text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                            seconds
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Width Settings */}
              <div className="space-y-6">

                {/* 5. Navigation Mode - Full Width */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Navigation Mode</h3>
                      <p className="text-sm text-gray-500">Control how learners navigate through slides</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-start gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      navigationMode === 'free'
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="navigationMode"
                        checked={navigationMode === 'free'}
                        onChange={() => setNavigationMode('free')}
                        className="mt-1 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 block mb-1">Free Navigation</span>
                        <p className="text-sm text-gray-600">Learners can skip forward and backward freely</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      navigationMode === 'linear'
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="navigationMode"
                        checked={navigationMode === 'linear'}
                        onChange={() => setNavigationMode('linear')}
                        className="mt-1 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 block mb-1">Linear Mode</span>
                        <p className="text-sm text-gray-600">Must complete each slide to progress forward</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 6. Seek Bar Control - Full Width */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Seek Bar Control</h3>
                      <p className="text-sm text-gray-500">Control audio seek bar visibility and behavior</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-start gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      seekBarControl === 'enable'
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="seekBarControl"
                        checked={seekBarControl === 'enable'}
                        onChange={() => setSeekBarControl('enable')}
                        className="mt-1 w-5 h-5 text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 block mb-1">Enable Seek Bar</span>
                        <p className="text-sm text-gray-600 mb-3">Show progress bar with options</p>

                        {seekBarControl === 'enable' && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={seekBarOption}
                              onChange={(e) => setSeekBarOption(e.target.value as 'allowDrag' | 'afterCompletion' | 'readOnly')}
                              className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            >
                              <option value="allowDrag">Allow user to drag</option>
                              <option value="afterCompletion">Allow after completion</option>
                              <option value="readOnly">Read only</option>
                            </select>
                          </div>
                        )}

                        {navigationMode === 'linear' && seekBarControl === 'enable' && seekBarOption === 'allowDrag' && (
                          <div className="flex items-start gap-1.5 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">Forward dragging restricted in Linear mode</p>
                          </div>
                        )}
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      seekBarControl === 'hide'
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="seekBarControl"
                        checked={seekBarControl === 'hide'}
                        onChange={() => setSeekBarControl('hide')}
                        className="mt-1 w-5 h-5 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 block mb-1">Hide Seek Bar</span>
                        <p className="text-sm text-gray-600">Completely hide progress bar</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Generate Course */}
          {currentStep === 3 && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Generate Course
                </h2>
                <p className="text-gray-600">
                  Configure audio, settings, and content for each slide
                </p>
              </div>

              {slides.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Slides Found</h3>
                  <p className="text-gray-600 mb-6">
                    Please upload a PPT/PDF file in Step 1 to generate slides
                  </p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Go to Step 1
                  </button>
                </div>
              ) : (
                <>
              {/* Two-Column Layout: Slides Sidebar + Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

                {/* Left Sidebar: All Slides */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-5 max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <List className="w-5 h-5 text-gray-700" />
                      <h3 className="font-semibold text-gray-900">All Slides</h3>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                      {slides.length}
                    </span>
                  </div>

                  {/* Draggable Slide List */}
                  <div className="space-y-2">
                    {slides.map((slide, index) => (
                      <DraggableSlideItem key={slide.id} slide={slide} index={index} />
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <GripVertical className="w-3 h-3" />
                      Drag to reorder slides
                    </p>
                  </div>
                </div>

                {/* Right Content: Slide Editor */}
                <div className="space-y-5">

                  {/* Progress Indicator */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 shadow-lg mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{currentSlideIndex + 1}</span>
                        </div>
                        <div>
                          <p className="text-white/80 text-xs font-medium">Editing Slide</p>
                          <p className="text-white font-bold text-sm">{slides[currentSlideIndex].name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-xs font-medium">Progress</p>
                        <p className="text-white font-bold">{currentSlideIndex + 1} of {slides.length}</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-300"
                        style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Current Slide Header */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                    {/* Slide Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Slide Number */}
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <span className="text-base font-bold text-white">{currentSlideIndex + 1}</span>
                          </div>

                          {/* Slide Name - Editable */}
                          {editingSlideId === slides[currentSlideIndex].id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingSlideName}
                                onChange={(e) => setEditingSlideName(e.target.value)}
                                className="px-4 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold bg-white shadow-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameSlide(slides[currentSlideIndex].id, editingSlideName);
                                  } else if (e.key === 'Escape') {
                                    setEditingSlideId(null);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleRenameSlide(slides[currentSlideIndex].id, editingSlideName)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingSlideId(null)}
                                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 shadow-sm"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900">{slides[currentSlideIndex].name}</h3>
                              <button
                                onClick={() => {
                                  setEditingSlideId(slides[currentSlideIndex].id);
                                  setEditingSlideName(slides[currentSlideIndex].name);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDuplicateSlide(slides[currentSlideIndex].id)}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-all shadow-sm border border-blue-200"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="text-sm font-medium">Duplicate</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSlide(slides[currentSlideIndex].id)}
                            disabled={slides.length === 1}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm border ${
                              slides.length === 1
                                ? 'text-gray-300 bg-gray-100 cursor-not-allowed border-gray-200'
                                : 'text-red-600 bg-white hover:bg-red-50 border-red-200'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Slide Preview */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg mx-auto mb-4 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-blue-500" />
                        </div>
                        <p className="text-gray-700 font-medium">Slide {currentSlideIndex + 1} Preview</p>
                        <p className="text-gray-500 text-sm mt-1">Content preview from uploaded file</p>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Section 1: Audio Settings */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all">
                    <button
                      onClick={() => setIsAudioSettingsOpen(!isAudioSettingsOpen)}
                      className="w-full px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Music2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-gray-900 block mb-0.5">Audio Settings</span>
                          <p className="text-sm text-gray-600">Upload audio or use text-to-speech</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform ${isAudioSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>

                {isAudioSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-white border-t border-gray-200"
                  >
                    <p className="text-xs font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                      Choose Audio Option
                    </p>

                    {/* Option 1: Upload Audio */}
                    <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all mb-3 ${
                      slides[currentSlideIndex].audioOption === 'upload'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name={`audio-option-${slides[currentSlideIndex].id}`}
                          checked={slides[currentSlideIndex].audioOption === 'upload'}
                          onChange={() => {
                            setSlides(slides.map((s, idx) =>
                              idx === currentSlideIndex
                                ? { ...s, audioOption: 'upload', enableTranscript: false, durationMode: 'auto' }
                                : s
                            ));
                          }}
                          className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Music2 className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-gray-900">Upload Audio File</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Upload MP3 audio for this slide</p>

                          {slides[currentSlideIndex].audioOption === 'upload' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3"
                            >
                              {slideAudioFiles[slides[currentSlideIndex].id] ? (
                                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Music2 className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700 font-medium">
                                      {slideAudioFiles[slides[currentSlideIndex].id].name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleSlideAudioChange(slides[currentSlideIndex].id, null);
                                    }}
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Remove audio"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <input
                                    type="file"
                                    id={`slide-audio-${slides[currentSlideIndex].id}`}
                                    accept=".mp3"
                                    onChange={(e) => handleSlideAudioChange(slides[currentSlideIndex].id, e.target.files ? e.target.files[0] : null)}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`slide-audio-${slides[currentSlideIndex].id}`}
                                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-sm font-medium text-blue-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                                  >
                                    <Upload className="w-4 h-4" />
                                    Click to Upload MP3
                                  </label>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Text to Speech */}
                    <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all mb-3 ${
                      slides[currentSlideIndex].audioOption === 'tts'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name={`audio-option-${slides[currentSlideIndex].id}`}
                          checked={slides[currentSlideIndex].audioOption === 'tts'}
                          onChange={() => {
                            setSlides(slides.map((s, idx) =>
                              idx === currentSlideIndex
                                ? { ...s, audioOption: 'tts', enableTranscript: true, durationMode: 'auto' }
                                : s
                            ));
                          }}
                          className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Captions className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold text-gray-900">Text-to-Speech</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Generate audio from text transcript</p>

                          {slides[currentSlideIndex].audioOption === 'tts' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Voice Type
                                  </label>
                                  <select
                                    value={slides[currentSlideIndex].voiceGender}
                                    onChange={(e) => {
                                      setSlides(slides.map((s, idx) =>
                                        idx === currentSlideIndex
                                          ? { ...s, voiceGender: e.target.value as 'male' | 'female' }
                                          : s
                                      ));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
                                  >
                                    <option value="female">Female Voice</option>
                                    <option value="male">Male Voice</option>
                                  </select>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePlayTranscript(slides[currentSlideIndex].id);
                                  }}
                                  disabled={!slides[currentSlideIndex].transcript.trim()}
                                  className={`mt-5 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                                    !slides[currentSlideIndex].transcript.trim()
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : playingTranscriptId === slides[currentSlideIndex].id
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                  }`}
                                >
                                  {playingTranscriptId === slides[currentSlideIndex].id ? (
                                    <>
                                      <Pause className="w-4 h-4" />
                                      Stop
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4" />
                                      Preview
                                    </>
                                  )}
                                </button>
                              </div>

                              <textarea
                                value={slides[currentSlideIndex].transcript}
                                onChange={(e) => {
                                  setSlides(slides.map((s, idx) =>
                                    idx === currentSlideIndex
                                      ? { ...s, transcript: e.target.value }
                                      : s
                                  ));
                                }}
                                placeholder={`Enter transcript text for ${slides[currentSlideIndex].name}...\n\nExample:\nWelcome to the ${slides[currentSlideIndex].name} section. In this part of the course, we'll explore...`}
                                className="w-full h-32 px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y text-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {slides[currentSlideIndex].transcript.length} characters
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </label>

                    {/* Option 3: No Audio */}
                    <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      slides[currentSlideIndex].audioOption === 'none'
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name={`audio-option-${slides[currentSlideIndex].id}`}
                          checked={slides[currentSlideIndex].audioOption === 'none'}
                          onChange={() => {
                            setSlides(slides.map((s, idx) =>
                              idx === currentSlideIndex
                                ? { ...s, audioOption: 'none', enableTranscript: false, durationMode: 'manual' }
                                : s
                            ));
                          }}
                          className="mt-1 w-5 h-5 text-gray-600 focus:ring-gray-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <X className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">No Audio</span>
                          </div>
                          <p className="text-sm text-gray-600">This slide will have no audio</p>
                        </div>
                      </div>
                    </label>
                  </motion.div>
                )}
                  </div>

                  {/* Accordion Section 2: Slide Settings */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 transition-all">
                    <button
                      onClick={() => setIsSlideSettingsOpen(!isSlideSettingsOpen)}
                      className="w-full px-6 py-5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-gray-900 block mb-0.5">Slide Settings</span>
                          <p className="text-sm text-gray-600">Transition effects and timing</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform ${isSlideSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>

                {isSlideSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-white border-t border-gray-200"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Slide Transition */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Transition Effect
                        </label>
                        <select
                          value={slides[currentSlideIndex].transition}
                          onChange={(e) => handleTransitionChange(slides[currentSlideIndex].id, e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                        >
                          {transitionOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Global setting: {globalSlideTransition ? transitionOptions.find(opt => opt.value === globalSlideTransition)?.label : 'None'}
                        </p>
                      </div>

                      {/* Slide Duration */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Slide Duration
                        </label>

                        <select
                          value={slides[currentSlideIndex].durationMode || 'auto'}
                          onChange={(e) => {
                            setSlides(slides.map((s, idx) =>
                              idx === currentSlideIndex
                                ? { ...s, durationMode: e.target.value as 'auto' | 'manual' }
                                : s
                            ));
                          }}
                          disabled={slides[currentSlideIndex].audioOption === 'none'}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed mb-3"
                        >
                          <option value="auto" disabled={slides[currentSlideIndex].audioOption === 'none'}>
                            Use Audio Duration
                          </option>
                          <option value="manual">Enter Manually</option>
                        </select>

                        {slides[currentSlideIndex].durationMode === 'manual' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative"
                          >
                            <input
                              type="number"
                              value={slides[currentSlideIndex].manualDuration || ''}
                              onChange={(e) => {
                                setSlides(slides.map((s, idx) =>
                                  idx === currentSlideIndex
                                    ? { ...s, manualDuration: e.target.value }
                                    : s
                                ));
                              }}
                              placeholder="Enter seconds"
                              min="1"
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white pr-16"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                              seconds
                            </span>
                          </motion.div>
                        )}

                        {slides[currentSlideIndex].audioOption === 'none' && (
                          <p className="text-xs text-amber-600 mt-2">
                            ⚠ Select an audio option to enable "Use Audio Duration"
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

                  {/* Accordion Section 3: Seekbar Settings */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-teal-300 transition-all">
                    <button
                      onClick={() => setIsSeekbarSettingsOpen(!isSeekbarSettingsOpen)}
                      className="w-full px-6 py-5 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-gray-900 block mb-0.5">Seekbar Settings</span>
                          <p className="text-sm text-gray-600">
                            {slides[currentSlideIndex].audioOption === 'none'
                              ? 'No audio - will be hidden'
                              : slides[currentSlideIndex].seekBarControl === 'hide' ? 'Hidden for this slide' :
                              slides[currentSlideIndex].seekBarOption === 'allowDrag' ? 'User can drag' :
                              slides[currentSlideIndex].seekBarOption === 'afterCompletion' ? 'After completion' :
                              'Read only'
                            }
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform ${isSeekbarSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>

                {isSeekbarSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-white border-t border-gray-200"
                  >
                    {slides[currentSlideIndex].audioOption === 'none' ? (
                      <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">No audio selected</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Seekbar will be automatically hidden for this slide. Select an audio option (Upload Audio or Text-to-Speech) in the Audio Settings section above to enable seekbar controls.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700">
                            <strong>Global Setting:</strong> {seekBarControl === 'hide' ? 'Hidden' : `Enabled - ${seekBarOption === 'allowDrag' ? 'Allow drag' : seekBarOption === 'afterCompletion' ? 'After completion' : 'Read only'}`}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            You can override the global setting for this slide below
                          </p>
                        </div>

                        {/* Seekbar Control */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Seekbar Control
                          </label>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setSlides(slides.map((s, idx) =>
                                  idx === currentSlideIndex
                                    ? { ...s, seekBarControl: 'enable' }
                                    : s
                                ));
                              }}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                slides[currentSlideIndex].seekBarControl === 'enable'
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              <div className="font-medium text-sm">Enable</div>
                              <div className="text-xs mt-1 opacity-70">Show seekbar</div>
                            </button>
                            <button
                              onClick={() => {
                                setSlides(slides.map((s, idx) =>
                                  idx === currentSlideIndex
                                    ? { ...s, seekBarControl: 'hide' }
                                    : s
                                ));
                              }}
                              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                                slides[currentSlideIndex].seekBarControl === 'hide'
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              <div className="font-medium text-sm">Hide</div>
                              <div className="text-xs mt-1 opacity-70">Hide seekbar</div>
                            </button>
                          </div>
                        </div>

                        {/* Seekbar Options - Only show if seekbar is enabled */}
                        {slides[currentSlideIndex].seekBarControl === 'enable' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                              Seekbar Options
                            </label>
                            <select
                              value={slides[currentSlideIndex].seekBarOption || 'allowDrag'}
                              onChange={(e) => {
                                setSlides(slides.map((s, idx) =>
                                  idx === currentSlideIndex
                                    ? { ...s, seekBarOption: e.target.value as 'allowDrag' | 'afterCompletion' | 'readOnly' }
                                    : s
                                ));
                              }}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm bg-white"
                            >
                              <option value="allowDrag">Allow user to drag</option>
                              <option value="afterCompletion">Allow drag after completion</option>
                              <option value="readOnly">Read only</option>
                            </select>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
                  </div>
                </div>

              </div>
              </>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-3">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Back
              </motion.button>
            )}

            {currentStep === 3 ? (
              <div className="flex flex-col gap-4">
                {/* Workflow Guide */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Workflow Guide</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>1. Configure each slide using the settings below</p>
                        <p>2. Click <strong>"Save and Next Slide"</strong> to move through all {slides.length} slides</p>
                        <p>3. After completing all slides, click <strong>"Publish Course"</strong> to finalize</p>
                      </div>
                      {currentSlideIndex === slides.length - 1 && (
                        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg">
                          <p className="text-sm font-semibold text-green-800">✓ Last slide! Review and click "Publish Course" when ready.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (hasExitedCourse) {
                          setShowResumeScreen(true);
                        } else {
                          setShowPreview(true);
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Preview Course
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveDraft}
                      disabled={isPublishing}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save as Draft
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-3">
                    {currentSlideIndex < slides.length - 1 ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleSaveDraft();
                          setCurrentSlideIndex(currentSlideIndex + 1);
                          toast.success(`Saved! Moving to slide ${currentSlideIndex + 2}`);
                        }}
                        disabled={isPublishing}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2 disabled:opacity-50 shadow-md"
                      >
                        Save and Next Slide
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleSaveDraft();
                          toast.success('All slides saved! Ready to publish.');
                        }}
                        disabled={isPublishing}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center gap-2 disabled:opacity-50 shadow-md"
                      >
                        <Check className="w-5 h-5" />
                        Save Final Slide
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePublishOrRepublish}
                      disabled={isPublishing || (!isEditMode && !canPublish())}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative group shadow-md"
                      title={!canPublish() && !isEditMode ? 'License limit reached' : ''}
                    >
                      <FileUp className="w-5 h-5" />
                      {isPublishing ? 'Publishing...' : (isPublishedAndEdited ? 'Republish Course' : 'Publish Course')}
                      {!canPublish() && !isEditMode && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 px-3 py-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-10">
                          License limit reached. Please contact your Administrator.
                        </div>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinue}
                disabled={currentStep === 1 && (!contentType || (contentType === 'ppt-pdf' && !uploadedFile))}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Course {isPublishedAndEdited ? 'Republished' : 'Published'} Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your course has been {isPublishedAndEdited ? 'republished' : 'published'}. You can now download the SCORM package and deploy it to your LMS.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/courses');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  View Courses
                </button>
                <button
                  onClick={async () => {
                    await handleDownload();
                    setShowSuccessModal(false);
                    navigate('/courses');
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Save className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Course Saved as Draft!
              </h3>
              <p className="text-gray-600 mb-6">
                Your course has been saved successfully. You can continue editing it later or publish it when ready.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDraftModal(false);
                    navigate('/courses');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  View Courses
                </button>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continue Editing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col relative">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{courseName}</h3>
                  <p className="text-xs text-gray-400">SCORM Player Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMenuModal(!showMenuModal);
                    setShowHelpModal(false);
                    setShowTranscriptModal(false);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Menu"
                >
                  <MenuIcon className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => {
                    setShowHelpModal(!showHelpModal);
                    setShowMenuModal(false);
                    setShowTranscriptModal(false);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Help"
                >
                  <HelpCircle className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => {
                    // Save current position and mark as exited
                    setLastSlidePosition(currentSlide);
                    setHasExitedCourse(true);
                    setShowPreview(false);
                    // Close all modals
                    setShowMenuModal(false);
                    setShowHelpModal(false);
                    setShowTranscriptModal(false);
                    setShowCCOverlay(false);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Exit"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Preview Content Area with Modals */}
            <div className="flex-1 relative overflow-hidden">
              {/* Main Content */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-8">
                <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg text-sm text-white">
                  {scormExportVersion}
                </div>
                
                {/* Info Banner - Shows available features */}
                {!showMenuModal && !showHelpModal && !showTranscriptModal && !showCCOverlay && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-white max-w-xs shadow-lg"
                  >
                    <p className="font-medium mb-1">💡 Preview Features</p>
                    <p className="text-xs opacity-90">Click <strong>Menu</strong>, <strong>Help</strong>, <strong>CC</strong>, or <strong>Transcript</strong> to test features</p>
                  </motion.div>
                )}
                
                <div className="text-center">
                  <div className="mb-4 text-6xl font-bold text-white">
                    {currentSlide} / {totalSlides}
                  </div>
                  <h4 className="text-2xl text-white mb-2">{slides[currentSlide - 1]?.name || 'Slide'}</h4>
                  <p className="text-gray-400">Slide content preview</p>
                </div>
                
                {/* CC Overlay */}
                {showCCOverlay && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/90 px-6 py-3 rounded-lg max-w-2xl">
                    <p className="text-white text-center text-sm leading-relaxed">
                      Hi, am here to discuss about a more popular buzzword in the past decade – emotional intelligence.
                    </p>
                  </div>
                )}
              </div>

              {/* Menu Modal */}
              {showMenuModal && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  className="absolute top-0 left-0 bottom-0 w-[500px] bg-gray-800/95 backdrop-blur-sm border-r border-orange-500/30 shadow-2xl z-10"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-orange-500/30">
                      <div className="flex items-center gap-2 text-orange-500">
                        <MenuIcon className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-white">Menu</h3>
                      </div>
                      <button
                        onClick={() => setShowMenuModal(false)}
                        className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-2">
                        {slides.map((slide, index) => (
                          <button
                            key={slide.id}
                            onClick={() => setCurrentSlide(index + 1)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                              currentSlide === index + 1
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'text-gray-300 hover:bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                currentSlide === index + 1 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
                              }`}>
                                {index === 0 ? '🎯' : '🔵'}
                              </div>
                              <span className="font-medium">{slide.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Help Modal */}
              {showHelpModal && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  className="absolute top-0 left-0 bottom-0 w-[600px] bg-gray-800/95 backdrop-blur-sm border-r border-orange-500/30 shadow-2xl z-10"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-orange-500/30">
                      <div className="flex items-center gap-2 text-orange-500">
                        <HelpCircle className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-white">Help</h3>
                      </div>
                      <button
                        onClick={() => setShowHelpModal(false)}
                        className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-6 text-white">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Screen title:</h4>
                          <p className="text-gray-300">The 'Screen title' is displayed on the top left corner of the screen</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Menu:</h4>
                          <p className="text-gray-300">Here you can see all the available topics in this course</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Help:</h4>
                          <p className="text-gray-300">Here you can see the 'Help' page</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Page no.:</h4>
                          <p className="text-gray-300">Here you can see the page that you are in right now</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Previous:</h4>
                          <p className="text-gray-300">Course navigation – You can go to the previous screen</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Next:</h4>
                          <p className="text-gray-300">Course navigation – You can go to the next screen</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Transcript:</h4>
                          <p className="text-gray-300">Here you can see the voice-over transcript</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Exit:</h4>
                          <p className="text-gray-300">Here you can 'Exit' the course</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Transcript Modal */}
              {showTranscriptModal && (
                <motion.div
                  initial={{ y: 300, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 300, opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 h-[300px] bg-gray-800/95 backdrop-blur-sm border-t border-orange-500/30 shadow-2xl z-10"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-orange-500/30">
                      <div className="flex items-center gap-2 text-orange-500">
                        <FileText className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-white">Transcript</h3>
                      </div>
                      <button
                        onClick={() => setShowTranscriptModal(false)}
                        className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      {slides[currentSlideIndex]?.enableTranscript && slides[currentSlideIndex]?.transcript ? (
                        <div>
                          <div className="mb-4 pb-3 border-b border-orange-500/30">
                            <div className="flex items-center gap-2 text-orange-500 text-sm">
                              <span className="font-semibold">Slide {currentSlideIndex + 1}:</span>
                              <span className="text-white">{slides[currentSlideIndex].name}</span>
                            </div>
                          </div>
                          <p className="text-white leading-relaxed whitespace-pre-wrap">
                            {slides[currentSlideIndex].transcript}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 leading-relaxed italic text-center">
                          No transcript added for this slide. Enable and add transcript text for "{slides[currentSlideIndex]?.name}" in Step 2: Audio & Slide Management.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Preview Player Controls */}
            <div className="bg-gray-800 p-4 border-t border-gray-700">
              <div className="max-w-3xl mx-auto">
                {/* Progress Bar */}
                {seekBarControl === 'enable' && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                      <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                    
                    <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <RotateCcw className="w-5 h-5 text-white" />
                    </button>

                    {showPrevNextButtons && (
                      <>
                        <button
                          onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
                          disabled={currentSlide === 1}
                          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <SkipBack className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => setCurrentSlide(Math.min(totalSlides, currentSlide + 1))}
                          disabled={currentSlide === totalSlides}
                          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <SkipForward className="w-5 h-5 text-white" />
                        </button>
                      </>
                    )}

                    <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Volume2 className="w-5 h-5 text-white" />
                    </button>

                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm font-medium">
                      1x
                    </button>

                    {/* CC Button - Always visible in preview */}
                    <button
                      onClick={() => setShowCCOverlay(!showCCOverlay)}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        showCCOverlay ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      title="Toggle Closed Captions"
                    >
                      CC
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                      <button
                        onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
                        disabled={currentSlide === 1}
                        className="disabled:opacity-30"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <span className="text-white font-semibold text-sm min-w-[60px] text-center">
                        {String(currentSlide).padStart(2, '0')} / {totalSlides}
                      </span>
                      <button
                        onClick={() => setCurrentSlide(Math.min(totalSlides, currentSlide + 1))}
                        disabled={currentSlide === totalSlides}
                        className="disabled:opacity-30"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Maximize className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row with Transcript - Always visible in preview */}
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setShowTranscriptModal(!showTranscriptModal);
                      setShowMenuModal(false);
                      setShowHelpModal(false);
                    }}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      showTranscriptModal ? 'text-orange-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Transcript
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume/Restart Modal */}
      {showResumeScreen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Course Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-24 text-center"
            >
              <h2 className="text-2xl text-white font-medium">{courseName}</h2>
            </motion.div>

            {/* Center Content - Resume Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-8"
            >
              <button
                onClick={() => {
                  // Resume from last position
                  setCurrentSlide(lastSlidePosition);
                  setShowResumeScreen(false);
                  setShowPreview(true);
                }}
                className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-100 rounded-full transition-all shadow-lg hover:shadow-xl group"
              >
                <Play className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
                <span className="text-gray-700 font-medium group-hover:text-gray-900">Resume</span>
              </button>
            </motion.div>

            {/* Bottom - Restart Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-24"
            >
              <button
                onClick={() => {
                  // Restart from beginning
                  setCurrentSlide(1);
                  setLastSlidePosition(1);
                  setShowResumeScreen(false);
                  setShowPreview(true);
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-medium">Restart</span>
              </button>
            </motion.div>

            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowResumeScreen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
    </DndProvider>
  );
}
