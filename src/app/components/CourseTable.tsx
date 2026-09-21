import { useState } from 'react';
import { Edit, Copy, Trash2, Download, ChevronLeft, ChevronRight, ChevronDown, FileUp, AlertCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCourseContext } from '../context/CourseContext';
import { useNavigate } from 'react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Badge } from './ui/badge';

// Mock user mapping for display names
const USER_NAMES: Record<string, string> = {
  'creator-1': 'John Doe',
  'creator-2': 'Jane Smith',
  'creator-3': 'Mike Johnson',
};

export function CourseTable() {
  const navigate = useNavigate();
  const {
    courses,
    canPublish,
    publishCourse,
    republishCourse,
    downloadCourse,
    editCourse,
    copyCourse,
    deleteCourse,
  } = useCourseContext();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isShowDropdownOpen, setIsShowDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const totalPages = Math.ceil(courses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCourses = courses.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setIsShowDropdownOpen(false);
  };

  const handlePublish = async (courseId: number) => {
    setActionLoading(courseId);
    await publishCourse(courseId);
    setActionLoading(null);
  };

  const handleRepublish = async (courseId: number) => {
    setActionLoading(courseId);
    await republishCourse(courseId);
    setActionLoading(null);
  };

  const handleDownload = async (courseId: number) => {
    setActionLoading(courseId);
    await downloadCourse(courseId);
    setActionLoading(null);
  };

  const handleEdit = (courseId: number) => {
    editCourse(courseId);
    navigate('/create-course', { state: { courseId, mode: 'edit' } });
  };

  const handleCopy = (courseId: number) => {
    copyCourse(courseId);
  };

  const handleDeleteClick = (courseId: number) => {
    setCourseToDelete(courseId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteCourse(courseToDelete);
      setCourseToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const showOptions = [5, 10, 15, 20, 25];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              {currentCourses.map((course, index) => {
                const isNewCourse = !course.hasBeenPublished;
                const isEditedPublished = course.status === 'published' && course.isEdited;
                const canPublishThis = isNewCourse ? canPublish() : true; // Can always republish
                const isLoading = actionLoading === course.id;

                return (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {String(startIndex + index + 1).padStart(2, '0')}
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
                      <div className="flex items-center gap-1.5">
                        {/* Publish/Republish Button */}
                        {course.status === 'draft' || isEditedPublished ? (
                          <div className="relative group">
                            <motion.button
                              whileHover={{ scale: canPublishThis ? 1.1 : 1 }}
                              whileTap={{ scale: canPublishThis ? 0.95 : 1 }}
                              onClick={() => {
                                if (isEditedPublished) {
                                  handleRepublish(course.id);
                                } else {
                                  handlePublish(course.id);
                                }
                              }}
                              disabled={!canPublishThis || isLoading}
                              className={`p-2 rounded-lg transition-all duration-200 relative ${
                                canPublishThis && !isLoading
                                  ? 'hover:bg-blue-100 text-blue-600'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title={
                                !canPublishThis
                                  ? 'License limit reached'
                                  : isEditedPublished
                                  ? 'Republish Course'
                                  : 'Publish Course'
                              }
                            >
                              <FileUp className="w-4 h-4" />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {!canPublishThis ? 'License limit reached' : isEditedPublished ? 'Republish' : 'Publish'}
                              </div>
                            </motion.button>
                            {!canPublishThis && isNewCourse && (
                              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 px-2 py-1.5 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-10">
                                License limit reached. Please contact your Administrator.
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Download Button */}
                        <div className="relative group">
                          <motion.button
                            whileHover={{ scale: course.canDownload ? 1.1 : 1 }}
                            whileTap={{ scale: course.canDownload ? 0.95 : 1 }}
                            onClick={() => handleDownload(course.id)}
                            disabled={!course.canDownload || isLoading}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              course.canDownload && !isLoading
                                ? 'hover:bg-green-100 text-green-600'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={course.canDownload ? 'Download SCORM' : 'Must be published first'}
                          >
                            <Download className="w-4 h-4" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {course.canDownload ? 'Download' : 'Not available'}
                            </div>
                          </motion.button>
                        </div>

                        {/* Edit Button */}
                        <div className="relative group">
                          <motion.button
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(course.id)}
                            disabled={isLoading}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="Edit Course"
                          >
                            <Edit className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Edit
                            </div>
                          </motion.button>
                        </div>

                        {/* Copy Button */}
                        <div className="relative group">
                          <motion.button
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(course.id)}
                            disabled={isLoading}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="Duplicate Course"
                          >
                            <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Duplicate
                            </div>
                          </motion.button>
                        </div>

                        {/* Delete Button */}
                        <div className="relative group">
                          <motion.button
                            whileHover={{ scale: 1.1, y: -2, rotate: [0, -3, 3, 0] }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteClick(course.id)}
                            disabled={isLoading}
                            className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors duration-200" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Delete
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Show Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <div className="relative">
                <button
                  onClick={() => setIsShowDropdownOpen(!isShowDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors min-w-[80px] justify-between"
                >
                  <span>{itemsPerPage}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {isShowDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[80px]">
                    {showOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleItemsPerPageChange(option)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          itemsPerPage === option ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Showing text */}
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, courses.length)}</span> of{' '}
              <span className="font-medium">{courses.length}</span> courses
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </motion.button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}