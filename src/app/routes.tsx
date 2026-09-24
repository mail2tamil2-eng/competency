import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { CompetencyManagementPage } from "./pages/CompetencyManagementPage";
import { ProfilePage } from "./pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/competency-management" replace />,
      },
      {
        path: "competency-management/*",
        element: <CompetencyManagementPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },
]);
