import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CreateCourseModal } from "./CreateCourseModal";

export function Layout() {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const userName = "Dheva";

  // Determine active tab based on route
  const getActiveTab = () => {
    if (location.pathname === "/courses") return "courses";
    if (location.pathname === "/resume") return "resume";
    return "dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        activeTab={getActiveTab()}
        setActiveTab={() => {}}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <Header userName={userName} isCollapsed={isSidebarCollapsed} />

      <main
        className="app-main pt-20 transition-all duration-300"
        style={{ marginLeft: isSidebarCollapsed ? "80px" : "256px" }}
      >
        <Outlet
          context={{ onCreateCourse: () => setIsCreateModalOpen(true) }}
        />
      </main>

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
