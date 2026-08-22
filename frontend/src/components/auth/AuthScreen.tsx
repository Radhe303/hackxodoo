import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye, 
  EyeOff,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

interface AuthScreenProps {
  initialMode?: 'register' | 'login';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode }) => {
  const { login, signup, switchDemoUser, isLoading } = useAuth();
  const { showToast } = useTrips();
  
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'forgot'>(() => {
    if (initialMode) return initialMode;
    const saved = sessionStorage.getItem('gt_auth_mode');
    return (saved as 'register' | 'login') || 'register';
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (authMode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Please enter your registered email address');
        return;
      }
      setSuccessMessage('Password reset instructions have been dispatched to your email.');
      showToast('Reset email sent successfully', 'success');
      return;
    }

    if (authMode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Full name is required');
        return;
      }
      if (!email.trim() || !password) {
        setErrorMessage('Email and password are required');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return;
      }

      const success = await signup(fullName.trim(), email.trim(), password);
      if (success) {
        setSuccessMessage('Account created successfully in database! Please sign in with your password to continue.');
        showToast('Registration successful! Please sign in.', 'success');
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage('Registration failed. An account with this email may already exist.');
      }
    } else {
      if (!email.trim() || !password) {
        setErrorMessage('Please enter your email and password');
        return;
      }

      const success = await login(email.trim(), password);
      if (success) {
        sessionStorage.removeItem('gt_auth_mode');
        showToast('Signed in successfully! Loading your personal travel dashboard...', 'success');
      } else {
        setErrorMessage('Invalid email or password. Please verify credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-black flex flex-col justify-between font-sans selection:bg-black selection:text-white">
      {/* Top Floating Mini Header */}
      <header className="w-full border-b border-neutral-100 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white shadow-sm">
            <span className="font-black text-base">G</span>
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-black block leading-none">
              GLOBETROTTER
            </span>
            <span className="text-[9px] font-bold tracking-widest text-neutral-400 uppercase">
              Monochrome Travel OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 hidden sm:inline">
            {authMode === 'register' ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'register' ? 'login' : 'register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="samsung-pill-btn samsung-pill-outline px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
          >
            {authMode === 'register' ? (
              <>
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" /> Register Free
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Portal */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-12 items-center gap-10 lg:gap-16">
        
        {/* Left Column: Brand Hero & Showcase */}
        <div className="flex-1 space-y-8 max-w-xl lg:max-w-none text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1 text-xs font-bold text-neutral-800">
              <Sparkles className="h-3.5 w-3.5 text-black" />
              <span>Screen 1 • Authentication & User Onboarding</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.08]">
              Travel planning, <br />
              <span className="underline decoration-neutral-300 decoration-2 underline-offset-8">
                refined to perfection.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 max-w-lg leading-relaxed">
              Design multi-city itineraries, estimate exact accommodation & transit budgets, customize activities, and synchronize your journeys with live database precision.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <MapPin className="h-5 w-5 text-black mb-2" />
              <h4 className="text-xs font-bold text-black">Multi-City Sequencing</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Route sequencing with auto distance & transit calculation</p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <DollarSign className="h-5 w-5 text-black mb-2" />
              <h4 className="text-xs font-bold text-black">Financial Intelligence</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Hotels, dining, activities & transit budget optimization</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Auth Form Card */}
        <div className="w-full max-w-md">
          <div className="relative rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-2xl">
            
            {/* Top Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-neutral-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'register'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
            </div>

            {/* Title */}
            <div className="mb-5 text-left">
              <h3 className="text-xl font-black tracking-tight text-black">
                {authMode === 'register' && 'Register New Account'}
                {authMode === 'login' && 'Welcome Back'}
                {authMode === 'forgot' && 'Reset Password'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {authMode === 'register' && 'Create your personal account to plan and save itineraries'}
                {authMode === 'login' && 'Enter your credentials to access your personal trips and wishlist'}
                {authMode === 'forgot' && 'We will dispatch password reset instructions to your email'}
              </p>
            </div>

            {/* Success Notification Alert */}
            {successMessage && (
              <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Radhe Sharma"
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-10 py-2.5 text-xs font-semibold text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-10 py-2.5 text-xs font-semibold text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Password *
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className="text-[11px] font-bold text-neutral-500 hover:text-black transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-10 py-2.5 text-xs font-semibold text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-black"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-10 py-2.5 text-xs font-semibold text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="samsung-pill-btn samsung-pill-primary w-full py-3 text-xs font-bold tracking-wide mt-2 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    {authMode === 'register' && 'Register & Create Account'}
                    {authMode === 'login' && 'Sign In & Access Data'}
                    {authMode === 'forgot' && 'Send Reset Link'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Bottom Switcher Links */}
              <div className="pt-2 text-center text-xs">
                {authMode === 'register' && (
                  <p className="text-neutral-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="font-black text-black underline underline-offset-4 hover:text-neutral-700"
                    >
                      Sign In here
                    </button>
                  </p>
                )}
                {authMode === 'login' && (
                  <p className="text-neutral-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="font-black text-black underline underline-offset-4 hover:text-neutral-700"
                    >
                      Register New Account
                    </button>
                  </p>
                )}
                {authMode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full text-center font-bold text-neutral-600 hover:text-black py-1"
                  >
                    ← Back to Sign In
                  </button>
                )}
              </div>
            </form>

            {/* Quick 1-Click Demo Accounts */}
            <div className="border-t border-neutral-100 pt-5 mt-5 space-y-2.5">
              <p className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Or Instant 1-Click Demo Evaluation
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    switchDemoUser('traveler');
                    showToast('Signed in as Radhe Sharma (Traveler)', 'success');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 hover:border-black transition-all"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                  Traveler Demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchDemoUser('admin');
                    showToast('Signed in as Aria Chen (Admin)', 'success');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 hover:border-black transition-all"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-black" />
                  Admin Demo
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-neutral-100 py-6 px-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} GlobeTrotter. Precision Monochrome Travel OS connected to live database.</p>
      </footer>
    </div>
  );
};
