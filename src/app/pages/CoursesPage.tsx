import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router';
import { CourseTable } from '../components/CourseTable';
import { Plus, Filter, ChevronDown, Check } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { useState, useRef, useEffect } from 'react';

interface LayoutContext {
  onCreateCourse: () => void;
}

export function CoursesPage() {
  const { onCreateCourse } = useOutletContext<LayoutContext>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All Courses');
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterOptions = [
    'All Courses',
    'Published',
    'Draft',
    'Archived',
    'Recently Updated'
  ];

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    setIsFilterOpen(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'My Courses' }]} />
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1>
          <p className="text-gray-600">Manage and organize your learning content</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>{selectedFilter}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-lg rounded-lg z-10 min-w-[200px]"
                >
                  <div className="py-1">
                    {filterOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleFilterSelect(option)}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          option === selectedFilter
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option === selectedFilter && (
                          <Check className="w-4 h-4" />
                        )}
                        <span className={option === selectedFilter ? '' : 'ml-6'}>
                          {option}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={onCreateCourse}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Course</span>
          </button>
        </div>
      </motion.div>

      {/* Course Table with Pagination */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <CourseTable />
      </motion.div>
    </div>
  );
}