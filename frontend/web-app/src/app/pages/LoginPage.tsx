import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Eye, EyeOff, Shield, Lock, Mail, X } from 'lucide-react';
import logoImg from '../../assets/brand/trusyn-logo.png';
import { authService } from '../api/services/authService';
import { ApiError } from '../api/errors';

type ProfileLogin = {
  id: string;
  name: string;
  role: string;
  email: string;
  password: string;
};

const QUICK_PROFILES: ProfileLogin[] = [
  {
    id: 'security_analyst',
    name: 'Ava Sharma',
    role: 'Security Analyst',
    email: 'ava.sharma@demo.trusyn.ai',
    password: 'TrusynDemo@123',
  },
  {
    id: 'org_admin',
    name: 'Rohan Mehta',
    role: 'Org Admin',
    email: 'rohan.mehta@demo.trusyn.ai',
    password: 'Governance@456',
  },
];

function parseLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 422) return 'Please check your email and password format.';
    return error.message;
  }
  return 'Unable to sign in right now. Please try again.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(QUICK_PROFILES[0].email);
  const [password, setPassword] = useState(QUICK_PROFILES[0].password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(QUICK_PROFILES[0].id);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await authService.login({
        email: email.trim(),
        password,
      });
      navigate(nextPath, { replace: true });
    } catch (error) {
      setErrorMessage(parseLoginError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (profile: ProfileLogin) => {
    setSelectedProfile(profile.id);
    setEmail(profile.email);
    setPassword(profile.password);
    setShowPassword(false);
    setErrorMessage(null);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: '#F8F5FF' }}
    >
      <div
        className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, #8B3CF7, transparent)',
          top: -200,
          left: -200,
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, #38BDF8, transparent)',
          bottom: -150,
          right: -150,
        }}
      />

      <div className="relative z-10 w-full mx-4" style={{ maxWidth: 460 }}>
        <div
          className="p-0.5 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,60,247,0.4), rgba(56,189,248,0.4))',
          }}
        >
          <div className="rounded-3xl px-8 py-9" style={{ background: '#FFFFFF' }}>
            <div className="flex flex-col items-center mb-8">
              <img src={logoImg} alt="Trusyn" className="h-12 w-auto mb-5" />
              <h1 className="text-center" style={{ color: '#1A1A2E', fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}>
                Welcome back
              </h1>
              <p className="text-sm mt-1 text-center" style={{ color: '#717182' }}>
                Access the Trusyn AI user workspace
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#717182' }}>
                  Work Email
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    border: '1px solid rgba(139,60,247,0.2)',
                    background: '#F8F5FF',
                  }}
                >
                  <Mail size={15} style={{ color: '#8B3CF7', flexShrink: 0 }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#1A1A2E' }}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#717182' }}>
                  Password
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    border: '1px solid rgba(139,60,247,0.2)',
                    background: '#F8F5FF',
                  }}
                >
                  <Lock size={15} style={{ color: '#8B3CF7', flexShrink: 0 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#1A1A2E' }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={14} style={{ color: '#717182' }} />
                    ) : (
                      <Eye size={14} style={{ color: '#717182' }} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-xs" style={{ color: '#717182' }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs"
                  style={{ color: '#8B3CF7' }}
                >
                  Forgot password?
                </button>
              </div>

              {errorMessage && (
                <div
                  className="rounded-xl px-3 py-2 text-xs"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    color: '#B42318',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white transition-all duration-200 mt-1 relative overflow-hidden"
                style={{
                  background: loading
                    ? 'linear-gradient(135deg, #8B3CF7aa, #38BDF8aa)'
                    : 'linear-gradient(135deg, #8B3CF7, #38BDF8)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(139, 60, 247, 0.4)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              <div
                className="rounded-2xl p-4 mt-1"
                style={{
                  background: 'linear-gradient(180deg, #FBFAFF 0%, #F6F4FF 100%)',
                  border: '1px solid rgba(139,60,247,0.16)',
                }}
              >
                <p className="text-xs mb-3" style={{ color: '#6B6790', letterSpacing: '0.03em' }}>
                  QUICK ACCESS PROFILES
                </p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROFILES.map(profile => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => handleQuickFill(profile)}
                      className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
                      style={{
                        border: profile.id === selectedProfile
                          ? '1px solid rgba(139,60,247,0.42)'
                          : '1px solid rgba(139,60,247,0.16)',
                        background: profile.id === selectedProfile ? 'rgba(139,60,247,0.08)' : '#FFFFFF',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm" style={{ color: '#1A1A2E', fontWeight: 600 }}>
                            {profile.name}
                          </p>
                          <p className="text-xs" style={{ color: '#73708C' }}>
                            {profile.role}
                          </p>
                        </div>
                        <span className="text-xs" style={{ color: '#8B3CF7', fontWeight: 600 }}>
                          Fill Credentials
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#595A75' }}>
                        {profile.email}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="flex items-center gap-2 mt-6 justify-center">
              <Shield size={12} style={{ color: '#717182' }} />
              <p className="text-xs" style={{ color: '#717182' }}>
                Protected by Trusyn Runtime Governance Engine
              </p>
            </div>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15, 10, 35, 0.45)' }}>
          <div
            className="w-full max-w-md rounded-3xl p-6 relative"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(139,60,247,0.22)',
              boxShadow: '0 20px 50px rgba(19, 9, 55, 0.25)',
            }}
          >
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5"
              style={{ color: '#8B3CF7', background: 'rgba(139,60,247,0.08)' }}
              aria-label="Close popup"
            >
              <X size={14} />
            </button>

            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,60,247,0.10)' }}>
              <Lock size={18} style={{ color: '#8B3CF7' }} />
            </div>

            <h3 style={{ color: '#1A1A2E', fontSize: 19, fontWeight: 700, margin: 0, marginBottom: 8 }}>
              Forgot password is disabled
            </h3>
            <p style={{ color: '#6F6D86', fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 18 }}>
              Please use one of the quick access profile credentials.
            </p>

            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="w-full rounded-xl py-3"
              style={{
                background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
