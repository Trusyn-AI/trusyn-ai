import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AgentsPage } from './pages/AgentsPage';
import { ThreatCenterPage } from './pages/ThreatCenterPage';
import { PolicyEnginePage } from './pages/PolicyEnginePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StubPage } from './pages/StubPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <PublicOnlyRoute />,
    children: [{ index: true, Component: LoginPage }],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        Component: MainLayout,
        children: [
          {
            path: 'dashboard',
            Component: DashboardPage,
          },
          {
            path: 'agents',
            Component: AgentsPage,
          },
          {
            path: 'threats',
            Component: ThreatCenterPage,
          },
          {
            path: 'policies',
            Component: PolicyEnginePage,
          },
          {
            path: 'audit-logs',
            Component: AuditLogsPage,
          },
          {
            path: 'analytics',
            Component: AnalyticsPage,
          },
          {
            path: 'settings',
            Component: SettingsPage,
          },
        ],
      },
    ],
  },
]);
