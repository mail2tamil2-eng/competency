import { Edit, Copy, Trash2, Download, ArrowRight, FileUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useCourseContext } from '../context/CourseContext';
import { Badge } from './ui/badge';

// Mock user mapping for display names
const USER_NAMES: Record<string, string> = {
  'creator-1': 'John Doe',
  'creator-2': 'Jane Smith',
  'creator-3': 'Mike Johnson',
};

export function DashboardCourseTable() {
  const navigate = useNavigate();
  const { courses, downloadCourse, editCourse, copyCourse, canPublish, publishCourse, republishCourse } = useCourseContext();
  
  // Show only the most recent 5 courses
  const recentCourses = courses.slice(0, 5);

  const handleAction = async (action: 'edit' | 'copy' | 'download' | 'publish' | 'republish', courseId: number) => {
    switch (action) {
      case 'edit':
        editCourse(courseId);
        navigate('/create-course', { state: { courseId, mode: 'edit' } });
        break;
      case 'copy':
        copyCourse(courseId);
        break;
      case 'download':
        await downloadCourse(courseId);
        break;
      case 'publish':
        await publishCourse(courseId);
        break;
      case 'republish':
        await republishCourse(courseId);
        break;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Recent Courses</h2>
          <p className="text-sm text-gray-500 mt-1">Your latest learning content</p>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created On</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentCourses.map((course, index) => {
              const isEditedPublished = course.status === 'published' && course.isEdited;
              const canPublishThis = !course.hasBeenPublished ? canPublish() : true;

              return (
                <motion.tr
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-800">{course.name}</span>
                    {isEditedPublished && (
                      <span className="ml-2 text-xs text-amber-600 font-medium">(Edited)</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {course.status === 'published' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Published
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Draft
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {USER_NAMES[course.createdBy]?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm text-gray-700">
                        {USER_NAMES[course.createdBy] || 'Unknown User'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.createdOn}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.lastUpdated}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.modules}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Publish/Republish */}
                      {(course.status === 'draft' || isEditedPublished) && (
                        <motion.button
                          whileHover={{ scale: canPublishThis ? 1.1 : 1 }}
                          whileTap={{ scale: canPublishThis ? 0.95 : 1 }}
                          onClick={() => handleAction(isEditedPublished ? 'republish' : 'publish', course.id)}
                          disabled={!canPublishThis}
                          className={`p-2 rounded-lg transition-colors group ${
                            canPublishThis ? 'hover:bg-blue-50' : 'cursor-not-allowed'
                          }`}
                          title={isEditedPublished ? 'Republish' : 'Publish'}
                        >
                          <FileUp className={`w-4 h-4 ${canPublishThis ? 'text-gray-400 group-hover:text-blue-600' : 'text-gray-300'} transition-colors`} />
                        </motion.button>
                      )}

                      {/* Download */}
                      <motion.button
                        whileHover={{ scale: course.canDownload ? 1.1 : 1 }}
                        whileTap={{ scale: course.canDownload ? 0.95 : 1 }}
                        onClick={() => handleAction('download', course.id)}
                        disabled={!course.canDownload}
                        className={`p-2 rounded-lg transition-colors group ${
                          course.canDownload ? 'hover:bg-purple-50' : 'cursor-not-allowed'
                        }`}
                        title="Download"
                      >
                        <Download className={`w-4 h-4 ${course.canDownload ? 'text-gray-400 group-hover:text-purple-600' : 'text-gray-300'} transition-colors`} />
                      </motion.button>

                      {/* Edit */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction('edit', course.id)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </motion.button>

                      {/* Copy */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction('copy', course.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}