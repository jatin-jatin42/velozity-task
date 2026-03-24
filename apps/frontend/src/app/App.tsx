import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ShellLayout } from "../layouts/ShellLayout";
import { ActivityPage } from "../pages/ActivityPage";
import { ClientsPage } from "../pages/ClientsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { MyTasksPage } from "../pages/MyTasksPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { TaskDetailPage } from "../pages/TaskDetailPage";
import { SocketProvider } from "../providers/SocketProvider";

const queryClient = new QueryClient();

const ProtectedApp = () => {
  const { status } = useAuth();

  if (status === "loading") {
    return <div className="page-loader">Loading application...</div>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return (
    <SocketProvider>
      <Routes>
        <Route element={<ShellLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailRoute />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </SocketProvider>
  );
};

const ProjectDetailRoute = () => {
  const params = useParams();
  return params.projectId ? <ProjectDetailPage projectId={params.projectId} /> : <NotFoundPage />;
};

const TaskDetailRoute = () => {
  const params = useParams();
  return params.taskId ? <TaskDetailPage taskId={params.taskId} /> : <NotFoundPage />;
};

const AuthenticatedRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<ProtectedApp />} />
    </Routes>
  </BrowserRouter>
);

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuthenticatedRouter />
    </AuthProvider>
  </QueryClientProvider>
);
