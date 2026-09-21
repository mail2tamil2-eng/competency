import { Play } from 'lucide-react';
import { motion } from 'motion/react';

export function RecentCourse() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Recently Created Course</h3>
      
      <div className="flex items-start gap-4">
        <motion.div 
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0"
        >
          <span className="text-gray-400 font-bold text-xl">ISM</span>
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 mb-1 truncate">
            Information Security Management System 2...
          </h4>
          <p className="text-xs text-gray-400 mb-3">Edited 5 minutes ago</p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Play className="w-4 h-4" fill="white" />
            <span>Resume Editing</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}