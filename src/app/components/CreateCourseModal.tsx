import { X, FileText, Layers, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const creationMethods = [
  {
    id: 'ppt-pdf',
    title: 'PPT/PDF to SCORM',
    description: 'Convert your existing PowerPoint or PDF files into SCORM packages. Quick and easy way to get started.',
    icon: FileText,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    id: 'custom',
    title: 'Custom Course Creation',
    description: 'Build comprehensive courses with videos, PDFs, audio narration, and interactive quizzes.',
    icon: Layers,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    id: 'ai-generated',
    title: 'AI-Generated Course',
    description: 'Let AI help you structure and create course content with smart learning paths and automated organization.',
    icon: Sparkles,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
];

export function CreateCourseModal({ isOpen, onClose }: CreateCourseModalProps) {
  const navigate = useNavigate();

  const handleMethodClick = (methodId: string) => {
    if (methodId === 'ppt-pdf') {
      onClose();
      navigate('/create-course');
    }
    // Handle other methods here in the future
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden pointer-events-auto">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Create New Course</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Choose how you'd like to create your course</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3 max-h-[calc(85vh-88px)] overflow-y-auto">
                {creationMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleMethodClick(method.id)}
                      className="w-full text-left p-5 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`${method.iconBg} p-3 rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                          <Icon className={`w-6 h-6 ${method.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-semibold text-gray-900">{method.title}</h3>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{method.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  Need help? Contact support or visit our documentation
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}