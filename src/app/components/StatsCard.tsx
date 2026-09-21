import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, bgColor, iconColor }: StatsCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium mb-2">{title}</p>
          <motion.h3 
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="text-3xl font-bold text-gray-800 mb-1"
          >
            {value}
          </motion.h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`${bgColor} p-3 rounded-xl`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </motion.div>
      </div>
    </motion.div>
  );
}