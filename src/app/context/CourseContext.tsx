import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export type CourseStatus = 'draft' | 'published';

export interface Course {
  id: number;
  name: string;
  createdOn: string;
  lastUpdated: string;
  modules: number;
  status: CourseStatus;
  publishedVersion?: number; // Tracks the published version number
  hasBeenPublished: boolean; // Track if it was ever published
  canDownload: boolean; // Can download SCORM package
  isEdited?: boolean; // If published course has been edited
  tenantId: string; // Tenant isolation
  createdBy: string; // User who created it
}

interface CourseContextType {
  courses: Course[];
  totalLicenses: number;
  usedLicenses: number;
  availableLicenses: number;
  totalPublished: number;
  totalDraft: number;
  canPublish: () => boolean;
  publishCourse: (courseId: number) => Promise<boolean>;
  republishCourse: (courseId: number) => Promise<boolean>;
  downloadCourse: (courseId: number) => Promise<boolean>;
  createDraft: (name: string) => number;
  editCourse: (courseId: number) => void;
  copyCourse: (courseId: number) => void;
  deleteCourse: (courseId: number) => void;
  updateCourse: (courseId: number, updates: Partial<Course>) => void;
  getCourse: (courseId: number) => Course | undefined;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

// Mock data with tenant associations
const ALL_COURSES: Course[] = [
  {
    id: 1,
    name: 'Introduction to SCORM',
    createdOn: '2024-11-28',
    lastUpdated: '2026-01-30',
    modules: 2,
    status: 'published',
    publishedVersion: 1,
    hasBeenPublished: true,
    canDownload: true,
    tenantId: 'tenant-1',
    createdBy: 'creator-1',
  },
  {
    id: 2,
    name: 'Introduction to Literature',
    createdOn: '2024-11-28',
    lastUpdated: '2026-01-30',
    modules: 2,
    status: 'published',
    publishedVersion: 1,
    hasBeenPublished: true,
    canDownload: true,
    tenantId: 'tenant-1',
    createdBy: 'creator-1',
  },
  {
    id: 3,
    name: 'Technical Business Communication',
    createdOn: '2024-11-28',
    lastUpdated: '2026-01-30',
    modules: 2,
    status: 'draft',
    hasBeenPublished: false,
    canDownload: false,
    tenantId: 'tenant-1',
    createdBy: 'creator-1',
  },
  {
    id: 4,
    name: 'Information Security Management System',
    createdOn: '2024-11-28',
    lastUpdated: '2026-01-30',
    modules: 2,
    status: 'published',
    publishedVersion: 1,
    hasBeenPublished: true,
    canDownload: true,
    tenantId: 'tenant-1',
    createdBy: 'creator-1',
  },
  {
    id: 5,
    name: 'Advanced JavaScript Programming',
    createdOn: '2024-11-15',
    lastUpdated: '2026-01-25',
    modules: 5,
    status: 'draft',
    hasBeenPublished: false,
    canDownload: false,
    tenantId: 'tenant-2',
    createdBy: 'creator-2',
  },
];

export function CourseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>(ALL_COURSES);
  const [nextId, setNextId] = useState(6);

  // Filter courses by tenant for course creators
  const courses = user?.role === 'course_creator' 
    ? allCourses.filter(c => c.tenantId === user.tenantId)
    : allCourses; // Site admins see all courses

  const [totalLicenses] = useState(50); // This should come from tenant settings

  // Calculate license usage
  const totalPublished = courses.filter(c => c.status === 'published').length;
  const totalDraft = courses.filter(c => c.status === 'draft').length;
  const usedLicenses = totalPublished;
  const availableLicenses = totalLicenses - usedLicenses;

  const canPublish = () => {
    return availableLicenses > 0;
  };

