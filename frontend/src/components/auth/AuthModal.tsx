import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, switchDemoUser, isLoading } = useAuth();
  const { showToast } = useTrips();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'forgot') {
      if (!email) {
        setErrorMsg('Please enter your email address');
        return;
      }
      showToast('Password reset link sent to your inbox', 'success');
      setTab('login');
      return;
    }

    if (tab === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Full name is required');
        return;
      }
      if (!email.trim() || !password) {
        setErrorMsg('Email and password are required');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        return;
      }

      const success = await signup(fullName, email, password);
      if (success) {
        showToast('Account created successfully! Welcome to GlobeTrotter', 'success');
        onClose();
      } else {
        setErrorMsg('Failed to create account. Please try again.');
      }
    } else {
      if (!email.trim() || !password) {
        setErrorMsg('Email and password are required');
        return;
      }

      const success = await login(email, password);
      if (success) {
        showToast('Signed in successfully', 'success');
        onClose();
      } else {
        setErrorMsg('Invalid email or password');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white mb-3">
            <span className="font-extrabold text-xl">G</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-black">
            {tab === 'login' && 'Welcome Back'}
            {tab === 'signup' && 'Create Your Account'}
            {tab === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {tab === 'login' && 'Access your personalized multi-city itineraries'}
            {tab === 'signup' && 'Join travelers organizing smart journey plans'}
            {tab === 'forgot' && 'Enter your email to receive recovery instructions'}
          </p>
        </div>

        {/* Tab switcher */}
        {tab !== 'forgot' && (
          <div className="flex rounded-full bg-neutral-100 p-1 mb-6 border border-neutral-200">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-all ${
                tab === 'login'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-all ${
                tab === 'signup'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Radhe Sharma"
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-10 py-2.5 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-10 py-2.5 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  Password
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setErrorMsg('');
                    }}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-black transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-10 py-2.5 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="samsung-pill-btn samsung-pill-primary w-full py-3 text-xs font-bold tracking-wide mt-2"
          >
            {isLoading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                {tab === 'login' && 'Sign In to Account'}
                {tab === 'signup' && 'Create Free Account'}
                {tab === 'forgot' && 'Send Reset Instructions'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>

          {tab === 'forgot' && (
            <button
              type="button"
              onClick={() => setTab('login')}
              className="w-full text-center text-xs font-bold text-neutral-600 hover:text-black py-1"
            >
              ← Back to Sign In
            </button>
          )}
        </form>

        {/* 1-Click Fast Access Demo Accounts */}
        <div className="mt-6 border-t border-neutral-100 pt-5">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
            Quick 1-Click Fast Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                switchDemoUser('traveler');
                showToast('Signed in as Radhe Sharma (Traveler)', 'success');
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 hover:border-black transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-black" />
              Traveler Demo
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoUser('admin');
                showToast('Signed in as Aria Chen (Admin)', 'success');
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 hover:border-black transition-all"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-black" />
              Admin Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
