import { Construction } from 'lucide-react';

interface StubPageProps {
  title: string;
  description: string;
  icon: string;
  phase: string;
}

export function StubPage({ title, description, icon, phase }: StubPageProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-screen">
      {/* Gradient border card */}
      <div
        className="p-0.5 rounded-3xl"
        style={{ background: 'linear-gradient(135deg, rgba(139,60,247,0.3), rgba(56,189,248,0.3))' }}
      >
        <div
          className="rounded-3xl px-12 py-12 flex flex-col items-center text-center"
          style={{ background: '#FFFFFF', maxWidth: 460 }}
        >
          <span className="text-5xl mb-5">{icon}</span>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(139,60,247,0.08)' }}
          >
            <Construction size={12} style={{ color: '#8B3CF7' }} />
            <span className="text-xs" style={{ color: '#8B3CF7' }}>{phase}</span>
          </div>
          <h2 style={{ color: '#1A1A2E' }}>{title}</h2>
          <p className="text-sm mt-2" style={{ color: '#717182', lineHeight: 1.7 }}>
            {description}
          </p>
          <div
            className="mt-6 w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(139,60,247,0.08)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: '30%', background: 'linear-gradient(90deg, #8B3CF7, #38BDF8)' }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: '#717182' }}>
            Coming in next phase
          </p>
        </div>
      </div>
    </div>
  );
}
