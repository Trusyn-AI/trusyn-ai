import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import logoImg from '../../assets/brand/trusyn-logo.png';
import { authService } from '../api/services/authService';
import { ApiError } from '../api/errors';

type DemoAdmin = {
  id: string;
  name: string;
  role: string;
  email: string;
  password: string;
};

const DEMO_ADMINS: DemoAdmin[] = [
  {
    id: 'super_admin',
    name: 'Nisha Rao',
    role: 'Super Admin',
    email: 'nisha.rao@demo.trusyn.ai',
    password: 'SuperSecure@123',
  },
  {
    id: 'operations_admin',
    name: 'Arjun Patel',
    role: 'Operations Admin',
    email: 'arjun.patel@demo.trusyn.ai',
    password: 'OpsControl@456',
  },
];

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

export function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState(DEMO_ADMINS[0].email);
  const [password, setPassword] = useState(DEMO_ADMINS[0].password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState(DEMO_ADMINS[0].id);

  const applyDemoUser = (demo: DemoAdmin) => {
    setSelectedDemo(demo.id);
    setEmail(demo.email);
    setPassword(demo.password);
    setShowPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login({
        email: email.trim(),
        password,
      });
      setLoading(false);
      onLoginSuccess();
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to sign in. Please try again.');
      }
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(1200px 600px at 10% -10%, rgba(139,60,247,0.28), transparent), radial-gradient(900px 520px at 95% 110%, rgba(56,189,248,0.22), transparent), #0A0A0F',
      }}
    >
      <div className="w-full max-w-[460px]">
        <div
          className="rounded-3xl p-[1px]"
          style={{ background: 'linear-gradient(135deg, rgba(139,60,247,0.6), rgba(56,189,248,0.5))' }}
        >
          <div className="rounded-3xl px-8 py-8" style={{ background: '#12121A' }}>
            <div className="text-center mb-7">
              <img src={logoImg} alt="Trusyn AI" className="h-12 w-auto mx-auto mb-4" />
              <h1 className="text-2xl font-semibold text-white">Admin Panel Sign In</h1>
              <p className="text-sm mt-1 text-[#9CA3AF]">Access global governance controls</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs mb-1.5 text-[#9CA3AF]">Admin Email</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#8B3CF7]/25 bg-[#1A1A24]">
                  <Mail size={15} className="text-[#8B3CF7] shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-white"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5 text-[#9CA3AF]">Password</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#8B3CF7]/25 bg-[#1A1A24]">
                  <Lock size={15} className="text-[#8B3CF7] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-white"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-[#9CA3AF] hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-medium transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)',
                  boxShadow: loading ? 'none' : '0 10px 24px rgba(139, 60, 247, 0.3)',
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-5 rounded-2xl p-4 border border-[#8B3CF7]/20 bg-[#171723]">
              <p className="text-xs tracking-wide text-[#A78BFA] mb-3">QUICK LOGIN PROFILES</p>
              <div className="space-y-2">
                {DEMO_ADMINS.map((admin) => (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => applyDemoUser(admin)}
                    className="w-full text-left rounded-xl px-3 py-2.5 border transition-all"
                    style={{
                      borderColor: selectedDemo === admin.id ? 'rgba(139,60,247,0.6)' : 'rgba(139,60,247,0.22)',
                      background: selectedDemo === admin.id ? 'rgba(139,60,247,0.18)' : '#13131A',
                    }}
                  >
                    <p className="text-sm text-white font-medium">{admin.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{admin.role}</p>
                    <p className="text-xs text-[#60A5FA] mt-1">{admin.email}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-5">
              <Shield size={12} className="text-[#9CA3AF]" />
              <p className="text-xs text-[#9CA3AF]">Protected by Trusyn governance security layer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
