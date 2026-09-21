import { Home } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'motion/react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-sm mb-6"
      aria-label="Breadcrumb"
    >
      {/* Home Icon Only */}
      <Link
        to="/"
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <span className="text-gray-400">/</span>
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-900' : 'text-gray-600'}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </motion.nav>
  );
}