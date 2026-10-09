import { Route, Routes } from "react-router-dom";
import GuestRoute from "./components/GuestRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CollaborationsPage from "./pages/CollaborationsPage.jsx";
import CorporatePage from "./pages/CorporatePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProblemDetailPage from "./pages/ProblemDetailPage.jsx";
import ProblemsPage from "./pages/ProblemsPage.jsx";
import ProfileEditPage from "./pages/ProfileEditPage.jsx";
import ProjectCreatePage from "./pages/ProjectCreatePage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import ProjectEditPage from "./pages/ProjectEditPage.jsx";
import ProjectListPage from "./pages/ProjectListPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ResearcherDirectoryPage from "./pages/ResearcherDirectoryPage.jsx";
import ResearcherPage from "./pages/ResearcherPage.jsx";
import ResearcherPublicPage from "./pages/ResearcherPublicPage.jsx";
import WorkspaceDetailPage from "./pages/WorkspaceDetailPage.jsx";
import WorkspaceListPage from "./pages/WorkspaceListPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route element={<ProtectedRoute roles={["researcher"]} />}>
          <Route path="/researcher" element={<ResearcherPage />} />
          <Route path="/researcher/projects" element={<ProjectListPage />} />
          <Route path="/researcher/projects/new" element={<ProjectCreatePage />} />
          <Route path="/researcher/projects/:id/edit" element={<ProjectEditPage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["researcher", "corporate"]} />}>
          <Route path="/researcher/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/researchers" element={<ResearcherDirectoryPage />} />
          <Route path="/researchers/:userId" element={<ResearcherPublicPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
          <Route path="/collaborations" element={<CollaborationsPage />} />
          <Route path="/workspaces" element={<WorkspaceListPage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
        </Route>
        <Route
          path="/corporate"
          element={
            <ProtectedRoute roles={["corporate"]}>
              <CorporatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