  // Simulate async operations
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const publishCourse = async (courseId: number): Promise<boolean> => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      toast.error('Course not found', { description: 'Unable to locate the course for publishing.' });
      return false;
    }

    if (course.status === 'published' && !course.isEdited) {
      toast.error('Course is already published', { description: 'This course has already been published and has no changes.' });
      return false;
    }

    // Check if it's a new publish (not a republish)
    const isNewPublish = !course.hasBeenPublished;

    if (isNewPublish && !canPublish()) {
      toast.error('License limit reached', { description: 'Please contact your Administrator to increase your license allocation.' });
      return false;
    }

    try {
      // Simulate packaging
      toast.loading('Packaging course...', { id: 'publish' });
      await delay(2000);

      setAllCourses(prev => prev.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            status: 'published',
            hasBeenPublished: true,
            canDownload: true,
            publishedVersion: (c.publishedVersion || 0) + 1,
            lastUpdated: new Date().toISOString().split('T')[0],
            isEdited: false,
          };
        }
        return c;
      }));

      toast.success('Course published successfully!', { id: 'publish', description: 'Your course is now available for download.' });
      return true;
    } catch (error) {
      toast.error('Packaging failure', { id: 'publish', description: 'Failed to package the course. Please try again.' });
      return false;
    }
  };

  const republishCourse = async (courseId: number): Promise<boolean> => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      toast.error('Course not found', { description: 'Unable to locate the course for republishing.' });
      return false;
    }

    if (!course.hasBeenPublished) {
      toast.error('Cannot republish', { description: 'This course has never been published before.' });
      return false;
    }

    if (!canPublish() && !course.hasBeenPublished) {
      toast.error('License limit reached', { description: 'Please contact your Administrator to increase your license allocation.' });
      return false;
    }

    try {
      toast.loading('Re-packaging course...', { id: 'republish' });
      await delay(2000);

      setAllCourses(prev => prev.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            status: 'published',
            canDownload: true,
            publishedVersion: (c.publishedVersion || 0) + 1,
            lastUpdated: new Date().toISOString().split('T')[0],
            isEdited: false,
          };
        }
        return c;
      }));

      toast.success('Course republished successfully!', { id: 'republish', description: 'Your updated course is now available for download.' });
      return true;
    } catch (error) {
      toast.error('Packaging failure', { id: 'republish', description: 'Failed to package the course. Please try again.' });
      return false;
    }
  };

  const downloadCourse = async (courseId: number): Promise<boolean> => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      toast.error('Course not found', { description: 'Unable to locate the course for download.' });
      return false;
    }

    if (!course.canDownload) {
      toast.error('Course not available', { description: 'Course must be published before downloading.' });
      return false;
    }

    try {
      toast.loading('Preparing SCORM package...', { id: 'download' });
      await delay(1500);

      // Simulate download
      const blob = new Blob(['SCORM Package Content'], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${course.name.replace(/\s+/g, '_')}_v${course.publishedVersion || 1}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Course downloaded successfully!', { id: 'download', description: `${course.name} has been downloaded.` });
      return true;
    } catch (error) {
      toast.error('Download failed', { description: 'Unable to download the course. Please try again.' });
      return false;
    }
  };

  const createDraft = (name: string): number => {
    const newCourse: Course = {
      id: nextId,
      name,
      createdOn: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      modules: 0,
      status: 'draft',
      hasBeenPublished: false,
      canDownload: false,
      tenantId: user?.tenantId || 'tenant-1', // Default to tenant-1 if not specified
      createdBy: user?.id || 'creator-1', // Default to creator-1 if not specified
    };

    setAllCourses(prev => [...prev, newCourse]);
    setNextId(nextId + 1);
    toast.success('Draft course created successfully');
    return newCourse.id;
  };

  const editCourse = (courseId: number) => {
    setAllCourses(prev => prev.map(c => {
      if (c.id === courseId && c.status === 'published') {
        return {
          ...c,
          isEdited: true,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
      return c;
    }));
  };

  const copyCourse = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      toast.error('Course not found');
      return;
    }

    const newCourse: Course = {
      ...course,
      id: nextId,
      name: `${course.name} (Copy)`,
      createdOn: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'draft', // Always create as draft
      hasBeenPublished: false, // Don't consume license
      canDownload: false,
      publishedVersion: undefined,
      isEdited: false,
    };

    setAllCourses(prev => [...prev, newCourse]);
    setNextId(nextId + 1);
    toast.success('Course copied as draft');
  };

  const deleteCourse = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      toast.error('Course not found');
      return;
    }

    setAllCourses(prev => prev.filter(c => c.id !== courseId));
    toast.success('Course deleted successfully');
  };

  const updateCourse = (courseId: number, updates: Partial<Course>) => {
    setAllCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return c;
    }));
  };

  const getCourse = (courseId: number): Course | undefined => {
    return courses.find(c => c.id === courseId);
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        totalLicenses,
        usedLicenses,
        availableLicenses,
        totalPublished,
        totalDraft,
        canPublish,
        publishCourse,
        republishCourse,
        downloadCourse,
        createDraft,
        editCourse,
        copyCourse,
        deleteCourse,
        updateCourse,
        getCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourseContext() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourseContext must be used within a CourseProvider');
  }
  return context;
}