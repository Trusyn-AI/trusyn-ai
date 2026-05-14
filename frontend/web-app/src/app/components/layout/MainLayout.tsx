import { Outlet } from 'react-router';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { dashboardService } from '../../api/services/dashboardService';

export function MainLayout() {
  const [activeThreats, setActiveThreats] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary(): Promise<void> {
      try {
        const summary = await dashboardService.summary();
        if (!cancelled) {
          setActiveThreats(summary.recent_threats.length);
        }
      } catch {
        if (!cancelled) setActiveThreats(0);
      }
    }

    void loadSummary();
    const interval = window.setInterval(() => {
      void loadSummary();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#F8F5FF' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar activeThreats={activeThreats} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
