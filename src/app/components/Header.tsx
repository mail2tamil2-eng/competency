import { Search, Bell, ChevronDown, User, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { readData } from "../competency/model";

interface HeaderProps {
  userName?: string;
  isCollapsed?: boolean;
}

export function Header({ userName, isCollapsed = false }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Use authenticated user or fallback to prop
  const displayName = user?.name || userName || "User";
  const displayRole = "Workspace administrator";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    navigate("/profile");
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };

  return (
    <header
      className="app-header fixed top-0 right-0 h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10 shadow-sm transition-all duration-300"
      style={{ left: isCollapsed ? "80px" : "256px" }}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search competencies or skills..."
            aria-label="Search competencies and skills globally"
            onChange={(e) =>
              window.dispatchEvent(
                new CustomEvent("competency-search", {
                  detail: e.currentTarget.value,
                }),
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter")
                window.dispatchEvent(
                  new CustomEvent("competency-search", {
                    detail: e.currentTarget.value,
                  }),
                );
            }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button
          aria-label="Review notifications"
          onClick={() => {
            const pending =
              readData().workflow?.proofs.filter(
                (p) => p.status === "Under Review",
              ).length || 0;
            toast.info(
              pending
                ? pending +
                    " proof submission(s) awaiting review. Open Manager preview to review them."
                : "No new notifications.",
            );
          }}
          className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
              {displayName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-700">{displayName}</p>
              <p className="text-xs text-gray-400">{displayRole}</p>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -10 }}
                className="absolute right-0 top-14 bg-white border border-gray-100 rounded-lg shadow-md w-48"
              >
                <div className="p-2">
                  <button
                    className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={handleProfileClick}
                  >
                    <User className="w-5 h-5 text-gray-500" />
                    <p className="text-gray-700">Profile</p>
                  </button>
                  <button
                    className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 text-gray-500" />
                    <p className="text-gray-700">Logout</p>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
