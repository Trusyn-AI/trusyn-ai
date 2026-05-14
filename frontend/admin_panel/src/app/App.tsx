import { useEffect, useState } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { LeftSidebar } from './components/LeftSidebar';
import { PlatformOverview } from './pages/PlatformOverview';
import { Organizations } from './pages/Organizations';
import { ThreatIntelligence } from './pages/ThreatIntelligence';
import { AIAgents } from './pages/AIAgents';
import { APIMonitoring } from './pages/APIMonitoring';
import { Governance } from './pages/Governance';
import { AuditLogs } from './pages/AuditLogs';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { getAccessToken } from './api/auth';
import { authService } from './api/services/authService';
import { useSessionUser } from './state/session';

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const sessionUser = useSessionUser();

  useEffect(() => {
    let isMounted = true;
    const boot = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setIsInitializing(false);
        return;
      }

      try {
        await authService.me();
        if (!isMounted) return;
        setIsAuthenticated(true);
      } catch {
        authService.logout();
        if (!isMounted) return;
        setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    void boot();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setIsAuthenticated(Boolean(sessionUser && getAccessToken()));
  }, [sessionUser]);

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <PlatformOverview />;
      case 'organizations':
        return <Organizations />;
      case 'threats':
        return <ThreatIntelligence />;
      case 'agents':
        return <AIAgents />;
      case 'api':
        return <APIMonitoring />;
      case 'governance':
        return <Governance />;
      case 'audit':
        return <AuditLogs />;
      case 'health':
        return <SystemHealth />;
      case 'settings':
        return <Settings />;
      default:
        return <PlatformOverview />;
    }
  };

  if (isInitializing) {
    return (
      <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Initializing secure admin session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="dark min-h-screen bg-background text-foreground">
        <AdminLoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex h-screen overflow-hidden">
        <LeftSidebar activePage={activePage} onPageChange={setActivePage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar
            onOpenSettings={() => setActivePage('settings')}
            onLogout={() => {
              authService.logout();
              setIsAuthenticated(false);
              setActivePage('overview');
            }}
          />
          <main className="trusyn-scrollbar flex-1 overflow-y-auto p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}
