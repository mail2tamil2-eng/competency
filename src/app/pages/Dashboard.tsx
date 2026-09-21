import { motion } from 'motion/react';
import { useOutletContext } from 'react-router';
import { Hero } from '../components/Hero';
import { StatsCard } from '../components/StatsCard';
import { RecentCourse } from '../components/RecentCourse';
import { DashboardCourseTable } from '../components/DashboardCourseTable';
import { BookOpen, Clock, XCircle, FileCheck } from 'lucide-react';
import { useCourseContext } from '../context/CourseContext';

interface LayoutContext {
  onCreateCourse: () => void;
}

export function Dashboard() {
  const { onCreateCourse } = useOutletContext<LayoutContext>();
  const userName = 'Dheva';
  const { totalPublished, totalDraft, usedLicenses, availableLicenses } = useCourseContext();

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Hero userName={userName} onCreateCourse={onCreateCourse} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatsCard
            title="Total Course Created"
            value={totalPublished}
            icon={FileCheck}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatsCard
            title="Total course in Draft"
            value={totalDraft}
            icon={Clock}
            bgColor="bg-amber-50"
            iconColor="text-amber-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatsCard
            title="Used vs Available License"
            value={usedLicenses}
            subtitle={`${availableLicenses} Available license`}
            icon={XCircle}
            bgColor="bg-pink-50"
            iconColor="text-pink-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <RecentCourse />
        </motion.div>
      </div>

      {/* Recent Courses Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <DashboardCourseTable />
      </motion.div>
    </div>
  );
}