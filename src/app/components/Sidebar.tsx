import { Layers, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import axleKorpLogo from "../../imports/AXLE-Korp-LOGO__2_.jpg";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const location = useLocation();
  const menuItems = [
    {
      id: "competency-management",
      label: "Competency Management",
      icon: Layers,
      path: "/competency-management",
    },
  ];

  return (
    <motion.div
      initial={{ x: -264 }}
      animate={{
        x: 0,
        width: isCollapsed ? 80 : 256,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="app-sidebar fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm z-30"
    >
      {/* Toggle Button — placed below the header (top-20 = 80px) */}
      <button
        aria-label="Toggle sidebar"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[88px] w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md z-40"
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </motion.div>
      </button>

      {/* Logo */}
      <div className="h-20 border-b border-gray-100 flex items-center px-4">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ImageWithFallback
                src={axleKorpLogo}
                alt="Axle Korp"
                className="h-10 w-auto object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center w-full"
            >
              <ImageWithFallback
                src={axleKorpLogo}
                alt="Axle Korp"
                className="w-10 h-10 object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path || location.pathname === "/";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group ${
                    isActive
                      ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : ""}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-orange-600" : "text-gray-400"}`}
                  />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium text-sm leading-5 text-left"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="p-4 border-t border-gray-100"
      >
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="footer-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-gray-400"
            >
              Powered By{" "}
              <span className="font-semibold text-gray-500">NOVACTECH</span>
            </motion.div>
          ) : (
            <motion.div
              key="footer-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-gray-400"
            >
              <span className="font-semibold text-gray-500">NT</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
